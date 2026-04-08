'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { SideAdArtwork } from '@/components/ads/SideAdArtwork';
import {
  DEFAULT_SIDE_AD_FOCUS_PERCENT,
  DEFAULT_SIDE_AD_ZOOM,
  MIN_SIDE_AD_ZOOM,
  MAX_SIDE_AD_ZOOM,
  type SideAdSlotConfig,
  type SideAdSlotId,
} from '@/lib/side-ads';

type Props = {
  slotId: SideAdSlotId;
  slot: SideAdSlotConfig | null;
  uploading: boolean;
  onFileChange: (slotId: SideAdSlotId, event: ChangeEvent<HTMLInputElement>) => void;
  onChange: (slotId: SideAdSlotId, updates: Partial<SideAdSlotConfig>) => void;
  onClear: (slotId: SideAdSlotId) => void;
};

export function SideAdSlotEditor({ slotId, slot, uploading, onFileChange, onChange, onClear }: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
    width: number;
    height: number;
    zoom: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const title = slotId === 'left' ? 'Left Side Banner' : 'Right Side Banner';
  const updatedLabel = slot?.updatedAtUtc
    ? new Date(slot.updatedAtUtc).toLocaleString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!slot || !previewRef.current) {
      return;
    }

    const rect = previewRef.current.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocusX: slot.focusXPercent ?? DEFAULT_SIDE_AD_FOCUS_PERCENT,
      startFocusY: slot.focusYPercent ?? DEFAULT_SIDE_AD_FOCUS_PERCENT,
      width: rect.width,
      height: rect.height,
      zoom: slot.zoom ?? DEFAULT_SIDE_AD_ZOOM,
    };
    setIsDragging(true);
    previewRef.current.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const zoomFactor = Math.max(dragState.zoom, 1);
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const nextFocusX = dragState.startFocusX - (deltaX / dragState.width) * (100 / zoomFactor);
    const nextFocusY = dragState.startFocusY - (deltaY / dragState.height) * (100 / zoomFactor);

    onChange(slotId, {
      focusXPercent: nextFocusX,
      focusYPercent: nextFocusY,
    });
  }

  function finishDrag(event?: React.PointerEvent<HTMLDivElement>) {
    if (event && previewRef.current && dragStateRef.current?.pointerId === event.pointerId) {
      previewRef.current.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }

  return (
    <div
      className="space-y-3 rounded-lg p-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--t-border)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
            {title}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
            {slot?.updatedAtUtc ? `Updated ${updatedLabel}` : 'No image uploaded yet'}
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{
            background: slot ? 'rgba(0,230,118,0.12)' : 'rgba(148,163,184,0.12)',
            color: slot ? 'var(--t-accent)' : 'var(--t-text-5)',
            border: '1px solid var(--t-border)',
          }}
        >
          {slot ? 'Ready' : 'Empty'}
        </span>
      </div>

      {slot ? (
        <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
          Drag inside the preview to choose the visible part of the image, then fine-tune with zoom and focus sliders.
        </div>
      ) : null}

      <div
        ref={previewRef}
        className="overflow-hidden rounded-[12px]"
        style={{
          aspectRatio: '1 / 3.2',
          border: isDragging ? '1px solid rgba(0, 230, 118, 0.5)' : '1px solid var(--t-border)',
          background: 'rgba(5,8,18,0.22)',
          cursor: slot ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        {slot?.imageSrc ? (
          <SideAdArtwork slot={slot} alt={slot.alt || title} />
        ) : (
          <div
            className="flex h-full items-center justify-center px-4 text-center text-[11px]"
            style={{ color: 'var(--t-text-5)' }}
          >
            Upload a vertical banner image for this side slot.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="chrome-btn cursor-pointer rounded px-3 py-1.5 text-[12px] font-bold">
          {uploading ? 'Uploading...' : slot?.imageSrc ? 'Replace Image' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onFileChange(slotId, event)}
            disabled={uploading}
          />
        </label>
        <button
          type="button"
          onClick={() => onClear(slotId)}
          disabled={!slot}
          className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(slotId, {
              focusXPercent: DEFAULT_SIDE_AD_FOCUS_PERCENT,
              focusYPercent: DEFAULT_SIDE_AD_FOCUS_PERCENT,
              zoom: DEFAULT_SIDE_AD_ZOOM,
            })
          }
          disabled={!slot}
          className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
        >
          Reset Crop
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Zoom
          </label>
          <input
            type="range"
            min={String(MIN_SIDE_AD_ZOOM)}
            max={String(MAX_SIDE_AD_ZOOM)}
            step="0.01"
            value={slot?.zoom ?? DEFAULT_SIDE_AD_ZOOM}
            onChange={(event) => onChange(slotId, { zoom: Number(event.target.value) })}
            disabled={!slot}
            className="w-full accent-green-400 disabled:opacity-40"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              Horizontal Focus
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={slot?.focusXPercent ?? DEFAULT_SIDE_AD_FOCUS_PERCENT}
              onChange={(event) => onChange(slotId, { focusXPercent: Number(event.target.value) })}
              disabled={!slot}
              className="w-full accent-green-400 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              Vertical Focus
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={slot?.focusYPercent ?? DEFAULT_SIDE_AD_FOCUS_PERCENT}
              onChange={(event) => onChange(slotId, { focusYPercent: Number(event.target.value) })}
              disabled={!slot}
              className="w-full accent-green-400 disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
          <input
            type="checkbox"
            checked={Boolean(slot?.isClickable && slot?.href)}
            onChange={(event) => onChange(slotId, { isClickable: event.target.checked })}
            disabled={!slot}
            className="accent-green-400 disabled:opacity-40"
          />
          Banner is clickable
        </label>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Destination URL
          </label>
          <input
            type="url"
            value={slot?.href ?? ''}
            onChange={(event) => onChange(slotId, { href: event.target.value })}
            disabled={!slot}
            placeholder="https://example.com"
            className="input-shell w-full px-3 py-1.5 text-[12px] disabled:opacity-40"
          />
        </div>
        {slot ? (
          <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
            The banner redirects only when this toggle is on and the destination URL is filled in.
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Alt / Label
          </label>
          <input
            type="text"
            value={slot?.alt ?? ''}
            onChange={(event) => onChange(slotId, { alt: event.target.value })}
            disabled={!slot}
            placeholder={`${title} alt text`}
            className="input-shell w-full px-3 py-1.5 text-[12px] disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}
