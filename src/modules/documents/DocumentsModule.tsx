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
  X,
  Compass,
  FileCheck2,
  Sparkles,
  Layers,
  Settings,
  Heart,
  Sliders
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { listMembers, generateMemberIdentityDocument } from '../members/memberApi';

// --- Template Renderer Imports ---
import { 
  MembershipDeclarationTemplate, 
  BaptismCertificateTemplate, 
  VisitorDeclarationTemplate, 
  PDFActionBar 
} from './ComplianceDocuments';

type DocRow = {
  id: string | number;
  name: string;
  cat: string;
  owner: string;
  size: string;
  date: string;
  status: string;
  fileUrl?: string | null;
};

const DOCS: DocRow[] = [
  { id: 1, name: 'Member_Covenant_Benson_Jacob.pdf', cat: 'Member Files', owner: 'Clerk Office', size: '142 KB', date: 'Just now', status: 'Live' },
  { id: 2, name: 'Baptism_Certificate_Benson_Jacob.pdf', cat: 'Baptism Registry', owner: 'Pastor David Chen', size: '280 KB', date: 'Just now', status: 'Live' },
  { id: 3, name: 'Visitor_Intake_Benson_Jacob.pdf', cat: 'Member Files', owner: 'Host Team', size: '94 KB', date: 'Just now', status: 'Live' },
  { id: 4, name: 'Member_Trust_Agreement_2024.pdf', cat: 'Legal & Policy', owner: 'Sarah Jenkins', size: '2.4 MB', date: '2 days ago', status: 'Approved' },
  { id: 5, name: 'Annual_Audit_Report_2023.xlsx', cat: 'Financial Records', owner: 'James Wilson', size: '15.2 MB', date: 'Mar 12, 2024', status: 'Audit Ready' },
  { id: 6, name: 'Declaration_of_Indigenous_Rights.pdf', cat: 'Legal & Policy', owner: 'Legal Office', size: '3.1 MB', date: 'Feb 10, 2024', status: 'Certified' },
];

export function DocumentsModule() {
  const { settings } = useSettings();
  const [selectedDoc, setSelectedDoc] = React.useState<any>(null);
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [docs, setDocs] = React.useState<DocRow[]>(DOCS);
  const [docsError, setDocsError] = React.useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = React.useState<string | null>(null);

  // --- Compliance Document Workspace State ---
  const [activeTab, setActiveTab] = React.useState<'vault' | 'templates'>('vault');
  const [selectedTemplate, setSelectedTemplate] = React.useState<'membership' | 'baptism' | 'visitor'>('membership');
  const [activeDocPreviewMode, setActiveDocPreviewMode] = React.useState<'screen' | 'print' | 'pdf'>('screen');
  const [displaySettings, setDisplaySettings] = React.useState({
    showBorder: true,
    showSeal: true,
    showQR: true
  });

  const defaultFormValues = {
    memberName: 'Benson Jacob',
    pastorName: 'Pastor David Chen',
    date: 'May 18, 2026',
    churchName: 'Grace Community Trust',
    docRef: 'GCC-MEMB-2026-9402',
    witnessName: 'Elder John Sterling',
    churchAddress: '12/1, Residency Road, Richmond Town, Bangalore, Karnataka - 560025',
    baptismLocation: 'Richmond Town, Bangalore',
    candidateDob: 'August 14, 2002',
    fatherName: '—',
    motherName: '—',
    visitorEmail: 'visitor@grace.local',
    visitorPhone: '+91 98450 12345',
    prayerRequest: 'I am currently going through a career transition and would love prayer for peace, clarity, wisdom, and that my family is sustained through this next chapter.'
  };

  const [formValues, setFormValues] = React.useState(defaultFormValues);
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [pdfProgress, setPdfProgress] = React.useState(0);

  // --- Member selection state ---
  const [membersList, setMembersList] = React.useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>('');

  React.useEffect(() => {
    (async () => {
      try {
        const list = await listMembers();
        setMembersList(list);
        if (list.length > 0) {
          // Check if Benson Jacob is in the list
          const benson = list.find(m => m.name.toLowerCase().includes('benson'));
          const defaultMember = benson || list[0];
          setSelectedMemberId(defaultMember.id);
          setFormValues(prev => ({
            ...prev,
            memberName: defaultMember.name,
            visitorEmail: defaultMember.email || 'visitor@grace.local',
            visitorPhone: defaultMember.phone || '+91 98450 12345',
            candidateDob: defaultMember.dob ? new Date(defaultMember.dob).toISOString().split('T')[0] : '2002-08-14',
          }));
        }
      } catch (err) {
        console.error("Failed to load members for selector:", err);
      }
    })();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDocsError(null);
        const json = await apiRequest<unknown>('documents', { method: 'GET' });
        const list = parseApiResponse<
          { id: string; title: string; category?: string | null; createdAt: string; url: string }[]
        >(json);
        if (cancelled || !list.length) return;
        setDocs([
          ...DOCS.slice(0, 3), // Keep our newly generated compliance entries
          ...list.map((d) => ({
            id: d.id,
            name: d.title,
            cat: d.category || 'General',
            owner: '—',
            size: '—',
            date: new Date(d.createdAt).toLocaleDateString(),
            status: 'Live',
          }))
        ]);
      } catch (e) {
        if (!cancelled) setDocsError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDocs = activeCategory === 'All' 
    ? docs 
    : docs.filter(d => activeCategory.toLowerCase().includes(String(d.cat).toLowerCase()));

  // --- Print/PDF Trigger Handlers ---
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!selectedMemberId) {
      setUploadFeedback("Please select a member first.");
      return;
    }
    setIsExportingPDF(true);
    setPdfProgress(10);
    try {
      const templateMap: Record<string, string> = {
        membership: 'member_declaration',
        baptism: 'baptism_certificate',
        visitor: 'visitor_declaration',
      };
      
      setPdfProgress(30);
      
      const resDoc = await generateMemberIdentityDocument(
        selectedMemberId,
        templateMap[selectedTemplate] as any,
        {
          candidateDob: formValues.candidateDob,
          date: formValues.date,
          officiantName: formValues.pastorName,
          witnessName: formValues.witnessName,
          fatherName: formValues.fatherName,
          motherName: formValues.motherName,
          baptismDate: formValues.date, 
          baptismPlace: formValues.baptismLocation,
          visitorEmail: formValues.visitorEmail,
          visitorPhone: formValues.visitorPhone,
          prayerRequest: formValues.prayerRequest,
        }
      );

      setPdfProgress(70);

      const newDoc: DocRow = {
        id: resDoc.id,
        name: `${selectedTemplate.toUpperCase()}_Declaration_${formValues.memberName.replace(/\s+/g, '_')}.pdf`,
        cat: selectedTemplate === 'baptism' ? 'Baptism Registry' : 'Member Files',
        owner: formValues.pastorName,
        size: '142 KB',
        date: 'Just now',
        status: 'Live',
        fileUrl: resDoc.fileUrl,
      };

      setDocs((prev) => [newDoc, ...prev]);
      setPdfProgress(100);
      
      setTimeout(() => {
        setIsExportingPDF(false);
        setUploadFeedback(`Document exported successfully and backed up to Vault: ${newDoc.name}`);
        setSelectedDoc(newDoc);
        setActiveTab('vault');
      }, 500);

    } catch (err: any) {
      console.error("Failed to generate institutional PDF:", err);
      setUploadFeedback(`Generation failed: ${err.message || 'Server error'}`);
      setIsExportingPDF(false);
    }
  };

  const handleResetForm = () => {
    setFormValues(defaultFormValues);
  };

  // --- Render Compliance Document Template ---
  const renderSelectedDocument = () => {
    const props = {
      values: formValues,
      settings,
      displaySettings
    };

    switch (selectedTemplate) {
      case 'membership':
        return <MembershipDeclarationTemplate {...props} />;
      case 'baptism':
        return <BaptismCertificateTemplate {...props} />;
      case 'visitor':
        return <VisitorDeclarationTemplate {...props} />;
      default:
        return null;
    }
  };

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
                  const f = e.target.files[0];
                  const newDoc: DocRow = {
                    id: Date.now(),
                    name: f.name,
                    cat: 'Legal & Policy',
                    owner: 'Super Admin',
                    size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
                    date: 'Just now',
                    status: 'Live'
                  };
                  setDocs((prev) => [newDoc, ...prev]);
                  setUploadFeedback(`File uploaded successfully: ${f.name}`);
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
                        <option>Leadership & policies</option>
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
                  <h3 className="text-sm font-black uppercase tracking-widest">Privacy & records</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium text-left">Uploads are encrypted. Who views or downloads files is recorded in change history.</p>
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
      {/* Dynamic Global Printer Styling CSS Override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-document-area, #printable-document-area * {
            visibility: visible !important;
          }
          #printable-document-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

       {uploadFeedback && (
         <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-700 flex items-center justify-between animate-in slide-in-from-top-2 print:hidden">
           <span>✓ {uploadFeedback}</span>
           <button onClick={() => setUploadFeedback(null)} className="text-emerald-400 hover:text-emerald-600 font-black text-xs ml-2">✕</button>
         </div>
       )}

       {/* Top Navigation Tabs Bar */}
       <div className="flex items-center gap-3 border-b border-slate-100 pb-4 print:hidden">
        <button
          onClick={() => setActiveTab('vault')}
          className={cn(
            "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 leading-none",
            activeTab === 'vault' 
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          Secure Document Vault
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 leading-none",
            activeTab === 'templates' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" 
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <FileSignature size={14} />
          Church documents & printing
        </button>
       </div>

      {activeTab === 'vault' ? (
        // ==========================================
        // TAB 1: SECURE DOCUMENT VAULT (EXISTING)
        // ==========================================
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Secure Document Vault</h1>
              <p className="text-slate-500">Secure church records, policies, and printable member documents.</p>
              {docsError && <p className="text-sm text-rose-600 font-medium mt-1">{docsError}</p>}
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
                        { name: 'All Files', count: docs.length, icon: Folder },
                        { name: 'Baptism Registry', count: docs.filter(d => d.cat === 'Baptism Registry').length, icon: CheckCircle2 },
                        { name: 'Legal & Policy', count: docs.filter(d => d.cat === 'Legal & Policy').length, icon: Lock },
                        { name: 'Financial Records', count: docs.filter(d => d.cat === 'Financial Records').length, icon: FileText },
                        { name: 'Member Files', count: docs.filter(d => d.cat === 'Member Files').length, icon: Folder },
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
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (doc.fileUrl) {
                                                window.open(`${SERVER_ROOT}${doc.fileUrl}`, '_blank');
                                              } else {
                                                alert("No printable file URL available for this record.");
                                              }
                                            }}
                                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-90"
                                            title="View PDF"
                                          >
                                            <Eye size={16} />
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (doc.fileUrl) {
                                                const link = document.createElement('a');
                                                link.href = `${SERVER_ROOT}${doc.fileUrl}`;
                                                link.setAttribute('download', doc.name);
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              } else {
                                                alert("No printable file URL available for download.");
                                              }
                                            }}
                                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-90"
                                            title="Download PDF"
                                          >
                                            <Download size={16} />
                                          </button>
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
                     <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">File details</h2>
                     <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                  </div>

                  <div className="space-y-4">
                     {selectedDoc.fileUrl ? (
                       <iframe 
                         src={`${SERVER_ROOT}${selectedDoc.fileUrl}`} 
                         className="w-full aspect-[1/1.4] rounded-[2rem] border border-slate-100 shadow-md"
                         title="PDF Preview"
                       />
                     ) : (
                       <div className="w-full aspect-square bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300">
                          <FileText size={64} className="opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Preview Not Available</p>
                       </div>
                     )}
                     <div className="space-y-1 text-center">
                        <h3 className="text-lg font-black text-slate-800 truncate px-4">{selectedDoc.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDoc.cat} Document</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <Button 
                       onClick={() => {
                         if (selectedDoc.fileUrl) {
                           window.open(`${SERVER_ROOT}${selectedDoc.fileUrl}`, '_blank');
                         }
                       }}
                       disabled={!selectedDoc.fileUrl}
                       className="rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20"
                     >
                       Open PDF
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => {
                         if (selectedDoc.fileUrl) {
                           const link = document.createElement('a');
                           link.href = `${SERVER_ROOT}${selectedDoc.fileUrl}`;
                           link.setAttribute('download', selectedDoc.name);
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                         }
                       }}
                       disabled={!selectedDoc.fileUrl}
                       className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]"
                     >
                       Download
                     </Button>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change history</h4>
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
        </>
      ) : (
        // ==========================================
        // TAB 2: COMPLIANCE & TEMPLATE REGISTRY (NEW)
        // ==========================================
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Institutional Registry & Documents</h1>
              <p className="text-slate-500">Preview, generate, and print member-facing letters and certificates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Workspace Panel: Selector + Live Variable Forms */}
            <div className="lg:col-span-4 space-y-6 print:hidden">
              {/* Quick Template Switcher Cards */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden p-6 space-y-4 bg-white">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers size={12} />
                  Select Document Registry
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'membership', name: 'Membership Declaration', desc: 'Covenant of Faith & Bylaws Consent', icon: FileSignature, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                    { id: 'baptism', name: 'Baptism Certificate', desc: 'Certificate of Baptism with Registry Seal', icon: Compass, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                    { id: 'visitor', name: 'Visitor Intake Intake', desc: 'Consent form & Pastoral Connection', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-100' }
                  ].map((temp) => (
                    <button
                      key={temp.id}
                      onClick={() => {
                        setSelectedTemplate(temp.id as any);
                        // Adjust default document references based on type
                        setFormValues(prev => ({
                          ...prev,
                          docRef: temp.id === 'membership' ? 'GCC-MEMB-2026-9402' : temp.id === 'baptism' ? 'GCC-BAPT-2026-0814' : 'GCC-VSTR-2026-9410'
                        }));
                      }}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-2xl text-left border transition-all active:scale-98 group",
                        selectedTemplate === temp.id 
                          ? "bg-slate-50 border-slate-200 shadow-sm" 
                          : "border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                        selectedTemplate === temp.id ? temp.color : "bg-slate-100 text-slate-400 group-hover:text-slate-600"
                      )}>
                        <temp.icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{temp.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{temp.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Dynamic Live Variable Customization Form */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden p-6 space-y-6 bg-white">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders size={12} />
                    Live Variable Editor
                  </h3>
                  <Badge variant="ghost" className="text-[9px] font-black text-indigo-600 bg-indigo-50 border-none uppercase tracking-widest px-2 py-0.5 rounded-md">Reactive</Badge>
                </div>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-4">
                    {membersList.length > 0 && (
                      <div className="space-y-1.5 animate-in fade-in duration-300">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Link to Registered Member</label>
                        <select 
                          value={selectedMemberId}
                          onChange={(e) => {
                            const mId = e.target.value;
                            setSelectedMemberId(mId);
                            const m = membersList.find(x => x.id === mId);
                            if (m) {
                              setFormValues(prev => ({
                                ...prev,
                                memberName: m.name,
                                visitorEmail: m.email || 'visitor@grace.local',
                                visitorPhone: m.phone || '+91 98450 12345',
                                candidateDob: m.dob ? new Date(m.dob).toISOString().split('T')[0] : '2002-08-14',
                              }));
                            }
                          }}
                          className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm cursor-pointer"
                        >
                          {membersList.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.growthStage || 'Active'})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        {selectedTemplate === 'visitor' ? 'Visitor Full Name' : 'Candidate Name'}
                      </label>
                      <input 
                        type="text" 
                        value={formValues.memberName}
                        onChange={(e) => setFormValues({...formValues, memberName: e.target.value})}
                        className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Signing Pastor/Officiant</label>
                      <input 
                        type="text" 
                        value={formValues.pastorName}
                        onChange={(e) => setFormValues({...formValues, pastorName: e.target.value})}
                        className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Date of Affirmation</label>
                      <input 
                        type="text" 
                        value={formValues.date}
                        onChange={(e) => setFormValues({...formValues, date: e.target.value})}
                        className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Church Name</label>
                      <input 
                        type="text" 
                        value={formValues.churchName}
                        onChange={(e) => setFormValues({...formValues, churchName: e.target.value})}
                        className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Witness / Secretary Name</label>
                      <input 
                        type="text" 
                        value={formValues.witnessName}
                        onChange={(e) => setFormValues({...formValues, witnessName: e.target.value})}
                        className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Document Reference Number</label>
                      <input 
                        type="text" 
                        value={formValues.docRef}
                        onChange={(e) => setFormValues({...formValues, docRef: e.target.value})}
                        className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    {/* Baptism Specific Inputs */}
                    {selectedTemplate === 'baptism' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Baptism Sanctuary Location</label>
                          <input 
                            type="text" 
                            value={formValues.baptismLocation}
                            onChange={(e) => setFormValues({...formValues, baptismLocation: e.target.value})}
                            className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Candidate Date of Birth</label>
                          <input 
                            type="text" 
                            value={formValues.candidateDob}
                            onChange={(e) => setFormValues({...formValues, candidateDob: e.target.value})}
                            className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Father's Full Name</label>
                          <input 
                            type="text" 
                            value={formValues.fatherName}
                            onChange={(e) => setFormValues({...formValues, fatherName: e.target.value})}
                            className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Mother's Full Name</label>
                          <input 
                            type="text" 
                            value={formValues.motherName}
                            onChange={(e) => setFormValues({...formValues, motherName: e.target.value})}
                            className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    )}

                    {/* Visitor Specific Inputs */}
                    {selectedTemplate === 'visitor' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Visitor Email</label>
                          <input 
                            type="text" 
                            value={formValues.visitorEmail}
                            onChange={(e) => setFormValues({...formValues, visitorEmail: e.target.value})}
                            className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Visitor Contact Phone</label>
                          <input 
                            type="text" 
                            value={formValues.visitorPhone}
                            onChange={(e) => setFormValues({...formValues, visitorPhone: e.target.value})}
                            className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Prayer Intentions</label>
                          <textarea 
                            value={formValues.prayerRequest}
                            rows={3}
                            onChange={(e) => setFormValues({...formValues, prayerRequest: e.target.value})}
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Toggles & Options Panel */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden p-6 space-y-4 bg-white">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings size={12} />
                  Display Controls
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Show Decorative Borders</span>
                    <input 
                      type="checkbox" 
                      checked={displaySettings.showBorder}
                      onChange={(e) => setDisplaySettings({...displaySettings, showBorder: e.target.checked})}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-200"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Include Circular Wax Seal</span>
                    <input 
                      type="checkbox" 
                      checked={displaySettings.showSeal}
                      onChange={(e) => setDisplaySettings({...displaySettings, showSeal: e.target.checked})}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-200"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Enable Verification QR Code</span>
                    <input 
                      type="checkbox" 
                      checked={displaySettings.showQR}
                      onChange={(e) => setDisplaySettings({...displaySettings, showQR: e.target.checked})}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-200"
                    />
                  </label>
                </div>
              </Card>
            </div>

            {/* Right Workspace Panel: PDF Actions + Dynamic preview Frame */}
            <div className="lg:col-span-8 space-y-6">
              {/* PDF Action Command Bar */}
              <PDFActionBar 
                activeView={activeDocPreviewMode}
                onChangeView={setActiveDocPreviewMode}
                onPrint={handlePrint}
                onExportPDF={handleExportPDF}
                onReset={handleResetForm}
              />

              {/* simulated PDF Export Loader */}
              {isExportingPDF && (
                <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-1" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Generating PDF</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Preparing your church letter or certificate…</p>
                  </div>
                  <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-indigo-600 transition-all duration-150" style={{ width: `${pdfProgress}%` }} />
                  </div>
                </div>
              )}

              {/* The Live A4 Preview Frame */}
              <div 
                className={cn(
                  "relative w-full overflow-hidden transition-all duration-500",
                  activeDocPreviewMode === 'pdf' 
                    ? "bg-slate-800 rounded-3xl p-10 flex justify-center border border-slate-900 shadow-inner min-h-[800px]" 
                    : activeDocPreviewMode === 'print'
                    ? "bg-slate-100 border border-slate-200 p-8 flex justify-center rounded-3xl"
                    : "bg-white border border-slate-100 rounded-[3rem] shadow-2xl p-0"
                )}
              >
                {/* PDF Reader Overlay */}
                {activeDocPreviewMode === 'pdf' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700/50 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3 shadow-2xl select-none print:hidden">
                    <FileCheck2 size={13} className="text-emerald-400" />
                    <span>Document ready (1 page)</span>
                    <span className="text-slate-600">|</span>
                    <span>100% vector scale</span>
                  </div>
                )}

                <div 
                  id="printable-document-area"
                  className={cn(
                    "bg-white transition-all duration-500 origin-top text-left",
                    // Screen Preview Style
                    activeDocPreviewMode === 'screen' 
                      ? "w-full p-8 md:p-14"
                      : // Physical A4 Frame (Shadowed Paper)
                      "w-[210mm] min-h-[297mm] shadow-2xl p-[20mm] border border-slate-200/50 select-text print:p-0 print:border-none print:shadow-none print:w-full print:min-h-0"
                  )}
                >
                  {renderSelectedDocument()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
