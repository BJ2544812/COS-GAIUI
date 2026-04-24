import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Download,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { MembershipStatus, ERPModule } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { MemberIntake } from './MemberIntake';
import { MemberProfileDetail } from './MemberProfile';

const MOCK_MEMBERS = [
  { id: '1', name: 'James Wilson', email: 'james.w@example.com', phone: '+1 555 0101', status: MembershipStatus.MEMBER, joined: 'Oct 12, 2021', score: 85, campus: 'Downtown' },
  { id: '2', name: 'Maria Garcia', email: 'maria.g@example.com', phone: '+1 555 0102', status: MembershipStatus.LEADER, joined: 'Feb 05, 2018', score: 98, campus: 'Westside' },
  { id: '3', name: 'David Smith', email: 'david.s@example.com', phone: '+1 555 0103', status: MembershipStatus.REGULAR, joined: 'Jan 20, 2024', score: 42, campus: 'Downtown' },
  { id: '4', name: 'Sarah Miller', email: 'sarah.m@example.com', phone: '+1 555 0104', status: MembershipStatus.VISITOR, joined: 'Apr 11, 2024', score: 15, campus: 'South' },
  { id: '5', name: 'Robert Taylor', email: 'robert.t@example.com', phone: '+1 555 0105', status: MembershipStatus.STAFF, joined: 'Sep 30, 2015', score: 95, campus: 'Downtown' },
  { id: '6', name: 'Linda White', email: 'linda.w@example.com', phone: '+1 555 0106', status: MembershipStatus.MEMBER, joined: 'May 14, 2022', score: 76, campus: 'Westside' },
];

interface MembersModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

type ViewState = 'directory' | 'intake' | 'profile';

export function MembersModule({ onModuleChange }: MembersModuleProps) {
  const [view, setView] = useState<ViewState>('directory');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddMember = () => setView('intake');
  const handleViewProfile = (id: string) => {
    setSelectedMemberId(id);
    setView('profile');
  };
  const handleBackToDirectory = () => {
    setView('directory');
    setSelectedMemberId(null);
  };

  if (view === 'intake') {
    return (
      <MemberIntake 
        onCancel={handleBackToDirectory} 
        onSave={(data) => {
          console.log('Saving member:', data);
          handleBackToDirectory();
        }} 
      />
    );
  }

  if (view === 'profile' && selectedMemberId) {
    return (
      <MemberProfileDetail 
        memberId={selectedMemberId} 
        onBack={handleBackToDirectory} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Member Directory</h1>
          <p className="text-slate-500">Manage individuals, families, and their spiritual journeys.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={handleAddMember}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm h-full">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Total Members</p>
              <p className="text-2xl font-bold text-slate-900 leading-none">2,482</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm h-full">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Active This Week</p>
              <p className="text-2xl font-bold text-slate-900 leading-none">1,150</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm h-full">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">In Outreach Pipe</p>
              <p className="text-2xl font-bold text-slate-900 leading-none">84</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search members by name, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2">
             <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <p className="text-sm font-medium text-slate-400">Showing 6 of 2,482 members</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[300px] font-bold text-slate-600 h-12">Member</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Status</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Campus</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Joined</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Engagement</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_MEMBERS.map((member) => (
                <TableRow key={member.id} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200 overflow-hidden">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span 
                          onClick={() => handleViewProfile(member.id)}
                          className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer hover:underline"
                        >
                          {member.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {member.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-semibold rounded-full px-3 py-0.5 border-none shadow-sm",
                      member.status === MembershipStatus.MEMBER && "bg-indigo-50 text-indigo-700",
                      member.status === MembershipStatus.LEADER && "bg-amber-50 text-amber-700",
                      member.status === MembershipStatus.VISITOR && "bg-rose-50 text-rose-700",
                      member.status === MembershipStatus.REGULAR && "bg-teal-50 text-teal-700",
                      member.status === MembershipStatus.STAFF && "bg-slate-100 text-slate-700",
                    )}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      {member.campus}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">{member.joined}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Registration Date</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                        <span>Score</span>
                        <span className={cn(
                          member.score > 80 ? "text-emerald-500" : member.score > 50 ? "text-amber-500" : "text-slate-400"
                        )}>{member.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            member.score > 80 ? "bg-emerald-500" : member.score > 50 ? "bg-amber-500" : "bg-slate-300"
                          )} 
                          style={{ width: `${member.score}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleViewProfile(member.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/10">
          <p className="text-sm text-slate-500 font-medium">Page 1 of 414</p>
          <div className="flex gap-2">
             <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-400 bg-white cursor-not-allowed">Previous</button>
             <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
