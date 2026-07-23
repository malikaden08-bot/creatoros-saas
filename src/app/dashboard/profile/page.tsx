'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { User, Shield, Lock, Bell, Check, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, showToast } = useAuth();

  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [email, setEmail] = useState(user?.email || 'alex@creatoros.ai');
  const [title, setTitle] = useState(user?.title || 'Founder & Head of Content');
  const [twoFactor, setTwoFactor] = useState<boolean>(user?.twoFactorEnabled ?? true);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [slackNotifs, setSlackNotifs] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile information updated!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--text-tertiary)]">• User Account & Security</span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Profile & Account Settings
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Update personal details, manage 2FA security credentials, and configure notification alerts.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="surface-card p-6 space-y-5">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <User size={18} className="text-[var(--accent-warm)]" />
                <span>Personal Details</span>
              </h3>

              <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-subtle)]">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[var(--accent-warm)] shadow-md"
                />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{email}</div>
                  <button
                    onClick={() => showToast('Avatar updated!')}
                    className="text-[11px] font-semibold text-[var(--accent-warm)] hover:underline cursor-pointer"
                  >
                    Change Avatar Image
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="surface-card p-5 space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Shield size={18} className="text-[var(--accent-warm)]" />
                <span>Security & Authentication</span>
              </h3>

              <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Two-Factor Auth (2FA)</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Secure logins with OTP authenticator app</div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => {
                    setTwoFactor(e.target.checked);
                    showToast(`2FA set to ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                  }}
                  className="accent-[var(--accent-warm)] w-4 h-4 cursor-pointer"
                />
              </div>

              <button
                onClick={() => showToast('Opened password change dialog')}
                className="w-full py-2.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
              >
                Change Password
              </button>
            </div>

            <div className="surface-card p-5 space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Bell size={18} className="text-[var(--accent-warm)]" />
                <span>Notification Preferences</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Weekly Email Activity Digest</span>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="accent-[var(--accent-warm)] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Slack Render Complete Alerts</span>
                  <input
                    type="checkbox"
                    checked={slackNotifs}
                    onChange={(e) => setSlackNotifs(e.target.checked)}
                    className="accent-[var(--accent-warm)] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
