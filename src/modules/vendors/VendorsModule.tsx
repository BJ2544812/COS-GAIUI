import React from 'react';
import { Store, Plus, ArrowUpRight, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { ERPModule } from '@/types';

export function VendorsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Vendors & suppliers"
        subtitle="Accounts payable, vendor registry, and invoice tracking are not implemented as live APIs in this build."
        status="placeholder"
        icon={Store}
        actions={
          <>
            <ActionButton label="Accounting" icon={CreditCard} variant="secondary" onClick={() => onModuleChange?.('finance')} />
            <ActionButton label="Add vendor" icon={Plus} variant="primary" onClick={() => onModuleChange?.('finance')} />
          </>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-medium" role="status">
        <span className="font-black">Removed sample data:</span> Demo vendor rows, KPIs, invoices, and expense breakdowns were illustrative only and have been deleted. Use{' '}
        <strong className="font-bold">Accounting</strong> for real payables tied to vouchers when your process uses them.
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden max-w-2xl">
        <CardHeader className="p-10 border-b border-slate-50">
          <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Vendor directory</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-medium leading-relaxed">
            When a vendor model and APIs are added, this list will load from the database. Until then, keep supplier context in voucher narrations and external records.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-4">
          <p className="text-sm text-slate-400 font-medium">No vendors to display.</p>
          <Button type="button" variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2" onClick={() => onModuleChange?.('finance')}>
            <ArrowUpRight className="w-4 h-4" /> Go to accounting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
