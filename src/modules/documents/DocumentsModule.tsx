import * as React from 'react';
import { 
  FileBox, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Lock, 
  Folder, 
  FileText, 
  Clock, 
  CheckCircle2,
  Trash2,
  Download,
  Eye,
  FileSignature,
  History,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Library,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const DOCS = [
  { id: 1, name: 'Member_Trust_Agreement_2024.pdf', cat: 'Legal', owner: 'Sarah Jenkins', size: '2.4 MB', date: '2 days ago', status: 'Approved' },
  { id: 2, name: 'Baptism_Certificate_Template.docx', cat: 'Internal', owner: 'Robert Chen', size: '840 KB', date: '1 week ago', status: 'Draft' },
  { id: 3, name: 'Annual_Audit_Report_2023.xlsx', cat: 'Finance', owner: 'James Wilson', size: '15.2 MB', date: 'Mar 12, 2024', status: 'Audit Ready' },
  { id: 4, name: 'Status_Card_Renewal_Guide.pdf', cat: 'Indian Act', owner: 'Chief Joseph', size: '1.2 MB', date: 'Mar 15, 2024', status: 'Reference' },
  { id: 5, name: 'Declaration_of_Indigenous_Rights.pdf', cat: 'Indian Act', owner: 'Legal Office', size: '3.1 MB', date: 'Feb 10, 2024', status: 'Certified' },
  { id: 6, name: 'Baptism_Certificate_Registry.xlsx', cat: 'Registry', owner: 'Pastoral Office', size: '2.1 MB', date: 'Yesterday', status: 'Live' },
];

export function DocumentsModule() {
  const [selectedDoc, setSelectedDoc] = React.useState<any>(null);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredDocs = activeCategory === 'All' 
    ? DOCS 
    : DOCS.filter(d => activeCategory.toLowerCase().includes(d.cat.toLowerCase()));

  if (isUploading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsUploading(false)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Upload to Secure Vault</h1>
            <p className="text-sm text-slate-500 font-medium">Add new institutional records or policy documents.</p>
          </div>
        </div>

        <Card 
          onClick={() => fileInputRef.current?.click()}
          className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-6 group hover:border-indigo-400 hover:bg-white transition-all cursor-pointer"
        >
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={(e) => {
               if (e.target.files?.length) {
                 alert(`Selected file: ${e.target.files[0].name}`);
                 setIsUploading(false);
               }
             }}
           />
           <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-slate-200 mx-auto flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Plus size={32} />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">Drag & Drop Documents</h3>
              <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto text-balance text-left md:text-center">PDF, XLSX, DOCX, or JPG files support. Individual file size limit 50MB.</p>
           </div>
           <Button className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-xl font-bold h-12 shadow-lg shadow-indigo-100">Browse Local Files</Button>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Meta</h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Security Category</label>
                    <select className="w-full h-11 bg-white border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20">
                       <option>Legal & Policy</option>
                       <option>Financial Records</option>
                       <option>Member Records</option>
                       <option>Governance</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Retention Policy</label>
                    <select className="w-full h-11 bg-white border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20">
                       <option>Standard (7 Years)</option>
                       <option>Permanent (Indefinite)</option>
                       <option>Temporary (1 Year)</option>
                    </select>
                 </div>
              </div>
           </Card>
           <Card className="rounded-3xl border-none shadow-sm p-8 bg-slate-900 text-white space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-indigo-400" />
                 <h3 className="text-sm font-black uppercase tracking-widest">GDPR & Compliance</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium text-left">All uploads are multi-stage encrypted. Access to these documents is logged in the immutable audit trail.</p>
              <div className="pt-4 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Encryption Active</span>
              </div>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Secure Document Vault</h1>
          <p className="text-slate-500">Encrypted institutional record storage, policy management, and audit trailing.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUploading(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 leading-none"
          >
            <Plus className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
               <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/20">
                  <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Vault Categories</CardTitle>
               </CardHeader>
               <CardContent className="p-3">
                  {[
                    { name: 'All Files', count: DOCS.length, icon: Folder },
                    { name: 'Indian Act Requirements', count: 2, icon: Library },
                    { name: 'Baptism Registry', count: 1, icon: CheckCircle2 },
                    { name: 'Legal & Policy', count: 12, icon: Lock },
                    { name: 'Financial Records', count: 84, icon: FileText },
                    { name: 'Member Files', count: 248, icon: Folder },
                  ].map((cat, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveCategory(cat.name)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all group active:scale-95 mb-1",
                        activeCategory === cat.name ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100" : "hover:bg-slate-50 text-slate-600"
                      )}
                    >
                       <div className="flex items-center gap-3">
                          <cat.icon size={18} className={cn("transition-colors", activeCategory === cat.name ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-400")} />
                          <span>{cat.name}</span>
                       </div>
                       <Badge variant="ghost" className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400 p-0">{cat.count}</Badge>
                    </button>
                  ))}
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
               <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-900/50">
                    <Trash2 size={24} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight pt-2">Retention Guard</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">Financial records are kept for 7 years. Automated archival Nov 1st.</p>
                  <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-300 group-hover:text-white p-0 h-auto justify-start">View Policy <ArrowRight className="w-3 h-3 ml-2" /></Button>
               </div>
            </Card>
         </div>

         <div className="lg:col-span-3 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
               <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
                  <div className="relative flex-1 group w-full">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                     <input type="text" placeholder="Search secure vault..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm italic font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-[9px] h-10 px-4 rounded-xl font-black uppercase tracking-widest text-slate-400 border-slate-100 bg-slate-50/50 hidden md:flex">Storage: 4.2 GB / 50 GB</Badge>
                  </div>
               </div>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left font-sans">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="px-8 py-5">Filename</th>
                              <th className="px-8 py-5">Status</th>
                              <th className="px-8 py-5">Modified</th>
                              <th className="px-8 py-5"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                           {filteredDocs.map((doc, i) => (
                             <tr 
                              key={i} 
                              onClick={() => setSelectedDoc(doc)}
                              className={cn(
                                "hover:bg-slate-50/50 transition-all group cursor-pointer active:bg-slate-100",
                                selectedDoc?.id === doc.id ? "bg-indigo-50/30" : ""
                              )}
                             >
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-500 group-hover:shadow-lg transition-all flex items-center justify-center shadow-sm">
                                         <FileBox size={20} />
                                      </div>
                                      <div>
                                         <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{doc.name}</p>
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.owner} • {doc.size}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <Badge className={cn("rounded-full border-none shadow-none text-[9px] font-black uppercase tracking-widest px-3 py-1",
                                     doc.status === 'Approved' ? "bg-emerald-50 text-emerald-600" : doc.status === 'Draft' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                                   )}>{doc.status}</Badge>
                                </td>
                                <td className="px-8 py-6 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">{doc.date}</td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex items-center gap-3 justify-end">
                                      <button className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-90"><Eye size={16} /></button>
                                      <button className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-90"><Download size={16} /></button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>

      {selectedDoc && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-100 z-50 animate-in slide-in-from-right duration-500 overflow-y-auto">
           <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">File Intelligence</h2>
                 <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                 <div className="w-full aspect-square bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300">
                    <FileText size={64} className="opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Preview Not Available</p>
                 </div>
                 <div className="space-y-1 text-center">
                    <h3 className="text-lg font-black text-slate-800 truncate px-4">{selectedDoc.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDoc.cat} Document</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <Button className="rounded-2xl h-12 bg-indigo-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20">Signature</Button>
                 <Button variant="outline" className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">Permission</Button>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit History</h4>
                    <History size={14} className="text-slate-300" />
                 </div>
                 <div className="space-y-6">
                    {[
                      { action: 'Document Signed', user: 'Bishop Mike', time: '1 hour ago' },
                      { action: 'New Version Uploaded', user: 'Sarah Jenkins', time: '2 days ago' },
                      { action: 'Initial Upload', user: 'System Alpha', time: '3 days ago' },
                    ].map((log, i) => (
                      <div key={i} className="flex gap-3 relative pl-4 border-l-2 border-slate-50">
                         <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                         <div>
                            <p className="text-xs font-bold text-slate-800">{log.action}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{log.user} • {log.time}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-50 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Trash2 size={20} />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">Delete Permanently</p>
                    <p className="text-[10px] text-slate-400 font-medium">Files in vault cannot be recovered.</p>
                 </div>
                 <ArrowRight className="text-slate-200" size={16} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
