import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Mobile-friendly inline capture — replaces window.prompt in live ops. */
export function InlineTextCapture({
  label,
  placeholder,
  submitLabel = 'Send',
  onSubmit,
  onCancel,
  variant = 'default',
  className,
}: {
  label: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (text: string) => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
      setText('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant={variant === 'destructive' ? 'destructive' : 'outline'}
        className={cn('min-h-[44px]', className)}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium resize-none min-h-[88px]"
        autoFocus
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-[44px] bg-indigo-600" disabled={busy || !text.trim()} onClick={() => void submit()}>
          {busy ? 'Sending…' : submitLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-[44px]"
          onClick={() => {
            setOpen(false);
            setText('');
            onCancel?.();
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
