interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">&#x26BD;</div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--t-text-2)' }}>{title}</h3>
      {description && <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--t-text-4)' }}>{description}</p>}
      {action}
    </div>
  );
}
