/**
 * Shared read-only blocks so public site and builder preview show the same structure for list/CTA sections.
 */
import * as React from 'react';
import { Video, ArrowRight, MousePointer2, Globe, Heart, Calendar, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PublicEventRow = { id: string; name: string; type: string; date: string };
export type PublicSermonRow = { id: string; title: string; speaker: string | null; date: string };

const sectionTitleClass = 'text-4xl font-black tracking-tight uppercase text-slate-900';

// --- Theme Utility ---
const THEME = {
  font: { title: "font-black tracking-tight uppercase", body: "font-medium leading-relaxed text-slate-600" }
};

// --- Hero View ---
export function SharedHeroView({ config, branding, pageSlug, organizationName }: any) {
  const variant = config.variant || 'centered';
  const primaryColor = branding?.primaryColor ?? '#4F46E5';
  const isHome = (pageSlug || '').toLowerCase() === 'home';
  const orgName = organizationName || 'Grace Community';
  
  const titleVal = String(config.title ?? '').trim() || (isHome ? `Welcome to ${orgName}` : 'Gather with us');
  const subVal = String(config.subtitle ?? '').trim() || (isHome ? 'A community centered on faith, hope, and love.' : 'Gather with us this week.');
  const btnVal = String(config.buttonText ?? '').trim() || (isHome ? 'Plan Your Visit' : 'Learn More');
  const badgeText = isHome ? 'Welcome' : 'Featured Message';

  const content = (
    <>
       <Badge className="w-fit bg-indigo-500 text-white border-none font-black uppercase tracking-[0.3em] text-[9px] px-4 py-1 mb-6">{badgeText}</Badge>
       <h1 className={cn("text-5xl md:text-7xl leading-[1.1] mb-6", THEME.font.title)}>{titleVal}</h1>
       <p className="text-xl md:text-2xl font-medium opacity-80 max-w-xl mb-10">{subVal}</p>
       <div className="pt-2">
         <Button className="h-16 px-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform text-white border-none" style={{ backgroundColor: primaryColor }}>
           {btnVal}
         </Button>
       </div>
    </>
  );

  if (variant === 'split') {
    return (
      <div className="relative min-h-[650px] w-full flex flex-col md:flex-row items-stretch bg-slate-900">
        <div className="flex-1 flex flex-col justify-center p-12 md:p-24 space-y-2 text-left text-white bg-slate-900 z-20">
           {content}
        </div>
        <div className="flex-1 relative bg-slate-800 overflow-hidden min-h-[300px]">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent z-10" />
           <div className="absolute inset-0 flex items-center justify-center text-white/5 uppercase font-black text-9xl tracking-tighter select-none rotate-[-10deg]">KINGDOM</div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="relative min-h-[550px] w-full flex items-center justify-center text-center overflow-hidden bg-slate-50">
        <div className="relative z-20 max-w-4xl px-10 py-20">
          <div className="w-20 h-1 bg-indigo-500 mx-auto mb-10" />
          <h1 className={cn("text-6xl md:text-8xl text-slate-950 mb-8", THEME.font.title)}>{titleVal}</h1>
          <p className="text-2xl font-medium text-slate-500 max-w-2xl mx-auto mb-12">{subVal}</p>
          <div className="pt-4 flex items-center justify-center gap-6">
             <Button className="h-16 px-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-xl hover:scale-105 transition-transform text-white border-none" style={{ backgroundColor: primaryColor }}>
               {btnVal}
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[700px] w-full overflow-hidden flex items-center justify-center text-center text-white bg-slate-900">
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/30 z-10" 
        style={{ opacity: config.overlayOpacity ?? 0.6 }} 
      />
      <div className="relative z-20 max-w-4xl px-10 py-24 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <h1 className={cn("text-6xl md:text-8xl leading-[1.0] mb-10", THEME.font.title)}>{titleVal}</h1>
        <p className="text-xl md:text-3xl font-medium opacity-80 max-w-3xl mx-auto mb-12">{subVal}</p>
        {config.serviceTimes && (
           <p className="text-sm font-black uppercase tracking-[0.5em] text-indigo-400 mb-10">{config.serviceTimes}</p>
        )}
        <div className="pt-2">
          <Button className="h-18 px-16 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform text-white border-none" style={{ backgroundColor: primaryColor }}>
            {btnVal}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Text View ---
export function SharedTextView({ config }: any) {
  const contentVal = String(config.content ?? '').trim() || 'We are glad you are here.';
  return (
    <section className={cn(
      "py-24 px-10 max-w-5xl mx-auto",
      config.alignment === 'center' ? "text-center" : "text-left"
    )}>
      <div className="space-y-10">
         {config.title && (
            <h2 className={cn("text-4xl md:text-5xl text-slate-900", THEME.font.title)}>{config.title}</h2>
         )}
         <p className={cn("text-xl md:text-2xl whitespace-pre-wrap", THEME.font.body)}>{contentVal}</p>
      </div>
    </section>
  );
}

// --- Navigation View ---
export function SharedNavbar({ organizationName, primaryColor, pages }: any) {
  return (
    <header className="h-28 px-12 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-[100] w-full">
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">
           {organizationName?.[0] || 'G'}
         </div>
         <span className="text-base font-black uppercase tracking-tight">{organizationName || 'Grace Community'}</span>
      </div>
      <nav className="hidden md:flex items-center gap-10">
         {pages?.map((p: any) => (
           <a 
             key={p.slug} 
             href={`/website/${p.slug}`} 
             className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors"
           >
             {p.title}
           </a>
         ))}
         <Button className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white border-none shadow-lg" style={{ backgroundColor: primaryColor ?? '#4F46E5' }}>
           Giving
         </Button>
      </nav>
    </header>
  );
}

// --- Footer View ---
export function SharedFooter({ organizationName }: any) {
  return (
    <footer className="bg-slate-950 text-white p-32 text-center space-y-10">
      <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mx-auto text-white font-black text-2xl">
        {organizationName?.[0] || 'G'}
      </div>
      <div className="space-y-4">
         <h4 className="text-2xl font-black uppercase tracking-tight">{organizationName || 'Grace Community'}</h4>
         <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">Building a community of faith and grace.</p>
      </div>
      <div className="pt-10 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600">
        © {new Date().getFullYear()} {organizationName}. All rights reserved.
      </div>
    </footer>
  );
}

export function SharedEventListView({
  title,
  events,
  limit = 10,
}: {
  title?: string;
  events: PublicEventRow[];
  limit?: number;
}) {
  const rows = events.slice(0, limit);
  return (
    <section className="max-w-7xl mx-auto py-24 px-10">
      <div className="bg-slate-50 p-12 md:p-20 rounded-[4rem]">
        <h2 className={cn(sectionTitleClass, 'mb-12')}>{title || 'Upcoming Events'}</h2>
        <div className="space-y-6">
          {rows.length === 0 && (
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs py-10 text-center">Check back soon for gatherings.</p>
          )}
          {rows.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-[2rem] bg-white px-10 py-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-transform"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{ev.type || 'Event'}</p>
                <h3 className="text-2xl font-black text-slate-900 leading-none">{ev.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="h-12 w-px bg-slate-100 hidden sm:block mx-4" />
                 <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {new Date(ev.date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-base font-black text-slate-900">
                      {new Date(ev.date).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                   <ArrowRight size={20} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SharedSermonGrid({
  title,
  sermons,
  limit = 9,
}: {
  title?: string;
  sermons: PublicSermonRow[];
  limit?: number;
}) {
  const rows = sermons.slice(0, limit);
  return (
    <section className="max-w-7xl mx-auto py-24 px-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <h2 className={sectionTitleClass}>{title || 'Latest Messages'}</h2>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400 mt-2">
            Watch or Listen to Weekly Teachings
          </p>
        </div>
        <Button variant="ghost" className="text-indigo-600 font-black uppercase text-[11px] tracking-widest hover:bg-indigo-50 h-14 px-8 rounded-2xl">
           Explore Archive <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {rows.map((s) => (
          <Card key={s.id} className="border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white hover:translate-y-[-8px] transition-all duration-500 group">
            <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-300 relative">
              <Video size={50} strokeWidth={1} className="group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors" />
              <PlayCircle className="absolute bottom-6 right-6 text-white/50 w-10 h-10" />
            </div>
            <CardContent className="p-12 space-y-6">
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest">Video Recap</Badge>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{s.title}</h3>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-black">
                  {(s.speaker && s.speaker[0]) || 'P'}
                </div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                  {s.speaker || 'Senior Pastor'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="col-span-3 py-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-2xl opacity-30">Awaiting Content</div>
        )}
      </div>
    </section>
  );
}

export function SharedGivingCtaView({
  title,
  description,
  buttonText,
  primaryColor,
}: {
  title?: string;
  description?: string;
  buttonText?: string;
  primaryColor?: string;
}) {
  const bg = primaryColor ?? '#4F46E5';
  return (
    <section className="max-w-5xl mx-auto py-24 px-10">
      <div className="text-center space-y-10 py-24 px-12 rounded-[4rem] bg-slate-950 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 space-y-8">
           <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center mx-auto text-indigo-400">
              <Heart size={32} />
           </div>
           <h2 className={cn(sectionTitleClass, 'text-white')}>{title || 'Giving'}</h2>
           <p className="text-slate-400 font-medium max-w-xl mx-auto leading-relaxed text-lg">
             {description || 'Your generosity fuels ministry and outreach in our community.'}
           </p>
           <div className="pt-4">
             <Button
               type="button"
               className="h-16 px-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] text-white border-none shadow-2xl hover:scale-105 transition-transform"
               style={{ backgroundColor: bg }}
             >
               {buttonText || 'Give now'}
             </Button>
           </div>
        </div>
      </div>
    </section>
  );
}

export function SharedContactView({
  title,
  email,
  phone,
  address,
}: {
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  return (
    <section className="max-w-7xl mx-auto py-24 px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white border border-slate-100 rounded-[4rem] shadow-2xl overflow-hidden">
         <div className="p-12 md:p-24 space-y-10">
            <h2 className="text-5xl font-black tracking-tight uppercase text-slate-900">{title || 'Contact'}</h2>
            <div className="space-y-8">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                     <Globe size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Our Location</p>
                     <p className="text-lg font-black text-slate-900">{address || '123 Grace Street, City Center'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <Video size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                     <p className="text-lg font-black text-slate-900">{email || 'hello@grace.local'}</p>
                  </div>
               </div>
            </div>
         </div>
         <div className="bg-slate-50 p-12 md:p-24 flex flex-col justify-center">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                     <div className="h-14 bg-white rounded-2xl border border-slate-200" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                     <div className="h-14 bg-white rounded-2xl border border-slate-200" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                  <div className="h-32 bg-white rounded-2xl border border-slate-200" />
               </div>
               <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-widest border-none shadow-xl">Send Message</Button>
            </div>
         </div>
      </div>
    </section>
  );
}
