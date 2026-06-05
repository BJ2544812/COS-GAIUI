import * as React from 'react';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';

type GlAccount = { id: string; code: string; name: string; type: string };

export function AccountSelect({
  value,
  onChange,
  filterType,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  filterType?: string;
  placeholder?: string;
}) {
  const [accounts, setAccounts] = React.useState<GlAccount[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await apiRequest('finance/accounts');
        const list = parseApiResponse<GlAccount[]>(res) || [];
        setAccounts(
          filterType ? list.filter((a) => a.type === filterType) : list
        );
      } catch {
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filterType]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
    >
      <option value="">{loading ? 'Loading accounts…' : placeholder || 'Select account'}</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.code} — {a.name} ({a.type})
        </option>
      ))}
    </select>
  );
}
