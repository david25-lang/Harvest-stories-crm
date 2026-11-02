
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: string;
};

type ContactForm = Omit<Contact, "id" | "createdAt">;

const emptyForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
};

const navigation = [
  { label: "Overview", icon: "◫", href: "/" },
  { label: "Contacts", icon: "♙", href: "/contacts" },
  { label: "Opportunities", icon: "◇", href: "/opportunities" },
  { label: "Follow-ups", icon: "◷", href: "/follow-ups" },
];

type ContactRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  created_at?: string | null;
};

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.full_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    company: row.organization ?? "",
    createdAt: row.created_at ?? "",
  };
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const loadContacts = useCallback(async () => {
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

    const { data, error: queryError } = await supabase
      .from("contacts")
      .select("id, full_name, email, phone, organization")
      .eq("user_id", user.id);

    if (queryError) throw queryError;

    const loaded = ((data ?? []) as ContactRow[]).map(mapContact);

    // Sort locally so this works without assuming a created_at column exists.
    loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    setContacts(loaded);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await loadContacts();
      } catch (reason: unknown) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load contacts from Supabase.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadContacts]);
  
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function subscribeToContactChanges() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled || error || !user) return;

      channel = supabase
        .channel(`contacts-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contacts",
          },
          () => {
            void loadContacts();
          },
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR") {
            console.error("Contacts Realtime subscription failed.");
          }
        });
    }

    void subscribeToContactChanges();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadContacts, supabase]);


  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return contacts;

    return contacts.filter((contact) =>
      [
        contact.name,
        contact.email,
        contact.phone,
        contact.company,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [contacts, search]);

  function openCreateForm() {
    setEditingContact(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setIsFormOpen(true);
  }

  function openEditForm(contact: Contact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
    });
    setError("");
    setNotice("");
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      if (!user) throw new Error("Your session has expired. Please sign in again.");

      const payload = {
        full_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        organization: form.company.trim(),
        user_id: user.id,
      };

      if (editingContact) {
        const { data, error: updateError } = await supabase
          .from("contacts")
          .update({
            full_name: payload.full_name,
            email: payload.email,
            phone: payload.phone,
            organization: payload.organization,
          })
          .eq("id", editingContact.id)
          .eq("user_id", user.id)
          .select("id");

        if (updateError) throw updateError;

        if (!data?.length) {
          throw new Error(
            "The contact was not updated. Check your access policies and confirm the record belongs to your account.",
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from("contacts")
          .insert(payload);

        if (insertError) throw insertError;
      }

      await loadContacts();
      setIsFormOpen(false);
      setEditingContact(null);
      setForm(emptyForm);
      setNotice(
        editingContact
          ? "Contact updated successfully."
          : "Contact saved successfully.",
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save this contact.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Remove ${contact.name} from your contacts?`)) return;

    setDeletingId(contact.id);
    setError("");
    setNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in again.");

      const { data, error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contact.id)
        .eq("user_id", user.id)
        .select("id");

      if (deleteError) throw deleteError;

      if (!data?.length) {
        throw new Error(
          "The contact was not deleted. Check your access policies and record ownership.",
        );
      }

      setContacts((current) =>
        current.filter((item) => item.id !== contact.id),
      );

      if (editingContact?.id === contact.id) {
        setIsFormOpen(false);
        setEditingContact(null);
      }

      setNotice("Contact deleted successfully.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete this contact.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
          <div className="mb-10 flex items-center gap-3 px-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-xl text-white">
              H
            </div>
            <div>
              <p className="font-semibold tracking-tight text-slate-900">
                Harvest &amp; Stories
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Relationship CRM
              </p>
            </div>
          </div>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  item.label === "Contacts"
                    ? "bg-emerald-50 font-semibold text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
                {item.label === "Contacts" && (
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {contacts.length}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-[#f3f6f0] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">
              ✦
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Your relationships, organized
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Keep every farming and writing connection close at hand.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-md sm:px-8">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Workspace / Contacts</p>
              <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">
                Contacts
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                <span className="text-slate-400">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search contacts..."
                  className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400 md:w-52"
                />
              </label>

              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <span className="text-lg leading-none">+</span> Add contact
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-800">
                  RELATIONSHIP DIRECTORY
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Know your people.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  One organized place for the people and companies moving your
                  businesses forward.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span className="font-semibold">{contacts.length}</span>{" "}
                {contacts.length === 1 ? "contact" : "contacts"} saved to your
                CRM
              </div>
            </div>

            <div className="mb-5 sm:hidden">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <span className="text-slate-400">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search contacts..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {notice}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h3 className="font-semibold text-slate-900">All contacts</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {search
                      ? `${filteredContacts.length} matching results`
                      : "Your saved relationship details"}
                  </p>
                </div>

                <button
                  onClick={openCreateForm}
                  className="w-fit rounded-xl border border-emerald-200 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  + New contact
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50/70 text-xs text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold sm:px-6">Contact</th>
                      <th className="px-3 py-3 font-semibold">Company</th>
                      <th className="px-3 py-3 font-semibold">Contact details</th>
                      <th className="px-5 py-3 text-right font-semibold sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-16 text-center text-sm text-slate-500"
                        >
                          Loading your contacts...
                        </td>
                      </tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <p className="font-medium text-slate-700">
                            {search
                              ? "No contacts match your search."
                              : "Your contact list is empty."}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {search
                              ? "Try another name, email, or company."
                              : "Add your first contact to get started."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                {initials(contact.name)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">
                                  {contact.name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {contact.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-4 text-sm text-slate-600">
                            {contact.company || "—"}
                          </td>

                          <td className="px-3 py-4 text-sm text-slate-600">
                            {contact.phone || "—"}
                          </td>

                          <td className="px-5 py-4 text-right sm:px-6">
                            <div className="flex justify-end gap-2">
                              <button
                                aria-label={`Edit ${contact.name}`}
                                onClick={() => openEditForm(contact)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-emerald-800"
                              >
                                Edit
                              </button>
                              <button
                                aria-label={`Delete ${contact.name}`}
                                disabled={deletingId === contact.id}
                                onClick={() => void handleDelete(contact)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingId === contact.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-form-title"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {editingContact ? "Update relationship" : "New relationship"}
                </p>
                <h2
                  id="contact-form-title"
                  className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
                >
                  {editingContact ? "Edit contact" : "Add a contact"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep the details you need to stay connected.
                </p>
              </div>

              <button
                aria-label="Close contact form"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={form.name}
                  onChange={(value) => setForm({ ...form, name: value })}
                  required
                  placeholder="e.g. Amara Okafor"
                />
                <Field
                  label="Company"
                  value={form.company}
                  onChange={(value) => setForm({ ...form, company: value })}
                  required
                  placeholder="e.g. Greenfield Farms"
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm({ ...form, email: value })}
                  required
                  placeholder="name@company.com"
                />
                <Field
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                  required
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingContact
                      ? "Save changes"
                      : "Save contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
