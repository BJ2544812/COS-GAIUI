import React from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  CheckCheck,
  UserPlus,
  Calendar,
  AlertCircle,
  MessageSquare,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';

const NOTIFICATIONS_DATA = [
  { id: 1, type: 'member', title: 'New Visitor Registration', message: 'Sarah Johnson just registered via the Sunday Service connection card.', time: '10 mins ago', read: false, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 2, type: 'event', title: 'Event Capacity Alert', message: 'Youth Summer Camp is now at 95% capacity. Consider opening more slots.', time: '1 hour ago', read: false, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 3, type: 'finance', title: 'Large Donation Received', message: 'An anonymous donation of $5,000.00 was recorded for the Building Fund.', time: '3 hours ago', read: true, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 4, type: 'communication', title: 'Unread Reply', message: 'Pastor David replied to your message regarding the sermon schedule.', time: '5 hours ago', read: true, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 5, type: 'service', title: 'Service Plan Updated', message: 'Main Service (Sunday 9AM) has been updated by the Worship Director.', time: 'Yesterday', read: true, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export function NotificationsModule() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Notifications
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-bold px-3">2 New</Badge>
          </h1>
          <p className="text-slate-500 text-sm">Stay updated with the latest activities across your organization.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </Button>
          <Button variant="outline" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-transparent">
            <Trash2 className="w-4 h-4" /> Clear all
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Filter notifications..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" /> All Activities
        </Button>
      </div>

      <div className="space-y-3">
        {NOTIFICATIONS_DATA.map((notification) => (
          <Card key={notification.id} className={cn(
            "group transition-all hover:shadow-md cursor-pointer",
            !notification.read ? "border-l-4 border-l-indigo-500 bg-indigo-50/20" : "hover:bg-slate-50"
          )}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", notification.bg)}>
                <notification.icon className={cn("w-6 h-6", notification.color)} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn("font-bold", notification.read ? "text-slate-700" : "text-slate-900")}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{notification.time}</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                  {notification.message}
                </p>
                <div className="pt-2 flex items-center gap-4">
                   <button className="text-xs font-bold text-indigo-600 hover:underline">View Details</button>
                   <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Dismiss</button>
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-8">
        <Button variant="ghost" className="text-slate-400 hover:text-slate-600 font-medium">
          Load older notifications
        </Button>
      </div>
    </div>
  );
}
