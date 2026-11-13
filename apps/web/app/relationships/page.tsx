
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

type RelationshipRow = {
  id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  organization_name: string | null;
  project_name: string | null;
  relationship_type: string | null;
  status: string | null;
  notes: string | null;
};

type Relationship = {
  id: string;
  contactId: string | null;
  opportunityId: string | null;
  name: string;
  role: string;
  organization: string;
  category: string;
  connectedTo: string;
  strength: string;
  notes: string;
};

const statuses = ["Active", "Pending", "Inactive"];
const categories = ["Farming", "Writing", "Both"];

// These values must match the Supabase CHECK constraint exactly.
const relationshipTypes = [
  "Business Partner",
  "Client",
  "Supplier",
  "Publisher",
  "Collaborator",
  "Other",
];

function parseRelationshipNotes(rawNotes: string | null, projectName: string | null) {
  const notes = rawNotes ?? "";
  const areaMatch = notes.match(/^\[Area: (Farming|Writing|Both)\]\s*/);

  // Support older records where the category was stored in project_name.
  const legacyCategory = categories.includes(projectName ?? "")
    ? projectName!
    : null;

  return {
    category: areaMatch?.[1] ?? legacyCategory ?? "Both",
    notes: areaMatch
      ? notes.replace(/^\[Area: (Farming|Writing|Both)\]\s*/, "")
      : notes,
  };
}

export default function RelationshipsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [newCategory, setNewCategory] = useState("Farming");
  const [connectedTo, setConnectedTo] = useState("");
  const [strength, setStrength] = useState("Pending");
  const [notes, setNotes] = useState("");

  const loadRelationships = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please log in to view your relationships.");
      setLoading(false);
      return;
    }

    const [relationshipResult, contactResult, opportunityResult] =
      await Promise.all([
        supabase
          .from("relationships")
          .select(
            "id, contact_id, opportunity_id, organization_name, project_name, relationship_type, status, notes"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

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

    if (relationshipResult.error) {
      setError(`Could not load relationships: ${relationshipResult.error.message}`);
      setLoading(false);
      return;
    }

    if (contactResult.error) {
      setError(`Could not load contacts: ${contactResult.error.message}`);
      setLoading(false);
      return;
    }

    if (opportunityResult.error) {
      setError(`Could not load opportunities: ${opportunityResult.error.message}`);
      setLoading(false);
      return;
    }

    const loadedContacts = (contactResult.data ?? []) as Contact[];
    const loadedOpportunities = (opportunityResult.data ?? []) as Opportunity[];

    const contactMap = new Map(loadedContacts.map((item) => [item.id, item]));
    const opportunityMap = new Map(
      loadedOpportunities.map((item) => [item.id, item])
    );

    const mapped = ((relationshipResult.data ?? []) as RelationshipRow[]).map(
      (row): Relationship => {
        const contact = row.contact_id
          ? contactMap.get(row.contact_id)
          : undefined;

        const opportunity = row.opportunity_id
          ? opportunityMap.get(row.opportunity_id)
          : undefined;

        const parsedNotes = parseRelationshipNotes(
          row.notes,
          row.project_name
        );

        const projectName = categories.includes(row.project_name ?? "")
          ? ""
          : row.project_name ?? "";

        return {
          id: row.id,
          contactId: row.contact_id,
          opportunityId: row.opportunity_id,
          name: contact?.full_name ?? "Unlinked contact",
          role: relationshipTypes.includes(row.relationship_type ?? "")
            ? row.relationship_type!
            : "Other",
          organization:
            row.organization_name ?? contact?.organization ?? "",
          category: parsedNotes.category,
          connectedTo: opportunity?.title ?? projectName,
          strength: statuses.includes(row.status ?? "")
           ? row.status!
            : "Pending",
          notes: parsedNotes.notes,
        };
      }
    );

    setContacts(loadedContacts);
    setOpportunities(loadedOpportunities);
    setRelationships(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Load persisted records when the page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRelationships();
  }, [loadRelationships, supabase]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function subscribeToRelationshipChanges() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled || error || !user) return;

      channel = supabase
        .channel(`relationships-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "relationships",
          },
          () => {
            void loadRelationships();
          },
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR") {
            console.error("Relationships Realtime subscription failed.");
          }
        });
    }

    void subscribeToRelationshipChanges();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadRelationships, supabase]);

  const filteredRelationships = useMemo(() => {
    const term = search.toLowerCase().trim();

    return relationships.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.organization.toLowerCase().includes(term) ||
        item.connectedTo.toLowerCase().includes(term) ||
        item.role.toLowerCase().includes(term);

      return (
        matchesSearch &&
        (category === "All" || item.category === category)
      );
    });
  }, [relationships, search, category]);

  async function addRelationship(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!contactId) {
      setError("Select an existing contact first.");
      return;
    }

    if (!relationshipTypes.includes(role)) {
      setError("Select a valid relationship type.");
      return;
    }

    if (!categories.includes(newCategory)) {
      setError("Select a valid connection area.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please log in again before saving.");
      setSaving(false);
      return;
    }

    const selectedContact = contacts.find((item) => item.id === contactId);

    if (!selectedContact) {
      setError("The selected contact could not be found. Refresh and try again.");
      setSaving(false);
      return;
    }

    const selectedOpportunity = opportunityId
      ? opportunities.find((item) => item.id === opportunityId)
      : undefined;

    if (opportunityId && !selectedOpportunity) {
      setError("The selected opportunity could not be found. Refresh and try again.");
      setSaving(false);
      return;
    }

    const cleanProjectName = connectedTo.trim();

    const savedNotes = `[Area: ${newCategory}]${
      notes.trim() ? `\n${notes.trim()}` : ""
    }`;

    const { error: insertError } = await supabase.from("relationships").insert({
      user_id: user.id,
      contact_id: contactId,
      opportunity_id: opportunityId || null,
      organization_name:
        organization.trim() || selectedContact.organization || null,
      project_name:
        cleanProjectName ||
        (selectedOpportunity ? selectedOpportunity.title : null),
      relationship_type: role,
      status: strength,
      notes: savedNotes,
    });

    if (insertError) {
      setError(`Could not save relationship: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setContactId("");
    setOpportunityId("");
    setRole("");
    setOrganization("");
    setNewCategory("Farming");
    setConnectedTo("");
    setStrength("Pending");
    setNotes("");
    setShowForm(false);

    await loadRelationships();
    setSaving(false);
  }

  async function updateStatus(item: Relationship, nextStatus: string) {
    if (!statuses.includes(nextStatus)) {
      setError("Select a valid relationship status.");
      return;
    }

    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again before updating.");
      return;
    }

    const { error: updateError } = await supabase
      .from("relationships")
      .update({ status: nextStatus })
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(`Could not update status: ${updateError.message}`);
      return;
    }

    setRelationships((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, strength: nextStatus } : entry
      )
    );
  }

  async function deleteRelationship(item: Relationship) {
    if (!window.confirm(`Delete the relationship with ${item.name}?`)) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again before deleting.");
      return;
    }

    setError("");

    const { error: deleteError } = await supabase
      .from("relationships")
      .delete()
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(`Could not delete relationship: ${deleteError.message}`);
      return;
    }

    setRelationships((current) =>
      current.filter((entry) => entry.id !== item.id)
    );
  }

  const farmingCount = relationships.filter(
    (item) => item.category === "Farming" || item.category === "Both"
  ).length;

  const writingCount = relationships.filter(
    (item) => item.category === "Writing" || item.category === "Both"
  ).length;

  return (
    <WorkspacePage
      title="Relationships"
      activeHref="/relationships"
      description="Understand the people, organisations and projects connected to your work."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Relationship directory
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep useful context about people and their connections.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
            }}
            className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            {showForm ? "Cancel" : "+ Add relationship"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Relationships recorded</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {relationships.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Farming connections</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {farmingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Writing connections</p>
            <p className="mt-2 text-3xl font-semibold text-blue-700">
              {writingCount}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={addRelationship}
            className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
          >
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
                <option value="">Select an existing contact</option>
                {contacts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.full_name}
                  </option>
                ))}
              </select>
              {contacts.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  Add a contact on the Contacts page first.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role / relationship type
              </label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option value="">Select a relationship type</option>
                {relationshipTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Organisation
              </label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Company or organisation"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Connection area
              </label>
              <select
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Related opportunity
              </label>
              <select
                value={opportunityId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setOpportunityId(selectedId);

                  const selected = opportunities.find(
                    (item) => item.id === selectedId
                  );

                  if (selected) setConnectedTo(selected.title);
                  else setConnectedTo("");
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option value="">No linked opportunity</option>
                {opportunities
                  .filter(
                    (item) =>
                      !contactId || item.contact_id === contactId
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Project or connection details
              </label>
              <input
                value={connectedTo}
                onChange={(e) => setConnectedTo(e.target.value)}
                placeholder="Project name or context"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Relationship status
              </label>
              <select
                required
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Important details about this relationship"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving || contacts.length === 0}
              className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 sm:col-span-2"
            >
              {saving ? "Saving..." : "Save relationship"}
            </button>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, organisations or projects..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option value="All">All</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 lg:col-span-2">
              Loading relationships...
            </div>
          ) : filteredRelationships.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 lg:col-span-2">
              No relationships found. Add one or change your search.
            </div>
          ) : (
            filteredRelationships.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.role}
                      {item.organization ? ` · ${item.organization}` : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {item.strength}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Area: </span>
                    <span className="font-medium text-gray-800">
                      {item.category}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Connected to: </span>
                    <span className="font-medium text-gray-800">
                      {item.connectedTo || "No project linked"}
                    </span>
                  </p>
                  <p className="whitespace-pre-line leading-6 text-gray-600">
                    {item.notes || "No additional notes."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Update relationship status
                    </label>
                    <select
                      value={item.strength}
                      onChange={(e) => updateStatus(item, e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {statuses.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteRelationship(item)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <p className="text-xs text-gray-500">
          Relationships are loaded from your Supabase database and associated
          with your existing contacts and opportunities.
        </p>
      </div>
    </WorkspacePage>
  );
}
