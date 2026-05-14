import React from 'react';
import { PieChart, Plus, Heart, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { ERPModule } from '@/types';

export function BudgetsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Budgets & planning"
        subtitle="Budget envelopes, ministry limits, and utilization charts are not wired to a live API in this build."
        status="placeholder"
        icon={PieChart}
        actions={
          <>
            <ActionButton label="Accounting" icon={CreditCard} variant="secondary" onClick={() => onModuleChange?.('finance')} />
            <ActionButton label="Giving" icon={Heart} variant="secondary" onClick={() => onModuleChange?.('giving')} />
            <ActionButton label="New budget" icon={Plus} variant="primary" onClick={() => onModuleChange?.('finance')} />
          </>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-medium" role="status">
        <span className="font-black">Not connected:</span> Previous sample budgets, KPIs, and charts have been removed.
        Voucher posting in Accounting may still enforce limits configured in settings when those rules exist — this screen does not duplicate that logic with fake numbers.
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden max-w-2xl">
        <CardHeader className="p-10 border-b border-slate-50">
          <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">What to use instead</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-medium leading-relaxed">
            Track real spending in <strong className="text-slate-800">Accounting</strong> (ledger & vouchers) and compare to goals outside this module until budget APIs exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-4">
          <Button type="button" className="rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('finance')}>
            Open accounting
          </Button>
          <Button type="button" variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('giving')}>
            Open giving
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
