
"use client";

import { useMemo, useState } from "react";
import WorkspacePage from "../components/WorkspacePage";

type FarmRecord = {
  id: number;
  crop: string;
  location: string;
  plantedDate: string;
  harvestDate: string;
  status: string;
  quantity: string;
};

const initialRecords: FarmRecord[] = [
  {
    id: 1,
    crop: "Maize",
    location: "North Field",
    plantedDate: "2026-09-15",
    harvestDate: "2026-12-15",
    status: "Growing",
    quantity: "500 kg",
  },
  {
    id: 2,
    crop: "Tomatoes",
    location: "Greenhouse A",
    plantedDate: "2026-10-01",
    harvestDate: "2026-11-20",
    status: "Growing",
    quantity: "200 kg",
  },
  {
    id: 3,
    crop: "Cassava",
    location: "East Field",
    plantedDate: "2026-04-10",
    harvestDate: "2027-01-10",
    status: "Growing",
    quantity: "1,000 kg",
  },
];

export default function FarmingPage() {
  const [records, setRecords] = useState(initialRecords);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [crop, setCrop] = useState("");
  const [location, setLocation] = useState("");
  const [plantedDate, setPlantedDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("Planned");

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const matchesSearch =
          record.crop.toLowerCase().includes(search.toLowerCase()) ||
          record.location.toLowerCase().includes(search.toLowerCase());

        return (
          matchesSearch &&
          (filter === "All" || record.status === filter)
        );
      }),
    [records, search, filter]
  );

  function addRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setRecords((current) => [
      ...current,
      {
        id: Date.now(),
        crop,
        location,
        plantedDate,
        harvestDate,
        status,
        quantity,
      },
    ]);

    setCrop("");
    setLocation("");
    setPlantedDate("");
    setHarvestDate("");
    setQuantity("");
    setStatus("Planned");
    setShowForm(false);
  }

  return (
    <WorkspacePage
      title="Farming"
      activeHref="/farming"
      description="Organise crop records, planting schedules and expected harvests."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Farm management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep track of crops from planning to harvest.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            {showForm ? "Cancel" : "+ Add crop record"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Crop records</p>
            <p className="mt-2 text-3xl font-semibold">{records.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Growing</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {records.filter((r) => r.status === "Growing").length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Harvested</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {records.filter((r) => r.status === "Harvested").length}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={addRecord}
            className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Crop name
              </label>
              <input
                required
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="e.g. Maize"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Farm location
              </label>
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. North Field"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Planting date
              </label>
              <input
                required
                type="date"
                value={plantedDate}
                onChange={(e) => setPlantedDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Expected harvest date
              </label>
              <input
                required
                type="date"
                min={plantedDate || undefined}
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Expected quantity
              </label>
              <input
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 500 kg"
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Crop status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
              >
                <option>Planned</option>
                <option>Growing</option>
                <option>Harvested</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 sm:col-span-2"
            >
              Save crop record
            </button>
          </form>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crops or farm locations..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option>All</option>
            <option>Planned</option>
            <option>Growing</option>
            <option>Harvested</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-4 font-medium">Crop</th>
                <th className="px-5 py-4 font-medium">Location</th>
                <th className="px-5 py-4 font-medium">Planted</th>
                <th className="px-5 py-4 font-medium">Expected harvest</th>
                <th className="px-5 py-4 font-medium">Quantity</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {record.crop}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {record.location}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {record.plantedDate}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {record.harvestDate}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {record.quantity}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={record.status}
                      onChange={(e) =>
                        setRecords((current) =>
                          current.map((item) =>
                            item.id === record.id
                              ? { ...item, status: e.target.value }
                              : item
                          )
                        )
                      }
                      aria-label={`Status for ${record.crop}`}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"
                    >
                      <option>Planned</option>
                      <option>Growing</option>
                      <option>Harvested</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No crop records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          These are sample records for now. We will connect the page to
          persistent database storage later.
        </p>
      </div>
    </WorkspacePage>
  );
}
