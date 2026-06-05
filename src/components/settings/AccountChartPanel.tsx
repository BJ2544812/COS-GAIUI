import * as React from 'react';
import { Plus, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

type GlAccount = {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  balance: number | string;
};

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const;

export function AccountChartPanel({ onAccountsChange }: { onAccountsChange?: () => void }) {
  const [accounts, setAccounts] = React.useState<GlAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ code: '', name: '', type: 'Asset' as (typeof ACCOUNT_TYPES)[number] });
  const [busy, setBusy] = React.useState(false);
  const [archiveId, setArchiveId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<unknown>('finance/accounts');
      setAccounts(parseApiResponse<GlAccount[]>(res) || []);
    } catch (e) {
      setError(formatApiError(e));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const createAccount = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('Account code and name are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiRequest('finance/accounts', {
        method: 'POST',
        body: { code: form.code.trim(), name: form.name.trim(), type: form.type },
      });
      setForm({ code: '', name: '', type: 'Asset' });
      await load();
      onAccountsChange?.();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const archiveAccount = async () => {
    if (!archiveId) return;
    setBusy(true);
    try {
      await apiRequest(`finance/accounts/${archiveId}`, {
        method: 'PATCH',
        body: { isActive: false },
      });
      setArchiveId(null);
      await load();
      onAccountsChange?.();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const grouped = React.useMemo(() => {
    const map = new Map<string, GlAccount[]>();
    for (const t of ACCOUNT_TYPES) map.set(t, []);
    for (const a of accounts) {
      const list = map.get(a.type) ?? [];
      list.push(a);
      map.set(a.type, list);
    }
    return map;
  }, [accounts]);

  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Chart of accounts</h4>
        <p className="text-xs text-slate-500 mt-1">
          Create ledger accounts for mapping gifts and expenses. Account codes cannot be changed after creation.
        </p>
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
          <Input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. 1100"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. General Fund — Cash"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as (typeof ACCOUNT_TYPES)[number] }))}
            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={() => void createAccount()} disabled={busy} className="md:col-span-4 bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" />
          Add account
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading accounts…</p>
      ) : (
        <div className="space-y-4">
          {ACCOUNT_TYPES.map((type) => {
            const rows = grouped.get(type) ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={type}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{type}</p>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  {rows.map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        'flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-50 last:border-0 text-sm',
                        !a.isActive && 'opacity-50',
                      )}
                    >
                      <span className="font-mono text-slate-500">{a.code}</span>
                      <span className="font-medium text-slate-800 flex-1">{a.name}</span>
                      <span className="text-xs text-slate-400">
                        {Number(a.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                      {a.isActive && (
                        <button
                          type="button"
                          title="Archive account"
                          className="p-2 text-slate-400 hover:text-rose-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          onClick={() => setArchiveId(a.id)}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!archiveId}
        title="Archive this account?"
        description="Archived accounts stay in history but cannot be selected for new transactions. Only accounts with zero balance can be archived."
        confirmLabel="Archive"
        variant="destructive"
        busy={busy}
        onCancel={() => setArchiveId(null)}
        onConfirm={archiveAccount}
      />
    </div>
  );
}
