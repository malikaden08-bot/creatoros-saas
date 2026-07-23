'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { MOCK_STORAGE_ASSETS } from '../../../lib/mockData';
import { HardDrive, Folder, Upload, Download, Search, Palette, Type, Copy, Check } from 'lucide-react';

export default function StoragePage() {
  const { currentWorkspace, showToast } = useAuth();
  const [assets] = useState(MOCK_STORAGE_ASSETS);
  const [search, setSearch] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--text-tertiary)]">• Encrypted Storage Vault</span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Cloud Drive Assets & Brand Kit
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage raw video footage, subtitle renders, brand color tokens, and font typography rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast('Opened raw media upload modal')}
              className="px-4 py-2 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload Assets</span>
            </button>
          </div>
        </div>

        <div className="surface-card p-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-2">
              <HardDrive size={16} className="text-[var(--accent-warm)]" />
              <span>Drive Usage</span>
            </span>
            <span className="font-mono text-[var(--text-secondary)]">
              {currentWorkspace.storageUsedGB} GB / {currentWorkspace.storageLimitGB} GB (28.5%)
            </span>
          </div>
          <div className="w-full bg-[var(--border-default)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent-warm)] h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentWorkspace.storageUsedGB / currentWorkspace.storageLimitGB) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="surface-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Cloud Assets</h3>
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {filteredAssets.map((ast) => (
                  <div
                    key={ast.id}
                    className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Folder size={18} className="text-[var(--accent-warm)] shrink-0" />
                      <div className="overflow-hidden">
                        <div className="font-bold text-[var(--text-primary)] truncate">{ast.name}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2">
                          <span>{ast.folder}</span>
                          <span>•</span>
                          <span>{ast.updatedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{ast.size}</span>
                      <button
                        onClick={() => showToast(`Downloading ${ast.name}...`)}
                        className="p-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="surface-card p-5 space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Brand Tokens & Swatches
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                  <Palette size={14} className="text-[var(--accent-warm)]" />
                  <span>Color Tokens</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Primary Warm', hex: '#1C1917' },
                    { label: 'Amber Accent', hex: '#D97706' },
                    { label: 'Bronze Warm', hex: '#B45309' },
                    { label: 'Off-White Canvas', hex: '#FDFBF7' }
                  ].map((color) => (
                    <button
                      key={color.label}
                      onClick={() => handleCopyHex(color.hex)}
                      className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-left space-y-1.5 cursor-pointer hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div className="w-full h-7 rounded border border-black/10" style={{ backgroundColor: color.hex }} />
                      <div className="text-[10px] font-bold text-[var(--text-primary)]">{color.label}</div>
                      <div className="text-[9px] font-mono text-[var(--text-tertiary)] flex items-center justify-between">
                        <span>{color.hex}</span>
                        {copiedHex === color.hex ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                  <Type size={14} className="text-[var(--accent-warm)]" />
                  <span>Typography Stack</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Inter', 'JetBrains Mono', 'Playfair Display'].map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded bg-[var(--bg-muted)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
