import * as React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberSelectProps {
  value: string;
  onChange: (value: string) => void;
  members: any[];
  placeholder?: string;
  className?: string;
}

export function MemberSelect({ value, onChange, members, placeholder = "Select a person...", className }: MemberSelectProps) {
  // A simplified combobox alternative using native select styled nicely, 
  // since building a full accessible combobox from scratch takes too much code here.
  // In a real iteration, this would use CmdK or Radix UI Combobox.
  
  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <User className="w-4 h-4" />
      </div>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border-none rounded-xl h-12 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none outline-none transition-all shadow-inner"
      >
        <option value="" disabled className="text-slate-400 font-medium">{placeholder}</option>
        {members.map(m => (
          <option key={m.id} value={m.id} className="font-medium text-slate-900">
            {m.name} {m.family?.name ? `(${m.family.name} Family)` : ''}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
