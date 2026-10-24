"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type BusinessType = "Farming" | "Writing" | "Both";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  businessType: BusinessType;
  createdAt: string;
};

type ContactForm = Omit<Contact, "id" | "createdAt">;

const databaseName = "harvest-stories-crm";
const storeName = "contacts";

const seedContacts: ContactForm[] = [
  {
    name: "Amara Okafor",
    email: "amara@greenfieldfarms.com",
    phone: "+234 803 555 0142",
    company: "Greenfield Farms",
    businessType: "Farming",
  },
  {
    name: "Daniel Mensah",
    email: "daniel@inkandoak.com",
    phone: "+234 805 555 0198",
    company: "Ink & Oak Publishing",
    businessType: "Writing",
  },
  {
    name: "Sarah Adeyemi",
    email: "sarah@harvestmarket.ng",
    phone: "+234 807 555 0126",
    company: "Harvest Market",
    businessType: "Both",
  },
  {
    name: "Michael Bello",
    email: "michael@bellodistributors.com",
    phone: "+234 809 555 0174",
    company: "Bello Distributors",
    businessType: "Farming",
  },
];

const emptyForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  businessType: "Farming",
};

const navigation = [
  { label: "Overview", icon: "◫", href: "/" },
  { label: "Contacts", icon: "♙", href: "/contacts" },
  { label: "Opportunities", icon: "◇", href: "/opportunities" },
  { label: "Follow-ups", icon: "◷", href: "/follow-ups" },
];

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Your browser does not support local database storage."));
      return;
    }

    const request = indexedDB.open(databaseName, 1);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open the contacts database."));
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function getStoredContacts(): Promise<Contact[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .getAll();
    request.onerror = () =>
      reject(request.error ?? new Error("Could not read contacts."));
    request.onsuccess = () => {
      database.close();
      resolve((request.result as Contact[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
  });
}

async function saveContact(contact: Contact): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(storeName, "readwrite")
      .objectStore(storeName)
      .put(contact);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not save this contact."));
    request.onsuccess = () => {
      database.close();
      resolve();
    };
  });
}

async function removeContact(id: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(storeName, "readwrite")
      .objectStore(storeName)
      .delete(id);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not delete this contact."));
    request.onsuccess = () => {
      database.close();
      resolve();
    };
  });
}

async function seedDatabaseIfEmpty(): Promise<Contact[]> {
  const existing = await getStoredContacts();
  if (existing.length > 0) return existing;

  const seeded = seedContacts.map((contact, index) => ({
    ...contact,
    id: `seed-${index + 1}`,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  }));
  await Promise.all(seeded.map(saveContact));
  return seeded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    seedDatabaseIfEmpty()
      .then(setContacts)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Could not load contacts.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      Object.values(contact).some((value) => value.toLowerCase().includes(query)),
    );
  }, [contacts, search]);

  function openCreateForm() {
    setEditingContact(null);
    setForm(emptyForm);
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(contact: Contact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      businessType: contact.businessType,
    });
    setError("");
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const contact: Contact = {
      ...form,
      id: editingContact?.id ?? getId(),
      createdAt: editingContact?.createdAt ?? new Date().toISOString(),
    };

    try {
      await saveContact(contact);
      setContacts((current) =>
        editingContact
          ? current.map((item) => (item.id === contact.id ? contact : item))
          : [contact, ...current],
      );
      setIsFormOpen(false);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not save this contact.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Remove ${contact.name} from your contacts?`)) return;
    try {
      await removeContact(contact.id);
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      if (editingContact?.id === contact.id) setIsFormOpen(false);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not delete this contact.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
          <div className="mb-10 flex items-center gap-3 px-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-xl text-white">H</div>
            <div>
              <p className="font-semibold tracking-tight text-slate-900">Harvest &amp; Stories</p>
              <p className="mt-0.5 text-xs text-slate-500">Relationship CRM</p>
            </div>
          </div>
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  item.label === "Contacts" ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
                {item.label === "Contacts" && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">{contacts.length}</span>}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#f3f6f0] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">✦</div>
            <p className="text-sm font-semibold text-slate-800">Your relationships, organized</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Keep every farming and writing connection close at hand.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-md sm:px-8">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Workspace / Contacts</p>
              <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">Contacts</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                <span className="text-slate-400">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts..." className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400 md:w-52" />
              </label>
              <button onClick={openCreateForm} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
                <span className="text-lg leading-none">+</span> Add contact
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-800">RELATIONSHIP DIRECTORY</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Know your people.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">One organized place for the people and companies moving your businesses forward.</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span className="font-semibold">{contacts.length}</span> {contacts.length === 1 ? "contact" : "contacts"} saved locally
              </div>
            </div>

            <div className="mb-5 sm:hidden">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <span className="text-slate-400">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, company..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </label>
            </div>

            {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h3 className="font-semibold text-slate-900">All contacts</h3>
                  <p className="mt-1 text-xs text-slate-500">{search ? `${filteredContacts.length} matching results` : "Your saved relationship details"}</p>
                </div>
                <button onClick={openCreateForm} className="w-fit rounded-xl border border-emerald-200 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">+ New contact</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50/70 text-xs text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold sm:px-6">Contact</th>
                      <th className="px-3 py-3 font-semibold">Company</th>
                      <th className="px-3 py-3 font-semibold">Business type</th>
                      <th className="px-3 py-3 font-semibold">Contact details</th>
                      <th className="px-5 py-3 text-right font-semibold sm:px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500">Loading your contacts...</td></tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-16 text-center"><p className="font-medium text-slate-700">{search ? "No contacts match your search." : "Your contact list is empty."}</p><p className="mt-1 text-sm text-slate-500">{search ? "Try a different name, company, or business type." : "Add your first relationship to get started."}</p></td></tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact.id} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{initials(contact.name)}</div><div><p className="font-medium text-slate-800">{contact.name}</p><p className="mt-0.5 text-xs text-slate-500">{contact.email}</p></div></div></td>
                          <td className="px-3 py-4 text-sm text-slate-600">{contact.company}</td>
                          <td className="px-3 py-4"><span className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${contact.businessType === "Farming" ? "bg-emerald-50 text-emerald-700" : contact.businessType === "Writing" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}>{contact.businessType}</span></td>
                          <td className="px-3 py-4 text-sm text-slate-600">{contact.phone}</td>
                          <td className="px-5 py-4 text-right sm:px-6"><div className="flex justify-end gap-2"><button aria-label={`Edit ${contact.name}`} onClick={() => openEditForm(contact)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-emerald-800">Edit</button><button aria-label={`Delete ${contact.name}`} onClick={() => handleDelete(contact)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700">Delete</button></div></td>
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
          <div role="dialog" aria-modal="true" aria-labelledby="contact-form-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{editingContact ? "Update relationship" : "New relationship"}</p><h2 id="contact-form-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{editingContact ? "Edit contact" : "Add a contact"}</h2><p className="mt-1 text-sm text-slate-500">Keep the details you need to stay connected.</p></div>
              <button aria-label="Close contact form" onClick={() => setIsFormOpen(false)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required placeholder="e.g. Amara Okafor" />
                <Field label="Company" value={form.company} onChange={(value) => setForm({ ...form, company: value })} required placeholder="e.g. Greenfield Farms" />
                <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required placeholder="name@company.com" />
                <Field label="Phone" type="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required placeholder="+234 800 000 0000" />
              </div>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Business type</span><select value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value as BusinessType })} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"><option>Farming</option><option>Writing</option><option>Both</option></select></label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button disabled={isSaving} type="submit" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Saving..." : editingContact ? "Save changes" : "Save contact"}</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
