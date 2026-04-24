import * as React from 'react';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  Heart,
  Share2,
  Image as ImageIcon,
  Hash,
  ArrowLeft,
  Mail,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const CAMPAIGNS = [
  { name: 'Easter Service Invitation', type: 'Email', status: 'Sent', reach: '2,482', date: 'Mar 15, 2024' },
  { name: 'Weekly Newsletter #42', type: 'Email', status: 'Scheduled', reach: '2,510', date: 'Mar 22, 2024' },
  { name: 'Emergency Weather Alert', type: 'SMS', status: 'Draft', reach: '1,840', date: '--' },
  { name: 'New Series Spotlight', type: 'Push', status: 'Sent', reach: '950', date: 'Mar 10, 2024' },
];

export function CommunicationModule() {
  const [view, setView] = React.useState<'feed' | 'messaging' | 'campaigns'>('feed');
  const [selectedGroup, setSelectedGroup] = React.useState<any>(null);

  const GROUPS = [
    { id: 1, name: 'Main Campus Leaders', lastMsg: 'Sermon notes for Sunday...', time: '10:15 AM', unread: 2 },
    { id: 2, name: 'Worship Team Hub', lastMsg: 'New setlist uploaded!', time: 'Yesterday', unread: 0 },
    { id: 3, name: 'Youth Ministry', lastMsg: 'Pizza party details...', time: '2 days ago', unread: 5 },
    { id: 4, name: 'Media Volunteers', lastMsg: 'Camera 2 needs battery...', time: '4 days ago', unread: 0 },
  ];

  const POSTS = [
    { id: 1, author: 'Dr. Arthur Penhaligon', avatar: 'AP', time: '2 hours ago', content: 'Incredibly proud of our outreach team today. We served over 200 families in the Downtown area. God is good!', likes: 42, comments: 4, image: 'https://images.unsplash.com/photo-1544427928-c49cdfebf194?q=80&w=600&auto=format&fit=crop' },
    { id: 2, author: 'Sarah Jenkins', avatar: 'SJ', time: '5 hours ago', content: 'Preparation for the 2024 Membership Class is underway. Can\'t wait to welcome the new brothers and sisters!', likes: 28, comments: 2 },
  ];

  if (view === 'messaging' && selectedGroup) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-[2rem]">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => setSelectedGroup(null)} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
               </Button>
               <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {selectedGroup.name[0]}
               </div>
               <div>
                  <h2 className="font-bold text-slate-900">{selectedGroup.name}</h2>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Now</p>
               </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
         </div>
         <div className="flex-1 bg-slate-50 p-8 space-y-6 overflow-y-auto">
            <div className="max-w-md bg-white p-4 rounded-2xl rounded-tl-none shadow-sm shadow-slate-100 border border-slate-100 overflow-hidden">
               <p className="text-xs font-bold text-indigo-600 mb-1">Robert Chen</p>
               <p className="text-sm text-slate-700">Has anyone seen the setlist for the 11AM service? I can't find it in the drive.</p>
               <p className="text-[10px] text-slate-400 mt-2 text-right">09:42 AM</p>
            </div>
            <div className="max-w-md ml-auto bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-lg shadow-indigo-100 text-white">
               <p className="text-sm">I've just uploaded it to the Planning Center. Let me know if you still can't access it.</p>
               <p className="text-[10px] text-indigo-200 mt-2 text-right">09:45 AM</p>
            </div>
         </div>
         <div className="p-6 bg-white border-t border-slate-100 rounded-b-[2rem]">
            <div className="relative">
               <input className="w-full h-12 pl-6 pr-14 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner" placeholder="Type your message..." />
               <Button size="icon" className="absolute right-1 top-1 w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md">
                  <Send className="w-4 h-4" />
               </Button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Communication & Community</h1>
          <p className="text-slate-500">The internal heart of our church - connect, post, and coordinate.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
           <button onClick={() => setView('feed')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === 'feed' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>Community Feed</button>
           <button onClick={() => setView('messaging')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === 'messaging' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>Groups</button>
           <button onClick={() => setView('campaigns')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === 'campaigns' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>Campaigns</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-[2rem] border-slate-100 shadow-sm p-8 space-y-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Top Groups</h3>
               <div className="space-y-4">
                  {GROUPS.map((group, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSelectedGroup(group); setView('messaging'); }}
                      className="group cursor-pointer flex items-center justify-between"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <Hash className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">{group.name}</p>
                             <p className="text-[10px] text-slate-400 font-medium truncate w-32">{group.lastMsg}</p>
                          </div>
                       </div>
                       {group.unread > 0 && <Badge className="bg-indigo-600 text-white rounded-lg px-1.5 py-0 min-w-5 h-5 flex items-center justify-center border-none">{group.unread}</Badge>}
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl">View All Communities</Button>
               </div>
            </Card>

            <Card className="rounded-[2rem] border-none bg-slate-900 text-white p-8 space-y-4 shadow-xl">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-black">Member App</h3>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">Download the church app for real-time notifications, mobile check-in, and tithe management.</p>
               <div className="flex gap-2 pt-2">
                  <div className="flex-1 h-10 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest overflow-hidden group cursor-pointer hover:bg-white/20 transition-all">App Store</div>
                  <div className="flex-1 h-10 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest overflow-hidden group cursor-pointer hover:bg-white/20 transition-all">Play Store</div>
               </div>
            </Card>
         </div>

         <div className="lg:col-span-3">
            {view === 'feed' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Card className="rounded-[2rem] border-slate-100 shadow-sm p-6">
                    <div className="flex gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200">YOU</div>
                       <div className="flex-1 space-y-3">
                          <textarea className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner resize-none" placeholder="Share something with the community..." />
                          <div className="flex items-center justify-between">
                             <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="rounded-xl text-slate-500"><ImageIcon size={18} className="mr-2" /> Photo</Button>
                                <Button variant="ghost" size="sm" className="rounded-xl text-slate-500"><Hash size={18} className="mr-2" /> Tag</Button>
                             </div>
                             <Button className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-xl font-bold h-10 shadow-lg shadow-indigo-100">Post Insight</Button>
                          </div>
                       </div>
                    </div>
                 </Card>

                 {POSTS.map(post => (
                   <Card key={post.id} className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="p-6">
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                  {post.avatar}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.author}</h4>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{post.time}</p>
                               </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300"><MoreVertical size={20} /></Button>
                         </div>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed text-left mb-6">{post.content}</p>
                         {post.image && (
                           <div className="mb-6 rounded-3xl overflow-hidden shadow-xl shadow-slate-200 border border-slate-50">
                              <img src={post.image} alt="Post content" className="w-full h-80 object-cover" />
                           </div>
                         )}
                         <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                            <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
                               <Heart size={20} />
                               <span className="text-xs font-black">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
                               <MessageCircle size={20} />
                               <span className="text-xs font-black">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors ml-auto">
                               <Share2 size={20} />
                            </button>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>
            )}

            {view === 'messaging' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {GROUPS.map(group => (
                   <Card 
                     key={group.id} 
                     onClick={() => setSelectedGroup(group)}
                     className="rounded-[2.5rem] border-slate-100 shadow-sm p-8 hover:ring-2 hover:ring-indigo-500/20 cursor-pointer transition-all active:scale-[0.98] group flex flex-col gap-6"
                   >
                      <div className="flex justify-between items-start">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-2xl font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            {group.name[0]}
                         </div>
                         {group.unread > 0 && <Badge className="bg-red-500 border-none shadow-lg shadow-red-200 h-6 px-2 font-black">{group.unread} NEW</Badge>}
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{group.time}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-500 truncate italic">"{group.lastMsg}"</p>
                      <Button className="w-full bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest border-none transition-all">Open Group Hub</Button>
                   </Card>
                 ))}
                 <Card className="rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center gap-6 group hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                       <Plus size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Establish New Group Community</p>
                 </Card>
              </div>
            )}

            {view === 'campaigns' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-3xl border-slate-100 shadow-sm p-8 bg-indigo-900 text-white border-none flex items-center justify-between">
                       <div className="space-y-2">
                          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Reach</h3>
                          <p className="text-3xl font-black">12,842</p>
                          <p className="text-xs text-indigo-300 font-medium">Unique contacts across all lists</p>
                       </div>
                       <Mail className="w-12 h-12 text-indigo-500 opacity-40" />
                    </Card>
                    <Card className="rounded-3xl border-slate-100 shadow-sm p-8 bg-emerald-900 text-white border-none flex items-center justify-between">
                       <div className="space-y-2">
                          <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Broadcast Opt-ins</h3>
                          <p className="text-3xl font-black">4,820</p>
                          <p className="text-xs text-emerald-300 font-medium">Subscribed to SMS alerts</p>
                       </div>
                       <Smartphone className="w-12 h-12 text-emerald-500 opacity-40" />
                    </Card>
                 </div>
                 <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                       <h3 className="font-extrabold text-slate-800 uppercase tracking-tighter">Active Campaigns</h3>
                       <Button className="bg-indigo-600 rounded-xl h-10 font-bold px-6 shadow-lg shadow-indigo-100">Create New Outreach</Button>
                    </div>
                    <div className="p-0">
                       {/* ... existing campaign list can be refined here if needed ... */}
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
