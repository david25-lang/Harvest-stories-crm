import Link from "next/link";

const navigation = [
  { label: "Overview", icon: "◫", href: "/" },
  { label: "Contacts", icon: "♙", href: "/contacts" },
  { label: "Opportunities", icon: "◇", href: "/opportunities" },
  { label: "Follow-ups", icon: "◷", href: "/follow-ups" },
];

const businesses = [
  { label: "Farming", icon: "♧", href: "/farming" },
  { label: "Writing", icon: "✎", href: "/writing" },
  { label: "Relationship map", icon: "⌘", href: "/relationships" },
  { label: "Insights", icon: "✧", href: "/insights" },
];

export default function WorkspacePage({
  title,
  eyebrow = "WORKSPACE",
  description,
  activeHref,
  children,
}: {
  title: string;
  eyebrow?: string;
  description: string;
  activeHref: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
          <Link href="/" className="mb-10 flex items-center gap-3 px-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-xl text-white">H</div>
            <div><p className="font-semibold tracking-tight text-slate-900">Harvest &amp; Stories</p><p className="mt-0.5 text-xs text-slate-500">Relationship CRM</p></div>
          </Link>
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav className="space-y-1">
            {navigation.map((item) => <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${activeHref === item.href ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><span className="w-5 text-center text-lg">{item.icon}</span>{item.label}</Link>)}
          </nav>
          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Your businesses</p>
          <nav className="space-y-1">
            {businesses.map((item) => <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${activeHref === item.href ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><span className="w-5 text-center text-lg">{item.icon}</span>{item.label}</Link>)}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#f3f6f0] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">✦</div><p className="text-sm font-semibold text-slate-800">Your relationships, organized</p><p className="mt-1.5 text-xs leading-5 text-slate-500">Keep every farming and writing connection close at hand.</p></div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-3 sm:px-8"><div><p className="text-xs text-slate-500">Workspace / {title}</p><h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{title}</h1></div><Link href="/contacts" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">View contacts</Link></header>
          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9"><p className="mb-2 text-sm font-medium text-emerald-800">{eyebrow}</p><h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>{children ?? <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm"><p className="font-semibold text-slate-900">This workspace is ready for your next step.</p><p className="mt-2 text-sm text-slate-500">Use the navigation to move between your relationship tools.</p></div>}</div>
        </section>
      </div>
    </main>
  );
}
