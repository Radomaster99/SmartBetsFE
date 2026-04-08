'use client';

import { buildSideAdImageStyle, type SideAdSlotConfig } from '@/lib/side-ads';

type Props = {
  slot: SideAdSlotConfig;
  alt: string;
};

export function SideAdArtwork({ slot, alt }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={slot.imageSrc}
        alt={alt}
        draggable={false}
        style={buildSideAdImageStyle(slot)}
      />
    </div>
  );
}
