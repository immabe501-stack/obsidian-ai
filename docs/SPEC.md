# 員工特休管理系統 — 規格文件

## 1. 系統目標
讓員工線上申請特休、主管線上核准，並由系統自動依勞基法計算特休餘額。所有紀錄持久化儲存於資料庫，不因瀏覽器或裝置變動而遺失。

## 2. 使用者角色

| 角色 | 權限 |
|------|------|
| 員工（employee） | 查詢自己的特休餘額、提出申請、檢視/取消自己的申請紀錄 |
| 主管（manager） | 員工的所有權限 + 核准/退回直屬部屬的申請、檢視部屬請假狀況 |
| HR / 管理員（admin） | 全部權限 + 新增員工、調整任職日、手動調整餘額、匯出報表 |

> 同一人可同時是主管和員工（主管也要請假）。Admin 一般另設專屬帳號。

## 3. 核心流程

### 3.1 申請流程（單層簽核）
1. 員工登入 → 填寫起訖日期、是否含半天、事由
2. 系統檢查：日期合法、餘額足夠、無重疊申請
3. 送出後狀態為 `pending`，通知直屬主管
4. 主管核准 → 狀態 `approved`、扣除餘額、通知員工
5. 主管退回 → 狀態 `rejected`、附退回原因、通知員工
6. 員工可在 `pending` 狀態自行取消（狀態 `cancelled`）

### 3.2 特休天數計算（依勞基法第 38 條）
| 年資 | 天數 |
|------|------|
| 滿 6 個月 ~ 1 年 | 3 |
| 1 年 ~ 2 年 | 7 |
| 2 年 ~ 3 年 | 10 |
| 3 年 ~ 5 年 | 14 |
| 5 年 ~ 10 年 | 15 |
| 10 年以上 | 每年 +1，上限 30 |

- 系統依 `hire_date` 與當前日期自動推算「當年度應有特休天數」。
- 每年週年日重新計算；剩餘天數 = 應有天數 − 已核准天數 ± admin 調整值。
- 半天 = 0.5 天，最小單位 0.5。

## 4. 功能清單（MVP）

| # | 功能 | 路徑 |
|---|------|------|
| F1 | 登入 / 登出 | `/login` |
| F2 | 我的首頁（餘額 + 我的申請） | `/` |
| F3 | 新增申請 | `/leave/new` |
| F4 | 申請詳細頁 / 取消 | `/leave/[id]` |
| F5 | 主管待審清單 + 核准/退回 | `/approvals` |
| F6 | 團隊請假行事曆 | `/calendar` |
| F7 | Admin 員工管理 | `/admin/users` |
| F8 | Admin 餘額手動調整 | `/admin/balances` |
| F9 | Admin 匯出 CSV | `/admin/export` |

## 5. API 端點（Next.js Route Handlers）

| Method | Path | 權限 | 說明 |
|--------|------|------|------|
| POST | `/api/auth/login` | 公開 | Email + 密碼登入，回傳 session cookie |
| POST | `/api/auth/logout` | 登入 | 清除 session |
| GET | `/api/me` | 登入 | 取得自身資料 + 餘額 |
| GET | `/api/leave-requests` | 登入 | 取得自己的申請清單，可 filter |
| POST | `/api/leave-requests` | 員工 | 新增申請 |
| PATCH | `/api/leave-requests/:id/cancel` | 申請人 | 取消尚未核准的申請 |
| GET | `/api/approvals` | 主管 | 待審清單（部屬的 pending） |
| PATCH | `/api/approvals/:id/approve` | 主管 | 核准 |
| PATCH | `/api/approvals/:id/reject` | 主管 | 退回，需附 `reason` |
| GET | `/api/calendar` | 登入 | 取得部門範圍內的核准紀錄 |
| GET | `/api/admin/users` | admin | 列出員工 |
| POST | `/api/admin/users` | admin | 新增員工 |
| PATCH | `/api/admin/users/:id` | admin | 編輯員工（含 hire_date、manager） |
| POST | `/api/admin/balance-adjustments` | admin | 手動加減餘額 |
| GET | `/api/admin/export` | admin | CSV 下載 |

## 6. 重要商業規則
- **不可重疊**：同一員工的 approved/pending 申請不可日期重疊。
- **不可請過去**：申請的起始日須 ≥ 今日（admin 可代為補登例外）。
- **不可超額**：申請天數 ≤ 剩餘特休。
- **核准後不可改**：員工要修改須先取消，再重新申請。
- **退回後可修改**：員工可修改後重新送出（產生新紀錄，狀態 pending）。
- **稽核紀錄**：所有狀態變更寫入 `audit_logs`，至少保留 3 年。

## 7. 技術棧
- **框架**：Next.js 15（App Router）+ TypeScript
- **資料庫**：開發環境 SQLite，正式環境 PostgreSQL（透過 Prisma 切換）
- **ORM**：Prisma
- **認證**：Auth.js (NextAuth v5) credentials provider + bcrypt 密碼雜湊
- **UI**：Tailwind CSS + shadcn/ui
- **行事曆**：FullCalendar 或 react-big-calendar
- **通知**：MVP 階段只在 UI 顯示，後續可接 Email（Resend）或 Slack webhook
- **部署**：Vercel（Postgres 用 Neon / Supabase / Vercel Postgres）

## 8. 安全性
- 密碼使用 bcrypt（cost 12+）儲存
- Session cookie 設 `HttpOnly` + `Secure` + `SameSite=Lax`
- 所有 API 強制檢查 session + role
- 主管核准動作須驗證該申請的 `user.manager_id == session.user.id`
- 速率限制（中介層）防止暴力登入
- 不在 client 端洩漏密碼雜湊或他人個資

## 9. 非 MVP 但已預留欄位／後續可加
- 多假別（事假、病假、婚假…）
- 代理人 (`delegate_id`)
- 附件（診斷書、喜帖）
- 兩層以上簽核流程
- 行動版優化 / PWA
- 與 Google Calendar / Outlook 同步
- 多部門、多公司
- i18n（中英文切換）

## 10. 開發里程碑（建議）
1. **M1 基礎建設**：Next.js 專案、Prisma schema、Auth.js、seed 假資料
2. **M2 員工端**：登入、首頁、新增/取消申請
3. **M3 主管端**：待審清單、核准/退回
4. **M4 行事曆 + Admin**：團隊行事曆、員工管理、匯出
5. **M5 加固**：稽核紀錄、速率限制、E2E 測試（Playwright）
