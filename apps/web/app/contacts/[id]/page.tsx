import Link from "next/link";

export const instant = false;

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-[#f7f8f6] p-5 text-slate-800 sm:p-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/contacts" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">← Back to contacts</Link>
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Contact profile</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Contact details</h1>
          <p className="mt-2 text-sm text-slate-500">Profile ID: {id}</p>
          <p className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Open the Contacts page to view and edit the saved contact information.</p>
        </div>
      </div>
    </main>
  );
}
