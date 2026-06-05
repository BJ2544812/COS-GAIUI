import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';

type Account = { id: string; code?: string; name: string; type?: string };

type Line = { accountId: string; debit: string; credit: string };

export function VoucherCreateDialog({
  open,
  onOpenChange,
  accounts,
  currency,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  currency: string;
  onCreated: (voucherId: string) => void;
}) {
  const [type, setType] = React.useState<'Payment' | 'Receipt' | 'Journal'>('Journal');
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = React.useState<Line[]>([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setType('Journal');
    setDescription('');
    setDate(new Date().toISOString().slice(0, 10));
    setLines([
      { accountId: '', debit: '', credit: '' },
      { accountId: '', debit: '', credit: '' },
    ]);
    setError(null);
  };

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      const entries = lines
        .filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))
        .map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        }));
      if (entries.length < 2) {
        setError('Add at least two lines with accounts and amounts.');
        return;
      }
      if (!balanced) {
        setError('Debits and credits must balance.');
        return;
      }
      const amount = totalDebit;
      const res = await apiRequest<unknown>('finance/vouchers', {
        method: 'POST',
        body: JSON.stringify({
          type,
          description: description.trim() || `${type} voucher`,
          date: new Date(date).toISOString(),
          amount,
          source: 'manual',
          sourceType: 'manual',
          entries,
        }),
      });
      const voucher = parseApiResponse<{ id: string }>(res);
      if (!voucher?.id) throw new Error('Voucher was not created.');
      onCreated(voucher.id);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New voucher (draft)</DialogTitle>
          <DialogDescription>
            Creates a balanced draft journal entry. Approve and post from the voucher registry ({currency}).
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-xs font-bold uppercase text-slate-500">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="Journal">Journal</option>
              <option value="Payment">Payment</option>
              <option value="Receipt">Receipt</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase text-slate-500 md:col-span-2">
            Description
            <Input className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Utilities — March" />
          </label>
          <label className="text-xs font-bold uppercase text-slate-500">
            Date
            <Input type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Journal lines</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setLines((prev) => [...prev, { accountId: '', debit: '', credit: '' }])}>
              <Plus className="w-4 h-4 mr-1" /> Line
            </Button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <select
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                  value={line.accountId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, accountId: v } : l)));
                  }}
                >
                  <option value="">Account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code ? `${a.code} — ` : ''}{a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <Input placeholder="Debit" inputMode="decimal" value={line.debit} onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, debit: e.target.value } : l)))} />
              </div>
              <div className="col-span-3">
                <Input placeholder="Credit" inputMode="decimal" value={line.credit} onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, credit: e.target.value } : l)))} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="sm" disabled={lines.length <= 2} onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <p className={balanced ? 'text-sm text-emerald-700 font-medium' : 'text-sm text-amber-700 font-medium'}>
            Debits {totalDebit.toFixed(2)} · Credits {totalCredit.toFixed(2)}
            {balanced ? ' · Balanced' : ' · Must balance'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={busy || !balanced}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
