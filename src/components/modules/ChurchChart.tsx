/**
 * Consistent Recharts area chart for Giving, Attendance, and analytics modules.
 */
import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

export type ChurchChartPoint = Record<string, string | number>;

interface ChurchAreaChartProps {
  data: ChurchChartPoint[];
  xKey: string;
  dataKey: string;
  color?: string;
  height?: number;
  gradientId?: string;
  className?: string;
  yFormatter?: (value: number) => string;
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid var(--border, #e2e8f0)',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: '12px',
  fontWeight: 600,
};

export function ChurchAreaChart({
  data,
  xKey,
  dataKey,
  color = 'var(--chart-primary, #4F46E5)',
  height = 280,
  gradientId = 'churchAreaFill',
  className,
  yFormatter,
}: ChurchAreaChartProps) {
  const safeId = gradientId.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div className={cn('w-full min-w-0', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #f1f5f9)" />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--chart-tick, #64748b)' }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--chart-tick, #64748b)' }}
            tickFormatter={yFormatter}
            width={48}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#334155', marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${safeId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartSection({ title, subtitle, children, actions, className }: ChartSectionProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      <div className="px-5 md:px-6 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-800">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}
