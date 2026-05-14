import * as React from 'react';
import { 
  Globe, 
  Plus, 
  Save, 
  Trash2, 
  Layout, 
  Type, 
  Video, 
  Calendar, 
  Heart, 
  ArrowRight,
  Monitor,
  Smartphone,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MousePointer2,
  Layers,
  Palette,
  Check,
  PlusCircle,
  X,
  RefreshCw,
  Zap,
  Rocket,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  Edit3,
  ChevronRight,
  Settings,
  Copy,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { SharedEventListView, type PublicEventRow } from '@/lib/websiteSharedBlocks';
import { sortSectionsForDisplay, heroFieldFallbacksForBuilder, DEFAULT_PUBLIC_MISSION } from '@/lib/websiteDisplay';

// --- Types ---
type SectionType = 'hero' | 'text' | 'image' | 'sermon_list' | 'event_list' | 'giving_cta' | 'contact_form' | 'stats_bar' | 'ministry_grid' | 'leadership_grid' | 'testimonials' | 'giving_impact' | 'qr_payment';

interface PageSection {
  id: string;
  type: SectionType;
  config: any;
  isVisible?: boolean;
  order?: number;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string; 
  isPublished: boolean;
  updatedAt: string;
}

interface Sermon { id: string; title: string; speaker: string; date: string; }

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const TEMPLATES: TemplateSummary[] = [
  { id: 'classic', name: 'Classic Church', description: 'Timeless, elegant design for traditional worship.', icon: Layers, color: 'bg-slate-900' },
  { id: 'modern', name: 'Modern Worship', description: 'Vibrant and energetic for city-wide outreach.', icon: Sparkles, color: 'bg-indigo-600' },
  { id: 'youth', name: 'Youth Church', description: 'Bold and dynamic for the next generation.', icon: Zap, color: 'bg-rose-600' },
  { id: 'minimal', name: 'Minimal Church', description: 'Clean, typography-focused depth and focus.', icon: Palette, color: 'bg-emerald-600' }
];

// --- Design Layer & Theme ---
const THEME = {
  transition: "transition-all duration-500 ease-out",
  cardRadius: "rounded-[3rem]",
  inputRadius: "rounded-2xl",
  spacing: { section: "py-24 px-10", gap: "space-y-10" },
  font: { title: "font-black tracking-tight uppercase", body: "font-medium leading-relaxed text-slate-600" }
};

// --- Preview Components with Inline Editing ---

const EditableText = ({ value, onSave, className, multiline = false, dataTestId }: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(() => String(value ?? ''));

  React.useEffect(() => {
    if (!isEditing) setTempValue(String(value ?? ''));
  }, [value, isEditing]);

  if (isEditing) {
    return (
      <div className="relative z-50" data-testid={dataTestId}>
        {multiline ? (
          <textarea 
            autoFocus 
            className={cn("w-full bg-indigo-500/10 text-inherit border-2 border-indigo-500/50 p-2 rounded-xl outline-none backdrop-blur-sm transition-all focus:bg-white/10", className)}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => { setIsEditing(false); onSave(tempValue); }}
          />
        ) : (
          <input 
            autoFocus 
            className={cn("w-full bg-indigo-500/10 text-inherit border-2 border-indigo-500/50 px-3 py-1 rounded-lg outline-none backdrop-blur-sm transition-all focus:bg-white/10", className)}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => { setIsEditing(false); onSave(tempValue); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur())}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      data-testid={dataTestId}
      className={cn("relative group/edit cursor-text hover:outline hover:outline-2 hover:outline-indigo-500/50 hover:bg-white/5 p-1 rounded-lg transition-all", className)} 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
    >
      {String(value ?? '') || <span className="opacity-30">Click to edit...</span>}
      <div className="absolute -top-3 -right-3 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-indigo-500 text-white p-1 rounded-lg shadow-lg z-50">
         <Edit3 size={10} />
      </div>
    </div>
  );
};

const PreviewHero = ({ config, branding, onUpdateConfig, isSelected, onClick, pageSlug, organizationName }: any) => {
  const variant = config.variant || 'centered';
  const primaryColor = branding?.primaryColor ?? '#4F46E5';
  
  const titleVal = String(config.title ?? '').trim() || (pageSlug === 'home' ? `Welcome to ${organizationName}` : 'Join Us');
  const subVal = String(config.subtitle ?? '').trim() || (pageSlug === 'home' ? 'A community centered on faith, hope, and love.' : 'Experience grace and community.');
  const btnVal = String(config.buttonText ?? '').trim() || 'Plan Your Visit';

  const updateField = (field: string, val: string) => {
    onUpdateConfig({ ...config, [field]: val });
  };

  const content = (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
       <Badge className="bg-white/10 text-white backdrop-blur-md border-white/20 font-black uppercase tracking-[0.3em] text-[9px] px-5 py-2 rounded-xl mb-4">Experience Grace</Badge>
       <EditableText 
         dataTestId="website-hero-title"
         value={titleVal} 
         onSave={(v: string) => updateField('title', v)} 
         className={cn("text-6xl md:text-8xl leading-[0.9] tracking-tighter", THEME.font.title)} 
       />
       <EditableText 
         value={subVal} 
         onSave={(v: string) => updateField('subtitle', v)} 
         multiline
         className="text-xl md:text-2xl font-medium opacity-80 max-w-2xl mx-auto" 
       />
       <div className="pt-6 flex flex-wrap justify-center gap-6">
         <Button className="h-18 px-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform text-white border-none" style={{ backgroundColor: primaryColor }}>
           {btnVal}
         </Button>
         {config.serviceTimes && (
            <div className="h-18 flex items-center px-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
               {config.serviceTimes}
            </div>
         )}
       </div>
    </div>
  );

  if (variant === 'split') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative min-h-[750px] w-full flex flex-col md:flex-row items-stretch bg-slate-900 group cursor-pointer border-4 border-transparent",
          THEME.transition,
          isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
        )}
      >
        <div className="flex-1 flex flex-col justify-center p-20 md:p-32 space-y-10 text-left text-white bg-slate-900 z-20">
           <div className="max-w-xl space-y-8">
              <Badge className="bg-indigo-600 text-white border-none font-black uppercase tracking-[0.3em] text-[9px] px-5 py-2 rounded-xl w-fit">Join the Movement</Badge>
              <EditableText 
                value={titleVal} 
                onSave={(v: string) => updateField('title', v)} 
                className={cn("text-6xl md:text-8xl leading-[0.9] tracking-tighter", THEME.font.title)} 
              />
              <EditableText 
                value={subVal} 
                onSave={(v: string) => updateField('subtitle', v)} 
                multiline
                className="text-xl font-medium opacity-70 leading-relaxed" 
              />
              <div className="pt-6">
                 <Button className="h-18 px-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform text-white border-none" style={{ backgroundColor: primaryColor }}>
                    {btnVal}
                 </Button>
              </div>
           </div>
        </div>
        <div className="flex-1 relative bg-slate-800 overflow-hidden min-h-[400px]">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent z-10" />
           <div className="absolute inset-0 flex items-center justify-center text-white/5 uppercase font-black text-[15rem] tracking-tighter select-none rotate-[-10deg] whitespace-nowrap">KINGDOM</div>
        </div>
        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white p-3 rounded-2xl shadow-2xl z-30">
           <MousePointer2 size={20} />
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative min-h-[600px] w-full flex items-center justify-center text-center group cursor-pointer border-4 border-transparent overflow-hidden bg-slate-50",
          THEME.transition,
          isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
        )}
      >
        <div className="relative z-20 max-w-4xl px-10 space-y-12">
          <div className="w-24 h-1 bg-indigo-600 mx-auto" />
          <EditableText 
            value={titleVal} 
            onSave={(v: string) => updateField('title', v)} 
            className={cn("text-7xl md:text-9xl text-slate-950 leading-none tracking-tighter", THEME.font.title)} 
          />
          <EditableText 
            value={subVal} 
            onSave={(v: string) => updateField('subtitle', v)} 
            multiline
            className="text-2xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed" 
          />
          <div className="pt-6">
             <Button className="h-18 px-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-xl hover:scale-105 transition-transform text-white border-none" style={{ backgroundColor: primaryColor }}>
                {btnVal}
             </Button>
          </div>
        </div>
        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white p-3 rounded-2xl shadow-2xl">
           <MousePointer2 size={20} />
        </div>
      </div>
    );
  }

  // Default Centered
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative min-h-[800px] w-full overflow-hidden flex items-center justify-center text-center text-white bg-slate-900 group cursor-pointer border-4 border-transparent",
        THEME.transition,
        isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
      )}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 z-10" 
        style={{ opacity: config.overlayOpacity ?? 0.7 }} 
      />
      <div className="relative z-20 max-w-5xl px-10">
         {content}
      </div>
      <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white p-3 rounded-2xl shadow-2xl z-30">
         <MousePointer2 size={20} />
      </div>
    </div>
  );
};

const PreviewText = ({ config, onUpdateConfig, isSelected, onClick, pageSlug }: any) => {
  const updateField = (field: string, val: string) => {
    onUpdateConfig({ ...config, [field]: val });
  };
  const contentVal = String(config.content ?? '').trim() || (pageSlug === 'home' ? 'We are a Christ-centered community: worshipping together, caring for neighbors, and making room for every story.' : 'Experience a community dedicated to the authority of scripture and the warmth of family fellowship.');
  const titleVal = String(config.title ?? '').trim();

  return (
    <div 
      onClick={onClick}
      className={cn(
        "py-32 px-10 group cursor-pointer border-4 border-transparent relative bg-white",
        THEME.transition,
        isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
      )}
    >
      <div className={cn("max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000", config.alignment === 'center' ? "text-center" : "text-left")}>
         {titleVal !== '' && (
            <EditableText 
              value={titleVal} 
              onSave={(v: string) => updateField('title', v)} 
              className={cn("text-5xl md:text-7xl tracking-tighter leading-none", THEME.font.title)} 
            />
         )}
         <div className="w-20 h-1.5 bg-indigo-600 rounded-full mx-auto" />
         <EditableText 
            value={contentVal} 
            onSave={(v: string) => updateField('content', v)} 
            multiline
            className={cn("text-2xl md:text-3xl font-medium text-slate-600 leading-relaxed", THEME.font.body)} 
         />
      </div>
      <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white p-3 rounded-2xl shadow-xl">
         <MousePointer2 size={20} />
      </div>
    </div>
  );
};

const PreviewSermonList = ({ config, sermons, onClick, isSelected }: any) => (
  <div onClick={onClick} className={cn(
    THEME.spacing.section,
    "bg-slate-50 group cursor-pointer border-4 border-transparent relative",
    THEME.transition,
    isSelected && "border-indigo-500 bg-white shadow-2xl z-20 scale-[1.01]"
  )}>
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
             <h2 className={cn("text-4xl", THEME.font.title)}>{config.title || 'Latest Messages'}</h2>
             <p className="text-sm font-black uppercase tracking-widest text-slate-400">Stream or Download Weekly Teachings</p>
          </div>
          <Button variant="ghost" className="text-indigo-600 font-black uppercase text-[11px] tracking-widest hover:bg-indigo-50 h-12 px-6 rounded-xl group/btn">
             View Library <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {(sermons ?? []).slice(0, config.limit || 3).map((s: any) => (
             <Card key={s.id} className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white hover:translate-y-[-8px] transition-all duration-500 group/card">
                <div className="aspect-video bg-slate-200 flex items-center justify-center text-slate-400 relative overflow-hidden">
                   <div className="absolute inset-0 bg-slate-900/0 group-hover/card:bg-slate-900/20 transition-all duration-500" />
                   <Video size={50} strokeWidth={1} className="group-hover/card:scale-110 transition-transform duration-500" />
                </div>
                <CardContent className="p-12 space-y-5">
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{new Date(s.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                   <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover/card:text-indigo-600 transition-colors">{s.title}</h3>
                   <div className="flex items-center gap-3 pt-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{(s.speaker && s.speaker[0]) || '?'}</div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{s.speaker || 'Speaker'}</p>
                   </div>
                </CardContent>
             </Card>
          ))}
          {(!sermons || sermons.length === 0) && <div className="col-span-3 py-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] opacity-30 text-2xl">Awaiting Content</div>}
       </div>
    </div>
  </div>
);

const PreviewEventList = ({ config, events, onClick, isSelected }: any) => (
  <div
    onClick={onClick}
    className={cn(
      'group cursor-pointer relative rounded-[3rem]',
      THEME.transition,
      isSelected && 'ring-4 ring-indigo-500 bg-white shadow-2xl z-20 scale-[1.01]',
    )}
  >
    <SharedEventListView
      title={config.title || 'Upcoming Events'}
      events={events ?? []}
      limit={Math.min(50, Math.max(1, Number(config.limit) || 10))}
    />
  </div>
);

const PreviewGivingCta = ({ config, branding, onClick, isSelected }: any) => (
  <div
    onClick={onClick}
    className={cn(
      THEME.spacing.section,
      'max-w-5xl mx-auto text-center space-y-8 group cursor-pointer relative rounded-[3rem]',
      THEME.transition,
      isSelected && 'ring-4 ring-indigo-500 shadow-2xl z-20 scale-[1.01]',
    )}
  >
    <h2 className={cn('text-4xl', THEME.font.title)}>
      {String(config.title ?? '').trim() || 'Giving'}
    </h2>
    <p className="text-slate-600 font-medium max-w-xl mx-auto">
      {String(config.description ?? '').trim() ||
        'Your generosity fuels ministry and outreach in our community.'}
    </p>
    <Button
      className="h-14 px-10 rounded-2xl font-black uppercase text-[10px]"
      style={{ backgroundColor: branding?.primaryColor ?? '#4F46E5' }}
    >
      {String(config.buttonText ?? '').trim() || 'Give now'}
    </Button>
  </div>
);

const PreviewStatsBar = ({ config, onClick, isSelected }: any) => {
  const stats = config.stats || [
    { label: 'Weekly Attendance', value: '2,500+' },
    { label: 'Small Groups', value: '120+' },
    { label: 'Community Impact', value: '$45k+' }
  ];
  return (
    <div onClick={onClick} className={cn(
      "py-20 bg-slate-900 text-white group cursor-pointer border-4 border-transparent relative",
      THEME.transition,
      isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
    )}>
       <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          {stats.map((s: any, i: number) => (
             <div key={i} className="space-y-4 animate-in zoom-in duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                <h3 className="text-6xl font-black tracking-tighter text-indigo-400">{s.value}</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">{s.label}</p>
             </div>
          ))}
       </div>
    </div>
  );
};

const PreviewMinistryGrid = ({ config, onClick, isSelected, onUpdateConfig }: any) => {
  const ministries = config.ministries || [
    { title: 'Kids Ministry', desc: 'A safe, fun place for children to grow in faith.', icon: Sparkles },
    { title: 'Youth & Students', desc: 'Connecting the next generation to Christ.', icon: Zap },
    { title: 'Worship Arts', desc: 'Expressing devotion through music and art.', icon: Palette },
    { title: 'Global Outreach', desc: 'Spreading hope across the globe.', icon: Globe }
  ];
  return (
    <div onClick={onClick} className={cn(
      "py-32 bg-white group cursor-pointer border-4 border-transparent relative",
      THEME.transition,
      isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
    )}>
       <div className="max-w-7xl mx-auto px-10 space-y-16">
          <div className="text-center space-y-4">
             <EditableText 
               value={config.title || 'Our Ministries'} 
               onSave={(v: string) => onUpdateConfig({ ...config, title: v })}
               className={cn("text-4xl", THEME.font.title)} 
             />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Opportunities for everyone to connect</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {ministries.map((m: any, i: number) => (
                <Card key={i} className="border-none shadow-2xl rounded-[3rem] bg-slate-50 hover:bg-white hover:shadow-indigo-100 transition-all duration-500 group/card">
                   <CardContent className="p-10 space-y-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm mx-auto group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all">
                         <m.icon size={28} />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{m.title}</h3>
                         <p className="text-xs font-medium text-slate-500 leading-relaxed">{m.desc}</p>
                      </div>
                   </CardContent>
                </Card>
             ))}
          </div>
       </div>
    </div>
  );
};

const PreviewLeadershipGrid = ({ config, onClick, isSelected }: any) => {
  const staff = config.staff || [
    { name: 'Lead Pastors', role: 'David & Sarah Chen', bio: 'Passionate about building a community centered on grace.' },
    { name: 'Worship Director', role: 'Marcus Wright', bio: 'Leading our community in creative expression and devotion.' },
    { name: 'Kids Pastor', role: 'Jessica Miller', bio: 'Empowering families to raise the next generation in faith.' }
  ];
  return (
    <div onClick={onClick} className={cn(
      "py-32 bg-slate-50 group cursor-pointer border-4 border-transparent relative",
      THEME.transition,
      isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
    )}>
       <div className="max-w-7xl mx-auto px-10 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             <div className="space-y-2">
                <h2 className={cn("text-4xl", THEME.font.title)}>{config.title || 'Our Leadership'}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">The hearts behind the vision</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {staff.map((s: any, i: number) => (
                <div key={i} className="space-y-8 group/staff">
                   <div className="aspect-[4/5] rounded-[3.5rem] bg-slate-200 overflow-hidden shadow-2xl relative">
                      <div className="absolute inset-0 bg-indigo-600/0 group-hover/staff:bg-indigo-600/20 transition-all duration-700" />
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 opacity-20"><Palette size={100} /></div>
                   </div>
                   <div className="space-y-3 px-4">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{s.role}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{s.name}</p>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed pt-2">{s.bio}</p>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

const PreviewTestimonials = ({ config, onClick, isSelected }: any) => {
  const items = config.items || [
    { quote: "This community has changed my life. I've found a family here.", author: "Michael P." },
    { quote: "The preaching is practical, biblical, and truly inspiring.", author: "Sarah L." }
  ];
  return (
    <div onClick={onClick} className={cn(
      "py-32 bg-white group cursor-pointer border-4 border-transparent relative",
      THEME.transition,
      isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
    )}>
       <div className="max-w-4xl mx-auto px-10 text-center space-y-12">
          <Sparkles size={40} className="text-indigo-600 mx-auto opacity-40" />
          <div className="space-y-8 italic">
             {items.map((t: any, i: number) => (
                <div key={i} className="space-y-6">
                   <h3 className="text-3xl md:text-4xl font-medium text-slate-900 leading-relaxed">"{t.quote}"</h3>
                   <p className="text-xs font-black uppercase tracking-widest text-indigo-600">— {t.author}</p>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

const PreviewGivingImpact = ({ config, onClick, isSelected, branding, onUpdateConfig }: any) => {
  const campaigns = config.campaigns || [
    { title: 'Global Missions', progress: 75, target: '$50,000', current: '$37,500' },
    { title: 'Local Food Bank', progress: 40, target: '$10,000', current: '$4,000' }
  ];
  const primaryColor = branding?.primaryColor ?? '#4F46E5';
  return (
    <div onClick={onClick} className={cn(
      "py-32 bg-white group cursor-pointer border-4 border-transparent relative",
      THEME.transition,
      isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
    )}>
       <div className="max-w-7xl mx-auto px-10 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
             <EditableText 
               value={config.title || 'Giving Impact'} 
               onSave={(v: string) => onUpdateConfig({ ...config, title: v })}
               className={cn("text-4xl", THEME.font.title)} 
             />
             <p className="text-slate-500 font-medium">Your generosity is transforming lives both locally and globally. See the progress of our current initiatives.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {campaigns.map((c: any, i: number) => (
                <Card key={i} className="border-none shadow-2xl rounded-[3rem] bg-slate-50 overflow-hidden">
                   <CardContent className="p-12 space-y-8">
                      <div className="flex justify-between items-end">
                         <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{c.title}</h3>
                         <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{c.progress}% Funded</p>
                      </div>
                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${c.progress}%`, backgroundColor: primaryColor }} />
                      </div>
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                         <span>Raised: {c.current}</span>
                         <span>Goal: {c.target}</span>
                      </div>
                   </CardContent>
                </Card>
             ))}
          </div>
       </div>
    </div>
  );
};

const PreviewQRPayment = ({ config, onClick, isSelected, branding }: any) => {
  const primaryColor = branding?.primaryColor ?? '#4F46E5';
  return (
    <div onClick={onClick} className={cn(
      "py-24 bg-slate-50 group cursor-pointer border-4 border-transparent relative rounded-[4rem] mx-10 mb-10",
      THEME.transition,
      isSelected && "border-indigo-500 shadow-2xl z-20 scale-[1.01]"
    )}>
       <div className="max-w-5xl mx-auto px-10 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
             <Badge className="bg-indigo-600 text-white font-black uppercase tracking-widest px-4 py-1 rounded-xl border-none">Frictionless Giving</Badge>
             <h2 className={cn("text-4xl text-slate-900", THEME.font.title)}>{config.title || 'Give Instantly via QR'}</h2>
             <p className="text-slate-500 font-medium leading-relaxed">Scan the QR code with your banking or payment app to donate directly to the {config.fundName || 'General Fund'}. It's secure, fast, and tax-deductible.</p>
             <div className="flex flex-wrap gap-4 pt-4">
                {['Stripe', 'PayPal', 'GPay', 'Razorpay'].map(p => (
                   <div key={p} className="px-4 py-2 bg-white rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">{p}</div>
                ))}
             </div>
          </div>
          <div className="w-72 h-72 bg-white rounded-[3rem] p-10 shadow-2xl relative group/qr overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover/qr:opacity-100 transition-opacity" />
             <div className="w-full h-full border-4 border-slate-900 rounded-2xl relative flex items-center justify-center">
                <Zap size={60} className="text-slate-900 opacity-20 animate-pulse" />
                <div className="absolute top-2 left-2 w-4 h-4 bg-slate-900" />
                <div className="absolute top-2 right-2 w-4 h-4 bg-slate-900" />
                <div className="absolute bottom-2 left-2 w-4 h-4 bg-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg"><Heart size={20} className="text-rose-500" /></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const SectionWrapper = ({ children, isSelected, onSelect, onMove, onRemove, onAddAfter }: any) => {
  return (
    <div className="relative group/section">
      <div 
        onClick={onSelect}
        className={cn(
          "relative transition-all duration-300",
          isSelected && "ring-2 ring-indigo-500 z-20 shadow-2xl scale-[1.002]"
        )}
      >
        {/* Floating Contextual Toolbar */}
        {!isSelected && (
          <div className="absolute inset-0 bg-indigo-500/0 group-hover/section:bg-indigo-500/5 transition-all pointer-events-none z-10 border-2 border-transparent group-hover/section:border-indigo-500/20" />
        )}
        
        <div className={cn(
          "absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-all z-[60] bg-white shadow-2xl rounded-xl p-1 border border-slate-100 scale-90 group-hover/section:scale-100",
          isSelected && "opacity-100 border-indigo-500 ring-2 ring-indigo-100"
        )}>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); onMove('up'); }}><ChevronUp size={14} /></Button>
           <div className="w-px h-4 bg-slate-100 mx-1" />
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); onMove('down'); }}><ChevronDown size={14} /></Button>
           <div className="w-px h-4 bg-slate-100 mx-1" />
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); onRemove(); }}><Trash2 size={14} /></Button>
           {isSelected && (
             <>
                <div className="w-px h-4 bg-slate-100 mx-1" />
                <div className="px-3 py-1 bg-indigo-600 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">Editing</div>
             </>
           )}
        </div>

        {children}
      </div>

      {/* Modern Add Section Divider */}
      <div className="flex flex-col items-center justify-center group/add relative z-40 h-8">
         <div className="w-full h-px bg-slate-100 group-hover/add:bg-indigo-200 transition-colors" />
         <button 
           onClick={(e) => { e.stopPropagation(); onAddAfter(); }}
           className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/add:opacity-100 transition-all scale-75 group-hover/add:scale-100"
         >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
               <Plus size={16} strokeWidth={3} />
            </div>
         </button>
      </div>
    </div>
  );
};

const TemplateSelection = ({ onSelect, isApplying }: { onSelect: (id: string) => void; isApplying: boolean }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-50 space-y-20 animate-in fade-in zoom-in-95 duration-1000">
    <div className="text-center space-y-6 max-w-3xl">
       <Badge className="bg-indigo-600 text-white font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border-none">Initialization Engine</Badge>
       <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tight leading-none">Launch in 1 Click</h1>
       <p className="text-xl text-slate-500 font-medium leading-relaxed">Choose a template and we'll automatically sync your church name, logo, and contact info to create your site instantly.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full max-w-7xl">
       {TEMPLATES.map((t) => (
         <Card 
           key={t.id} 
           className="group border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white hover:translate-y-[-12px] active:scale-[0.98] transition-all duration-700 cursor-pointer"
           onClick={() => onSelect(t.id)}
         >
            <div className={cn("h-56 flex items-center justify-center text-white relative", t.color)}>
               <t.icon size={70} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <CardContent className="p-12 space-y-6">
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{t.description}</p>
               </div>
               <div className="pt-4">
                  <Button className="w-full h-14 rounded-2xl bg-slate-950 font-black uppercase text-[10px] tracking-[0.3em] group-hover:bg-indigo-600 transition-colors shadow-xl">
                     {isApplying ? <RefreshCw className="animate-spin" /> : 'Launch Website'} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </div>
            </CardContent>
         </Card>
       ))}
    </div>
  </div>
);

// --- Success Overlay ---

const SectionSettings = ({ section, onUpdate, sermons, events }: any) => {
  if (!section) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
       <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Settings size={18} />
             </div>
             <div>
                <h4 className="text-sm font-black uppercase tracking-tight leading-none">{section.type.replace('_', ' ')} Settings</h4>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Configure layout & display</p>
             </div>
          </div>
       </div>

       <div className="space-y-6">
          {section.type === 'hero' && (
             <>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Layout Variant</Label>
                   <select 
                     value={section.config.variant || 'centered'} 
                     onChange={(e) => onUpdate({ ...section.config, variant: e.target.value })}
                     className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-xs appearance-none"
                   >
                      <option value="centered">Centered</option>
                      <option value="split">Split Layout</option>
                      <option value="minimal">Minimalist</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overlay Opacity ({Math.round((section.config.overlayOpacity ?? 0.7) * 100)}%)</Label>
                   <input 
                     type="range" min="0" max="1" step="0.1" 
                     value={section.config.overlayOpacity ?? 0.7}
                     onChange={(e) => onUpdate({ ...section.config, overlayOpacity: parseFloat(e.target.value) })}
                     className="w-full"
                   />
                </div>
             </>
          )}

          {section.type === 'text' && (
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Text Alignment</Label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                   {['left', 'center'].map(align => (
                      <Button 
                        key={align}
                        variant={section.config.alignment === align || (!section.config.alignment && align === 'center') ? 'secondary' : 'ghost'}
                        className="flex-1 h-10 rounded-lg font-black uppercase text-[9px] tracking-widest"
                        onClick={() => onUpdate({ ...section.config, alignment: align })}
                      >
                         {align}
                      </Button>
                   ))}
                </div>
             </div>
          )}

          {(['sermon_list', 'event_list'].includes(section.type)) && (
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Display Limit</Label>
                <Input 
                  type="number" 
                  value={section.config.limit || 3}
                  onChange={(e) => onUpdate({ ...section.config, limit: parseInt(e.target.value) })}
                  className="h-12 rounded-xl border-slate-100 font-bold"
                />
             </div>
          )}

          {section.type === 'stats_bar' && (
            <div className="space-y-6">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Statistics</Label>
               {(section.config.stats || []).map((s: any, i: number) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-4">
                    <Input 
                      placeholder="Value (e.g. 2,500+)" 
                      value={s.value} 
                      onChange={(e) => {
                        const newStats = [...(section.config.stats || [])];
                        newStats[i] = { ...s, value: e.target.value };
                        onUpdate({ ...section.config, stats: newStats });
                      }}
                      className="h-10 rounded-lg border-none font-bold text-indigo-600"
                    />
                    <Input 
                      placeholder="Label (e.g. Attendance)" 
                      value={s.label} 
                      onChange={(e) => {
                        const newStats = [...(section.config.stats || [])];
                        newStats[i] = { ...s, label: e.target.value };
                        onUpdate({ ...section.config, stats: newStats });
                      }}
                      className="h-10 rounded-lg border-none text-[10px] font-black uppercase tracking-widest"
                    />
                 </div>
               ))}
               <Button 
                 variant="outline" 
                 className="w-full h-12 rounded-xl border-dashed border-slate-200"
                 onClick={() => onUpdate({ ...section.config, stats: [...(section.config.stats || []), { label: 'New Stat', value: '0' }] })}
               >
                 <Plus size={14} className="mr-2" /> Add Stat
               </Button>
            </div>
          )}

          {section.type === 'giving_impact' && (
            <div className="space-y-6">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Campaigns</Label>
               {(section.config.campaigns || []).map((c: any, i: number) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-4 text-xs font-bold">
                    <div className="space-y-1">
                       <Label className="text-[8px] uppercase opacity-50">Campaign Title</Label>
                       <Input value={c.title} onChange={(e) => {
                          const newC = [...section.config.campaigns];
                          newC[i] = { ...c, title: e.target.value };
                          onUpdate({ ...section.config, campaigns: newC });
                       }} className="h-10 border-none bg-white rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <Label className="text-[8px] uppercase opacity-50">Target Amount</Label>
                          <Input value={c.target} onChange={(e) => {
                             const newC = [...section.config.campaigns];
                             newC[i] = { ...c, target: e.target.value };
                             onUpdate({ ...section.config, campaigns: newC });
                          }} className="h-10 border-none bg-white rounded-lg" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[8px] uppercase opacity-50">Current Amount</Label>
                          <Input value={c.current} onChange={(e) => {
                             const newC = [...section.config.campaigns];
                             newC[i] = { ...c, current: e.target.value };
                             const targetVal = parseFloat(c.target.replace(/[^0-9.]/g, '')) || 1;
                             const currentVal = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                             newC[i].progress = Math.min(100, Math.round((currentVal / targetVal) * 100));
                             onUpdate({ ...section.config, campaigns: newC });
                          }} className="h-10 border-none bg-white rounded-lg" />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {section.type === 'qr_payment' && (
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">QR Configuration</Label>
               <div className="space-y-2">
                  <Label className="text-[8px] font-black uppercase opacity-40">Fund Selection</Label>
                  <select 
                    value={section.config.fundName || 'General Fund'} 
                    onChange={(e) => onUpdate({ ...section.config, fundName: e.target.value })}
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-xs appearance-none"
                  >
                     <option value="General Fund">General Fund</option>
                     <option value="Building Fund">Building Fund</option>
                     <option value="Missions">Missions & Outreach</option>
                     <option value="Youth Ministry">Youth Ministry</option>
                  </select>
               </div>
            </div>
          )}
          {section.type === 'ministry_grid' && (
            <div className="space-y-6">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ministry Grid</Label>
               {(section.config.ministries || []).map((m: any, i: number) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-4">
                    <Input value={m.title} onChange={(e) => {
                       const newM = [...(section.config.ministries || [])];
                       newM[i] = { ...m, title: e.target.value };
                       onUpdate({ ...section.config, ministries: newM });
                    }} className="h-10 border-none bg-white rounded-lg font-bold" placeholder="Ministry Title" />
                    <textarea value={m.desc} onChange={(e) => {
                       const newM = [...(section.config.ministries || [])];
                       newM[i] = { ...m, desc: e.target.value };
                       onUpdate({ ...section.config, ministries: newM });
                    }} className="w-full min-h-[60px] p-3 rounded-lg border-none bg-white text-xs font-medium" placeholder="Description" />
                 </div>
               ))}
               <Button 
                 variant="outline" 
                 className="w-full h-12 rounded-xl border-dashed border-slate-200"
                 onClick={() => onUpdate({ ...section.config, ministries: [...(section.config.ministries || []), { title: 'New Ministry', desc: 'Add a description', icon: Globe }] })}
               >
                 <Plus size={14} className="mr-2" /> Add Ministry
               </Button>
            </div>
          )}

          {section.type === 'leadership_grid' && (
            <div className="space-y-6">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Leadership Team</Label>
               {(section.config.staff || []).map((s: any, i: number) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-4">
                    <Input value={s.role} onChange={(e) => {
                       const newS = [...(section.config.staff || [])];
                       newS[i] = { ...s, role: e.target.value };
                       onUpdate({ ...section.config, staff: newS });
                    }} className="h-10 border-none bg-white rounded-lg font-bold" placeholder="Role (e.g. Lead Pastor)" />
                    <Input value={s.name} onChange={(e) => {
                       const newS = [...(section.config.staff || [])];
                       newS[i] = { ...s, name: e.target.value };
                       onUpdate({ ...section.config, staff: newS });
                    }} className="h-10 border-none bg-white rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600" placeholder="Full Name" />
                 </div>
               ))}
               <Button 
                 variant="outline" 
                 className="w-full h-12 rounded-xl border-dashed border-slate-200"
                 onClick={() => onUpdate({ ...section.config, staff: [...(section.config.staff || []), { name: 'Staff Name', role: 'Role Title', bio: 'Short bio' }] })}
               >
                 <Plus size={14} className="mr-2" /> Add Leader
               </Button>
            </div>
          )}
        </div>
     </div>
  );
};

const SuccessOverlay = ({ onDismiss, onViewLive }: { onDismiss: () => void; onViewLive?: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-500">
     <div className="bg-white rounded-[4rem] p-16 text-center space-y-10 shadow-2xl max-w-md animate-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
           <CheckCircle2 size={48} />
        </div>
        <div className="space-y-3">
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Flagship Site Ready</h2>
           <p className="text-slate-500 font-medium text-sm leading-relaxed px-6">Your comprehensive church website has been generated with all operational data synced. Every section is ready for visual customization.</p>
        </div>
        <div className="flex flex-col gap-4">
           <Button
             type="button"
             className="h-14 bg-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
             onClick={() => onViewLive?.()}
           >
             View Live Site <ExternalLink className="ml-2 w-4 h-4" />
           </Button>
           <Button variant="ghost" onClick={onDismiss} className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Return to Editor</Button>
        </div>
     </div>
  </div>
);

// --- Main Module ---

export function WebsiteModule() {
  const { settings } = useSettings();
  const orgName = settings?.organization?.name?.trim() || 'Church';
  const primaryColor = settings?.branding?.primaryColor ?? '#4F46E5';

  const [pages, setPages] = React.useState<PageData[]>([]);
  const [activePage, setActivePage] = React.useState<PageData | null>(null);
  const [sections, setSections] = React.useState<PageSection[]>([]);
  const [sermons, setSermons] = React.useState<Sermon[]>([]);
  const [publicEvents, setPublicEvents] = React.useState<PublicEventRow[]>([]);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [activeView, setActiveView] = React.useState<string>('dashboard');
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = React.useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(true);
  const [leftTab, setLeftTab] = React.useState<'pages' | 'layers' | 'ops'>('pages');
  const [isEditingPageSettings, setIsEditingPageSettings] = React.useState(false);
  const [showSiteMap, setShowSiteMap] = React.useState(false);
  const [pageSettingsData, setPageSettingsData] = React.useState({ title: '', slug: '' });

  // Track changes to sections to manage isDirty
  const initialSectionsRef = React.useRef<string>('[]');
  
  React.useEffect(() => {
    if (!loading && activePage) {
      const currentJson = JSON.stringify(sections);
      if (currentJson !== initialSectionsRef.current) {
        setIsDirty(true);
      } else {
        setIsDirty(false);
      }
    }
  }, [sections, loading, activePage]);
  
  const parseSectionsJson = (raw: string | null | undefined): PageSection[] => {
    if (raw == null || raw === '') return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed as PageSection[];
    } catch {
      return [];
    }
  };

  const loadAllData = React.useCallback(async (slug?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const pRes = await apiRequest<unknown>('website/pages');
      const pList = parseApiResponse<PageData[]>(pRes);
      setPages(pList);

      try {
        const sRes = await apiRequest<unknown>('website/sermons');
        setSermons(parseApiResponse<Sermon[]>(sRes));
      } catch {
        setSermons([]);
      }

      try {
        const eRes = await apiRequest<unknown>('website/events?limit=30');
        setPublicEvents(parseApiResponse<PublicEventRow[]>(eRes));
      } catch {
        setPublicEvents([]);
      }

      if (pList.length > 0) {
        const target = (slug ? pList.find((p) => p.slug === slug) : null) ?? pList[0];
        setActivePage(target);
        const sData = parseSectionsJson(target.content);
        setSections(sData);
        initialSectionsRef.current = JSON.stringify(sData);
        setIsDirty(false);
      } else {
        setActivePage(null);
        setSections([]);
        initialSectionsRef.current = '[]';
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Failed to load website data', error);
      setLoadError(formatApiError(error));
      setPages([]);
      setActivePage(null);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleApplyTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      
      // We rely on the backend to apply the template atomically
      await apiRequest('website/templates/apply', {
        method: 'POST',
        body: { templateId }
      });

      await loadAllData('home');
      setShowSuccess(true);
    } catch (err) {
      console.error('Apply template failed', err);
      setLoadError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!activePage) return;
    setIsSaving(true);
    try {
      await apiRequest(`website/pages/${encodeURIComponent(activePage.slug)}`, {
        method: 'PATCH',
        body: { content: JSON.stringify(sections) },
      });
      initialSectionsRef.current = JSON.stringify(sections);
      setIsDirty(false);
      // Optional: Refresh local pages list to update updatedAt
      const pRes = await apiRequest<unknown>('website/pages');
      setPages(parseApiResponse<PageData[]>(pRes));
    } catch (error) {
      console.error('Save failed', error);
      setLoadError(formatApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!activePage) return;
    try {
      const newStatus = !activePage.isPublished;
      await apiRequest(`website/pages/${encodeURIComponent(activePage.slug)}/publish`, {
        method: 'POST',
        body: { isPublished: newStatus },
      });
      await loadAllData(activePage.slug);
      if (newStatus) setShowSuccess(true);
    } catch (error) {
      console.error('Publish failed', error);
      setLoadError(formatApiError(error));
    }
  };

  const [isCreatingPage, setIsCreatingPage] = React.useState(false);
  const [newPageData, setNewPageData] = React.useState({ title: '', slug: '' });

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageData.title || !newPageData.slug) return;
    try {
      setLoading(true);
      await apiRequest('website/pages', {
        method: 'POST',
        body: { 
          title: newPageData.title, 
          slug: newPageData.slug, 
          isPublished: false,
          content: JSON.stringify([{ id: `hero-${Date.now()}`, type: 'hero', config: { title: newPageData.title, variant: 'centered' } }]) 
        }
      });
      const createdSlug = newPageData.slug;
      setIsCreatingPage(false);
      setNewPageData({ title: '', slug: '' });
      await loadAllData(createdSlug);
    } catch (err) {
      setLoadError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAll = async () => {
    if (!window.confirm('Publish all pages? This will make the entire site live.')) return;
    try {
      setLoading(true);
      const pagesToPublish = pages.filter(p => !p.isPublished);
      for (const p of pagesToPublish) {
        await apiRequest(`website/pages/${encodeURIComponent(p.slug)}/publish`, {
          method: 'POST',
          body: { isPublished: true },
        });
      }
      await loadAllData(activePage?.slug);
      setShowSuccess(true);
    } catch (error) {
      console.error('Publish all failed', error);
      setLoadError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePage = async (slug: string, data: { title?: string; newSlug?: string; isPublished?: boolean }) => {
    try {
      setLoading(true);
      await apiRequest(`website/pages/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        body: {
          title: data.title,
          slug: data.newSlug,
          isPublished: data.isPublished
        }
      });
      await loadAllData(data.newSlug || slug);
    } catch (err) {
      setLoadError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateSectionConfig = (id: string, config: any) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, config } : s)));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const removeSection = (id: string) => {
    if (!confirm('Are you sure you want to remove this section?')) return;
    setSections(sections.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const [addingAfterId, setAddingAfterId] = React.useState<string | null>(null);

  const addSection = (type: SectionType, afterId?: string) => {
    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type,
      config: {},
      isVisible: true,
      order: (sections.length > 0 ? Math.max(...sections.map(s => s.order ?? 0)) : 0) + 1
    };

    if (!afterId) {
      setSections([...sections, newSection]);
    } else {
      const index = sections.findIndex(s => s.id === afterId);
      const newSections = [...sections];
      newSections.splice(index + 1, 0, newSection);
      setSections(newSections);
    }
    setSelectedSectionId(newSection.id);
    setAddingAfterId(null);
  };

  const handleDuplicatePage = async (page: PageData) => {
    try {
      setLoading(true);
      const newTitle = `${page.title} (Copy)`;
      const newSlug = `${page.slug}-copy-${Date.now()}`;
      await apiRequest('website/pages', {
        method: 'POST',
        body: { 
          title: newTitle, 
          slug: newSlug, 
          content: page.content,
          isPublished: false 
        }
      });
      await loadAllData(newSlug);
    } catch (err) {
      setLoadError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete the page "${slug}"? This action cannot be undone.`)) return;
    try {
      setLoading(true);
      await apiRequest(`website/pages/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      await loadAllData();
    } catch (e) {
      setLoadError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const resetToFlagship = async () => {
    if (!confirm('This will DELETE ALL PAGES and reset to the flagship template. Continue?')) return;
    try {
      setLoading(true);
      // 1. Wipe all pages via backend
      await apiRequest('website/pages', { method: 'DELETE' });
      // 2. Apply template
      await handleApplyTemplate('flagship-1');
    } catch (e) {
      console.error('Reset failed', e);
      setLoadError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600" />
      </div>
    );
  }

  if (loadError && pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-50 space-y-6">
        <p className="text-slate-600 font-medium text-center max-w-md">{loadError}</p>
        <Button onClick={() => loadAllData()} className="rounded-2xl font-black uppercase text-[10px] tracking-widest">
          Retry
        </Button>
      </div>
    );
  }

  if (pages.length === 0) {
    return <TemplateSelection onSelect={handleApplyTemplate} isApplying={isApplyingTemplate} />;
  }

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden relative">
      <div className={cn(
        "w-72 bg-slate-900 text-white flex flex-col shrink-0 z-50 rounded-r-[3rem] my-4 ml-4 shadow-2xl transition-all duration-700", 
        (isPreviewMode || activeView === 'pages') && "w-0 opacity-0 pointer-events-none ml-0"
      )}>
         <div className="h-28 flex items-center px-10 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mr-4 shadow-inner">
               <Globe size={24} />
            </div>
            <div>
               <h2 className="font-black uppercase tracking-tight text-base leading-none">Web Center</h2>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 opacity-60">Digital Ministry</p>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
            {[
               { id: 'dashboard', label: 'Overview', icon: Layout },
               { id: 'pages', label: 'Visual Builder', icon: Globe },
               { id: 'sermons', label: 'Messages', icon: Video },
               { id: 'forms', label: 'Engagement', icon: Heart },
               { id: 'media', label: 'Assets', icon: Sparkles },
               { id: 'theme', label: 'Branding', icon: Palette },
               { id: 'seo', label: 'Visibility', icon: Zap }
            ].map(v => (
               <button 
                 key={v.id}
                 onClick={() => setActiveView(v.id)}
                 className={cn(
                   "w-full flex items-center px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all group", 
                   activeView === v.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5"
                 )}
               >
                 <v.icon size={18} className={cn("mr-4 transition-transform group-hover:scale-110", activeView === v.id ? "text-white" : "text-slate-500")} /> {v.label}
               </button>
            ))}
         </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
      {showSuccess && (
        <SuccessOverlay
          onDismiss={() => setShowSuccess(false)}
          onViewLive={() =>
            window.open(`${window.location.origin}/website/home`, '_blank', 'noopener,noreferrer')
          }
        />
      )}
      {loadError && (
        <div
          className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg max-w-lg text-center"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {/* Floating Controls */}
      {/* Professional Visual Editor */}
      {activeView === 'pages' && (
        <div className="absolute inset-0 z-[60] bg-slate-100 flex flex-col animate-in fade-in duration-500 overflow-hidden">
          {/* Top Control Bar */}
          {!isPreviewMode && (
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-[70] shrink-0">
               <div className="flex items-center gap-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveView('dashboard')}
                    className="rounded-xl font-black uppercase text-[9px] tracking-widest text-slate-400 hover:text-slate-900"
                  >
                    <ChevronLeft size={16} className="mr-2" /> Exit
                  </Button>
                  <div className="w-px h-6 bg-slate-100" />
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white shadow-lg"><Globe size={16} /></div>
                      <div className="flex flex-col">
                         <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">{activePage?.title}</span>
                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-none", activePage?.isPublished ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                               {activePage?.isPublished ? 'Live' : 'Draft'}
                            </Badge>
                            <button 
                              onClick={() => {
                                setPageSettingsData({ title: activePage?.title || '', slug: activePage?.slug || '' });
                                setIsEditingPageSettings(true);
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                               <Settings size={12} />
                            </button>
                         </div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">URL: /{activePage?.slug}</p>
                      </div>
                   </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                     <Button 
                       variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} 
                       size="icon" 
                       onClick={() => setPreviewDevice('desktop')} 
                       className="h-8 w-8 rounded-lg"
                     >
                       <Monitor size={14} />
                     </Button>
                     <Button 
                       variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} 
                       size="icon" 
                       onClick={() => setPreviewDevice('mobile')} 
                       className="h-8 w-8 rounded-lg"
                     >
                       <Smartphone size={14} />
                     </Button>
                  </div>
                  <div className="w-px h-6 bg-slate-100" />
                  <Button 
                     variant="ghost" 
                     size="icon" 
                     onClick={() => { setIsPreviewMode(true); setSelectedSectionId(null); }} 
                     className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600"
                  >
                     <Layers size={14} />
                  </Button>
                  <div className="w-px h-6 bg-slate-100" />
                  <Button 
                    onClick={handleSaveDraft}
                    disabled={isSaving || !isDirty}
                    className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                     {isSaving ? <RefreshCw className="animate-spin mr-2 w-3 h-3" /> : <Save size={14} className="mr-2" />}
                     {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button 
                    onClick={togglePublish}
                    className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest bg-indigo-600 text-white hover:bg-slate-950 shadow-lg shadow-indigo-100"
                  >
                     {activePage?.isPublished ? <RefreshCw className="mr-2 w-3 h-3" /> : <Rocket size={14} className="mr-2" />}
                     {activePage?.isPublished ? 'Update' : 'Publish'}
                  </Button>
               </div>
            </header>
          )}

          {/* Floating Exit Preview Button */}
          {isPreviewMode && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 hover:opacity-100 transition-opacity">
               <Button 
                 onClick={() => setIsPreviewMode(false)}
                 className="rounded-full bg-slate-950/80 backdrop-blur-md text-white border-none px-6 h-12 font-black uppercase text-[9px] tracking-widest shadow-2xl hover:bg-slate-900"
               >
                  <X size={16} className="mr-2" /> Exit Preview Mode
               </Button>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
             {/* Left Sidebar: Navigator */}
             {!isPreviewMode && (
                <div className={cn("bg-white border-r border-slate-200 flex flex-col transition-all duration-500 overflow-hidden shrink-0", leftSidebarOpen ? "w-[340px]" : "w-0")}>
                   {/* Sidebar Tabs */}
                   <div className="flex bg-slate-50 border-b border-slate-200 p-1">
                      {[
                        { id: 'pages', icon: Globe, label: 'Pages' },
                        { id: 'layers', icon: Layers, label: 'Layers' },
                        { id: 'ops', icon: Settings, label: 'Site Ops' }
                      ].map(tab => (
                        <button 
                          key={tab.id}
                          onClick={() => setLeftTab(tab.id as any)}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center py-3 gap-1 rounded-xl transition-all",
                            leftTab === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                           <tab.icon size={16} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                      ))}
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {leftTab === 'pages' && (
                        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Site Structure</h4>
                                 <button onClick={() => setShowSiteMap(true)} className="p-1 rounded bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <Layers size={10} />
                                 </button>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => setIsCreatingPage(true)} className="h-8 w-8 text-indigo-600 bg-indigo-50 rounded-lg"><Plus size={16} /></Button>
                           </div>
                           
                           <div className="space-y-2">
                              {pages.map(p => (
                                <div 
                                  key={p.id} 
                                  data-testid={`website-page-${p.slug}`}
                                  onClick={() => { if (isDirty && !confirm('Discard changes?')) return; loadAllData(p.slug); }}
                                  className={cn(
                                    "p-4 rounded-2xl transition-all cursor-pointer border-2 group relative overflow-hidden",
                                    activePage?.slug === p.slug ? "bg-white border-indigo-500 shadow-xl shadow-indigo-100" : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
                                  )}
                                >
                                   {activePage?.slug === p.slug && <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600" />}
                                   <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                         <div className={cn("w-2 h-2 rounded-full", p.isPublished ? "bg-emerald-500" : "bg-amber-500")} />
                                         <span className="font-black uppercase tracking-tight text-[11px] text-slate-900">{p.title}</span>
                                      </div>
                                      {p.slug === 'home' && <Badge variant="secondary" className="bg-slate-100 text-[8px] font-black">HOME</Badge>}
                                   </div>
                                   <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-slate-400 font-mono">/{p.slug}</span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/website/${p.slug}`, '_blank'); }}
                                           title="Open Live Page"
                                           className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600"
                                         >
                                            <ExternalLink size={10} />
                                         </button>
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); handleDuplicatePage(p); }}
                                           title="Duplicate Page"
                                           className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600"
                                         >
                                            <Copy size={10} />
                                         </button>
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); {
                                             setPageSettingsData({ title: p.title, slug: p.slug });
                                             setActivePage(p);
                                             setIsEditingPageSettings(true);
                                           }}}
                                           title="Page Settings"
                                           className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600"
                                         >
                                            <Settings size={10} />
                                         </button>
                                         {p.slug !== 'home' && (
                                           <button 
                                             onClick={(e) => { e.stopPropagation(); deletePage(p.slug); }}
                                             title="Delete Page"
                                             className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-rose-600"
                                           >
                                              <Trash2 size={10} />
                                           </button>
                                         )}
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>

                           <div className="pt-6 border-t border-slate-100 space-y-4">
                              <div className="p-6 rounded-[2rem] bg-indigo-600 text-white space-y-4 relative overflow-hidden">
                                 <Globe className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                                 <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Global Status</h5>
                                 <div>
                                    <p className="text-2xl font-black tracking-tight">{pages.filter(p => p.isPublished).length} / {pages.length}</p>
                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Pages Published</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      )}

                      {leftTab === 'layers' && (
                        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Layer Hierarchy</h4>
                              <Badge className="bg-slate-100 text-slate-400 text-[8px] font-black border-none px-2">{sections.length}</Badge>
                           </div>
                           <div className="space-y-2">
                              {sections.map((s, idx) => {
                                const Icon = s.type === 'hero' ? Monitor : s.type === 'text' ? Type : s.type === 'sermon_list' ? Video : s.type === 'event_list' ? Calendar : s.type === 'giving_cta' ? Heart : Globe;
                                return (
                                  <div 
                                    key={s.id} 
                                    onClick={() => setSelectedSectionId(s.id)}
                                    className={cn(
                                      "px-4 py-4 rounded-2xl transition-all cursor-pointer flex items-center gap-4 group border-2",
                                      selectedSectionId === s.id ? "bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1" : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 text-slate-500"
                                    )}
                                  >
                                     <div className={cn(
                                       "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                       selectedSectionId === s.id ? "bg-white/10 text-white" : "bg-white text-slate-400 shadow-sm"
                                     )}>
                                        <Icon size={14} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <p className="font-black uppercase tracking-widest text-[9px] truncate">{s.type.replace('_', ' ')}</p>
                                        <p className={cn("text-[8px] font-bold uppercase tracking-tight opacity-50 mt-0.5 truncate", selectedSectionId === s.id ? "text-white" : "text-slate-400")}>ID: {s.id.split('-').pop()}</p>
                                     </div>
                                  </div>
                                );
                              })}
                              <Button 
                                variant="ghost" 
                                onClick={() => setAddingAfterId('top')}
                                className="w-full h-12 mt-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 font-black uppercase text-[9px] tracking-widest hover:border-indigo-600 hover:text-indigo-600 hover:bg-white transition-all"
                              >
                                <PlusCircle size={14} className="mr-2" /> Add Component
                              </Button>
                           </div>
                        </div>
                      )}

                      {leftTab === 'ops' && (
                        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Digital Operations</h4>
                           <div className="grid grid-cols-1 gap-2">
                              {[
                                { id: 'dashboard', icon: Layout, label: 'Analytics Hub' },
                                { id: 'media', icon: Sparkles, label: 'Media Library' },
                                { id: 'forms', icon: Heart, label: 'Forms & Leads' },
                                { id: 'theme', icon: Palette, label: 'Branding & Theme' },
                                { id: 'seo', icon: Settings, label: 'SEO & Config' }
                              ].map(item => (
                                <button 
                                  key={item.id}
                                  onClick={() => setActiveView(item.id)}
                                  className="w-full p-5 rounded-2xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-500 transition-all text-left group"
                                >
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm"><item.icon size={18} /></div>
                                      <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{item.label}</p>
                                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Manage {item.label.toLowerCase()}</p>
                                      </div>
                                   </div>
                                </button>
                              ))}
                              <div className="pt-8 mt-8 border-t border-slate-100">
                                 <Button 
                                   onClick={resetToFlagship}
                                   variant="ghost"
                                   className="w-full h-14 rounded-2xl text-rose-600 hover:bg-rose-50 font-black uppercase text-[9px] tracking-[0.2em]"
                                 >
                                    <Trash2 size={16} className="mr-2" /> Reset Website to Flagship
                                 </Button>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              )}

             {/* Main Canvas Area */}
             <div className="flex-1 relative bg-slate-100 overflow-y-auto custom-scrollbar p-12 flex justify-center items-start">
                <div className={cn(
                  "bg-white transition-all duration-1000 shadow-2xl relative",
                  previewDevice === 'desktop' ? "w-full max-w-[1400px] min-h-[90vh] rounded-[2rem]" : "w-[420px] min-h-[850px] rounded-[3.5rem] border-[12px] border-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.3)]"
                )}>
                   {/* Realistic Browser Header (Desktop) */}
                   {previewDevice === 'desktop' && !isPreviewMode && (
                     <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-6 gap-2 rounded-t-[2rem]">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <div className="ml-4 flex-1 h-7 bg-white rounded-lg border border-slate-200 px-4 flex items-center">
                           <span className="text-[10px] text-slate-300 font-medium truncate">{window.location.origin}/website/{activePage?.slug}</span>
                        </div>
                     </div>
                   )}

                   {/* The Content */}
                   <div className={cn("overflow-x-hidden", previewDevice === 'mobile' && "rounded-[2.8rem] h-[calc(850px-24px)] overflow-y-auto")}>
                      <header className="h-24 px-12 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-lg">{orgName[0]}</div>
                           <span className="text-sm font-black uppercase tracking-tight">{orgName}</span>
                        </div>
                        <nav className={cn("flex items-center gap-8", previewDevice === 'mobile' && "hidden")}>
                           {pages.filter(p => p.isPublished).map(p => (
                             <span key={p.id} className={cn("text-[10px] font-black uppercase tracking-widest", activePage?.slug === p.slug ? "text-indigo-600" : "text-slate-400")}>{p.title}</span>
                           ))}
                           <Button className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest" style={{ backgroundColor: primaryColor }}>Giving</Button>
                        </nav>
                        {previewDevice === 'mobile' && <div className="w-10 h-10 flex flex-col justify-center items-end gap-1.5"><div className="w-6 h-0.5 bg-slate-900" /><div className="w-4 h-0.5 bg-slate-900" /></div>}
                      </header>

                      <main className="min-h-[500px]">
                        {sections.map((section) => {
                            const commonProps = { config: section.config, isSelected: selectedSectionId === section.id, onClick: () => setSelectedSectionId(section.id) };
                            const editProps = { onUpdateConfig: (c: any) => updateSectionConfig(section.id, c) };
                            
                            const renderContent = (isEdit: boolean) => {
                              const props = isEdit ? { ...commonProps, ...editProps } : commonProps;
                              switch (section.type) {
                                case 'hero': return <PreviewHero {...props} branding={settings.branding} organizationName={orgName} pageSlug={activePage?.slug} />;
                                case 'text': return <PreviewText {...props} pageSlug={activePage?.slug} />;
                                case 'sermon_list': return <PreviewSermonList {...props} sermons={sermons} />;
                                case 'event_list': return <PreviewEventList {...props} events={publicEvents} />;
                                case 'giving_cta': return <PreviewGivingCta {...props} branding={settings.branding} />;
                                case 'stats_bar': return <PreviewStatsBar {...props} />;
                                case 'ministry_grid': return <PreviewMinistryGrid {...props} />;
                                case 'leadership_grid': return <PreviewLeadershipGrid {...props} />;
                                case 'testimonials': return <PreviewTestimonials {...props} />;
                                case 'giving_impact': return <PreviewGivingImpact {...props} branding={settings.branding} />;
                                case 'qr_payment': return <PreviewQRPayment {...props} branding={settings.branding} />;
                                default: return null;
                              }
                            };

                            return isPreviewMode ? (
                              <div key={section.id}>{renderContent(false)}</div>
                            ) : (
                              <SectionWrapper 
                                key={section.id} 
                                isSelected={selectedSectionId === section.id}
                                onSelect={() => setSelectedSectionId(section.id)}
                                onMove={(dir: any) => moveSection(section.id, dir)}
                                onRemove={() => removeSection(section.id)}
                                onAddAfter={() => setAddingAfterId(section.id)}
                              >
                                {renderContent(true)}
                              </SectionWrapper>
                            );
                          })}

                         {!isPreviewMode && sections.length === 0 && (
                            <div className="py-32 text-center flex flex-col items-center justify-center gap-6">
                               <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><Layout size={40} /></div>
                               <div className="space-y-2">
                                  <p className="text-slate-900 font-black uppercase tracking-widest text-sm">Design your page</p>
                                  <p className="text-slate-400 font-medium text-xs">Start by adding your first section below</p>
                               </div>
                               <Button onClick={() => addSection('hero')} className="rounded-2xl font-black uppercase text-[10px] bg-indigo-600 text-white">Add Section</Button>
                            </div>
                         )}
                      </main>

                      <footer className="bg-slate-950 text-white p-24 text-center space-y-8">
                         <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-white font-black text-xl">{orgName[0]}</div>
                         <h4 className="text-xl font-black uppercase tracking-tight">{orgName}</h4>
                         <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">Building a community of faith and grace.</p>
                      </footer>
                   </div>
                </div>

                {/* Left Toggle */}
                {!isPreviewMode && (
                   <button 
                     onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                     className="fixed left-0 top-1/2 -translate-y-1/2 w-4 h-24 bg-white border border-slate-200 border-l-0 rounded-r-xl flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:w-6 transition-all z-50"
                   >
                      {leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                   </button>
                )}
                {/* Right Toggle */}
                {!isPreviewMode && selectedSectionId && (
                   <button 
                     onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                     className="fixed right-0 top-1/2 -translate-y-1/2 w-4 h-24 bg-white border border-slate-200 border-r-0 rounded-l-xl flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:w-6 transition-all z-50"
                   >
                      {rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                   </button>
                )}
             </div>

             {/* Right Sidebar: Inspector */}
             {!isPreviewMode && (
               <div className={cn("bg-white border-l border-slate-200 flex flex-col transition-all duration-500 overflow-hidden shrink-0", (rightSidebarOpen && selectedSectionId) ? "w-[400px]" : "w-0")}>
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inspector</h4>
                     <Button variant="ghost" size="icon" onClick={() => setSelectedSectionId(null)} className="h-8 w-8 text-slate-400"><X size={16} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <SectionSettings 
                        section={sections.find(s => s.id === selectedSectionId)} 
                        onUpdate={(c: any) => updateSectionConfig(selectedSectionId!, c)}
                        sermons={sermons}
                        events={publicEvents}
                     />
                  </div>
               </div>
             )}
          </div>

          {/* Section Picker Modal */}
          {addingAfterId && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setAddingAfterId(null)}>
                <div className="bg-white rounded-[4rem] p-16 shadow-2xl w-full max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                   <div className="col-span-full space-y-2 mb-4">
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Add Section</h3>
                      <p className="text-sm font-medium text-slate-400">Choose a layout component to inject into your page</p>
                   </div>
                   {[
                      { type: 'hero', icon: Monitor, label: 'Hero Section', desc: 'Cinematic header' },
                      { type: 'text', icon: Type, label: 'Text Block', desc: 'Narrative content' },
                      { type: 'stats_bar', icon: Zap, label: 'Impact Bar', desc: 'Statistics' },
                      { type: 'ministry_grid', icon: Globe, label: 'Ministries', desc: 'Service grid' },
                      { type: 'leadership_grid', icon: Layout, label: 'Leadership', desc: 'Staff gallery' },
                      { type: 'testimonials', icon: Sparkles, label: 'Social Proof', desc: 'Testimonials' },
                      { type: 'sermon_list', icon: Video, label: 'Sermons', desc: 'Message archive' },
                      { type: 'event_list', icon: Calendar, label: 'Events', desc: 'Upcoming schedule' },
                      { type: 'giving_impact', icon: Heart, label: 'Impact Tracker', desc: 'Donation goals' },
                      { type: 'qr_payment', icon: Smartphone, label: 'QR Giving', desc: 'Instant donation' },
                      { type: 'giving_cta', icon: Heart, label: 'Giving CTA', desc: 'Call to action' },
                      { type: 'contact_form', icon: Globe, label: 'Contact', desc: 'Lead generation form' }
                   ].map(opt => (
                     <div 
                       key={opt.type}
                       onClick={() => addSection(opt.type as any, addingAfterId === 'top' ? undefined : addingAfterId)}
                       className="p-8 rounded-[2.5rem] border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all cursor-pointer space-y-4 group"
                     >
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white mx-auto transition-all shadow-sm group-hover:shadow-indigo-200">
                           <opt.icon size={28} />
                        </div>
                        <div className="text-center space-y-1">
                           <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">{opt.label}</p>
                           <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight leading-tight">{opt.desc}</p>
                        </div>
                     </div>
                   ))}
                   <Button variant="ghost" className="col-span-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] text-slate-400" onClick={() => setAddingAfterId(null)}>Close Library</Button>
                </div>
             </div>
          )}
           {/* Page Settings Modal */}
           {isEditingPageSettings && activePage && (
             <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[4rem] p-16 shadow-2xl w-full max-w-xl space-y-10 animate-in zoom-in-95 duration-500">
                   <div className="space-y-2 text-center">
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Page Configuration</h3>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Configure operational metadata for /{activePage.slug}</p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Page Title</Label>
                         <Input 
                           value={pageSettingsData.title} 
                           onChange={(e) => setPageSettingsData({ ...pageSettingsData, title: e.target.value })}
                           className="h-14 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all font-bold text-lg px-6"
                         />
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">URL Slug</Label>
                         <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">/</span>
                            <Input 
                              value={pageSettingsData.slug} 
                              disabled={activePage.slug === 'home'}
                              onChange={(e) => setPageSettingsData({ ...pageSettingsData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              className="h-14 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all font-bold text-lg pl-10 pr-6"
                            />
                         </div>
                         {activePage.slug === 'home' && <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest ml-2">Homepage slug cannot be changed</p>}
                      </div>
                      
                      <div className="p-8 rounded-3xl bg-slate-50 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Publish Status</p>
                               <p className="text-[9px] font-medium text-slate-400">Make this page visible on the public site</p>
                            </div>
                            <Switch 
                              checked={activePage.isPublished} 
                              onCheckedChange={(val) => handleUpdatePage(activePage.slug, { isPublished: val })}
                            />
                         </div>
                         <div className="pt-4 border-t border-slate-200">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Public Preview URL</p>
                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                               <span className="text-[10px] font-mono text-indigo-600 truncate mr-4">{window.location.origin}/website/{activePage.slug}</span>
                               <Button variant="ghost" size="icon" onClick={() => window.open(`${window.location.origin}/website/${activePage.slug}`, '_blank')} className="h-8 w-8 text-slate-400 hover:text-indigo-600 shrink-0">
                                  <ExternalLink size={14} />
                               </Button>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsEditingPageSettings(false)}
                        className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400"
                      >
                         Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          handleUpdatePage(activePage.slug, { title: pageSettingsData.title, newSlug: pageSettingsData.slug });
                          setIsEditingPageSettings(false);
                        }}
                        className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                      >
                         Save Changes
                      </Button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
      {activeView === 'dashboard' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-end">
                 <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Website builder</h1>
                    <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Operational status & public engagement</p>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Site Status: Operational</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-2">{orgName.toLowerCase().replace(/\s+/g, '')}.kingdom.os</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-950 text-white hover:scale-[1.02] transition-all group overflow-hidden">
                     <CardContent className="p-10 space-y-8 relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Globe size={120} /></div>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-900/50"><Globe size={28}/></div>
                        <div>
                           <h3 className="font-black text-5xl tracking-tighter">{pages.length}</h3>
                           <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2">Active Pages</p>
                        </div>
                     </CardContent>
                  </Card>
                  <Card className="rounded-[3rem] border-none shadow-2xl bg-white hover:scale-[1.02] transition-all group overflow-hidden border-b-8 border-emerald-500">
                     <CardContent className="p-10 space-y-8 relative">
                        <div className="absolute top-0 right-0 p-8 text-emerald-50 opacity-50 group-hover:opacity-100 transition-opacity"><Video size={120} /></div>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm"><Video size={28}/></div>
                        <div>
                           <h3 className="font-black text-5xl tracking-tighter text-slate-900">{sermons.length}</h3>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Sermon Archive</p>
                        </div>
                     </CardContent>
                  </Card>
                  <Card className="rounded-[3rem] border-none shadow-2xl bg-white hover:scale-[1.02] transition-all group overflow-hidden border-b-8 border-rose-500">
                     <CardContent className="p-10 space-y-8 relative">
                        <div className="absolute top-0 right-0 p-8 text-rose-50 opacity-50 group-hover:opacity-100 transition-opacity"><Heart size={120} /></div>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm"><Heart size={28}/></div>
                        <div>
                           <h3 className="font-black text-5xl tracking-tighter text-slate-900">248</h3>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Global Leads</p>
                        </div>
                     </CardContent>
                  </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col min-h-[300px]">
                    <CardHeader className="p-8 pb-4">
                       <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Recent Pages</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-center">
                       {pages.length > 0 ? (
                         <div className="space-y-4">
                           {pages.slice(0,3).map(p => (
                             <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                               <div className="flex items-center gap-3">
                                 <Globe size={16} className="text-slate-400" />
                                 <span className="font-bold text-sm">{p.title}</span>
                               </div>
                               <Badge className={p.isPublished ? "bg-emerald-100 text-emerald-700 border-none" : "bg-slate-200 text-slate-600 border-none"}>{p.isPublished ? 'LIVE' : 'DRAFT'}</Badge>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center text-slate-400 space-y-2">
                           <Layout size={32} className="mx-auto opacity-20" />
                           <p className="font-bold">No pages found.</p>
                         </div>
                       )}
                    </CardContent>
                 </Card>
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col min-h-[300px]">
                     <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">SEO & Health</CardTitle>
                     </CardHeader>
                     <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-center gap-6">
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>Search Visibility</span>
                              <span className="text-emerald-600">92%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>Mobile Optimization</span>
                              <span className="text-indigo-600">85%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
                           </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                           <Button variant="ghost" className="w-full text-indigo-600 font-black uppercase text-[9px] tracking-widest h-10 rounded-xl hover:bg-indigo-50">Run Full SEO Audit</Button>
                        </div>
                     </CardContent>
                  </Card>
              </div>
           </div>
        </div>
      ) : activeView === 'sermons' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="flex justify-between items-end">
                 <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Sermon Library</h1>
                    <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Manage audio, video, and notes</p>
                 </div>
                 <Button className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-indigo-600 text-white hover:bg-indigo-700">
                    <Plus size={16} className="mr-2" /> Add Sermon
                 </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {sermons.map(s => (
                    <Card key={s.id} className="rounded-[2rem] border-none shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
                       <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-300 relative group-hover:bg-slate-200 transition-colors">
                          <Video size={32} />
                       </div>
                       <CardContent className="p-6">
                          <h3 className="font-black text-lg text-slate-900">{s.title}</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{s.speaker} • {new Date(s.date).toLocaleDateString()}</p>
                       </CardContent>
                    </Card>
                 ))}
                 {sermons.length === 0 && (
                    <div className="col-span-2 text-center p-20 text-slate-400">
                       <Video size={48} className="mx-auto opacity-20 mb-4" />
                       <p className="font-black text-lg">No sermons published yet.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      ) : activeView === 'forms' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Forms & Leads</h1>
                 <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Manage incoming requests and data collection</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {['Prayer Requests', 'Contact Us', 'Volunteer Interest'].map((form, i) => (
                    <Card key={i} className="rounded-[2rem] border-none shadow-lg bg-white hover:shadow-xl transition-all cursor-pointer">
                       <CardContent className="p-8 space-y-4 text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                             <Heart size={24} />
                          </div>
                          <h3 className="font-black text-lg text-slate-900">{form}</h3>
                          <Badge className="bg-indigo-50 text-indigo-700 border-none font-black">{i * 3 + 1} New Submissions</Badge>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           </div>
        </div>
      ) : activeView === 'media' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="flex justify-between items-end">
                 <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Media Library</h1>
                    <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Manage images, videos, and documents</p>
                 </div>
                 <Button className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 text-white hover:bg-emerald-700">
                    <Plus size={16} className="mr-2" /> Upload
                 </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[1,2,3,4,5,6].map((img) => (
                    <div key={img} className="aspect-square bg-slate-200 rounded-[2rem] flex items-center justify-center text-slate-400 hover:scale-105 transition-transform cursor-pointer shadow-md">
                       <Sparkles size={24} className="opacity-50" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      ) : activeView === 'landing_pages' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Landing Pages</h1>
                 <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Campaign-specific single page sites</p>
              </div>
              <div className="text-center p-20 text-slate-400 bg-white rounded-[3rem] shadow-xl">
                 <Layers size={48} className="mx-auto opacity-20 mb-4" />
                 <p className="font-black text-lg">No active campaigns.</p>
                 <Button className="mt-6 rounded-xl font-black uppercase text-[10px] bg-slate-900 text-white">Create Campaign</Button>
              </div>
           </div>
        </div>
      ) : activeView === 'theme' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Theme & Navigation</h1>
                 <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Global styling and menus</p>
              </div>
              <Card className="rounded-[3rem] border-none shadow-xl bg-white">
                 <CardContent className="p-12 space-y-8">
                    <div>
                       <h3 className="font-black text-xl mb-4">Color Palette</h3>
                       <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-2xl shadow-inner" style={{ backgroundColor: primaryColor }}></div>
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 shadow-inner"></div>
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-200"></div>
                       </div>
                    </div>
                    <div>
                       <h3 className="font-black text-xl mb-4">Typography</h3>
                       <p className="text-4xl font-black uppercase tracking-tight">Main Heading</p>
                       <p className="text-lg font-medium text-slate-600 mt-2">Body text uses a highly legible modern sans-serif font designed for screens.</p>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      ) : activeView === 'seo' ? (
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">SEO & Meta Configuration</h1>
                 <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Search visibility and social sharing</p>
              </div>
              <Card className="rounded-[3rem] border-none shadow-xl bg-white">
                 <CardContent className="p-12 space-y-8">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Site Title</Label>
                       <Input defaultValue={`${orgName} - Official Site`} className="h-14 rounded-2xl border-slate-200 font-bold" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Description</Label>
                       <textarea className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="Welcome to our community. Experience faith, hope, and love with us." />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                       <div className="space-y-1">
                          <p className="font-black text-sm">Search Engine Indexing</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Allow Google to crawl your site</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      ) : null}
      </div>

      {/* Site Map Modal */}
      {showSiteMap && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] p-16 shadow-2xl w-full max-w-4xl space-y-12 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Pages &amp; sections</h3>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Visual map of your digital presence</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSiteMap(false)} className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 transition-all"><X size={24} /></Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-1">
                {pages.map(p => (
                  <div key={p.id} className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-indigo-600 transition-all group relative">
                      <div className="absolute top-6 right-6">
                        <div className={cn("w-3 h-3 rounded-full shadow-lg", p.isPublished ? "bg-emerald-500 shadow-emerald-200" : "bg-amber-500 shadow-amber-200")} />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors mb-6">
                        {p.slug === 'home' ? <Globe size={24} /> : <FileText size={24} />}
                      </div>
                      <h4 className="font-black uppercase tracking-tight text-lg text-slate-900">{p.title}</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-2">/{p.slug}</p>
                      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200/60 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setShowSiteMap(false); loadAllData(p.slug); setActiveView('builder'); }}
                          className="h-10 flex-1 rounded-xl bg-white text-indigo-600 font-black uppercase text-[9px] tracking-widest border border-slate-100"
                        >
                          Edit Page
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(`${window.location.origin}/website/${p.slug}`, '_blank')}
                          className="h-10 w-10 rounded-xl bg-white text-slate-400 hover:text-indigo-600 border border-slate-100"
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                  </div>
                ))}
              </div>

              <div className="pt-12 border-t border-slate-100 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Site Maintenance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button 
                       onClick={handlePublishAll}
                       className="h-14 px-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95"
                     >
                        <Globe className="w-4 h-4" />
                        Publish All Pages
                     </button>
                     <button 
                       onClick={resetToFlagship}
                       className="h-14 px-6 rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-100 hover:bg-slate-900 transition-all active:scale-95"
                     >
                        <RefreshCw className="w-4 h-4" />
                        Reset Website to Flagship
                     </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Pages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Draft Pages</span>
                        </div>
                    </div>
                    <Button onClick={() => { setShowSiteMap(false); setIsCreatingPage(true); }} className="h-14 px-10 rounded-2xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
                        Add New Page
                    </Button>
                </div>
              </div>
          </div>
        </div>
      )}

      {isCreatingPage && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] p-16 shadow-2xl w-full max-w-xl space-y-10 animate-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Create New Page</h3>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Add a new dimension to your site</p>
              </div>
              <form onSubmit={handleCreatePage} className="space-y-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Page Title</Label>
                      <Input 
                        value={newPageData.title} 
                        onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                        placeholder="e.g. Next Steps" 
                        className="h-14 rounded-2xl border-slate-200 font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">URL Slug</Label>
                      <Input 
                        value={newPageData.slug} 
                        onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="e.g. next-steps" 
                        className="h-14 rounded-2xl border-slate-200 font-bold font-mono" 
                      />
                    </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button variant="ghost" type="button" onClick={() => setIsCreatingPage(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancel</Button>
                    <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-100">Create Page</Button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
