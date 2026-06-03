/**
 * Kingdom OS - Premium Ministry Component Library
 * High-maturity, cinematic blocks for the Grace Community ecosystem.
 */
import * as React from 'react';
import { 
  Video, ArrowRight, MousePointer2, Globe, Heart, Calendar, PlayCircle, 
  Users, Mic2, Star, Layout, Sparkles, MapPin, Phone, Mail, Clock, 
  MessageCircle, HelpCircle, CreditCard, ChevronRight, Share2, Info,
  Facebook, Instagram, Youtube, Twitter, Quote, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VITE_TENANT_DEFAULT } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';
import { formatEventDateParts } from '@/lib/websiteOperationalData';

// --- Types ---
export type PublicEventRow = { 
  id: string; 
  name: string; 
  type: string; 
  date: string; 
  description?: string; 
  location?: string; 
  registrationUrl?: string; 
  recurring?: boolean; 
  imageUrl?: string 
};

export type PublicSermonRow = { 
  id: string; 
  title: string; 
  speaker: string | null; 
  date: string; 
  series?: string; 
  scripture?: string; 
  videoUrl?: string; 
  thumbnail?: string; 
  description?: string 
};

// --- Design System Tokens ---
const THEME = {
  font: { 
    title: "font-black tracking-tighter uppercase", 
    body: "font-medium leading-relaxed text-slate-300 text-lg md:text-xl" 
  },
  spacing: {
    section: "py-32 md:py-64",
    container: "max-w-7xl mx-auto px-10"
  },
  colors: {
    dark: "bg-slate-950",
    elevated: "bg-slate-900",
    surface: "bg-slate-900/50",
    glass: "backdrop-blur-3xl bg-white/10 border border-white/20"
  },
  buttons: {
    primary: "h-20 px-12 rounded-3xl bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-indigo-700 transition-all border-none active:scale-95 flex items-center justify-center",
    secondary: "h-20 px-12 rounded-3xl bg-white/10 text-white border-2 border-white/20 font-black uppercase text-xs tracking-[0.3em] backdrop-blur-xl hover:bg-white hover:text-slate-950 transition-all active:scale-95 flex items-center justify-center",
    action: "h-16 px-10 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center"
  }
};

const sectionTitleClass = 'text-5xl md:text-[9rem] font-black tracking-tighter uppercase text-white leading-[0.8] mb-16';
const subTitleClass = 'text-[12px] font-black uppercase tracking-[0.8em] text-indigo-500 mb-12 block';

const formatOrgName = (name?: string) => {
  if (!name || name.trim().toUpperCase() === 'ORGANIZATION') return 'Grace Community';
  return name;
};



// --- Helpers ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const IMAGE_FALLBACKS = {
  hero: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=2000',
  ministry: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1000',
  sermon: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1000',
  portrait: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1000',
  gallery: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1000',
};

export function ResilientImage({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = React.useState(src && src.trim() ? src : fallbackSrc);
  React.useEffect(() => {
    setCurrentSrc(src && src.trim() ? src : fallbackSrc);
  }, [src, fallbackSrc]);
  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}

// --- 1. NAVBAR (PREMIUM RESTRUCTURED) ---
export function SharedNavbar({ organizationName = 'Grace Community', primaryColor, pages }: { organizationName?: string; primaryColor?: string; pages?: { slug: string; title: string }[] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const centerNavItems = [
    { slug: '/', title: 'Home' },
    { slug: '/about', title: 'About' },
    { slug: '/ministries', title: 'Ministries' },
    { slug: '/sermons', title: 'Sermons' },
    { slug: '/events', title: 'Events' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 h-24 flex items-center",
      isScrolled ? "bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 h-20" : "bg-transparent"
    )}>

      <div className={cn(THEME.spacing.container, "w-full flex items-center justify-between")}>
        {/* LEFT: Logo + Name */}
        <a href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-slate-200">
            <Layout size={20} />
          </div>
          <span className="text-lg font-black uppercase tracking-tight text-white">{formatOrgName(organizationName)}</span>
        </a>

        {/* CENTER: Navigation */}
        <div className={cn(
          "hidden lg:flex items-center p-1 rounded-[2rem] border transition-all duration-500",
          isScrolled ? "bg-white/5 border-white/10 shadow-inner" : "bg-white/10 border-white/10 backdrop-blur-md"

        )}>
          {centerNavItems.map((item) => (
            <a 
              key={item.slug} 
              href={item.slug} 
              className={cn(
                "px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                isScrolled 
                  ? "text-slate-400 hover:text-white hover:bg-white/10" 
                  : "text-white/70 hover:text-white hover:bg-white/20"

              )}
            >
              {item.title}
            </a>
          ))}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-4">
          <a 
            href="/contact"
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              "hidden md:flex h-11 px-7 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-500 hover:scale-105 border-none",
              isScrolled 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" 
                : "bg-white text-slate-950 hover:bg-slate-100 shadow-2xl shadow-white/10"


            )}
          >
            Plan Your Visit
          </a>

          <div className="hidden xl:flex items-center gap-10 ml-6">
            <a href="/giving" className={cn(
              "text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105",
              isScrolled ? "text-slate-400 hover:text-indigo-600" : "text-white/60 hover:text-white"
            )}>Give</a>
            <a href="/login" className={cn(
              "text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105",
              isScrolled ? "text-white/60 hover:text-white" : "text-white/60 hover:text-white"
            )}>Portal</a>
          </div>


          
          <button 
            className={cn(
              "lg:hidden w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
              isScrolled ? "bg-slate-100 text-slate-900" : "bg-white/20 text-white backdrop-blur-md"
            )}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Users size={18} />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950 text-white animate-in fade-in zoom-in duration-500 flex flex-col">
          <div className="h-24 px-10 flex justify-between items-center border-b border-white/5">
            <div className="text-xl font-black uppercase tracking-tight text-white">{organizationName}</div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ArrowRight size={20} className="rotate-180" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-10 py-12 flex flex-col gap-1">
            {[
              { slug: '/', title: 'Home' },
              { slug: '/about', title: 'About' },
              { slug: '/ministries', title: 'Ministries' },
              { slug: '/sermons', title: 'Sermons' },
              { slug: '/events', title: 'Events' },
              { slug: '/giving', title: 'Give' }, 
              { slug: '/login', title: 'Portal' }
            ].map((p) => (
              <a 
                key={p.slug} 
                href={p.slug} 
                className="text-5xl font-black uppercase tracking-tighter text-slate-100 hover:text-indigo-400 transition-colors py-4" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {p.title}
              </a>
            ))}
          </div>
          <div className="p-10 border-t border-white/5 bg-slate-900/50">
             <a 
               href="/contact"
               className={cn(
                 buttonVariants({ variant: 'default', size: 'lg' }),
                 "w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-2xl flex items-center justify-center border-none"
               )}
             >
               Plan Your Visit
             </a>
          </div>
        </div>
      )}
    </nav>
  );
}

// --- 2. HERO VIEW (CINEMATIC) ---
export function SharedHeroView({ config, branding, pageSlug, organizationName = 'Grace Community' }: { config: any; branding?: any; pageSlug: string; organizationName?: string }) {
  const variant = config.variant || 'centered';
  const imageUrl = config.imageUrl || IMAGE_FALLBACKS.hero;

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0">
        <ResilientImage
          src={imageUrl}
          fallbackSrc={IMAGE_FALLBACKS.hero}
          className="w-full h-full object-cover object-center opacity-40 scale-105 animate-[kenburns_40s_linear_infinite]"
          alt="Hero background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950" />
      </div>

      <div className={cn(THEME.spacing.container, "relative z-10 w-full")}>
        <div className={cn("max-w-6xl", variant === 'centered' ? "mx-auto text-center" : "text-left")}>
          <div className={cn(
            "inline-flex items-center gap-6 mb-12 animate-in slide-in-from-bottom-10 duration-1000",
            variant === 'centered' ? "justify-center" : ""
          )}>
             <div className="h-[2px] w-12 bg-indigo-500" />
             <span className="text-[12px] font-black uppercase tracking-[0.6em] text-white">{formatOrgName(organizationName)}</span>
             <div className="h-[2px] w-12 bg-indigo-500" />
          </div>
          
          <h1 className="text-7xl md:text-[12rem] font-black text-white uppercase tracking-tighter leading-[0.75] mb-16 animate-in slide-in-from-bottom-20 duration-1000 delay-200">
            {config.title || 'Welcome Home'}
          </h1>
          
          <p className="text-2xl md:text-5xl font-medium text-slate-300 leading-[1.1] mb-20 max-w-4xl mx-auto animate-in slide-in-from-bottom-32 duration-1000 delay-500 tracking-tighter italic opacity-80">
            {config.subtitle || 'Experience radical grace and authentic community.'}
          </p>

          <div className={cn(
            "flex flex-col sm:flex-row items-center gap-8 animate-in slide-in-from-bottom-40 duration-1000 delay-700",
            variant === 'centered' ? "justify-center" : ""
          )}>
            <a 
              href={config.primaryButtonHref || '/events'}
              className={THEME.buttons.primary}
            >
              {config.buttonText || 'Explore Gatherings'}
            </a>

            <a 
              href={config.secondaryButtonHref || '/ministries'}
              className={THEME.buttons.secondary}
            >
              {config.secondaryButtonText || 'Find Your Place'}
            </a>


          </div>
        </div>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 opacity-30">
         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Scroll</span>
         <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
      </div>
    </section>
  );
}

// --- 3. STORY / TIMELINE (ABOUT PAGE) ---
export function SharedAboutStory({ config }: { config: any }) {
  const milestones = config.milestones || [
    { year: '2004', title: 'The Vision', content: 'Our journey began in a small living room with a handful of families committed to radical grace.' },
    { year: '2012', title: 'Founding Site', content: 'We moved into our first permanent location, establishing a hub for community transformation.' },
    { year: '2020', title: 'Digital Frontier', content: 'Expansion into global digital ministry, reaching thousands with the message of hope.' },
    { year: '2026', title: 'Present Day', content: 'A thriving multi-campus community dedicated to the glory of God in every step.' }
  ];

  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950")}>

      <div className={THEME.spacing.container}>
        <div className="max-w-4xl mb-32">
           <span className={subTitleClass}>Our Journey</span>
           <h2 className={sectionTitleClass}>A Legacy of <br/><span className="text-indigo-500">Faithful Steps.</span></h2>

        </div>

        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[1px] bg-white/10" />

          
          <div className="space-y-40">
            {milestones.map((m: any, idx: number) => (
              <div key={idx} className={cn(
                "relative flex flex-col md:flex-row items-center gap-20",
                idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-xl z-10" />
                
                <div className="flex-1 w-full pl-20 md:pl-0 md:text-right">
                  {idx % 2 === 0 ? (
                    <div className="md:pr-20">
                      <span className="text-8xl font-black text-white/5 leading-none">{m.year}</span>

                    </div>
                  ) : (
                    <div className="md:pl-20 md:text-left">
                       <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-6">{m.title}</h3>

                       <p className="text-xl text-slate-300 font-medium leading-relaxed">{m.content}</p>

                    </div>
                  )}
                </div>

                <div className="flex-1 w-full pl-20 md:pl-0 md:text-left">
                  {idx % 2 === 0 ? (
                    <div className="md:pl-20">
                       <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-6">{m.title}</h3>

                       <p className="text-xl text-slate-300 font-medium leading-relaxed">{m.content}</p>

                    </div>
                  ) : (
                    <div className="md:pr-20 md:text-right">
                       <span className="text-8xl font-black text-white/5 leading-none">{m.year}</span>

                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 4. MISSION & VALUES ---
export function SharedMissionVision({ title, mission, vision, values }: { title?: string; mission?: string; vision?: string; values?: any[] }) {
  const defaultValues = [
    { title: 'Radical Grace', desc: 'We believe in a love that pursues, restores, and transforms every heart.' },
    { title: 'Authentic Community', desc: 'No masks, no performance. Just real people growing together in truth.' },
    { title: 'Bold Invitation', desc: 'We are intentionally outward-focused, reaching those far from God.' },
    { title: 'Passionate Worship', desc: 'Our lives are a response to the greatness of His presence.' }
  ];

  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950 text-white overflow-hidden relative")}>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/10 blur-[150px] -translate-y-1/2 translate-x-1/2 rounded-full" />
      
      <div className={THEME.spacing.container}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 mb-48">
          <div className="lg:col-span-6 space-y-12">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400">Our Identity</span>
            <h2 className="text-6xl md:text-[8rem] font-black uppercase tracking-tighter leading-[0.8]">{title || 'The Core of Grace.'}</h2>
          </div>
          <div className="lg:col-span-6 flex flex-col justify-end gap-16">
            <div className="space-y-6">
               <h4 className="text-xl font-black uppercase tracking-widest text-indigo-400 flex items-center gap-4">
                 <Sparkles size={20} /> Mission
               </h4>
               <p className="text-3xl md:text-5xl font-medium tracking-tighter italic text-slate-300 leading-tight">
                 "{mission || 'To lead people into a growing relationship with Jesus Christ through authentic community and radical grace.'}"
               </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {(values || defaultValues).map((v: any, i: number) => (
            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] p-12 hover:bg-white hover:text-slate-950 transition-all duration-700 group border-none shadow-none">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-10 group-hover:bg-slate-950 transition-colors">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight mb-4">{v.title}</h3>
              <p className="text-lg opacity-60 font-medium leading-relaxed group-hover:opacity-100">{v.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SharedMinistryDetailList({ title, ministries }: { title?: string; ministries?: any[] }) {
  const rawList = ministries?.length ? ministries : [
    { title: 'Kids Life', description: 'Empowering children to know God, find family, and discover purpose.', schedule: 'Sundays @ 9AM & 11AM', leader: 'Sarah Miller', image: 'https://images.unsplash.com/photo-1502086223501-7ea244b2896e' },
    { title: 'Youth Collective', description: 'A space for students to encounter Jesus and build authentic relationships.', schedule: 'Wednesdays @ 7PM', leader: 'Marcus Bell', image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94' },
    { title: 'Worship Arts', description: 'Creating atmospheres where people can meet with God through music and creativity.', schedule: 'Thursdays @ 6PM (Rehearsal)', leader: 'David Chen', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81' },
    { title: 'Outreach & Missions', description: 'Taking the message of hope beyond our walls to our city and the nations.', schedule: 'Monthly Serve Days', leader: 'Grace Community', image: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4' }
  ];

  const list = rawList.map((m: any) => {
    const title = m.name || m.title || 'Ministry';
    return {
      title,
      description: m.description || `Discover a community of disciples inside our active ${title}.`,
      schedule: m.schedule || 'Sundays @ 10:00 AM',
      leader: m.leader || 'Ministry Team',
      image: m.image || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1000'
    };
  });

  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950")}>

      <div className={THEME.spacing.container}>
        <div className="mb-32">
           <span className={subTitleClass}>Get Involved</span>
           <h2 className={sectionTitleClass}>{title || 'Our Ministries'}</h2>
        </div>

        <div className="space-y-24">
          {list.map((m: any, idx: number) => (
            <div key={idx} className={cn(
              "group relative grid grid-cols-1 lg:grid-cols-12 gap-16 items-center p-12 rounded-[4rem] hover:bg-white/5 transition-all duration-700",

              idx % 2 !== 0 ? "" : ""
            )}>
              <div className={cn(
                "lg:col-span-5 aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl",
                idx % 2 !== 0 ? "lg:order-2" : "lg:order-1"
              )}>
                <ResilientImage src={m.image} fallbackSrc={IMAGE_FALLBACKS.ministry} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={m.title} />
              </div>
              
              <div className={cn(
                "lg:col-span-7 space-y-10",
                idx % 2 !== 0 ? "lg:order-1 lg:text-right lg:items-end" : "lg:order-2 lg:text-left lg:items-start",
                "flex flex-col"
              )}>
                <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none">{m.title}</h3>

                <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-xl">{m.description}</p>

                
                <div className={cn(
                  "flex flex-col md:flex-row gap-10 pt-4",
                  idx % 2 !== 0 ? "md:justify-end" : "md:justify-start"
                )}>
                  <div className="flex items-center gap-4 text-slate-400">
                    <Clock size={20} className="text-indigo-600" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{m.schedule}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <Users size={20} className="text-indigo-600" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{m.leader}</span>
                  </div>
                </div>

                <a 
                  href={`/ministries/${m.title.toLowerCase().replace(/\s/g, '-')}`}
                  className={cn(THEME.buttons.secondary, "h-16 rounded-2xl")}
                >
                  Connect with {m.title}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 6. PRAYER EXPERIENCE ---
export function SharedPrayerExperience({ config }: { config: any }) {
  const [content, setContent] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setMessage('Please share your prayer request.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setMessage(null);
    try {
      const res = await apiFetch('website/public/prayer-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': VITE_TENANT_DEFAULT,
        },
        body: JSON.stringify({
          content: content.trim(),
          requesterName: name.trim(),
          email: email.trim(),
          isPrivate,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json?.error?.message || json?.message || 'Unable to submit prayer request');
      }
      setStatus('success');
      setContent('');
      setName('');
      setEmail('');
      setIsPrivate(false);
      setMessage('Your prayer request has been received. Our pastoral team will stand with you in faith.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  };

  return (
    <section className="bg-slate-950 min-h-screen flex items-center justify-center py-40 relative">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

       <div className={cn(THEME.spacing.container, "max-w-4xl")}>
          <div className="text-center space-y-16">
             <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <Heart size={40} />
             </div>
             
             <div className="space-y-8">
                <span className={subTitleClass}>Pastoral Care</span>
                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-white">You Are Not Alone.</h2>

                <p className="text-2xl md:text-4xl font-medium italic text-slate-300 tracking-tighter leading-tight">
                  "Come to me, all you who are weary and burdened, and I will give you rest." — Matthew 11:28
                </p>
             </div>

             <Card className="border-none shadow-2xl rounded-[4rem] bg-white/5 backdrop-blur-3xl border border-white/10 p-12 md:p-24 overflow-hidden relative">

                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                <div className="space-y-12">
                   <div className="text-left space-y-4">
                       <h4 className="text-3xl font-black uppercase tracking-tight text-white">How can we pray for you?</h4>

                      <p className="text-slate-400 font-medium">Our pastoral team and prayer warriors are ready to stand with you in faith.</p>
                   </div>
                   
                   <div className="space-y-8">
                      {message && (
                        <p className={cn(
                          'text-sm font-medium rounded-2xl px-6 py-4',
                          status === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300',
                        )}>
                          {message}
                        </p>
                      )}
                      <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full min-h-[200px] bg-slate-950 border border-white/10 rounded-3xl p-10 text-xl font-medium focus:ring-4 focus:ring-indigo-500/20 text-white transition-all outline-none"
                        placeholder="Share your request or testimony..."
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="w-full h-20 bg-slate-950 border border-white/10 rounded-2xl px-10 font-medium text-white outline-none focus:border-white/20" />
                         <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full h-20 bg-slate-950 border border-white/10 rounded-2xl px-10 font-medium text-white outline-none focus:border-white/20" />
                      </div>

                      <div className="flex items-center gap-4 px-4">
                         <input type="checkbox" id="private" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-6 h-6 rounded-lg text-indigo-600" />
                         <label htmlFor="private" className="text-sm font-black uppercase tracking-widest text-slate-400">Keep this request private to pastors only</label>
                      </div>
                      <Button type="button" disabled={status === 'submitting'} onClick={handleSubmit} className={cn(THEME.buttons.primary, "w-full")}>
                        {status === 'submitting' ? 'Submitting...' : 'Submit Prayer Request'}
                      </Button>
                   </div>
                </div>
             </Card>

             <div className="pt-20 border-t border-white/10">

                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8">Recent Testimonies</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-white/5 p-10 rounded-[2.5rem] shadow-sm text-left border border-white/10">
                      <Quote className="text-indigo-400 mb-6" size={32} />
                      <p className="text-lg font-medium text-slate-300 leading-relaxed mb-6 italic">"I requested prayer for my mother's surgery last week, and I'm overjoyed to share that she is recovering beautifully. Thank you, church family!"</p>

                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">— Maria S.</span>
                   </div>
                   <div className="bg-white/5 p-10 rounded-[2.5rem] shadow-sm text-left border border-white/10">
                      <Quote className="text-indigo-400 mb-6" size={32} />
                      <p className="text-lg font-medium text-slate-300 leading-relaxed mb-6 italic">"God provided a breakthrough in our finances just when we thought there was no way out. Faith works!"</p>

                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">— James R.</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </section>
  );
}

// --- 7. GIVING IMPACT (campaign progress) ---
export function SharedGivingImpact({ config, primaryColor }: { config: any; primaryColor?: string }) {
  const campaigns = Array.isArray(config?.campaigns) && config.campaigns.length > 0
    ? config.campaigns
    : [
        { title: 'Local Care Hub', progress: 65, target: '₹25,000', current: '₹16,250', desc: 'Serving families in our neighborhood.' },
        { title: 'Global Mission Partners', progress: 80, target: '₹40,000', current: '₹32,000', desc: 'Supporting gospel work across partner networks.' },
      ];
  const accent = primaryColor || '#4F46E5';
  return (
    <section className={cn(THEME.spacing.section, 'bg-slate-950')}>
      <div className={THEME.spacing.container}>
        <div className="text-center space-y-6 mb-24 max-w-3xl mx-auto">
          <span className={subTitleClass}>Generosity</span>
          <h2 className={sectionTitleClass}>{config?.title || 'Collective Impact'}</h2>
          <p className="text-xl text-slate-400 font-medium">Your generosity transforms lives locally and globally.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {campaigns.map((c: { title: string; progress: number; target: string; current: string; desc?: string }, i: number) => (
            <Card key={i} className="border-none shadow-2xl rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden">
              <CardContent className="p-12 space-y-8">
                <div className="flex justify-between items-end gap-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white">{c.title}</h3>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest shrink-0">{c.progress}% Funded</p>
                </div>
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, c.progress)}%`, backgroundColor: accent }} />
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Raised: {c.current}</span>
                  <span>Goal: {c.target}</span>
                </div>
                {c.desc && <p className="text-slate-400 font-medium leading-relaxed">{c.desc}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 8. IMPACT STATS ---
const DEFAULT_IMPACT_STATS = [
  { label: 'Souls Reached', value: '15k+', icon: Globe },
  { label: 'Weekly Attendance', value: '2,500', icon: Users },
  { label: 'Lives Transformed', value: '800+', icon: Sparkles },
  { label: 'Global Missions', value: '12', icon: MapPin },
];

export function SharedImpactStats({ config }: { config: any }) {
  const fromCms = Array.isArray(config?.stats)
    ? config.stats
        .filter((s: { label?: string; value?: string }) => s?.label && s?.value)
        .slice(0, 4)
        .map((s: { label: string; value: string }, i: number) => ({
          label: s.label,
          value: s.value,
          icon: [Globe, Users, Sparkles, MapPin][i] ?? Globe,
        }))
    : [];
  const stats = fromCms.length >= 4 ? fromCms : DEFAULT_IMPACT_STATS;

  return (
    <section className="py-32 bg-indigo-600 text-white">
      <div className={THEME.spacing.container}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
                <s.icon size={28} />
              </div>
              <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">{s.value}</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 8. FOOTER (RICH & PASTORAL) ---
export function SharedFooter({
  organizationName = 'Grace Community',
  orgSettings,
}: {
  organizationName?: string;
  orgSettings?: {
    organization?: {
      address?: string;
      email?: string;
      phone?: string;
      serviceTimes?: string | null;
      tagline?: string | null;
    };
  } | null;
}) {
  const displayOrg = formatOrgName(organizationName);
  const serviceTimesText =
    orgSettings?.organization?.serviceTimes?.trim() ||
    '9:00 AM • 11:00 AM\n5:00 PM (Youth)';
  const midweekText = 'Wednesdays @ 7:00 PM\nSmall Groups (Weekly)';
  const footerTagline =
    orgSettings?.organization?.tagline?.trim() ||
    'A community anchored in radical grace, pursuing the glory of God in every step of our journey. Join us as we reach those far from God.';
  return (
    <footer className="bg-slate-950 text-white pt-48 pb-20 overflow-hidden relative border-t border-white/5">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      
      <div className={cn(THEME.spacing.container, "relative z-10")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 pb-40">
          <div className="lg:col-span-5 space-y-16">
            <div>
              <div className="w-16 h-16 bg-white text-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl mb-10 shadow-2xl">G</div>
              <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-10">{displayOrg}</h3>
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-sm">{footerTagline}</p>
            </div>

            
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
               <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">A Note from Pastor David</h4>
               <p className="text-sm italic font-medium text-slate-300 leading-relaxed">"We don't just gather on Sundays; we live on mission together. You are loved, you are valued, and there is a seat at our table for you."</p>
            </div>

            <div className="flex gap-6">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, idx) => (
                <div key={idx} className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-950 transition-all duration-500 cursor-pointer group">
                   <Icon size={20} />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-12">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Navigation</h4>
              <div className="flex flex-col gap-8">
                {['Home', 'About', 'Ministries', 'Sermons', 'Events'].map(l => (
                  <a key={l} href={`/${l.toLowerCase() === 'home' ? '' : l.toLowerCase()}`} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div className="space-y-12">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Next Steps</h4>
              <div className="flex flex-col gap-8">
                {['Give', 'Prayer', 'Join a Group', 'Volunteer', 'Contact'].map(l => (
                  <a key={l} href={`/${l.toLowerCase() === 'give' ? 'giving' : l.toLowerCase().replace(/\s/g, '-')}`} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">{l}</a>
                ))}

              </div>
            </div>
            <div className="col-span-2 md:col-span-1 space-y-12">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Service Times</h4>
              <div className="space-y-8">
                 <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Sundays</p>
                    <p className="text-sm text-slate-400 font-medium whitespace-pre-line">{serviceTimesText.replace(/ • /g, '\n')}</p>
                 </div>
                 <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Midweek</p>
                    <p className="text-sm text-slate-400 font-medium whitespace-pre-line">{midweekText}</p>
                 </div>
                 <a 
                   href="/contact"
                   className={cn(THEME.buttons.action, "w-full h-16 rounded-2xl")}
                 >
                    Plan Your Visit
                 </a>

              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">&copy; 2026 {displayOrg} • Built with Kingdom OS.</p>

          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/portal" className="hover:text-white transition-colors">Admin Portal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Legacy / Aliases to prevent crashes ---
export const SharedTextView = ({ config }: { config: any }) => (
  <section className={cn(THEME.spacing.section, "bg-slate-950")}>
    <div className={THEME.spacing.container}>
      <div className="max-w-4xl">
         <span className={subTitleClass}>{config.subtitle || 'Our Foundation'}</span>
         <h2 className={sectionTitleClass}>{config.title || 'Rooted in Grace'}</h2>
         <div className="mt-16 prose prose-2xl prose-invert font-medium text-slate-400 leading-relaxed tracking-tight max-w-3xl">
            {config.content || 'We believe that the church is the hope of the world. Our mission is to lead people into a growing relationship with Jesus Christ.'}
         </div>
      </div>
    </div>
  </section>
);

export const SharedAtmosphereGallery = ({ config }: { config: any }) => {
  const images = config.images || [
    { url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', title: 'Worship Atmosphere' },
    { url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94', title: 'Community Life' },
    { url: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4', title: 'Prayer & Presence' }
  ];
  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950 overflow-hidden")}>
      <div className={THEME.spacing.container}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-20">
          <div className="lg:col-span-7">
            <span className={subTitleClass}>Church Culture</span>
            <h2 className={sectionTitleClass}>A Place of <br/><span className="text-indigo-600">Pure Belonging.</span></h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {images.map((img: any, i: number) => (
            <div key={i} className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative group">
              <ResilientImage src={img.url} fallbackSrc={IMAGE_FALLBACKS.gallery} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={img.title || 'Gallery image'} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-10 left-10"><h3 className="text-2xl font-black text-white uppercase">{img.title}</h3></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export function SharedSermonFeatured({ config, sermon }: { config: any; sermon?: PublicSermonRow }) {
  const s = sermon || {
    title: "The Architecture of Grace",
    speaker: "Pastor David Chen",
    series: "Kingdom Foundations",
    scripture: "Ephesians 2:8-10",
    date: "May 14, 2026",
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1000",
    description: "Discover how the radical grace of Jesus builds a foundation that can never be shaken."
  };
  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950")}>
      <div className={THEME.spacing.container}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-indigo-600/10 rounded-[4rem] blur-3xl" />
            <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-900">
              <ResilientImage src={s.thumbnail} fallbackSrc={IMAGE_FALLBACKS.sermon} className="w-full h-full object-cover" alt={s.title} />
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <PlayCircle size={64} className="text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-10">
            <div>
              <span className={subTitleClass}>{s.series}</span>
               <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-8">{s.title}</h2>

              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">{s.description}</p>
            </div>
            <a 
              href={'id' in s && s.id ? `/sermons/watch/${s.id}` : ('videoUrl' in s && s.videoUrl) || '/sermons'}
              className={THEME.buttons.primary}
            >
              Watch Latest Message
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SharedEventCalendar({ title, events, limit = 4 }: { title: string; events: PublicEventRow[]; limit?: number }) {
  const list = events.slice(0, limit);
  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950")}>

      <div className={THEME.spacing.container}>
        <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-24">
          <div className="max-w-2xl">
            <span className={subTitleClass}>Community Life</span>
            <h2 className={sectionTitleClass}>{title || 'Gatherings'}</h2>
          </div>
          <a 
            href="/events"
            className="h-16 px-8 rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-indigo-400 hover:text-white transition-all flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Full Calendar <ArrowRight size={16} className="ml-2" />
          </a>

        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {list.map((ev) => {
            const dateParts = formatEventDateParts(ev.date);
            const href = ev.registrationUrl ?? `/events/${ev.id}`;
            return (
            <a
              key={ev.id}
              href={href}
              className="group relative bg-white/5 rounded-[3.5rem] overflow-hidden hover:bg-indigo-600 transition-all duration-700 flex flex-col border border-white/10 hover:border-indigo-500"
            >
              {ev.imageUrl && (
                <ResilientImage
                  src={ev.imageUrl}
                  fallbackSrc={IMAGE_FALLBACKS.sermon}
                  alt=""
                  className="w-full h-36 object-cover opacity-90 group-hover:opacity-100"
                />
              )}
              <div className="p-12 flex flex-col gap-10 flex-1">
              <div className="flex justify-between items-start">
                <div className="w-20 h-20 rounded-3xl bg-white/10 text-white group-hover:bg-white group-hover:text-indigo-600 flex flex-col items-center justify-center shadow-xl transition-all">

                  <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">{dateParts.month}</span>
                  <span className="text-3xl font-black leading-none">{dateParts.day}</span>
                </div>
                <Badge className="bg-white/10 text-white group-hover:bg-white/20 group-hover:text-white font-black uppercase text-[9px] tracking-widest px-4 py-1.5 rounded-xl border-none">{ev.type}</Badge>

              </div>
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-6">{ev.name}</h3>

                <p className="text-lg text-slate-300 group-hover:text-white/70 font-medium leading-relaxed line-clamp-2">{ev.description || 'Join us for an intentional gathering of our faith community.'}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-10 border-t border-white/10">

                <div className="flex items-center gap-3 text-slate-400 group-hover:text-white/60"><Clock size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{dateParts.timeLabel}{ev.location ? ` • ${ev.location}` : ''}</span></div>
                <span className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-lg" aria-hidden><ArrowRight size={20} /></span>
              </div>
              </div>
            </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SharedGivingFlow({ title, primaryColor }: { title: string; primaryColor?: string }) {
  const [amount, setAmount] = React.useState<string>('1000');
  const [step, setStep] = React.useState<'amount' | 'details' | 'processing' | 'verifying' | 'success'>('amount');
  const [donorData, setDonorData] = React.useState({ email: '', name: '', phone: '' });
  const [error, setError] = React.useState<string | null>(null);

  const presets = ['500', '1000', '5000', '10000'];

  const handleInitiatePayment = async () => {
    setStep('processing');
    setError(null);
    try {
      const ready = await loadRazorpay();
      if (!ready) throw new Error('Razorpay library failed to load.');
      const res = await apiFetch('website/public/giving/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': VITE_TENANT_DEFAULT },
        body: JSON.stringify({ amount: Number(amount), donorEmail: donorData.email, donorPhone: donorData.phone })
      });
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.error?.message || 'Order creation failed');
      const { orderId, razorpayKeyId, currency } = json.data;
      const options = {
        key: razorpayKeyId, amount: Number(amount) * 100, currency: currency || 'INR', name: 'Grace Community', description: 'Tithe & Offering', order_id: orderId,
        prefill: { name: donorData.name, email: donorData.email, contact: donorData.phone },
        theme: { color: primaryColor || '#4F46E5' },
        handler: async (payment: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          setStep('verifying');
          try {
            const verifyRes = await apiFetch('website/public/giving/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-tenant-id': VITE_TENANT_DEFAULT },
              body: JSON.stringify({
                razorpayOrderId: payment?.razorpay_order_id,
                razorpayPaymentId: payment?.razorpay_payment_id,
                razorpaySignature: payment?.razorpay_signature,
                donorName: donorData.name,
                donorEmail: donorData.email,
                donorPhone: donorData.phone,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok || verifyJson?.status !== 'success') {
              throw new Error(verifyJson?.error?.message || verifyJson?.message || 'Payment verification failed');
            }
            setStep('success');
          } catch (verifyErr: any) {
            setError(verifyErr?.message || 'Payment verification failed');
            setStep('details');
          }
        },
        modal: { ondismiss: () => setStep('details') }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) { setError(err.message); setStep('details'); }
  };

  if (step === 'success') {
    return (
      <section className={cn(THEME.spacing.section, "bg-slate-950 flex items-center justify-center")}>

        <div className="max-w-xl text-center space-y-10 animate-in zoom-in duration-500">
           <div className="w-32 h-32 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xl"><Sparkles size={64} /></div>
           <div className="space-y-4"><h2 className="text-5xl font-black text-white uppercase tracking-tighter">Thank You.</h2><p className="text-xl text-slate-400 font-medium">Your generosity has been received. A digital receipt has been sent to your email.</p></div>

           <Button onClick={() => setStep('amount')} className={THEME.buttons.primary}>Give Again</Button>

        </div>
      </section>
    );
  }

  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950 relative overflow-hidden")}>
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

      <div className={THEME.spacing.container}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <span className={subTitleClass}>Generosity</span>
            <h2 className={sectionTitleClass}>{title || 'Fuel the Mission'}</h2>
          </div>
          <Card className="border-none shadow-2xl rounded-[4rem] bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden p-10 md:p-24 relative">

            {error && (
              <div className="mb-8 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-6 py-4 text-sm font-medium text-rose-200">
                {error}
              </div>
            )}

            {step === 'amount' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {presets.map(p => (
                    <button key={p} onClick={() => setAmount(p)} className={cn("h-24 rounded-3xl font-black text-2xl transition-all", amount === p ? "bg-indigo-600 text-white shadow-2xl" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white")}>₹{p}</button>
                  ))}

                </div>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-40 bg-white/5 border border-white/10 rounded-[2.5rem] text-7xl font-black text-white text-center outline-none focus:border-white/20" placeholder="0.00" />
                <Button onClick={() => setStep('details')} className={cn(THEME.buttons.primary, "w-full")}>Continue Giving</Button>

              </div>
            )}
            {step === 'details' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-10">
                <div className="space-y-8">
                   <input type="text" value={donorData.name} onChange={(e) => setDonorData({...donorData, name: e.target.value})} className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl px-10 font-black text-white outline-none" placeholder="Full Name" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <input type="email" value={donorData.email} onChange={(e) => setDonorData({...donorData, email: e.target.value})} className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl px-10 font-black text-white outline-none" placeholder="Email Address" />
                      <input type="tel" value={donorData.phone} onChange={(e) => setDonorData({...donorData, phone: e.target.value})} className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl px-10 font-black text-white outline-none" placeholder="Phone Number" />
                   </div>
                </div>

                <div className="flex gap-6">
                  <Button 
                    onClick={() => setStep('amount')} 
                    className="h-20 px-12 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black uppercase text-xs tracking-[0.3em] transition-all"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleInitiatePayment} 
                    className={cn(THEME.buttons.primary, "flex-1")}
                  >
                    Complete Gift of ₹{amount}
                  </Button>
                </div>
              </div>
            )}
            {(step === 'processing' || step === 'verifying') && <div className="h-[400px] flex flex-col items-center justify-center gap-12 animate-in fade-in"><div className="w-20 h-20 rounded-[2.5rem] border-[6px] border-indigo-600 border-t-transparent animate-spin" /><p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">{step === 'verifying' ? 'Verifying Payment...' : 'Processing Securely...'}</p></div>}
          </Card>
        </div>
      </div>
    </section>
  );
}

export function SharedContactFull({
  config,
  orgSettings,
}: {
  config?: { title?: string };
  orgSettings?: {
    organization?: { address?: string; email?: string; phone?: string; serviceTimes?: string | null };
  } | null;
}) {
  const org = orgSettings?.organization;
  const address = org?.address?.trim() || 'Visit us at our main campus.';
  const phone = org?.phone?.trim();
  const email = org?.email?.trim();
  const serviceTimesRaw = org?.serviceTimes?.trim();
  const serviceLines = serviceTimesRaw
    ? serviceTimesRaw.split(/\n/).map((s) => s.trim()).filter(Boolean)
    : ['Sunday Morning — 9:00 AM • 11:00 AM', 'Sunday Night — 5:00 PM'];
  return (
    <section className="bg-slate-950">

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className={cn(THEME.spacing.section, "px-10 md:px-20 lg:px-40")}>
          <span className={subTitleClass}>Get In Touch</span>
          <h2 className={sectionTitleClass}>Connect With <br/>Our Team.</h2>

          <div className="mt-20 space-y-12">
            <div className="flex gap-8 group">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shadow-xl"><MapPin size={28} /></div>
              <div><h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Campus Location</h4><p className="text-xl text-slate-400 font-medium whitespace-pre-line">{address}</p></div>
            </div>

            {(phone || email) && (
            <div className="flex gap-8 group">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-xl"><MessageCircle size={28} /></div>
              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Reach Us</h4>
                <p className="text-xl text-slate-400 font-medium">
                  {phone && <span className="block">{phone}</span>}
                  {email && <a href={`mailto:${email}`} className="block text-indigo-400 hover:text-indigo-300">{email}</a>}
                </p>
              </div>
            </div>
            )}

          </div>
          <div className="mt-20 p-12 bg-indigo-600 rounded-[4rem] text-white shadow-2xl">
             <h4 className="text-3xl font-black uppercase tracking-tight mb-8">Service Times</h4>
             <div className="space-y-6">
                {serviceLines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      'font-black uppercase text-[11px] tracking-widest text-white/90',
                      i < serviceLines.length - 1 && 'border-b border-white/20 pb-6',
                    )}
                  >
                    {line}
                  </div>
                ))}
             </div>
          </div>
        </div>
        <div className="relative min-h-[600px] bg-slate-100 lg:rounded-l-[5rem] overflow-hidden">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.540422141548!2d-0.1216201!3d51.5072178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604b900d26973%3A0x4291f3172409ea92!2sTrafalgar%20Square!5e0!3m2!1sen!2suk!4v1715878423641!5m2!1sen!2suk" 
            className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 border-none"
            allowFullScreen loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export function SharedLeadershipGrid({ title, leaders }: { title: string; leaders: any[] }) {
  const list = leaders?.length ? leaders : [
    { name: 'David Chen', role: 'Senior Pastor', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
    { name: 'Sarah Miller', role: 'Worship Pastor', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
    { name: 'Marcus Bell', role: 'Executive Pastor', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e' }
  ];
  return (
    <section className={cn(THEME.spacing.section, "bg-slate-950")}>

      <div className={THEME.spacing.container}>
        <div className="mb-24 text-center">
          <span className={subTitleClass}>Our Team</span>
          <h2 className={sectionTitleClass}>{title || 'Leadership'}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {list.map((l: any, i: number) => (
            <div key={i} className="group text-center">
               <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden mb-8 shadow-2xl relative">
                 <ResilientImage src={l.image} fallbackSrc={IMAGE_FALLBACKS.portrait} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={l.name} />
                 <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 transition-all duration-500" />
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-2">{l.name}</h3>

               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600">{l.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SharedVisionStatement({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <section className="py-64 bg-slate-950 text-center relative overflow-hidden">
       <div className="absolute inset-0 flex items-center justify-center text-[30vw] font-black text-white/[0.03] uppercase tracking-tighter select-none pointer-events-none translate-y-24">VISION</div>
       <div className="relative z-10 max-w-7xl mx-auto px-10">
          <span className="text-[12px] font-black uppercase tracking-[1em] text-indigo-500 block mb-12">Our Eternal Mandate</span>
          <h2 className="text-6xl md:text-[14rem] font-black text-white uppercase tracking-tighter leading-[0.75] mb-20">{title || 'Built for Glory'}</h2>
          <p className="text-3xl md:text-6xl font-medium text-slate-400 max-w-5xl mx-auto leading-[1.1] italic tracking-tighter">"{subtitle || 'To reach people far from God and teach them how to follow Jesus step by radical step.'}"</p>
       </div>
    </section>
  );
}

export function SharedNextSteps({ config }: { config: any }) {
  const steps = [
    { title: 'New Here?', label: 'Plan Your Visit', icon: MapPin, href: '/contact' },
    { title: 'Growing?', label: 'Join a Group', icon: Users, href: '/ministries' },
    { title: 'Serving?', label: 'Volunteer', icon: Heart, href: '/ministries' }
  ];
  return (
    <section className={cn(THEME.spacing.section, "bg-indigo-600 text-white overflow-hidden relative")}>
       <div className={THEME.spacing.container}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map(s => (
              <div key={s.title} className="p-16 rounded-[4rem] bg-white/10 backdrop-blur-3xl border border-white/20 hover:bg-white hover:text-slate-950 transition-all duration-700 group">
                 <div className="w-16 h-16 rounded-2xl bg-white/20 group-hover:bg-slate-950 group-hover:text-white flex items-center justify-center mb-10 transition-colors">{React.createElement(s.icon, { size: 28 })}</div>
                 <h4 className="text-4xl font-black uppercase tracking-tighter mb-8">{s.title}</h4>
                 <a 
                   href={s.href}
                   className="h-16 px-10 rounded-2xl bg-white text-slate-950 group-hover:bg-slate-950 group-hover:text-white font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center border-none shadow-xl"
                 >
                    {s.label}
                 </a>
              </div>
            ))}
          </div>
       </div>
    </section>
  );
}

// --- Aliases for renderer compatibility ---
export const SharedEventListView = SharedEventCalendar;
export const SharedContactView = SharedContactFull;

export function SharedLivestreamBanner({
  url,
  title,
  primaryColor,
}: {
  url: string;
  title?: string;
  primaryColor?: string;
}) {
  if (!url?.trim()) return null;
  const embed = url.includes('youtube.com/watch')
    ? url.replace('watch?v=', 'embed/')
    : url.includes('youtu.be/')
      ? url.replace('youtu.be/', 'youtube.com/embed/')
      : url;
  return (
    <section className="bg-slate-900 border-y border-white/10">
      <div className={cn(THEME.spacing.container, 'py-16')}>
        <span className={subTitleClass}>Live now</span>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-8">
          {title || 'Join us online'}
        </h2>
        <div className="aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-black">
          {embed.includes('embed') || embed.includes('vimeo') ? (
            <iframe
              title="Live stream"
              src={embed}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-full text-white font-black uppercase tracking-widest text-sm"
              style={{ color: primaryColor }}
            >
              Watch live stream
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function SharedSermonGrid({ title, sermons }: { title?: string; sermons?: PublicSermonRow[] }) {
  const list = sermons ?? [];
  const speakers = React.useMemo(
    () => [...new Set(list.map((s) => s.speaker).filter(Boolean))] as string[],
    [list],
  );
  const seriesList = React.useMemo(
    () => [...new Set(list.map((s) => s.series).filter(Boolean))] as string[],
    [list],
  );
  const [speakerFilter, setSpeakerFilter] = React.useState<string>('all');
  const [seriesFilter, setSeriesFilter] = React.useState<string>('all');
  const filtered = list.filter((s) => {
    if (speakerFilter !== 'all' && s.speaker !== speakerFilter) return false;
    if (seriesFilter !== 'all' && s.series !== seriesFilter) return false;
    return true;
  });
  const display = filtered.length ? filtered : list;
  return (
  <section className={cn(THEME.spacing.section, "bg-slate-950")}>
    <div className={THEME.spacing.container}>
      <div className="mb-12">
        <span className={subTitleClass}>Series & Messages</span>
        <h2 className={sectionTitleClass}>{title || 'Latest Sermons'}</h2>
      </div>
      {(speakers.length > 1 || seriesList.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-12">
          {speakers.length > 1 && (
            <select value={speakerFilter} onChange={(e) => setSpeakerFilter(e.target.value)} className="h-12 px-4 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-black uppercase tracking-widest" aria-label="Filter by speaker">
              <option value="all">All speakers</option>
              {speakers.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
            </select>
          )}
          {seriesList.length > 0 && (
            <select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} className="h-12 px-4 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-black uppercase tracking-widest" aria-label="Filter by series">
              <option value="all">All series</option>
              {seriesList.map((sr) => <option key={sr} value={sr}>{sr}</option>)}
            </select>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {display.map((s, i) => {
          const href = s.id ? `/sermons/watch/${s.id}` : s.videoUrl || '/sermons';
          return (
          <a key={s.id || i} href={href} className="group block">
            <Card className="border-none shadow-none bg-transparent">
            <div className="aspect-video rounded-[2.5rem] overflow-hidden mb-8 shadow-xl relative">
              <ResilientImage src={s.thumbnail || IMAGE_FALLBACKS.sermon} fallbackSrc={IMAGE_FALLBACKS.sermon} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={s.title || 'Sermon thumbnail'} />
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle size={48} className="text-white" /></div>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{s.title || 'Message'}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{s.speaker || 'Teaching team'}{s.series ? ` · ${s.series}` : ''}</p>
          </Card>
          </a>
          );
        })}
      </div>
    </div>
  </section>
  );
}

export const SharedGivingCtaView = SharedGivingFlow;
export const SharedQRPayment = SharedGivingFlow;
export const SharedWelcomeVision = SharedVisionStatement;
export const SharedPrayerCTA = SharedPrayerExperience;
export const SharedWorshipSection = SharedVisionStatement;
export const SharedTimelineSection = SharedAboutStory;
export const SharedValuesSection = SharedMissionVision;
export const SharedFaqSection = SharedVisionStatement;
export const SharedMinistryHighlight = SharedMinistryDetailList;
export const SharedPastoralNote = SharedVisionStatement;
export const SharedMinistryGrid = SharedMinistryDetailList;
export const SharedImpactSection = SharedImpactStats;

