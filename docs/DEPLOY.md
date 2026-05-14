# 部署到 Vercel + Neon Postgres（給非工程背景使用者）

全部用瀏覽器點按鈕完成，不用打指令。預計 15 分鐘。

10 人以下的團隊兩邊都是免費方案。

---

## 步驟 1 — 註冊 Neon（免費 PostgreSQL 資料庫）

1. 開 [https://neon.tech](https://neon.tech)，點右上「Sign up」
2. 用 GitHub 帳號登入（沒有就先去 github.com 註冊）
3. 進去後它會請你建立第一個 Project：
   - Project name 隨便，例如 `leave-system`
   - Region 選離台灣最近的（**Asia Pacific (Singapore)**）
   - 其他保持預設，按 **Create Project**
4. 建好後會跳出一個 **Connection string**，看起來像：
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require
   ```
   點旁邊的「Copy」按鈕複製，**貼到記事本暫存**。等下會用到。

---

## 步驟 2 — 產生兩把金鑰

打開 [https://it-tools.tech/token-generator](https://it-tools.tech/token-generator) 或任何隨機字串產生器，產出：

- **SESSION_SECRET**：48 個 byte 的 base64 → 隨便產長度 64 以上的字串
- **PII_ENCRYPTION_KEY**：剛好 32 個 byte 的 base64 → 用 [base64encode.org](https://www.base64encode.org/) 把任意 32 字元字串編碼

或者更簡單，直接複製這兩行隨機產出的：

```
SESSION_SECRET=請從 https://generate-random.org/api-token-generator 產生 64 字元
PII_ENCRYPTION_KEY=請務必恰好 32 bytes，從 https://generate-secret.vercel.app/32 取得
```

> ⚠️ **重要**：`PII_ENCRYPTION_KEY` 一旦設定後不要改，否則所有員工的身分證 / 銀行帳號就解不開了。

把這兩個金鑰也貼到記事本暫存。

---

## 步驟 3 — 註冊 Vercel 並 Import 專案

1. 開 [https://vercel.com](https://vercel.com)，右上「Sign Up」→ 選 **Continue with GitHub**
2. 進入後點 **Add New...** → **Project**
3. 找到 `andyyyyang/obsidian-ai` 這個 repo → 點 **Import**
4. 進入「Configure Project」頁面：
   - **Framework Preset**：自動偵測為 Next.js（不用改）
   - **Branch**（重要）：點開選單，選 `claude/employee-leave-system-Ec1sI`
   - **Root Directory**：保留預設
   - 把下面 **Environment Variables** 區塊展開，貼入這 6 個：

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | （步驟 1 從 Neon 複製的連線字串） |
   | `SESSION_SECRET` | （步驟 2 產出的） |
   | `PII_ENCRYPTION_KEY` | （步驟 2 產出的，必須是 32 bytes base64） |
   | `INITIAL_ADMIN_EMAIL` | 你的 email，例如 `you@yourcompany.com` |
   | `INITIAL_ADMIN_PASSWORD` | 任意 8 字元以上強密碼，**第一次登入會用** |
   | `INITIAL_ADMIN_NAME` | 你的姓名，例如 `王小明` |

5. 按 **Deploy**

第一次部署約 2-3 分鐘。完成後它會給你一個網址，例如：
```
https://obsidian-ai-xxx.vercel.app
```

---

## 步驟 4 — 第一次登入

1. 打開上面那個 Vercel 網址
2. 用 `INITIAL_ADMIN_EMAIL` 和 `INITIAL_ADMIN_PASSWORD` 登入
3. **立刻**：到右上「HR 後台」→「員工」→ 點自己的名字 → 改密碼

---

## 步驟 5 — 建立員工帳號

在 HR 後台「員工」→ 點「+ 新增員工」逐一建立。每位員工建好後：

1. 把網址（步驟 3 那個 vercel.app 網址）+ email + 你給的初始密碼通知該員工
2. 員工自己登入後可以在「個人手冊」修改聯絡資訊

---

## 之後想做的事

### 想用自己的網域（例如 leave.yourcompany.com）

Vercel 後台 → 你的專案 → **Settings → Domains** → Add Domain，照指示在你的 DNS 業者那邊加一筆 CNAME。

### 改密碼或調環境變數

Vercel 後台 → **Settings → Environment Variables** → 改完按 **Save** 後到 **Deployments** 點最新一筆右側的「⋯」→ **Redeploy**。

### 重新部署最新程式

如果之後我幫你加新功能，會推到 GitHub。Vercel 看到 GitHub 有新 commit 會**自動重新部署**，你不用做事。

---

## 常見問題

### Q: 第一次登入失敗，說「帳號或密碼錯誤」
- 檢查 Vercel 環境變數 `INITIAL_ADMIN_EMAIL` 是否正確
- 檢查 `INITIAL_ADMIN_PASSWORD` 至少 8 字元
- 確認該帳號真的被建立：到 Neon 後台 → SQL Editor → 跑 `SELECT email FROM "User";`

### Q: 我看不到「HR 後台」按鈕
代表你登入的帳號 role 不是 ADMIN。用初始 admin 重新登入，把你的角色改成 Admin。

### Q: 員工忘記密碼怎麼辦？
目前還沒做「忘記密碼」流程。HR 從後台進員工頁面 → 「重設密碼」欄位輸入新密碼 → 儲存即可。

### Q: 想本機測試？
本機開發目前需要：Node.js 22+、pnpm、本地 PostgreSQL（或免費的 Neon dev branch）。詳見 README。
