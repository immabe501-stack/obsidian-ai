import { PageHeader } from "@/components/page-header";
import { ExportForm } from "./export-form";

export default function AdminExportPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader title="匯出申請紀錄" subtitle="下載 CSV，可直接以 Excel 開啟" />
      <ExportForm />
    </main>
  );
}
