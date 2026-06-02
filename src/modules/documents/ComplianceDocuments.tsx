import * as React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Eye, 
  Check, 
  RefreshCw, 
  QrCode, 
  ShieldCheck, 
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// REUSABLE DOCUMENT RENDERER COMPONENTS
// ==========================================

export function DocumentHeader({ 
  settings,
  title, 
  subtitle, 
  serialNumber,
  ledgerFolio = "GCC-FOLIO-2026/908",
}: { 
  settings: any;
  title: string; 
  subtitle?: string; 
  serialNumber?: string;
  ledgerFolio?: string;
}) {
  // Extract compliance metadata from settings with highly realistic Indian Trust/Society fallbacks
  const orgName = settings?.organization?.name || "Grace Community Trust";
  const address = settings?.organization?.address || "12/1, Residency Road, Richmond Town, Bangalore, Karnataka - 560025";
  const regNumber = settings?.organization?.registrationNumber || "Reg. No: 492/BK-IV/1994 (Registered under the Indian Trusts Act, 1882)";
  const phone = settings?.organization?.phone || "+91 80 4912 3000";
  const email = settings?.organization?.email || "office@gracecommunity.in";
  const logoUrl = settings?.organization?.logo;

  return (
    <div className="text-left pb-4 border-b-2 border-slate-900 mb-4 relative print:border-slate-950">
      {/* Top Registry & Society Compliance Ribbon */}
      <div className="grid grid-cols-2 gap-4 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-2 border-b border-slate-100 pb-1.5 print:border-slate-300">
        <div>
          <span className="block text-slate-800 font-bold">{regNumber}</span>
          <span className="block text-slate-400 mt-0.5">U/S 12A & 80G OF THE INCOME TAX ACT, 1961</span>
        </div>
        <div className="text-right">
          <span className="block text-slate-800 font-bold">Ledger Registry Ref: {ledgerFolio}</span>
          <span className="block text-slate-400 mt-0.5">Church records • India</span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-6 pt-1">
        <div className="space-y-1 max-w-xl">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950 font-serif leading-none">
            {orgName}
          </h1>
          <p className="text-[9px] font-bold text-slate-600 leading-normal uppercase tracking-wider">
            {address}
          </p>
          <div className="flex gap-4 text-[8px] font-medium text-slate-400 uppercase tracking-widest pt-0.5">
            <span>Tel: {phone}</span>
            <span>•</span>
            <span>Email: {email}</span>
          </div>
        </div>

        {/* Ink-Safe Professional Ministry Emblem */}
        {logoUrl ? (
          <img src={logoUrl} className="w-12 h-12 object-contain print:w-11 print:h-11" alt="Logo" />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-slate-950 flex items-center justify-center text-slate-950 bg-slate-50 print:bg-transparent">
            <Compass className="w-6 h-6 stroke-[1.5]" />
          </div>
        )}
      </div>

      <div className="mt-4 text-center border-t border-dashed border-slate-300 pt-3 print:border-slate-400">
        <h2 className="text-lg font-black uppercase tracking-widest text-slate-950 font-serif leading-none">{title}</h2>
        {subtitle && (
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-1">{subtitle}</p>
        )}
      </div>

      {serialNumber && (
        <div className="absolute top-14 right-0 text-right print:top-12">
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">Document ID</span>
          <span className="text-[9px] font-mono font-black text-slate-800 tracking-tight">{serialNumber}</span>
        </div>
      )}
    </div>
  );
}

export function SignatureSection({ 
  signatures 
}: { 
  signatures: { label: string; name: string; date?: string; title?: string }[] 
}) {
  return (
    <div className="grid grid-cols-3 gap-8 pt-6 mt-6 border-t border-slate-300 print:border-slate-400">
      {signatures.map((sig, i) => (
        <div key={i} className="text-center flex flex-col justify-between">
          <div className="w-full h-10 border-b border-slate-900 flex items-end justify-center pb-0.5 mb-1 relative print:border-slate-950">
            {sig.name && (
              <span className="font-serif italic text-sm text-slate-900 font-bold tracking-wide print:text-xs">
                {sig.name}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-950 block leading-none">{sig.label}</span>
            {sig.title && (
              <span className="text-[8px] font-bold text-slate-500 block tracking-wider uppercase leading-none mt-0.5">{sig.title}</span>
            )}
            {sig.date && (
              <span className="text-[7px] font-mono text-slate-400 block mt-0.5 leading-none">{sig.date}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CertificateSeal({ 
  churchName, 
  establishmentDate = 'EST. 1994' 
}: { 
  churchName: string; 
  establishmentDate?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center select-none print:scale-90">
      <div className="relative w-24 h-24 rounded-full border-2 border-slate-900 flex items-center justify-center p-1 bg-white print:bg-transparent">
        <div className="absolute inset-0.5 rounded-full border border-dashed border-slate-900/30" />
        <div className="text-center relative z-10 flex flex-col items-center justify-center p-0.5">
          <Compass className="w-5 h-5 text-slate-900 mb-0.5 stroke-[1.2]" />
          <span className="text-[5.5px] font-black uppercase tracking-[0.12em] text-slate-950 leading-none max-w-[60px] text-center font-serif">
            {churchName}
          </span>
          <div className="w-4 h-[0.5px] bg-slate-900/30 my-0.5" />
          <span className="text-[4.5px] font-black text-slate-700 uppercase tracking-widest leading-none">
            {establishmentDate}
          </span>
        </div>
      </div>
    </div>
  );
}

export function OfficeUseTable({ 
  fields 
}: { 
  fields: { label: string; val: string }[] 
}) {
  return (
    <div className="mt-6 border border-slate-900 rounded-lg overflow-hidden bg-slate-50/50 print:bg-transparent print:border-slate-950">
      <div className="bg-slate-900 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white print:bg-slate-900 print:text-white leading-none">
        For church office use only
      </div>
      <div className="grid grid-cols-4 divide-x divide-slate-900 text-left border-t border-slate-900">
        {fields.map((f, i) => (
          <div key={i} className="p-2 space-y-1">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">{f.label}</span>
            <span className="text-xs font-bold text-slate-800 leading-none font-mono block pt-0.5">{f.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrintFooter({ 
  settings,
  complianceText 
}: { 
  settings: any;
  complianceText?: string; 
}) {
  const orgName = settings?.organization?.name || "Grace Community Trust";
  const address = settings?.organization?.address || "Richmond Town, Bangalore, India";
  
  return (
    <div className="pt-4 mt-6 border-t border-slate-300 text-center space-y-1 print:border-slate-400 print:mt-4">
      <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-[0.1em]">
        OFFICIAL MINISTRY LEDGER RECORD • {orgName} • {address}
      </p>
      {complianceText && (
        <p className="text-[7.5px] font-semibold text-slate-400 leading-normal max-w-xl mx-auto">
          {complianceText}
        </p>
      )}
      <div className="pt-1 flex items-center justify-center gap-1 text-[7.5px] font-black text-slate-500 uppercase tracking-widest">
        <ShieldCheck className="w-2.5 h-2.5 text-slate-900" />
        <span>SECURE COMPLIANCE RECORD RETENTION PROTOCOL V2.0</span>
      </div>
    </div>
  );
}

export function PDFActionBar({ 
  onPrint, 
  onExportPDF, 
  onReset, 
  activeView, 
  onChangeView 
}: { 
  onPrint: () => void; 
  onExportPDF: () => void; 
  onReset: () => void; 
  activeView: 'screen' | 'print' | 'pdf';
  onChangeView: (view: 'screen' | 'print' | 'pdf') => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm w-full print:hidden">
      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100/50">
        {[
          { id: 'screen', label: 'Screen Preview', icon: Eye },
          { id: 'print', label: 'Print Layout', icon: Printer },
          { id: 'pdf', label: 'PDF View', icon: FileText }
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => onChangeView(view.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 leading-none",
              activeView === view.id
                ? "bg-white text-indigo-600 shadow-sm border border-slate-100/50"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <view.icon size={13} />
            {view.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 h-10 px-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <RefreshCw size={13} />
          Reset Form
        </button>
        <button
          onClick={onPrint}
          className="flex items-center gap-2 h-10 px-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all"
        >
          <Printer size={13} />
          Print
        </button>
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 h-10 px-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
        >
          <Download size={13} />
          Export PDF
        </button>
      </div>
    </div>
  );
}

// ==========================================
// DOCUMENT TEMPLATES (REUSABLE RENDERERS)
// ==========================================

export function MembershipDeclarationTemplate({ 
  values, 
  settings,
  displaySettings = {} 
}: { 
  values: Record<string, string>; 
  settings: any;
  displaySettings?: Record<string, boolean>;
}) {
  const statementOfFaith = [
    "Authority of Holy Scriptures: The Holy Bible is the inspired and final authority in all matters of Christian faith, morals, and practice.",
    "The Holy Trinity: Belief in one eternal God, existing co-equally and co-eternally in three Persons: Father, Son, and Holy Spirit.",
    "Redemption through Christ: Salvation is received solely by grace through personal faith in the life, death, and resurrection of Jesus Christ.",
    "Congregational Conduct: Committing to gather regularly for worship, supporting community services, and adhering to the guidelines of the society."
  ];

  const pastorName = settings?.documents?.authorizedSignatoryName || values.pastorName || "Pastor David Chen";
  const orgName = settings?.organization?.name || values.churchName || "Grace Community Trust";

  return (
    <div className="h-full flex flex-col justify-between p-8 bg-white relative font-sans print:p-0 select-text text-slate-900 leading-normal">
      {/* Restrained double line border representing legal certificate paper */}
      {displaySettings.showBorder && (
        <div className="absolute inset-2 border border-slate-900 pointer-events-none p-0.5 print:border-slate-950">
          <div className="absolute inset-0.5 border border-slate-900/10 pointer-events-none" />
        </div>
      )}

      <div className="relative z-10 space-y-4">
        <DocumentHeader 
          settings={settings}
          title="Voluntary Declaration of Association and Membership"
          subtitle="Declaration of Christian Faith, Congregational Association & Registry Enrollment"
          serialNumber={values.docRef || "GCC-MEMB-2026-9402"}
        />

        {/* DECLARANT REGISTRY PARTICULARS CARD */}
        <div className="border border-slate-900 rounded-lg overflow-hidden bg-slate-50/20 text-left text-[11px] font-sans print:bg-transparent print:border-slate-950">
          <div className="bg-slate-900 text-white font-mono uppercase tracking-[0.1em] text-[8px] px-3 py-1.5 print:bg-slate-900 print:text-white leading-none">
            Permanent Registry Particulars (Declarant Profile)
          </div>
          <div className="grid grid-cols-2 divide-y divide-x divide-slate-200 print:divide-slate-950 border-t border-slate-900">
            <div className="p-2 border-r border-slate-200 print:border-slate-950">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Declarant Full Name</span>
              <strong className="block text-slate-950 font-serif text-sm pt-1 leading-none">{values.memberName}</strong>
            </div>
            <div className="p-2">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Date of Birth (DOB)</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-none">{values.candidateDob || values.dob || "August 14, 2002"}</strong>
            </div>
            <div className="p-2 border-t border-slate-200 print:border-slate-950 border-r">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Father / Legal Guardian</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-none">{values.fatherName || "—"}</strong>
            </div>
            <div className="p-2 border-t border-slate-200 print:border-slate-950">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Mother's Full Name</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-none">{values.motherName || "—"}</strong>
            </div>
            <div className="p-2 col-span-2 border-t border-slate-200 print:border-slate-950">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Residential Address</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-normal text-[10px]">{values.churchAddress || "—"}</strong>
            </div>
            <div className="p-2 border-t border-slate-200 print:border-slate-950 border-r">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Contact Email Address</span>
              <strong className="block text-slate-800 font-mono text-[9px] pt-1 leading-none">{values.visitorEmail || "candidate@grace.local"}</strong>
            </div>
            <div className="p-2 border-t border-slate-200 print:border-slate-950">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Contact Mobile Number</span>
              <strong className="block text-slate-800 font-mono text-[9px] pt-1 leading-none">{values.visitorPhone || "+91 98450 12345"}</strong>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-[10.5px] font-medium leading-relaxed">
          {/* Doctrinal statement alignment */}
          <div className="space-y-1.5">
            <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-950 border-b border-slate-900 pb-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-900" />
              I. DECLARATION OF CHRISTIAN FAITH & BELIEFS
            </h3>
            <p className="text-[10px] leading-relaxed text-slate-700 text-justify">
              I, the above-named declarant, do hereby voluntarily declare my personal faith in the Lord Jesus Christ and my desire to be registered as an associate member of the Christian congregation under the administration of <strong className="text-slate-950">{orgName}</strong>. I declare my unreserved alignment with the following core tenets of faith:
            </p>
            <ul className="space-y-1 mt-1 pl-4 list-decimal text-[9.5px] text-slate-600 leading-normal text-justify">
              {statementOfFaith.map((item, i) => (
                <li key={i} className="pl-1"><strong className="text-slate-900">{item.split(":")[0]}:</strong>{item.split(":")[1]}</li>
              ))}
            </ul>
          </div>

          {/* Member Covenant commitment */}
          <div className="space-y-1.5">
            <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-950 border-b border-slate-900 pb-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-900" />
              II. CONGREGATIONAL COVENANT AND SOCIAL COMMITMENT
            </h3>
            <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
              I commit to support the spiritual mission, pastoral leadership, and community life of the congregation. I agree to maintain mutual respect, attend services regularly, contribute voluntarily to the charitable works of the trust, and serve the community faithfully.
            </p>
          </div>

          {/* CRITICAL ANTI-CONVERSION COMPLIANCE CLAUSE */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 print:bg-transparent print:p-0 print:border-none">
            <h3 className="text-[8.5px] font-black uppercase tracking-[0.15em] text-slate-950">III. VOLUNTARY DECLARATION OF CONSCIENCE & NOTARIAL RECORD</h3>
            <p className="text-[9.5px] text-slate-700 leading-relaxed italic text-justify">
              "I do hereby solemnly declare that I am executing this voluntary declaration of my own free will, conviction, and conscience, without any force, coercion, inducement, misrepresentation, or threat from any person or agency. I fully consent to the collection and secure preservation of my details in the permanent administrative register of the society."
            </p>
            <p className="text-[8.5px] text-slate-500 leading-normal border-t border-slate-200 pt-1.5 italic text-justify print:border-slate-300">
              <strong>सत्यनिष्ठ घोषणा:</strong> मैं सत्यनिष्ठा से घोषणा करता/करती हूँ कि मैं बिना किसी दबाव, लालच, अनुचित प्रभाव या जबरदस्ती के अपनी स्वतंत्र इच्छा और विवेक से इस मण्डली के साथ जुड़ाव स्थापित कर रहा/रही हूँ। मेरे व्यक्तिगत विवरण मण्डली के स्थायी रजिस्टर में सुरक्षित रखे जाएंगे।
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-4 mt-4">
        <SignatureSection 
          signatures={[
            { label: "Signature of Declarant", name: values.memberName, title: "Affiant Candidate", date: values.date },
            { label: "Attesting Board Trustee / Officer", name: values.witnessName || "Elder John Sterling", title: "Board of Trustees" },
            { label: "Pastoral Affirmation", name: pastorName, title: "Authorized Signatory", date: values.date }
          ]}
        />

        <OfficeUseTable 
          fields={[
            { label: "Enrolment ID", val: values.docRef || "GCC-MEMB-2026-9402" },
            { label: "Registry Enrolment Date", val: values.date },
            { label: "Verified Clerk ID", val: "GCC-CLK-9401" },
            { label: "Ledger Volume Ref", val: "VOL XXVI // NO 8094" }
          ]}
        />

        <PrintFooter 
          settings={settings}
          complianceText="Official Ministry Compliance Record. This instrument acts as a legal and religious covenant agreement for institutional recordkeeping and data audits. Confirms to Indian Trusts Act requirements for association records."
        />
      </div>
    </div>
  );
}

export function BaptismCertificateTemplate({ 
  values, 
  settings,
  displaySettings = {} 
}: { 
  values: Record<string, string>; 
  settings: any;
  displaySettings?: Record<string, boolean>;
}) {
  const pastorName = settings?.documents?.authorizedSignatoryName || values.pastorName || "Pastor David Chen";
  const orgName = settings?.organization?.name || values.churchName || "Grace Community Trust";

  return (
    <div className="h-full flex flex-col justify-between p-10 bg-white relative font-serif print:p-0 text-center select-text text-slate-900">
      {/* Restrained Elegant Single Frame */}
      {displaySettings.showBorder && (
        <div className="absolute inset-3 border-[1.5px] border-slate-900 rounded-xl pointer-events-none p-1 print:border-slate-950">
          <div className="absolute inset-0.5 border border-slate-900/5 pointer-events-none" />
        </div>
      )}

      {/* Liturgical Cross Emblem Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
        <Compass size={320} className="text-slate-950" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Registry Compliance Header */}
        <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-500 uppercase tracking-tight px-4 border-b border-slate-100 pb-1.5 print:border-slate-300">
          <span>Ministry Baptism Register Ledger</span>
          <span>Registry Index No: {values.docRef || "GCC-BAPT-2026-0814"}</span>
        </div>

        {/* Certificate Title Block */}
        <div className="space-y-1.5 pt-1.5">
          <span className="text-[9px] font-sans font-black uppercase tracking-[0.35em] text-slate-900 leading-none block">
            {orgName}
          </span>
          <h1 className="text-2xl font-serif font-bold text-slate-950 mt-1 leading-none uppercase tracking-wide">
            Certificate of Christian Baptism
          </h1>
        </div>

        {/* Scriptural Scripture Preamble */}
        <div className="space-y-3 max-w-xl mx-auto pt-1">
          <p className="text-[12px] text-slate-600 leading-relaxed font-serif italic print:text-[11px] px-6">
            "Therefore we are buried with him by baptism into death: that like as Christ was raised up from the dead by the glory of the Father, even so we also should walk in newness of life." — Romans 6:4
          </p>

          <p className="text-[8.5px] font-sans font-black uppercase tracking-[0.18em] text-slate-400 pt-2 leading-none">
            This is to certify and record that
          </p>

          <h2 className="text-2xl font-serif italic text-slate-950 font-bold border-b border-slate-200 pb-1 max-w-md mx-auto print:text-xl leading-none my-1">
            {values.memberName}
          </h2>

          {/* Official Registry Particulars: DOB and Parentage */}
          <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto py-2 px-3.5 border border-slate-200 rounded-lg bg-slate-50/30 text-left font-sans text-[9.5px] print:bg-transparent print:border-slate-950">
            <div>
              <span className="block text-[6.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Date of Birth</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-none">{values.candidateDob || values.dob || "—"}</strong>
            </div>
            <div className="border-l border-slate-200 print:border-slate-950 pl-2">
              <span className="block text-[6.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Father / Guardian</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-none">{values.fatherName || "—"}</strong>
            </div>
            <div className="border-l border-slate-200 print:border-slate-950 pl-2">
              <span className="block text-[6.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Mother's Name</span>
              <strong className="block text-slate-800 font-bold pt-1 leading-none">{values.motherName || "—"}</strong>
            </div>
          </div>

          <p className="text-[11px] font-sans font-medium text-slate-500 max-w-md mx-auto leading-relaxed pt-1">
            was received into Christ's visible Church through the Sacrament of Baptism, having publicly confessed faith in Jesus Christ as Lord and Savior, at
          </p>

          <h3 className="text-sm font-sans font-bold text-slate-950 max-w-md mx-auto border-b border-slate-100 pb-0.5 leading-tight">
            {values.baptismLocation || "Richmond Town, Bangalore"}
          </h3>

          <p className="text-[8.5px] font-sans font-black uppercase tracking-[0.18em] text-slate-400 leading-none">
            on the
          </p>

          <h4 className="text-base font-serif italic text-slate-800 font-bold max-w-xs mx-auto border-b border-slate-100 pb-0.5 leading-tight">
            {values.date}
          </h4>
        </div>
      </div>

      {/* Dynamic Cert Seals & Verification Area */}
      <div className="relative z-10 grid grid-cols-3 items-center gap-4 max-w-xl mx-auto pt-4">
        <div className="text-center flex flex-col items-center justify-end h-20">
          <div className="w-full border-b border-slate-900 pb-0.5 mb-1 print:border-slate-950">
            <span className="font-serif italic text-xs text-slate-900 font-bold leading-none block">{pastorName}</span>
          </div>
          <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-slate-400 leading-none">Officiating Pastor</span>
        </div>

        {displaySettings.showSeal ? (
          <CertificateSeal churchName={orgName} />
        ) : (
          <div className="h-20" />
        )}

        {displaySettings.showQR ? (
          <div className="flex flex-col items-center justify-center h-20">
            <div className="p-1 border border-slate-900 rounded bg-white print:bg-transparent print:border-slate-950">
              <QrCode size={32} className="text-slate-950" />
            </div>
            <span className="text-[6.5px] font-sans font-black uppercase tracking-wider text-slate-400 mt-1 leading-none">Registry QR Verify</span>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-end h-20">
            <div className="w-full border-b border-slate-900 pb-0.5 mb-1 print:border-slate-950">
              <span className="font-serif italic text-xs text-slate-900 font-bold leading-none block">{values.witnessName || "Elder David Sterling"}</span>
            </div>
            <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-slate-400 leading-none">Attesting Witness</span>
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-3 mt-4">
        <OfficeUseTable 
          fields={[
            { label: "Registry No.", val: values.docRef || "GCC-BAPT-2026-0814" },
            { label: "Volume & Page", val: "VOL IV // PG 42" },
            { label: "Registry Region Code", val: "GCC-REG-56" },
            { label: "Clerk Signature", val: "GCC-CLK-VERIFIED" }
          ]}
        />

        <PrintFooter 
          settings={settings}
          complianceText={`Baptism Record Registry Index ID #${values.docRef || "GCC-BAPT-2026-0814"}. Officially registered in the institutional baptism registers of the society.`}
        />
      </div>
    </div>
  );
}

export function VisitorDeclarationTemplate({ 
  values, 
  settings,
  displaySettings = {} 
}: { 
  values: Record<string, string>; 
  settings: any;
  displaySettings?: Record<string, boolean>;
}) {
  const orgName = settings?.organization?.name || values.churchName || "Grace Community Trust";
  const pastorName = settings?.documents?.authorizedSignatoryName || values.pastorName || "Pastor David Chen";

  return (
    <div className="h-full flex flex-col justify-between p-8 bg-white relative font-sans print:p-0 select-text text-slate-900">
      {/* Tighter border for office forms */}
      {displaySettings.showBorder && (
        <div className="absolute inset-2 border border-slate-900 pointer-events-none p-0.5 print:border-slate-950" />
      )}

      <div className="relative z-10 space-y-4">
        <DocumentHeader 
          settings={settings}
          title="Visitor Connection & Records Statement"
          subtitle="Visitor Connection & Pastoral Support Request Form"
          serialNumber={values.docRef || "GCC-VSTR-2026-9410"}
        />

        <div className="space-y-4 text-xs font-medium leading-relaxed">
          {/* Welcome benediction */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center space-y-1 print:border-none print:p-0 print:bg-transparent">
            <p className="text-[10px] text-slate-950 font-serif italic leading-relaxed">
              "We are honored to welcome you to our congregation today. Our prayer is that you experience warmth, peace, and spiritual encouragement during your visit. Please let us know how we can support you."
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-950 border-b border-slate-900 pb-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-900" />
              I. GUEST INFORMATION INTAKE
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Visitor Full Name</span>
                <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center text-xs font-bold text-slate-800 print:border-slate-950 print:bg-transparent">
                  {values.memberName}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Date of Visit</span>
                <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center text-xs font-bold text-slate-800 print:border-slate-950 print:bg-transparent">
                  {values.date}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Confidential Email</span>
                <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center text-xs font-bold text-slate-800 print:border-slate-950 print:bg-transparent">
                  {values.visitorEmail || "visitor@grace.local"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Contact Number</span>
                <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center text-xs font-bold text-slate-800 print:border-slate-950 print:bg-transparent">
                  {values.visitorPhone || "+91 98450 12345"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-950 border-b border-slate-900 pb-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-900" />
              II. PRAYER REQUESTS AND PASTORAL CARE REQUESTS
            </h3>
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">How Can Our Pastoral Staff Pray For & Serve You?</span>
              <div className="min-h-[60px] p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-[10px] font-medium text-slate-700 italic leading-relaxed print:border-slate-950 print:bg-transparent">
                {values.prayerRequest || "No specific requests noted."}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200 print:border-none print:p-0 print:bg-transparent">
            <h3 className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-950">III. VOLUNTARY CONNECTION & RECORDS CONSENT</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center mt-0.5 shrink-0">
                  <Check size={10} className="stroke-[3]" />
                </div>
                <p className="text-[10px] text-slate-700 flex-1 leading-relaxed">
                  <strong>Pastoral Connection:</strong> Yes, I request a contact or phone call from a pastoral or welcome team member this week.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center mt-0.5 shrink-0">
                  <Check size={10} className="stroke-[3]" />
                </div>
                <p className="text-[10px] text-slate-700 flex-1 leading-relaxed">
                  <strong>Consent for Records:</strong> I voluntarily consent to allow {orgName} to record my contact details in the secure visitor register for administrative coordination and pastoral updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-4 mt-4">
        <SignatureSection 
          signatures={[
            { label: "Signature of Guest", name: values.memberName, title: "Visitor Declarant", date: values.date },
            { label: "Assigned Connector", name: values.witnessName || "Sarah Jenkins", title: "Hospitality Lead" },
            { label: "Ministry Intake Host", name: pastorName, title: "Senior Minister", date: values.date }
          ]}
        />

        <OfficeUseTable 
          fields={[
            { label: "Intake Serial No", val: values.docRef || "GCC-VSTR-2026-9410" },
            { label: "Gathering Date", val: values.date },
            { label: "Connector Guide ID", val: "GCC-CON-9021" },
            { label: "Welcome Gift sent?", val: "DISPATCHED" }
          ]}
        />

        <PrintFooter 
          settings={settings}
          complianceText="Confidential Record. Ecclesial visitor records are kept exclusively for member connection pipelines and internal pastoral follow-ups. Strictly compliant with local data retention rules."
        />
      </div>
    </div>
  );
}
