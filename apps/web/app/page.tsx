
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import WorkspacePage from "./components/WorkspacePage";

export const instant = false;

type Metric = {
  label: string;
  value: number;
  description: string;
};

export default async function OverviewPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const tables = [
    { key: "contacts", label: "Contacts" },
    { key: "opportunities", label: "Opportunities" },
    { key: "follow_ups", label: "Follow-ups" },
    { key: "relationships", label: "Relationships" },
    { key: "farming_records", label: "Farming records" },
    { key: "writing_projects", label: "Writing projects" },
  ] as const;

  const results = await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase
        .from(table.key)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      return {
        ...table,
        count: count ?? 0,
        error: error?.message ?? null,
      };
    }),
  );

  const metrics: Metric[] = [
    {
      label: "Contacts",
      value: results[0].count,
      description: "People and organizations in your directory",
    },
    {
      label: "Opportunities",
      value: results[1].count,
      description: "Business opportunities you're tracking",
    },
    {
      label: "Follow-ups",
      value: results[2].count,
      description: "Tasks and conversations to follow up on",
    },
    {
      label: "Relationships",
      value: results[3].count,
      description: "Business relationships you're managing",
    },
    {
      label: "Farming records",
      value: results[4].count,
      description: "Farming activities and crop records",
    },
    {
      label: "Writing projects",
      value: results[5].count,
      description: "Writing projects you're managing",
    },
  ];

  const failedTables = results.filter((result) => result.error);

  return (
    <WorkspacePage
      title="Business overview"
      eyebrow="WELCOME BACK"
      activeHref="/"
      description="See what's happening across your farming and writing relationships today."
    >
      <div className="space-y-8">
        {failedTables.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <h2 className="font-semibold text-amber-900">
              Some dashboard metrics could not be loaded
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Check the table permissions and database policies in Supabase.
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-amber-800">
              {failedTables.map((table) => (
                <li key={table.key}>
                  {table.label}: {table.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <section>
          <div className="mb-5">
            <p className="text-sm font-medium text-emerald-700">
              YOUR WORKSPACE
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Business at a glance
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              These figures come directly from your Supabase database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {metric.value.toLocaleString()}
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  {metric.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Keep your workspace up to date
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add contacts, track opportunities, schedule follow-ups, record
            farming activities, and manage writing projects. Your dashboard
            totals will reflect saved database records whenever the page loads.
          </p>
        </section>
      </div>
    </WorkspacePage>
  );
}
