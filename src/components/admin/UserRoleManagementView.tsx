'use client';

import React, { useState } from 'react';
import { ADMIN_USERS, AdminUser } from '../../lib/mockDataAdmin';
import { Table } from '../ui/Table';
import { Users, Shield, Plus, Ban, Check, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserRoleManagementView = () => {
  const { showToast } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>(ADMIN_USERS);
  const [search, setSearch] = useState('');

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          showToast(`Changed ${u.name} status to ${nextStatus.toUpperCase()}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleGrantCredits = (id: string, name: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, credits: u.credits + 5000 } : u))
    );
    showToast(`Granted +5,000 bonus credits to ${name}!`);
  };

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[var(--accent-warm)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">User Directory & Role Permissions (RBAC)</h3>
        </div>

        <input
          type="text"
          placeholder="Search users or emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
        />
      </div>

      <Table
        columns={[
          {
            key: 'name',
            header: 'User Account',
            render: (row) => (
              <div>
                <div className="font-bold text-[var(--text-primary)]">{row.name}</div>
                <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{row.email}</div>
              </div>
            )
          },
          {
            key: 'role',
            header: 'Role Scope',
            render: (row) => (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-warm-light)] text-[var(--accent-warm-text)]">
                {row.role}
              </span>
            )
          },
          { key: 'plan', header: 'Subscription' },
          {
            key: 'credits',
            header: 'AI Credits',
            render: (row) => <span className="font-mono font-bold">{row.credits.toLocaleString()} pts</span>
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <span className={`font-mono text-[10px] font-bold uppercase ${row.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                {row.status}
              </span>
            )
          },
          {
            key: 'id',
            header: 'Actions',
            render: (row) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGrantCredits(row.id, row.name)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center gap-1 cursor-pointer"
                >
                  <Coins size={11} className="text-[var(--accent-warm)]" /> +5k Credits
                </button>
                <button
                  onClick={() => toggleUserStatus(row.id)}
                  className={`p-1.5 rounded-lg cursor-pointer ${row.status === 'active' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}
                  title={row.status === 'active' ? 'Suspend User' : 'Activate User'}
                >
                  {row.status === 'active' ? <Ban size={12} /> : <Check size={12} />}
                </button>
              </div>
            )
          }
        ]}
        data={filtered}
      />
    </div>
  );
};
