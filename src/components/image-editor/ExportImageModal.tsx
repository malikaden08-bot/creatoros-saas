'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/DialogModal';
import { Download, FileImage, FileCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExportImageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { showToast } = useAuth();
  const [format, setFormat] = useState('PNG');

  const FORMATS = [
    { format: 'PNG', label: 'Lossless 4K PNG Graphic' },
    { format: 'JPG', label: '100% Quality JPEG' },
    { format: 'WebP', label: 'Compressed WebP' },
    { format: 'PSD', label: 'Photoshop PSD Document' }
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Export Master Image Graphic" maxWidth="max-w-md">
      <div className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">Export Format</label>
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.format}
                onClick={() => setFormat(f.format)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  format === f.format
                    ? 'bg-[var(--accent-warm)] text-white border-transparent shadow-xs'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="text-xs font-bold font-mono">{f.format}</div>
                <div className={`text-[10px] ${format === f.format ? 'text-white/80' : 'text-[var(--text-tertiary)]'}`}>{f.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => {
              showToast(`Exported 4K graphic in .${format} format!`);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Download .{format} File</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
