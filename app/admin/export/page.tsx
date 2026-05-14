import { ExportForm } from "./export-form";

export default function AdminExportPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">匯出申請紀錄</h1>
      <ExportForm />
    </main>
  );
}
