import { Receipt, Plus, Search } from 'lucide-react';
import { ActionButton } from '@/components/modules/ModuleHeader';

export function VoucherRegistryHero({
  totalCount,
  draftCount,
  onNewVoucher,
  onFocusSearch,
}: {
  totalCount: number;
  draftCount: number;
  onNewVoucher: () => void;
  onFocusSearch?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 md:p-8 text-white shadow-lg shadow-indigo-500/20">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-100">
            <Receipt className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voucher registry</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Vouchers are the heart of church accounting
          </h2>
          <p className="text-sm font-medium text-indigo-100/90 leading-relaxed">
            Every gift, bill, payroll run, and adjustment becomes a voucher. Search here, approve drafts, and post to the books.
          </p>
          <p className="text-xs font-bold text-indigo-200/80">
            {totalCount} vouchers on record
            {draftCount > 0 ? ` · ${draftCount} awaiting review` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {onFocusSearch && (
            <ActionButton
              label="Search"
              icon={Search}
              variant="secondary"
              onClick={onFocusSearch}
              className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25"
            />
          )}
          <ActionButton
            label="New voucher"
            icon={Plus}
            variant="primary"
            onClick={onNewVoucher}
            className="!bg-white !text-indigo-700 hover:!bg-indigo-50"
          />
        </div>
      </div>
    </div>
  );
}
