
"use client";

import { useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";

type Stage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
type Business = "Farming" | "Writing" | "Both";

type Opportunity = {
  id: number;
  title: string;
  contact: string;
  business: Business;
  value: number;
  stage: Stage;
  dueDate: string;
};

const stages: Stage[] = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const initialOpportunities: Opportunity[] = [
  {
    id: 1,
    title: "Organic produce partnership",
    contact: "Amara Okafor",
    business: "Farming",
    value: 850000,
    stage: "Negotiation",
    dueDate: "2026-10-28",
  },
  {
    id: 2,
    title: "Agriculture book proposal",
    contact: "Daniel Mensah",
    business: "Writing",
    value: 320000,
    stage: "Proposal",
    dueDate: "2026-10-30",
  },
  {
    id: 3,
    title: "Farm product storytelling campaign",
    contact: "Sarah Adeyemi",
    business: "Both",
    value: 450000,
    stage: "Qualified",
    dueDate: "2026-11-05",
  },
  {
    id: 4,
    title: "Fresh produce supply enquiry",
    contact: "Michael Bello",
    business: "Farming",
    value: 180000,
    stage: "Lead",
    dueDate: "2026-11-08",
  },
];

const stageStyles: Record<Stage, string> = {
  Lead: "bg-slate-100 text-slate-700",
  Qualified: "bg-sky-100 text-sky-800",
  Proposal: "bg-violet-100 text-violet-800",
  Negotiation: "bg-amber-100 text-amber-800",
  Won: "bg-emerald-100 text-emerald-800",
  Lost: "bg-rose-100 text-rose-800",
};

const businessStyles: Record<Business, string> = {
  Farming: "bg-emerald-50 text-emerald-800",
  Writing: "bg-violet-50 text-violet-800",
  Both: "bg-amber-50 text-amber-800",
};

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [businessFilter, setBusinessFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  const [title, setTitle] = useState("");
  const [contact, setContact] = useState("");
  const [business, setBusiness] = useState<Business>("Farming");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Stage>("Lead");
  const [dueDate, setDueDate] = useState("");

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return opportunities.filter((item) => {
      const matchesSearch =
        `${item.title} ${item.contact} ${item.business}`
          .toLowerCase()
          .includes(query);

      const matchesStage =
        stageFilter === "All" || item.stage === stageFilter;

      const matchesBusiness =
        businessFilter === "All" || item.business === businessFilter;

      return matchesSearch && matchesStage && matchesBusiness;
    });
  }, [opportunities, search, stageFilter, businessFilter]);

  const activeOpportunities = opportunities.filter(
    (item) => item.stage !== "Won" && item.stage !== "Lost",
  );

  const totalPipelineValue = activeOpportunities.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const wonValue = opportunities
    .filter((item) => item.stage === "Won")
    .reduce((sum, item) => sum + item.value, 0);

  function handleAddOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !contact.trim() || Number(value) < 0) return;

    const newOpportunity: Opportunity = {
      id: Date.now(),
      title: title.trim(),
      contact: contact.trim(),
      business,
      value: Number(value),
      stage,
      dueDate,
    };

    setOpportunities((current) => [newOpportunity, ...current]);
    setTitle("");
    setContact("");
    setBusiness("Farming");
    setValue("");
    setStage("Lead");
    setDueDate("");
    setShowForm(false);
  }

  function updateStage(id: number, nextStage: Stage) {
    setOpportunities((current) =>
      current.map((item) =>
        item.id === id ? { ...item, stage: nextStage } : item,
      ),
    );

    setSelectedOpportunity((current) =>
      current?.id === id ? { ...current, stage: nextStage } : current,
    );
  }

  return (
    <WorkspacePage
      title="Opportunities"
      activeHref="/opportunities"
      description="Track potential partnerships, manage your pipeline and see the value of opportunities across farming and writing."
    >
      <div className="mt-8 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Your opportunity pipeline
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Track each opportunity from its first lead to its final outcome.
            </p>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            {showForm ? "Cancel" : "+ Add opportunity"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">All opportunities</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {opportunities.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Including won and lost deals
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active opportunities</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {activeOpportunities.length}
            </p>
            <p className="mt-2 text-xs text-emerald-700">
              Still moving through the pipeline
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active pipeline value</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {currency.format(totalPipelineValue)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Excludes won and lost deals
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Value won</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {currency.format(wonValue)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              From opportunities marked Won
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddOpportunity}
            className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6"
          >
            <h3 className="mb-5 text-lg font-semibold text-slate-900">
              Add a new opportunity
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Opportunity name *
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Produce supply partnership"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Contact or organization *
                <input
                  required
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Enter contact name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Business
                <select
                  value={business}
                  onChange={(event) =>
                    setBusiness(event.target.value as Business)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-500"
                >
                  <option value="Farming">Farming</option>
                  <option value="Writing">Writing</option>
                  <option value="Both">Both businesses</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Expected value (₦)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="e.g. 250000"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Pipeline stage
                <select
                  value={stage}
                  onChange={(event) => setStage(event.target.value as Stage)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-500"
                >
                  {stages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Next action date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Save opportunity
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Pipeline stages
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            See how many opportunities are at each stage.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {stages.map((item) => {
              const count = opportunities.filter(
                (opportunity) => opportunity.stage === item,
              ).length;

              return (
                <button
                  key={item}
                  onClick={() =>
                    setStageFilter((current) =>
                      current === item ? "All" : item,
                    )
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    stageFilter === item
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-100 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block rounded-lg px-2 py-1 text-xs font-medium ${stageStyles[item]}`}
                  >
                    {item}
                  </span>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {count}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">opportunities</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-900">
              All opportunities
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter and update your opportunities.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or contact..."
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="All">All stages</option>
              {stages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={businessFilter}
              onChange={(event) => setBusinessFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="All">All business types</option>
              <option value="Farming">Farming</option>
              <option value="Writing">Writing</option>
              <option value="Both">Both businesses</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredOpportunities.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        {item.title}
                      </h4>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${businessStyles[item.business]}`}
                      >
                        {item.business}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Contact: {item.contact}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.dueDate
                        ? `Next action: ${item.dueDate}`
                        : "No next action date set"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-900">
                      {currency.format(item.value)}
                    </p>

                    <select
                      aria-label={`Update stage for ${item.title}`}
                      value={item.stage}
                      onChange={(event) =>
                        updateStage(item.id, event.target.value as Stage)
                      }
                      className={`max-w-full rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none ${stageStyles[item.stage]}`}
                    >
                      {stages.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedOpportunity(item)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredOpportunities.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <p className="font-medium text-slate-700">
                  No opportunities found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try another search or change your filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedOpportunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="opportunity-dialog-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Opportunity details
                  </p>
                  <h3
                    id="opportunity-dialog-title"
                    className="mt-2 text-xl font-semibold text-slate-900"
                  >
                    {selectedOpportunity.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  aria-label="Close details"
                  className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Contact</span>
                  <span className="text-right font-medium text-slate-800">
                    {selectedOpportunity.contact}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Business</span>
                  <span className="font-medium text-slate-800">
                    {selectedOpportunity.business}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Expected value</span>
                  <span className="font-semibold text-slate-900">
                    {currency.format(selectedOpportunity.value)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Next action date</span>
                  <span className="font-medium text-slate-800">
                    {selectedOpportunity.dueDate || "Not set"}
                  </span>
                </div>
                <div>
                  <label
                    htmlFor="detail-stage"
                    className="mb-2 block text-slate-500"
                  >
                    Update stage
                  </label>
                  <select
                    id="detail-stage"
                    value={selectedOpportunity.stage}
                    onChange={(event) =>
                      updateStage(
                        selectedOpportunity.id,
                        event.target.value as Stage,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-emerald-500"
                  >
                    {stages.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setSelectedOpportunity(null)}
                className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Done
              </button>
            </div>
          </div>
        )}

        <p className="text-xs leading-5 text-slate-400">
          Prototype data only. Opportunities and stage changes currently live
          in page memory and reset on refresh. Database persistence comes in a
          later step.
        </p>
      </div>
    </WorkspacePage>
  );
}
