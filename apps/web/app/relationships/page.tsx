
"use client";

import { useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";

type Relationship = {
  id: number;
  name: string;
  role: string;
  organization: string;
  category: string;
  connectedTo: string;
  strength: string;
  notes: string;
};

const initialRelationships: Relationship[] = [
  {
    id: 1,
    name: "Amara Okafor",
    role: "Produce supplier",
    organization: "Green Harvest Farms",
    category: "Farming",
    connectedTo: "Organic produce partnership",
    strength: "Strong",
    notes: "Discussing a regular produce supply arrangement.",
  },
  {
    id: 2,
    name: "Daniel Mensah",
    role: "Editor",
    organization: "Storyline Publishing",
    category: "Writing",
    connectedTo: "Agriculture book proposal",
    strength: "Developing",
    notes: "Reviewing the book proposal and editorial plan.",
  },
  {
    id: 3,
    name: "Sarah Adeyemi",
    role: "Marketing partner",
    organization: "Harvest Media",
    category: "Both",
    connectedTo: "Farm storytelling campaign",
    strength: "Strong",
    notes: "Working together on agricultural storytelling.",
  },
];

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState(initialRelationships);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [newCategory, setNewCategory] = useState("Farming");
  const [connectedTo, setConnectedTo] = useState("");
  const [strength, setStrength] = useState("Developing");
  const [notes, setNotes] = useState("");

  const filteredRelationships = useMemo(
    () =>
      relationships.filter((item) => {
        const term = search.toLowerCase();

        const matchesSearch =
          item.name.toLowerCase().includes(term) ||
          item.organization.toLowerCase().includes(term) ||
          item.connectedTo.toLowerCase().includes(term);

        const matchesCategory =
          category === "All" || item.category === category;

        return matchesSearch && matchesCategory;
      }),
    [relationships, search, category]
  );

  function addRelationship(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setRelationships((current) => [
      ...current,
      {
        id: Date.now(),
        name,
        role,
        organization,
        category: newCategory,
        connectedTo,
        strength,
        notes,
      },
    ]);

    setName("");
    setRole("");
    setOrganization("");
    setNewCategory("Farming");
    setConnectedTo("");
    setStrength("Developing");
    setNotes("");
    setShowForm(false);
  }

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
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            {showForm ? "Cancel" : "+ Add relationship"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">People recorded</p>
            <p className="mt-2 text-3xl font-semibold">
              {relationships.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Farming connections</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {relationships.filter(
                (item) =>
                  item.category === "Farming" || item.category === "Both"
              ).length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Writing connections</p>
            <p className="mt-2 text-3xl font-semibold text-blue-700">
              {relationships.filter(
                (item) =>
                  item.category === "Writing" || item.category === "Both"
              ).length}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={addRelationship}
            className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Person's name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Role
              </label>
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Farmer, editor, supplier"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
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
              <label className="mb-1 block text-sm font-medium">
                Connection area
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>Farming</option>
                <option>Writing</option>
                <option>Both</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Related project or opportunity
              </label>
              <input
                required
                value={connectedTo}
                onChange={(e) => setConnectedTo(e.target.value)}
                placeholder="What connects you?"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Relationship status
              </label>
              <select
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>New</option>
                <option>Developing</option>
                <option>Strong</option>
                <option>Needs attention</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
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
              className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 sm:col-span-2"
            >
              Save relationship
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
            <option>All</option>
            <option>Farming</option>
            <option>Writing</option>
            <option>Both</option>
          </select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredRelationships.map((item) => (
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
                    {item.connectedTo}
                  </span>
                </p>

                <p className="leading-6 text-gray-600">
                  {item.notes || "No additional notes."}
                </p>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Update relationship status
                </label>
                <select
                  value={item.strength}
                  onChange={(e) =>
                    setRelationships((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, strength: e.target.value }
                          : entry
                      )
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option>New</option>
                  <option>Developing</option>
                  <option>Strong</option>
                  <option>Needs attention</option>
                </select>
              </div>
            </article>
          ))}

          {filteredRelationships.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 lg:col-span-2">
              No relationships found.
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          This prototype uses temporary sample data. We will connect
          relationships to actual contacts and projects when we build the
          database layer.
        </p>
      </div>
    </WorkspacePage>
  );
}
