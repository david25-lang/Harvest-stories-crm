"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";
import { createClient } from "@/lib/supabase/client";

type Metrics = {
  opportunities: number;
  farming: number;
  writing: number;
  followUps: number;
};

export default function InsightsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [metrics, setMetrics] = useState<Metrics>({
    opportunities: 0,
    farming: 0,
    writing: 0,
    followUps: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in to view your insights.");
        return;
      }

      const [
        opportunitiesResult,
        farmingResult,
        writingResult,
        followUpsResult,
      ] = await Promise.all([
        supabase
          .from("opportunities")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        supabase
          .from("farming_records")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        supabase
          .from("writing_projects")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const firstError =
        opportunitiesResult.error ||
        farmingResult.error ||
        writingResult.error ||
        followUpsResult.error;

      if (firstError) {
        throw firstError;
      }

      setMetrics({
        opportunities: opportunitiesResult.count ?? 0,
        farming: farmingResult.count ?? 0,
        writing: writingResult.count ?? 0,
        followUps: followUpsResult.count ?? 0,
      });
    } catch (err) {
      console.error("Failed to load insights:", err);
      setError("Unable to load your insights from the database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // The initial request intentionally updates loading and error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function subscribeToInsightChanges() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled || error || !user) return;

      channel = supabase
        .channel(`insights-live-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadInsights();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farming_records",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadInsights();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "writing_projects",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadInsights();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_ups",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadInsights();
        }
      )
      .subscribe((status: string, subscriptionError: Error | undefined) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Insights Realtime subscription failed.",
            subscriptionError,
          );
        }
      });

    }

    void subscribeToInsightChanges();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [supabase, loadInsights]);

  const total =
    metrics.opportunities +
    metrics.farming +
    metrics.writing +
    metrics.followUps;

  const distribution = [
    {
      label: "Opportunities",
      value: metrics.opportunities,
      color: "bg-blue-600",
    },
    {
      label: "Farming",
      value: metrics.farming,
      color: "bg-green-600",
    },
    {
      label: "Writing",
      value: metrics.writing,
      color: "bg-purple-600",
    },
    {
      label: "Follow-ups",
      value: metrics.followUps,
      color: "bg-amber-500",
    },
  ];

  return (
    <WorkspacePage
      title="Insights"
      activeHref="/insights"
      description="Review activity across your farming, writing and business relationships."
    >
      <div className="space-y-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Business overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Live records from your Supabase workspace.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Opportunities",
                value: metrics.opportunities,
                detail: "Live pipeline records",
                color: "text-blue-700",
                background: "bg-blue-50",
              },
              {
                title: "Farm records",
                value: metrics.farming,
                detail: "Live crop records",
                color: "text-green-700",
                background: "bg-green-50",
              },
              {
                title: "Writing projects",
                value: metrics.writing,
                detail: "Live writing projects",
                color: "text-purple-700",
                background: "bg-purple-50",
              },
              {
                title: "Follow-ups",
                value: metrics.followUps,
                detail: "Live follow-up records",
                color: "text-amber-700",
                background: "bg-amber-50",
              },
            ].map((metric) => (
              <div
                key={metric.title}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.background}`}
                >
                  <span className={`text-lg font-bold ${metric.color}`}>
                    {metric.title.charAt(0)}
                  </span>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  {metric.title}
                </p>

                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {loading ? "..." : metric.value}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Workspace distribution
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Number of records currently stored in each module.
            </p>

            <div className="mt-6 space-y-5">
              {distribution.map((item) => {
                const width =
                  total > 0 ? `${(item.value / total) * 100}%` : "0%";

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-700">{item.label}</span>

                      <span className="font-semibold text-gray-900">
                        {loading ? "..." : item.value}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Workspace summary
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              A quick view of your current workspace activity.
            </p>

            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Total records
              </p>

              <p className="mt-1 text-4xl font-semibold text-gray-900">
                {loading ? "..." : total}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Combined records across opportunities, farming, writing and
                follow-ups.
              </p>
            </div>

            <button
              type="button"
              onClick={loadInsights}
              disabled={loading}
              className="mt-6 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh insights"}
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Data status
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Insights are calculated from your authenticated Supabase data.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />

              <p className="font-medium text-gray-900">
                Database connected
              </p>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              The figures above are loaded for the currently signed-in user.
              New database changes will also refresh the insights through
              Supabase Realtime.
            </p>
          </div>
        </section>
      </div>
    </WorkspacePage>
  );
}