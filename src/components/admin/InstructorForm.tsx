'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Permission, StaffRole } from '@/lib/permissions-shared';

type Props = {
  mode: 'create' | 'edit';
  initial?: any;
  modules: { id: string; label: string }[];
  presets: Record<string, Permission[]>;
  presetDescriptions: Record<string, string>;
  groups: Record<string, Permission[]>;
  allPermissions: Permission[];
};

export function InstructorForm({ mode, initial, modules, presets, presetDescriptions, groups, allPermissions }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [staffRole, setStaffRole] = useState<StaffRole>(initial?.staffRole ?? 'TEACHING_ASSISTANT');
  const [preset, setPreset] = useState<string | null>(initial?.preset ?? 'ta');
  const [moduleIds, setModuleIds] = useState<string[]>(initial?.moduleIds ?? []);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    if (initial?.permissions && typeof initial.permissions === 'object') {
      return initial.permissions;
    }
    if (preset && presets[preset]) {
      return Object.fromEntries(presets[preset].map((p) => [p, true]));
    }
    return {};
  });
  const [validUntil, setValidUntil] = useState(initial?.validUntil?.slice(0, 10) ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  function applyPreset(p: string) {
    setPreset(p);
    if (p !== 'custom' && presets[p]) {
      const next: Record<string, boolean> = {};
      for (const perm of allPermissions) next[perm] = false;
      for (const perm of presets[p]) next[perm] = true;
      setPermissions(next);
    }
  }

  function togglePermission(perm: Permission) {
    setPermissions((prev) => ({ ...prev, [perm]: !prev[perm] }));
    setPreset('custom');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/admin/instructors' : `/api/admin/instructors/${initial.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          staffRole,
          preset,
          moduleIds,
          permissions,
          validUntil: validUntil || null,
          active,
        }),
      });
      if (res.ok) {
        router.push('/admin/instructors');
      } else {
        const data = await res.json();
        alert(data.error ?? 'Failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-xl p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value as StaffRole)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="LEAD_INSTRUCTOR">Lead Instructor</option>
            <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
            <option value="ADMIN">Admin (instructor)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valid until</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Modules</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
          {modules.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={moduleIds.includes(m.id)}
                onChange={(e) => {
                  setModuleIds((prev) => e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id));
                }}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Permission Preset</label>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(presets).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={`px-3 py-1 text-sm rounded-full border ${
                preset === p ? 'bg-emerald-100 border-emerald-300' : 'bg-white'
              }`}
              title={presetDescriptions[p]}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`px-3 py-1 text-sm rounded-full border ${
              preset === 'custom' ? 'bg-amber-100 border-amber-300' : 'bg-white'
            }`}
          >
            custom
          </button>
        </div>
        {preset && presetDescriptions[preset] && (
          <p className="text-xs text-muted-foreground mt-2">{presetDescriptions[preset]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Permissions</label>
        <div className="space-y-3 border rounded-lg p-3 max-h-96 overflow-y-auto">
          {Object.entries(groups).map(([groupName, perms]) => (
            <div key={groupName}>
              <div className="text-sm font-semibold mb-1">{groupName}</div>
              <div className="grid grid-cols-2 gap-1">
                {perms.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!permissions[perm]}
                      onChange={() => togglePermission(perm)}
                    />
                    <code className="text-xs">{perm}</code>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        <label htmlFor="active" className="text-sm">Active</label>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create Instructor' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
