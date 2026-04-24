import React from 'react';
import { 
  Library, 
  Search, 
  Filter, 
  Video, 
  Mic2, 
  FileText, 
  Tag, 
  Download, 
  Plus, 
  Play,
  Clock,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

const SERMONS = [
  { title: 'The Heart of Worship', speaker: 'Dr. Arthur Penhaligon', series: 'Deep Waters', date: 'Mar 24, 2024', tags: ['Worship', 'Grace'], type: 'video' },
  { title: 'Walking in the Light', speaker: 'Rev. Sarah Jenkins', series: '1 John Study', date: 'Mar 17, 2024', tags: ['Holiness', 'Truth'], type: 'audio' },
  { title: 'Faith Over Fear', speaker: 'Pastor Mike Ross', series: 'Overcoming', date: 'Mar 10, 2024', tags: ['Faith', 'Mental Health'], type: 'video' },
  { title: 'Building the House', speaker: 'Dr. Arthur Penhaligon', series: 'Deep Waters', date: 'Mar 03, 2024', tags: ['Church', 'Service'], type: 'video' },
];

export function ContentModule() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sermon & Media Library</h1>
          <p className="text-slate-500">Archive, categorize, and distribute church teaching across all channels.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">
            <Plus className="w-4 h-4" />
            Upload Content
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search sermons, series, or speakers..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all font-medium shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Advanced Filtering
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {SERMONS.map((sermon, i) => (
           <Card key={i} className="border-none shadow-sm group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white">
              <div className="aspect-video bg-slate-100 relative overflow-hidden group-hover:cursor-pointer">
                 <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-indigo-900/20 transition-all duration-500"></div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                    <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
                       <Play className="w-6 h-6 fill-indigo-600" />
                    </div>
                 </div>
                 <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-slate-900/60 rounded text-[10px] text-white font-bold backdrop-blur-sm">
                    {sermon.type === 'video' ? '42:15' : '38:00'}
                 </div>
                 <div className="absolute top-2 left-2">
                    {sermon.type === 'video' ? <Video className="w-4 h-4 text-white drop-shadow-md" /> : <Mic2 className="w-4 h-4 text-white drop-shadow-md" />}
                 </div>
              </div>
              <CardContent className="p-5 space-y-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{sermon.series}</p>
                    <h3 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{sermon.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">By {sermon.speaker}</p>
                 </div>
                 
                 <div className="flex flex-wrap gap-1.5">
                    {sermon.tags.map((tag, ti) => (
                      <Badge key={ti} className="bg-slate-50 text-slate-400 border-none text-[9px] h-4 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">{tag}</Badge>
                    ))}
                 </div>

                 <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sermon.date}</span>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-indigo-50">
                       <MoreVertical className="w-4 h-4" />
                    </button>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-none shadow-sm">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800">Series Collections</h2>
               <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest px-3 py-1.5 bg-indigo-50 rounded-lg">Browse All Series</button>
            </div>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {[
                    { name: 'Deep Waters', sermons: 12, lastActive: '2 days ago' },
                    { name: 'Overcoming', sermons: 4, lastActive: '2 weeks ago' },
                    { name: 'The Great Commission', sermons: 8, lastActive: '1 month ago' },
                  ].map((series, i) => (
                    <div key={i} className="flex items-center justify-between p-6 hover:bg-indigo-50/20 cursor-pointer transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-indigo-100 transition-all">
                             <Library className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{series.name}</p>
                             <p className="text-xs text-slate-400 font-medium">{series.sermons} Sermons • Updated {series.lastActive}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 translate-x-0 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative self-start">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Library size={120} />
            </div>
            <div className="relative z-10 p-6 space-y-6">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold">Content Analytics</h2>
                  <p className="text-sm text-indigo-100/70">Performance across distribution channels</p>
               </div>
               
               <div className="space-y-4">
                  {[
                    { label: 'YouTube Views', val: '45.2k', progress: 78 },
                    { label: 'Podcast Downloads', val: '12.4k', progress: 62 },
                    { label: 'App Playback', val: '8.1k', progress: 45 },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-1.5">
                       <div className="flex justify-between text-xs font-bold text-indigo-200 uppercase tracking-widest">
                          <span>{stat.label}</span>
                          <span>{stat.val}</span>
                       </div>
                       <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${stat.progress}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
               
               <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                  Export Detailed Report
               </button>
            </div>
         </Card>
      </div>
    </div>
  );
}
