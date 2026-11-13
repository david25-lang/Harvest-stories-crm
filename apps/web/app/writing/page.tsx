"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";
import { createClient } from "@/lib/supabase/client";

type WritingItem = {
  id: string;
  title: string;
  content_type: string;
  status: string;
  due_date: string | null;
  published_at: string | null;
  notes: string | null;
  created_at: string;
};

const contentTypes = ["Article", "Story", "Newsletter", "Blog post", "Book chapter", "Other"];
const statuses = ["Idea", "Drafting", "Editing", "Published", "On Hold"];

function formatDate(value: string | null) {
  if (!value) return "No deadline set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function WritingPage() {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<WritingItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("Article");
  const [status, setStatus] = useState("Idea");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Please log in to view your writing projects.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("writing_projects")
      .select("id, title, content_type, status, due_date, published_at, notes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(`Could not load writing projects: ${queryError.message}`);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as WritingItem[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // The initial request intentionally updates loading and error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems, supabase]);
  
useEffect(() => {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | undefined;

  async function subscribeToWritingChanges() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (cancelled || userError || !user) return;

    channel = supabase
      .channel(`writing-projects-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "writing_projects",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadItems();
        },
      )
      .subscribe((status: string, error: Error | undefined) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Writing Realtime subscription failed.", error);
        }
      });
  }

  void subscribeToWritingChanges();

  return () => {
    cancelled = true;

    if (channel) {
      void supabase.removeChannel(channel);
    }
  };
}, [loadItems, supabase]);


  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.content_type.toLowerCase().includes(query) ||
        (item.notes ?? "").toLowerCase().includes(query);

      return matchesSearch && (filter === "All" || item.status === filter);
    });
  }, [items, search, filter]);

  function resetForm() {
    setTitle("");
    setContentType("Article");
    setStatus("Idea");
    setDueDate("");
    setNotes("");
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Enter a title for the writing project.");
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again before saving.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("writing_projects").insert({
       user_id: user.id,
  title: title.trim(),
  content_type: contentType,
  status,
  due_date: dueDate || null,
  notes: notes.trim() || null,
  published_at: status === "Published" ? new Date().toISOString() : null,
});

    if (insertError) {
      setError(`Could not save writing project: ${insertError.message}`);
      setSaving(false);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadItems();
    setSaving(false);
  }

  async function updateStatus(item: WritingItem, nextStatus: string) {
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again before updating.");
      return;
    }

    const { error: updateError } = await supabase
      .from("writing_projects")
      .update({
        status: nextStatus,
        published_at:
          nextStatus === "Published"
            ? item.published_at ?? new Date().toISOString()
            : null,
      })
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(`Could not update writing project: ${updateError.message}`);
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: nextStatus,
              published_at:
                nextStatus === "Published"
                  ? entry.published_at ?? new Date().toISOString()
                  : null,
            }
          : entry,
      ),
    );
  }

  async function deleteItem(item: WritingItem) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again before deleting.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("writing_projects")
      .delete()
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(`Could not delete writing project: ${deleteError.message}`);
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  const inProgressCount = items.filter((item) =>
    ["Draft", "In Progress", "Under Review"].includes(item.status),
  ).length;
  const publishedCount = items.filter((item) => item.status === "Published").length;

  return (
    <WorkspacePage
      title="Writing"
      activeHref="/writing"
      description="Organise articles, stories, newsletters and publication deadlines."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Writing workspace</h2>
            <p className="mt-1 text-sm text-gray-500">
              Track each piece from its first idea to publication.
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
            {showForm ? "Cancel" : "+ Add writing item"}
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total items</p>
            <p className="mt-2 text-3xl font-semibold">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">In progress</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{inProgressCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Published</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">{publishedCount}</p>
          </div>
        </div>

        {showForm && (
          <form onSubmit={addItem} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter article or story title"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Content type</label>
              <select value={contentType} onChange={(event) => setContentType(event.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm">
                {contentTypes.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm">
                {statuses.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Add an outline, reminder or editorial notes..." className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm" />
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 sm:col-span-2">
              {saving ? "Saving..." : "Save writing item"}
            </button>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles, stories or newsletters..." className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm">
            <option>All</option>
            {statuses.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading writing projects...</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">{item.content_type}</span>
                  <select value={item.status} aria-label={`Status for ${item.title}`} onChange={(event) => void updateStatus(item, event.target.value)} className="max-w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">
                    {!statuses.includes(item.status) && <option value={item.status}>{item.status}</option>}
                    {statuses.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.notes || "No notes added yet."}</p>
                <p className="mt-4 text-xs text-gray-500">
                  {item.due_date ? `Deadline: ${formatDate(item.due_date)}` : "No deadline set"}
                </p>
                {item.published_at && <p className="mt-1 text-xs text-green-700">Published on {formatDate(item.published_at)}</p>}
                <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                  <button type="button" onClick={() => void deleteItem(item)} className="text-sm font-medium text-red-600 hover:text-red-800">
                    Delete project
                  </button>
                </div>
              </article>
            ))}
            {filteredItems.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 lg:col-span-2">
                {items.length === 0 ? "No writing projects yet. Add your first project to get started." : "No writing projects match your search or filter."}
              </div>
            )}
          </div>
        )}
      </div>
    </WorkspacePage>
  );
}
