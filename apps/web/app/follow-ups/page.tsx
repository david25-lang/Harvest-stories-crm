
"use client";

import { useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";

type FollowUp = {
  id: number;
  title: string;
  contact: string;
  type: string;
  dueDate: string;
  priority: string;
  completed: boolean;
};

const initialFollowUps: FollowUp[] = [
  {
    id: 1,
    title: "Discuss produce supply",
    contact: "Amara Okafor",
    type: "Call",
    dueDate: "2026-10-26",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "Review book proposal",
    contact: "Daniel Mensah",
    type: "Meeting",
    dueDate: "2026-10-27",
    priority: "Medium",
    completed: false,
  },
  {
    id: 3,
    title: "Send campaign draft",
    contact: "Sarah Adeyemi",
    type: "Email",
    dueDate: "2026-10-28",
    priority: "High",
    completed: false,
  },
];

export default function FollowUpsPage() {
  const [items, setItems] = useState(initialFollowUps);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState("Call");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.contact.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (filter === "Completed" && item.completed) ||
        (filter === "Pending" && !item.completed);

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  function addFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        contact,
        type,
        dueDate,
        priority,
        completed: false,
      },
    ]);

    setTitle("");
    setContact("");
    setType("Call");
    setDueDate("");
    setPriority("Medium");
    setShowForm(false);
  }

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
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            {showForm ? "Cancel" : "+ Add follow-up"}
          </button>
        </div>

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
              {items.filter((item) => !item.completed).length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {items.filter((item) => item.completed).length}
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
                Contact name
              </label>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Contact name"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-700"
              />
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

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
              >
                Save follow-up
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or contacts..."
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
          {filteredItems.length === 0 ? (
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
                      onChange={() =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, completed: !entry.completed }
                              : entry
                          )
                        )
                      }
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
                      <p className="mt-2 text-xs text-gray-500">
                        Due: {item.dueDate || "No date"}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Prototype data is stored in page state and resets when you refresh.
          We can connect it to the database later.
        </p>
      </div>
    </WorkspacePage>
  );
}
