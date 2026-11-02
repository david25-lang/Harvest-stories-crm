
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import WorkspacePage from "../components/WorkspacePage";

type FarmRecord = {
  id: string;
  crop_name: string;
  farm_location: string;
  area_size: number | null;
  area_unit: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const statuses = ["Planned", "Growing", "Harvested"];
const areaUnits = ["acres", "hectares", "square meters"];

export default function FarmingPage() {
  const supabase = useMemo(() => createClient(), []);

  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [crop, setCrop] = useState("");
  const [location, setLocation] = useState("");
  const [areaSize, setAreaSize] = useState("");
  const [areaUnit, setAreaUnit] = useState("acres");
  const [plantedDate, setPlantedDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [status, setStatus] = useState("Planned");
  const [notes, setNotes] = useState("");

  const loadFarmingRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Your session could not be verified. Please sign in again.");
      setRecords([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("farming_records")
      .select(
        "id, crop_name, farm_location, area_size, area_unit, planting_date, expected_harvest_date, status, notes, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setRecords([]);
    } else {
      setRecords((data ?? []) as FarmRecord[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // The initial request intentionally updates loading and error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFarmingRecords();
  }, [loadFarmingRecords]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function subscribeToFarmingChanges() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled || error || !user) return;

      channel = supabase
        .channel(`farming-records-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "farming_records",
          },
          () => {
            void loadFarmingRecords();
          },
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR") {
            console.error("Farming Realtime subscription failed.");
          }
        });
    }

    void subscribeToFarmingChanges();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadFarmingRecords, supabase]);


  function resetForm() {
    setCrop("");
    setLocation("");
    setAreaSize("");
    setAreaUnit("acres");
    setPlantedDate("");
    setHarvestDate("");
    setStatus("Planned");
    setNotes("");
  }

  async function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please sign in again before adding a farm record.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("farming_records")
      .insert({
        user_id: user.id,
        crop_name: crop.trim(),
        farm_location: location.trim(),
        area_size: areaSize ? Number(areaSize) : null,
        area_unit: areaSize ? areaUnit : null,
        planting_date: plantedDate || null,
        expected_harvest_date: harvestDate || null,
        status,
        notes: notes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadFarmingRecords();
    setSaving(false);
  }

  async function updateStatus(id: string, nextStatus: string) {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in again.");
      return;
    }

    const { error: updateError } = await supabase
      .from("farming_records")
      .update({ status: nextStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadFarmingRecords();
  }

  async function deleteRecord(id: string) {
    const confirmed = window.confirm(
      "Delete this farming record? This action cannot be undone."
    );

    if (!confirmed) return;

    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in again.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("farming_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadFarmingRecords();
  }

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      record.farm_location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filter === "All" || record.status === filter;

    return matchesSearch && matchesStatus;
  });

  const growingCount = records.filter(
    (record) => record.status === "Growing"
  ).length;

  const harvestedCount = records.filter(
    (record) => record.status === "Harvested"
  ).length;

  return (
    <WorkspacePage
      title="Farming"
      eyebrow="FARM MANAGEMENT"
      activeHref="/farming"
      description="Track crops, farm locations, planting schedules, and harvest dates."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total farm records</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {records.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Growing</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {growingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Harvested</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {harvestedCount}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search crops or farm locations..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="All">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-medium text-white hover:bg-blue-800"
          >
            {showForm ? "Close form" : "+ Add farm record"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={addRecord}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
          >
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Crop name *</span>
              <input
                required
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                placeholder="e.g. Maize"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Farm location *
              </span>
              <input
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. North Field"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Farm area</span>
              <input
                type="number"
                min="0"
                step="any"
                value={areaSize}
                onChange={(event) => setAreaSize(event.target.value)}
                placeholder="e.g. 2.5"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Area unit</span>
              <select
                value={areaUnit}
                onChange={(event) => setAreaUnit(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              >
                {areaUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Planting date</span>
              <input
                type="date"
                value={plantedDate}
                onChange={(event) => setPlantedDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Expected harvest date
              </span>
              <input
                type="date"
                min={plantedDate || undefined}
                value={harvestDate}
                onChange={(event) => setHarvestDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional farming notes..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save farm record"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">
              Loading farm records...
            </p>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-slate-800">
                No farming records found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add a record to start tracking your crops.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Crop</th>
                  <th className="px-5 py-4 font-medium">Location</th>
                  <th className="px-5 py-4 font-medium">Farm area</th>
                  <th className="px-5 py-4 font-medium">Planted</th>
                  <th className="px-5 py-4 font-medium">Expected harvest</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {record.crop_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.farm_location}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.area_size == null
                        ? "—"
                        : `${record.area_size} ${record.area_unit ?? ""}`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.planting_date || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.expected_harvest_date || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <select
                      aria-label={`Status for ${record.crop_name}`}
                      value={record.status}
                      onChange={(event) =>
                        void updateStatus(record.id, event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {!statuses.includes(record.status) && (
                        <option value={record.status}>{record.status}</option>
                      )}

                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void deleteRecord(record.id)}
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </WorkspacePage>
  );
}
