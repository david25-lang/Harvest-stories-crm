
import WorkspacePage from "../components/WorkspacePage";

const metrics = [
  {
    title: "Opportunities",
    value: "4",
    detail: "Sample pipeline records",
    color: "text-blue-700",
    background: "bg-blue-50",
  },
  {
    title: "Farm records",
    value: "3",
    detail: "Crop records tracked",
    color: "text-green-700",
    background: "bg-green-50",
  },
  {
    title: "Writing projects",
    value: "3",
    detail: "Articles and stories",
    color: "text-purple-700",
    background: "bg-purple-50",
  },
  {
    title: "Follow-ups",
    value: "3",
    detail: "Tasks to review",
    color: "text-amber-700",
    background: "bg-amber-50",
  },
];

const activities = [
  {
    title: "Organic produce partnership",
    category: "Opportunity",
    description: "Review the next steps in the partnership.",
    status: "In progress",
  },
  {
    title: "The Future of Sustainable Farming",
    category: "Writing",
    description: "Continue drafting the farming article.",
    status: "Draft",
  },
  {
    title: "Tomatoes — Greenhouse A",
    category: "Farming",
    description: "Review crop progress and the expected harvest.",
    status: "Growing",
  },
  {
    title: "Discuss produce supply",
    category: "Follow-up",
    description: "Contact the supplier about the proposed arrangement.",
    status: "Pending",
  },
];

export default function InsightsPage() {
  return (
    <WorkspacePage
      title="Insights"
      activeHref="/insights"
      description="Review activity across your farming, writing and business relationships."
    >
      <div className="space-y-8">
        <section>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Business overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              A snapshot of activity across your workspace.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
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
                  {metric.value}
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
              Number of sample records in each module.
            </p>

            <div className="mt-6 space-y-5">
              {[
                { label: "Opportunities", value: 4, width: "100%", color: "bg-blue-600" },
                { label: "Farming", value: 3, width: "75%", color: "bg-green-600" },
                { label: "Writing", value: 3, width: "75%", color: "bg-purple-600" },
                { label: "Follow-ups", value: 3, width: "75%", color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-semibold text-gray-900">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recommended next steps
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Actions to review during your next workspace session.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="font-medium text-amber-900">
                  Review pending follow-ups
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Check which contacts need a call, message or meeting.
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <p className="font-medium text-green-900">
                  Review upcoming harvests
                </p>
                <p className="mt-1 text-sm text-green-800">
                  Check crop schedules and update farming records.
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-4">
                <p className="font-medium text-purple-900">
                  Move writing projects forward
                </p>
                <p className="mt-1 text-sm text-purple-800">
                  Review drafts and upcoming publication dates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Activity overview
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Example records requiring attention.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Activity</th>
                  <th className="px-5 py-4 font-medium">Module</th>
                  <th className="px-5 py-4 font-medium">Details</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <tr key={activity.title}>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {activity.title}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {activity.category}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {activity.description}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-gray-500">
          These are illustrative figures and sample activities, not live
          database analytics. We will connect this page to real records later.
        </p>
      </div>
    </WorkspacePage>
  );
}
