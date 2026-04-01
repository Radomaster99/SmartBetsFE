interface Props {
  src: string;
  alt: string;
  size?: number;
}

export function TeamLogo({ src, alt, size = 24 }: Props) {
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-surface-2 border border-border flex items-center justify-center text-[8px] text-slate-500"
      >
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
