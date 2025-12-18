"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AllowedEmail = {
  id: string;
  email: string;
  created_at: string;
  created_by: string | null;
  role?: "admin" | "teacher";
};

type ApiResponse = { data: AllowedEmail[] } | { data: { email: string; role?: string } } | { error: string };

function hasError(payload: ApiResponse): payload is { error: string } {
  return "error" in payload;
}

export default function PermissionsClient() {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [input, setInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "teacher">("teacher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedEmails = useMemo(() => [...emails].sort((a, b) => a.email.localeCompare(b.email)), [emails]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/allowed-emails");
      const json = (await res.json()) as ApiResponse;
      if (cancelled) return;
      if (!res.ok) {
        setError("Failed to load allowlist");
      } else if (hasError(json)) {
        setError(json.error);
      } else if ("data" in json && Array.isArray(json.data)) {
        setEmails(json.data);
      } else {
        setError("Failed to load allowlist");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async () => {
    const email = input.trim().toLowerCase();
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/allowed-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: selectedRole }),
    });
    const json = (await res.json()) as ApiResponse;
    if (!res.ok) {
      setError("Failed to add email");
    } else if (hasError(json)) {
      setError(json.error);
    } else {
      setEmails((prev) =>
        prev.some((e) => e.email === email)
          ? prev
          : [
              {
                id: crypto.randomUUID(),
                email,
                created_at: new Date().toISOString(),
                created_by: null,
                role: selectedRole,
              },
              ...prev,
            ],
      );
      setInput("");
      setSelectedRole("teacher");
    }
    setLoading(false);
  };

  const handleRoleChange = async (email: string, newRole: "admin" | "teacher") => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/allowed-emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: newRole }),
    });
    const json = (await res.json()) as ApiResponse;
    if (!res.ok) {
      setError("Failed to update role");
    } else if (hasError(json)) {
      setError(json.error);
    } else {
      setEmails((prev) => prev.map((e) => (e.email === email ? { ...e, role: newRole } : e)));
    }
    setLoading(false);
  };

  const handleDelete = async (email: string) => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/allowed-emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = (await res.json()) as ApiResponse;
    if (!res.ok) {
      setError("Failed to remove email");
    } else if (hasError(json)) {
      setError(json.error);
    } else {
      setEmails((prev) => prev.filter((e) => e.email !== email));
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Permissions</h1>
          <p className="text-sm text-gray-500">Manage who can sign in via the email allowlist.</p>
        </div>
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <label className="text-sm font-medium" htmlFor="email-input">
          Add email
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="email-input"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="user@example.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && input.trim()) {
                handleAdd();
              }
            }}
          />
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "admin" | "teacher")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Add
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Current allowlist</h2>
          <span className="text-sm text-gray-500">
            {sortedEmails.length} email{sortedEmails.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="divide-y">
          {sortedEmails.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">No emails yet.</div>
          ) : (
            sortedEmails.map((item) => (
              <div key={item.email} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.email}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                      {item.role || "teacher"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Added {new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={item.role || "teacher"}
                    onValueChange={(value) => handleRoleChange(item.email, value as "admin" | "teacher")}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => handleDelete(item.email)}
                    disabled={loading}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
