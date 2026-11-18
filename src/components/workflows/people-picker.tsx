"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Someone who can be picked: every active person synced from Active
 * Directory, whether or not they have signed in to TechHub yet (`userId` is
 * null until they have an account; saving gives them one).
 */
export interface PersonOption {
  /** Stable key: the user id when there is one, otherwise "person:<id>". */
  id: string;
  personId: string | null;
  userId: string | null;
  name: string;
  email: string;
}

/** Search people by name or email and keep a list of the chosen ones. */
export function PeoplePicker({
  label,
  allUsers,
  selected,
  onChange,
}: {
  label: string;
  allUsers: PersonOption[];
  selected: PersonOption[];
  onChange: (next: PersonOption[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedIds = new Set(selected.map((u) => u.id));

  const filtered = allUsers.filter(
    (u) =>
      !selectedIds.has(u.id) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())),
  );

  function add(user: PersonOption) {
    onChange([...selected, user]);
    setQuery("");
    setOpen(false);
  }

  function remove(id: string) {
    onChange(selected.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {/* Search input */}
      <div ref={containerRef} className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or email…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        {open && filtered.length > 0 && (
          <ul className="bg-background absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-lg">
            {filtered.slice(0, 20).map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => add(u)}
                  className="hover:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left text-sm"
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {u.email}
                  </span>
                  {!u.userId && (
                    <span className="text-muted-foreground ml-auto text-[11px]">
                      Not signed in yet
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected users table */}
      {selected.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Name</th>
                <th className="px-3 py-1.5 text-left font-medium">Email</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {selected.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-3 py-1.5">
                    {u.name}
                    {!u.userId && (
                      <span
                        className="text-muted-foreground ml-1.5 text-[11px]"
                        title="A TechHub account is created when you save; Microsoft sign-in links to it"
                      >
                        · account created on save
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-1.5">
                    {u.email}
                  </td>
                  <td className="px-1 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => remove(u.id)}
                      className="text-muted-foreground hover:text-destructive rounded px-1"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
