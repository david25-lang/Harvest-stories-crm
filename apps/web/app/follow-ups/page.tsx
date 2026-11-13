"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  full_name: string;
  organization: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  contact_id: string | null;
};

type FollowUpRow = {
  id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: string | null;
  status: string | null;
};

type FollowUp = {
  id: string;
  title: string;
  contactId: string | null;
  contact: string;
  opportunityId: string | null;
  opportunity: string;
  description: string;
  type: string;
  dueDate: string;
  priority: string;
  status: string;
  completed: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FollowUpsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<FollowUp[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [type, setType] = useState("Call");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to view your follow-ups.");
      setLoading(false);
      return;
    }

    const [followUpsResult, contactsResult, opportunitiesResult] =
      await Promise.all([
        supabase
          .from("follow_ups")
          .select(
            "id, contact_id, opportunity_id, title, description, due_at, priority, status"
          )
          .eq("user_id", user.id)
          .order("due_at", { ascending: true }),

        supabase
          .from("contacts")
          .select("id, full_name, organization")
          .eq("user_id", user.id)
          .order("full_name", { ascending: true }),

        supabase
          .from("opportunities")
          .select("id, title, contact_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

    if (followUpsResult.error) {
      setError(`Could not load follow-ups: ${followUpsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (contactsResult.error) {
      setError(`Could not load contacts: ${contactsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (opportunitiesResult.error) {
      setError(
        `Could not load opportunities: ${opportunitiesResult.error.message}`
      );
      setLoading(false);
      return;
    }

    const loadedContacts = (contactsResult.data ?? []) as Contact[];
    const loadedOpportunities = (opportunitiesResult.data ??
      []) as Opportunity[];

    const contactMap = new Map(
      loadedContacts.map((contact) => [contact.id, contact])
    );

    const opportunityMap = new Map(
      loadedOpportunities.map((opportunity) => [opportunity.id, opportunity])
    );

    const mappedFollowUps: FollowUp[] = (
      (followUpsResult.data ?? []) as FollowUpRow[]
    ).map((item) => {
      const contact = item.contact_id
        ? contactMap.get(item.contact_id)
        : undefined;

      const opportunity = item.opportunity_id
        ? opportunityMap.get(item.opportunity_id)
        : undefined;

      const status = item.status || "Pending";

      return {
        id: item.id,
        title: item.title,
        contactId: item.contact_id,
        contact: contact?.full_name || "No contact",
        opportunityId: item.opportunity_id,
        opportunity: opportunity?.title || "",
        description: item.description || "",
        type: item.description?.startsWith("[Type:")
          ? item.description.match(/^\[Type:\s*(.*?)\]/)?.[1] || "Other"
          : "Other",
        dueDate: item.due_at || "",
        priority: item.priority || "Medium",
        status,
        completed: status.toLowerCase() === "completed",
      };
    });

    setContacts(loadedContacts);
    setOpportunities(loadedOpportunities);
    setItems(mappedFollowUps);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // The initial request intentionally updates loading and error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFollowUps();
  }, [loadFollowUps, supabase]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function subscribeToFollowUpChanges() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled || error || !user) return;

      channel = supabase
        .channel(`follow-ups-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "follow_ups",
          },
          () => {
            void loadFollowUps();
          },
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR") {
            console.error("Follow-ups Realtime subscription failed.");
          }
        });
    }

    void subscribeToFollowUpChanges();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadFollowUps, supabase]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.contact.toLowerCase().includes(query) ||
        item.opportunity.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Completed" && item.completed) ||
        (filter === "Pending" && !item.completed);

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  async function addFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!contactId) {
      setError("Please select a contact.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to add a follow-up.");
      return;
    }

    setSaving(true);
    setError("");

    const finalDescription = `[Type: ${type}]${
      description.trim() ? `\n${description.trim()}` : ""
    }`;

    const { error: insertError } = await supabase
      .from("follow_ups")
      .insert({
        user_id: user.id,
        contact_id: contactId,
        opportunity_id: opportunityId || null,
        title: title.trim(),
        description: finalDescription,
        due_at: dueDate
          ? new Date(`${dueDate}T12:00:00`).toISOString()
          : null,
        priority,
        status: "Pending",
      });

    if (insertError) {
      setError(`Could not save follow-up: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setTitle("");
    setContactId("");
    setOpportunityId("");
    setType("Call");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
    setShowForm(false);

    await loadFollowUps();

    setSaving(false);
  }

  async function toggleCompleted(item: FollowUp) {
    const nextStatus = item.completed ? "Pending" : "Completed";

    setError("");

    const { error: updateError } = await supabase
      .from("follow_ups")
      .update({
        status: nextStatus,
      })
      .eq("id", item.id);

    if (updateError) {
      setError(`Could not update follow-up: ${updateError.message}`);
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: nextStatus,
              completed: nextStatus === "Completed",
            }
          : entry
      )
    );
  }

  async function deleteFollowUp(item: FollowUp) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");

    const { error: deleteError } = await supabase
      .from("follow_ups")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(`Could not delete follow-up: ${deleteError.message}`);
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  const pendingCount = items.filter((item) => !item.completed).length;
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <WorkspacePage
      title="Follow-ups"
      activeHref="/follow-ups"
      description="Keep every conversation moving with clear next steps and deadlines."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Follow-up tracker
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage calls, meetings, emails and outstanding actions.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            {showForm ? "Cancel" : "+ Add follow-up"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total follow-ups</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {completedCount}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={addFollowUp}
            className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Task title
              </label>

              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call about a farm order"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-700"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contact
              </label>

              <select
                required
                value={contactId}
                onChange={(e) => {
                  setContactId(e.target.value);
                  setOpportunityId("");
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option value="">Select a contact</option>

                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name}
                    {contact.organization
                      ? ` — ${contact.organization}`
                      : ""}
                  </option>
                ))}
              </select>

              {contacts.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Add a contact first before creating a follow-up.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Opportunity
              </label>

              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option value="">No opportunity</option>

                {opportunities
                  .filter(
                    (opportunity) =>
                      !contactId ||
                      opportunity.contact_id === contactId
                  )
                  .map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Activity type
              </label>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>Call</option>
                <option>Meeting</option>
                <option>Email</option>
                <option>Message</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Due date
              </label>

              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add notes about this follow-up..."
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-700"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving || contacts.length === 0}
                className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save follow-up"}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, contacts or opportunities..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading follow-ups...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No follow-ups found. Try another search or add a new task.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCompleted(item)}
                      aria-label={`Mark ${item.title} completed`}
                      className="mt-1 h-4 w-4 accent-green-700"
                    />

                    <div>
                      <p
                        className={`font-semibold ${
                          item.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.contact} · {item.type}
                      </p>

                      {item.opportunity && (
                        <p className="mt-1 text-xs text-gray-500">
                          Opportunity: {item.opportunity}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">
                        Due: {formatDate(item.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.priority === "High"
                          ? "bg-red-50 text-red-700"
                          : item.priority === "Medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.priority}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.completed
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.completed ? "Completed" : "Pending"}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteFollowUp(item)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Follow-ups are stored in your Supabase database and linked to your
          existing contacts and opportunities.
        </p>
      </div>
    </WorkspacePage>
  );
}
