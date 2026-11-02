"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";
import { createClient } from "@/lib/supabase/client";

type Stage =
  | "Lead"
  | "Qualified"
  | "Proposal"
  | "Negotiation"
  | "Won"
  | "Lost";

type Business = "Farming" | "Writing" | "Both";

type Contact = {
  id: string;
  full_name: string | null;
  organization: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  description: string;
  contactId: string | null;
  contactName: string;
  business: Business;
  value: number;
  currency: string;
  stage: Stage;
  dueDate: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  description: string | null;
  contact_id: string | null;
  business_area: string | null;
  amount: number | null;
  currency: string | null;
  stage: string | null;
  expected_close_date: string | null;
};

const stages: Stage[] = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
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

function normalizeStage(value: string | null): Stage {
  if (stages.includes(value as Stage)) {
    return value as Stage;
  }

  return "Lead";
}

function normalizeBusiness(value: string | null): Business {
  if (value === "Farming" || value === "Writing" || value === "Both") {
    return value;
  }

  return "Farming";
}

export default function OpportunitiesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [businessFilter, setBusinessFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactId, setContactId] = useState("");
  const [business, setBusiness] = useState<Business>("Farming");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Stage>("Lead");
  const [dueDate, setDueDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOpportunities = useCallback(async () => {
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      window.location.assign("/login");
      return;
    }

    const [contactsResult, opportunitiesResult] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, full_name, organization")
        .eq("user_id", user.id)
        .order("full_name", { ascending: true }),

      supabase
        .from("opportunities")
        .select(
          "id, title, description, contact_id, business_area, amount, currency, stage, expected_close_date",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (contactsResult.error) {
      throw contactsResult.error;
    }

    if (opportunitiesResult.error) {
      throw opportunitiesResult.error;
    }

    const loadedContacts = (contactsResult.data ?? []) as Contact[];

    const loadedOpportunities = (
      (opportunitiesResult.data ?? []) as OpportunityRow[]
    ).map((row) => {
      const contact = loadedContacts.find(
        (item) => item.id === row.contact_id,
      );

      return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        contactId: row.contact_id,
        contactName:
          contact?.full_name ||
          contact?.organization ||
          "No contact selected",
        business: normalizeBusiness(row.business_area),
        value: Number(row.amount ?? 0),
        currency: row.currency || "NGN",
        stage: normalizeStage(row.stage),
        dueDate: row.expected_close_date ?? "",
      };
    });

    setContacts(loadedContacts);
    setOpportunities(loadedOpportunities);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await loadOpportunities();
      } catch (reason: unknown) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load opportunities.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadOpportunities]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function subscribeToOpportunityChanges() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled || error || !user) return;

      channel = supabase
        .channel(`opportunities-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "opportunities",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadOpportunities();
          },
        )
        .subscribe((status: string, error: Error | undefined) => {
          if (status === "CHANNEL_ERROR") {
            console.error(
              "Opportunities Realtime subscription failed.",
              error,
            );
          }
        });
    }

    void subscribeToOpportunityChanges();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadOpportunities, supabase]);

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return opportunities.filter((item) => {
      const matchesSearch =
        `${item.title} ${item.contactName} ${item.business}`
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

  function resetForm() {
    setTitle("");
    setDescription("");
    setContactId("");
    setBusiness("Farming");
    setValue("");
    setStage("Lead");
    setDueDate("");
  }

  function openCreateForm() {
    resetForm();
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (isSaving) return;

    setShowForm(false);
    resetForm();
  }

  async function handleAddOpportunity(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      if (!title.trim()) {
        throw new Error("Please enter an opportunity name.");
      }

      if (!contactId) {
        throw new Error("Please select a contact.");
      }

      const numericValue = Number(value);

      if (Number.isNaN(numericValue) || numericValue < 0) {
        throw new Error("Please enter a valid opportunity amount.");
      }

      const { error: insertError } = await supabase
        .from("opportunities")
        .insert({
          user_id: user.id,
          contact_id: contactId,
          title: title.trim(),
          description: description.trim(),
          business_area: business,
          stage,
          amount: numericValue,
          currency: "NGN",
          expected_close_date: dueDate || null,
        });

      if (insertError) throw insertError;

      await loadOpportunities();

      setShowForm(false);
      resetForm();
      setNotice("Opportunity saved successfully.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save the opportunity.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStage(id: string, nextStage: Stage) {
    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in again.");
      }

      const { data, error: updateError } = await supabase
        .from("opportunities")
        .update({
          stage: nextStage,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id");

      if (updateError) throw updateError;

      if (!data?.length) {
        throw new Error(
          "The opportunity was not updated. Check your Supabase access policies.",
        );
      }

      setOpportunities((current) =>
        current.map((item) =>
          item.id === id ? { ...item, stage: nextStage } : item,
        ),
      );

      setSelectedOpportunity((current) =>
        current?.id === id
          ? { ...current, stage: nextStage }
          : current,
      );

      setNotice("Opportunity stage updated.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update the opportunity.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteOpportunity(opportunity: Opportunity) {
    const confirmed = window.confirm(
      `Delete "${opportunity.title}" from your opportunities?`,
    );

    if (!confirmed) return;

    setDeletingId(opportunity.id);
    setError("");
    setNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in again.");
      }

      const { data, error: deleteError } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", opportunity.id)
        .eq("user_id", user.id)
        .select("id");

      if (deleteError) throw deleteError;

      if (!data?.length) {
        throw new Error(
          "The opportunity was not deleted. Check your Supabase access policies.",
        );
      }

      setOpportunities((current) =>
        current.filter((item) => item.id !== opportunity.id),
      );

      if (selectedOpportunity?.id === opportunity.id) {
        setSelectedOpportunity(null);
      }

      setNotice("Opportunity deleted successfully.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete the opportunity.",
      );
    } finally {
      setDeletingId(null);
    }
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
            onClick={openCreateForm}
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            + Add opportunity
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

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

            {contacts.length === 0 ? (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                You need at least one contact before creating an
                opportunity. Add a contact first.
              </div>
            ) : null}

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
                Contact *
                <select
                  required
                  value={contactId}
                  onChange={(event) => setContactId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-500"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name ||
                        contact.organization ||
                        "Unnamed contact"}
                      {contact.organization
                        ? ` — ${contact.organization}`
                        : ""}
                    </option>
                  ))}
                </select>
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
                  onChange={(event) =>
                    setStage(event.target.value as Stage)
                  }
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
                Expected close date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Description
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Add notes about this opportunity..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving || contacts.length === 0}
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save opportunity"}
              </button>

              <button
                type="button"
                onClick={closeForm}
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

                  <p className="mt-1 text-xs text-slate-500">
                    opportunities
                  </p>
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
              Search, filter and manage your saved opportunities.
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

          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading opportunities...
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <p className="font-medium text-slate-700">
                No opportunities found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first opportunity to start building your pipeline.
              </p>
            </div>
          ) : (
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
                        Contact: {item.contactName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.dueDate
                          ? `Expected close: ${item.dueDate}`
                          : "No expected close date"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-slate-900">
                        {currency.format(item.value)}
                      </p>

                      <select
                        aria-label={`Update stage for ${item.title}`}
                        value={item.stage}
                        disabled={updatingId === item.id}
                        onChange={(event) =>
                          void updateStage(
                            item.id,
                            event.target.value as Stage,
                          )
                        }
                        className={`rounded-lg border-0 px-3 py-2 text-xs font-semibold outline-none ${stageStyles[item.stage]}`}
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

                      <button
                        disabled={deletingId === item.id}
                        onClick={() =>
                          void handleDeleteOpportunity(item)
                        }
                        className="rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === item.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    {selectedOpportunity.contactName}
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
                  <span className="text-slate-500">Expected close</span>
                  <span className="font-medium text-slate-800">
                    {selectedOpportunity.dueDate || "Not set"}
                  </span>
                </div>

                {selectedOpportunity.description && (
                  <div>
                    <p className="mb-2 text-slate-500">Description</p>

                    <p className="rounded-xl bg-slate-50 p-3 leading-6 text-slate-700">
                      {selectedOpportunity.description}
                    </p>
                  </div>
                )}

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
                    disabled={updatingId === selectedOpportunity.id}
                    onChange={(event) =>
                      void updateStage(
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
      </div>
    </WorkspacePage>
  );
}