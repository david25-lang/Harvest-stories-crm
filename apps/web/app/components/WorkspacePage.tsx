
"use client";

import Link from "next/link";
import { useState } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
      activeHref === href
        ? "bg-emerald-50 font-semibold text-emerald-800"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8f6] text-slate-800">
      <div className="flex min-h-screen">

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
          <Link href="/" className="mb-10 flex items-center gap-3 px-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-xl text-white">
              H
            </div>
            <div>
              <p className="font-semibold tracking-tight text-slate-900">
                Harvest &amp; Stories
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Relationship CRM
              </p>
            </div>
          </Link>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Your businesses
          </p>

          <nav className="space-y-1">
            {businesses.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-[#f3f6f0] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">
              ✦
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Your relationships, organized
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Keep every farming and writing connection close at hand.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">

          {/* RESPONSIVE HEADER */}
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
            <div className="flex min-h-[70px] items-center justify-between gap-3 px-4 py-3 sm:px-8">

              {/* MOBILE BRAND */}
              <Link href="/" className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-lg text-white">
                  H
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Harvest &amp; Stories
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Relationship CRM
                  </p>
                </div>
              </Link>

              {/* DESKTOP PAGE TITLE */}
              <div className="hidden lg:block">
                <p className="text-xs text-slate-500">
                  Workspace / {title}
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/contacts"
                  className="hidden rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:inline-flex"
                >
                  View contacts
                </Link>

                {/* MOBILE MENU BUTTON */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={mobileMenuOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                >
                  {mobileMenuOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* MOBILE NAVIGATION */}
            {mobileMenuOpen && (
              <div className="border-t border-slate-100 bg-white px-4 py-5 shadow-lg lg:hidden">
                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Workspace
                </p>

                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={linkClass(item.href)}
                    >
                      <span className="w-5 text-center text-lg">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <p className="mb-3 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Your businesses
                </p>

                <nav className="space-y-1">
                  {businesses.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={linkClass(item.href)}
                    >
                      <span className="w-5 text-center text-lg">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <Link
                  href="/contacts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-5 flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
                >
                  View contacts
                </Link>
              </div>
            )}
          </header>

          {/* PAGE CONTENT */}
          <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-8 sm:py-9 lg:px-10">

            <p className="mb-2 text-xs font-medium text-emerald-800 sm:text-sm">
              {eyebrow}
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {description}
            </p>

            {children ?? (
              <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                <p className="font-semibold text-slate-900">
                  This workspace is ready for your next step.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Use the navigation to move between your relationship tools.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
