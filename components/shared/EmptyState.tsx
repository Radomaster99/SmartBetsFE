interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 16,
          fontSize: 26,
        }}
      >
        {icon ?? '⚽'}
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: 'var(--t-text-2)' }}>{title}</h3>
      {description && (
        <p className="text-[13px] mb-4 max-w-xs leading-relaxed" style={{ color: 'var(--t-text-5)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
