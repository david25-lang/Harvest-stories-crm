
"use client";

import { useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";

type WritingItem = {
  id: number;
  title: string;
  category: string;
  status: string;
  dueDate: string;
  notes: string;
};

const initialItems: WritingItem[] = [
  {
    id: 1,
    title: "The Future of Sustainable Farming",
    category: "Article",
    status: "Draft",
    dueDate: "2026-11-02",
    notes: "Explore sustainable methods and soil health.",
  },
  {
    id: 2,
    title: "Stories from the Harvest",
    category: "Story",
    status: "In Progress",
    dueDate: "2026-11-05",
    notes: "Collect stories from farmers and their communities.",
  },
  {
    id: 3,
    title: "November Farming Newsletter",
    category: "Newsletter",
    status: "Ready to Publish",
    dueDate: "2026-11-10",
    notes: "Review the final copy before publication.",
  },
];

export default function WritingPage() {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Article");
  const [status, setStatus] = useState("Draft");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase());

        return (
          matchesSearch &&
          (filter === "All" || item.status === filter)
        );
      }),
    [items, search, filter]
  );

  function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        category,
        status,
        dueDate,
        notes,
      },
    ]);

    setTitle("");
    setCategory("Article");
    setStatus("Draft");
    setDueDate("");
    setNotes("");
    setShowForm(false);
  }

  return (
    <WorkspacePage
      title="Writing"
      activeHref="/writing"
      description="Organise articles, stories, newsletters and publication deadlines."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Writing workspace
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track each piece from its first draft to publication.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            {showForm ? "Cancel" : "+ Add writing item"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total items</p>
            <p className="mt-2 text-3xl font-semibold">{items.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">In progress</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {items.filter((item) => item.status === "In Progress").length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Ready to publish</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {items.filter((item) => item.status === "Ready to Publish").length}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={addItem}
            className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article or story title"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Content type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>Article</option>
                <option>Story</option>
                <option>Newsletter</option>
                <option>Blog post</option>
                <option>Book chapter</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Deadline or publication date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>Draft</option>
                <option>In Progress</option>
                <option>Under Review</option>
                <option>Ready to Publish</option>
                <option>Published</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add an outline, reminder or editorial notes..."
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 sm:col-span-2"
            >
              Save writing item
            </button>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, stories or newsletters..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option>All</option>
            <option>Draft</option>
            <option>In Progress</option>
            <option>Under Review</option>
            <option>Ready to Publish</option>
            <option>Published</option>
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  {item.category}
                </span>

                <select
                  value={item.status}
                  aria-label={`Status for ${item.title}`}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, status: e.target.value }
                          : entry
                      )
                    )
                  }
                  className="max-w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"
                >
                  <option>Draft</option>
                  <option>In Progress</option>
                  <option>Under Review</option>
                  <option>Ready to Publish</option>
                  <option>Published</option>
                </select>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {item.notes || "No notes added yet."}
              </p>

              <p className="mt-4 text-xs text-gray-500">
                {item.dueDate
                  ? `Deadline: ${item.dueDate}`
                  : "No deadline set"}
              </p>
            </article>
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 lg:col-span-2">
              No writing items found.
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          This version uses sample data in page state. Saved items will reset
          when the page is refreshed; database storage comes later.
        </p>
      </div>
    </WorkspacePage>
  );
}
