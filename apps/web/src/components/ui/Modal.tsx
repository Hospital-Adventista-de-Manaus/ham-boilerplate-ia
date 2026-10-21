'use client';

import { Icon } from '@/components/Icon';

export function Modal({
  open,
  onClose,
  title,
  children,
  widthClassName = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClassName?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className={`animate-ham-rise flex max-h-[80vh] w-full ${widthClassName} flex-col rounded-2xl bg-surface shadow-elevated`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-ham-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted hover:text-ham-900">
            <Icon name="close" />
          </button>
        </div>
        <div className="space-y-6 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
