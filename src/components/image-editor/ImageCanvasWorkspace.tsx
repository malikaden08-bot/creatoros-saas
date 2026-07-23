'use client';

import React from 'react';
import { PSDLayer } from '../../lib/mockDataImageEditor';
import { ZoomIn, ZoomOut, Maximize2, Sparkles } from 'lucide-react';

export interface ImageCanvasWorkspaceProps {
  layers: PSDLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  zoomPct: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  activeTool: string;
  cropAspect: string;
}

export const ImageCanvasWorkspace: React.FC<ImageCanvasWorkspaceProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  zoomPct,
  onZoomIn,
  onZoomOut,
  activeTool,
  cropAspect
}) => {
  return (
    <div className="flex-1 h-full bg-stone-950 flex flex-col justify-between p-4 overflow-hidden select-none relative">
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-800">
            600 x 400 px • 300 DPI
          </span>
        </div>

        <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1">
          <button onClick={onZoomOut} className="text-stone-400 hover:text-white cursor-pointer">
            <ZoomOut size={14} />
          </button>
          <span className="font-mono text-xs font-bold text-stone-200">{zoomPct}%</span>
          <button onClick={onZoomIn} className="text-stone-400 hover:text-white cursor-pointer">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto">
        <div
          className="relative bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden transition-transform duration-150"
          style={{ width: 600, height: 400, transform: `scale(${zoomPct / 100})` }}
        >
          {layers
            .slice()
            .reverse()
            .map((layer) => {
              if (!layer.visible) return null;
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`absolute transition-all ${
                    isSelected ? 'ring-2 ring-[var(--accent-warm)] z-20' : ''
                  }`}
                  style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    opacity: layer.opacity / 100
                  }}
                >
                  {layer.type === 'image' && (
                    <img
                      src={layer.content}
                      alt={layer.name}
                      className="w-full h-full object-cover rounded pointer-events-none"
                    />
                  )}

                  {layer.type === 'text' && (
                    <div
                      className="w-full h-full font-black flex items-center justify-center text-3xl tracking-wider drop-shadow-lg"
                      style={{ color: layer.color || '#FFFFFF' }}
                    >
                      {layer.content}
                    </div>
                  )}

                  {layer.type === 'shape' && (
                    <div
                      className="w-full h-full rounded-2xl border-2 border-amber-500/50 shadow-xl"
                      style={{ backgroundColor: layer.color || '#1C1917' }}
                    />
                  )}

                  {layer.hasAiBgRemoval && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white font-mono text-[9px] font-bold flex items-center gap-1">
                      <Sparkles size={10} /> AI Isolated
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 z-10 pt-1">
        <span>Press Spacebar to Pan Canvas</span>
        <span>RGB / 8-bit / GPU Accelerated</span>
      </div>
    </div>
  );
};
