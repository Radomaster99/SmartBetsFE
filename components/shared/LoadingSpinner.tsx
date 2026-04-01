export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
    </div>
  );
}

const SKELETON_WIDTHS = [75, 90, 65, 85, 70, 95, 60, 80, 72, 88, 68, 92, 78, 63, 82, 97];

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 bg-surface-2 rounded animate-pulse" style={{ width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
