import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { VITE_TENANT_DEFAULT } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';
import { formatEventDateParts } from '@/lib/websiteOperationalData';
import { usePublicSeo } from '@/lib/publicSeo';
import {
  SharedNavbar,
  SharedFooter,
  ResilientImage,
  IMAGE_FALLBACKS,
} from '@/lib/websiteSharedBlocks';

type PublicEventDetail = {
  id: string;
  name: string;
  type: string;
  date: string;
  location?: string;
  campusName?: string;
  description?: string;
  imageUrl?: string;
  speaker?: string;
  category?: string;
  registrationOpen: boolean;
  registrationCount?: number;
  capacity?: number;
  spotsRemaining?: number;
};

function readSuccess<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (o.status !== 'success' || o.data === undefined) return null;
  return o.data as T;
}

export function PublicEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [event, setEvent] = React.useState<PublicEventDetail | null>(null);
  const [orgName, setOrgName] = React.useState('Church');
  const [primaryColor, setPrimaryColor] = React.useState('#4F46E5');
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [registering, setRegistering] = React.useState(false);
  const [registered, setRegistered] = React.useState(false);
  const [registerError, setRegisterError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError('Event not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const headers = { 'x-tenant-id': VITE_TENANT_DEFAULT };
        const [evRes, settingsRes] = await Promise.all([
          apiFetch(`website/public/events/${encodeURIComponent(id)}`, { headers }),
          apiFetch('website/public/settings', { headers }),
        ]);
        const evJson = await evRes.json();
        const settingsJson = await settingsRes.json();
        if (cancelled) return;
        const settings = readSuccess<{ organization?: { name?: string }; branding?: { primaryColor?: string } }>(settingsJson);
        if (settings?.organization?.name) setOrgName(settings.organization.name);
        if (settings?.branding?.primaryColor) setPrimaryColor(settings.branding.primaryColor);
        if (!evRes.ok || evJson.status !== 'success') {
          setError('This event is not available on the website.');
          setEvent(null);
          return;
        }
        setEvent(readSuccess<PublicEventDetail>(evJson));
      } catch {
        if (!cancelled) setError('Unable to load event.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  usePublicSeo({
    title: event?.name ?? 'Event',
    description: event?.description ?? `${event?.name ?? 'Event'} — ${orgName}`,
    siteName: orgName,
    canonicalPath: id ? `/events/${id}` : '/events',
    imageUrl: event?.imageUrl,
  });

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await apiFetch(`website/public/events/${encodeURIComponent(id)}/register`, {
        method: 'POST',
        headers: { 'x-tenant-id': VITE_TENANT_DEFAULT, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        setRegisterError(json.message ?? json.error ?? 'Registration failed');
        return;
      }
      setRegistered(true);
    } catch {
      setRegisterError('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const dateParts = event ? formatEventDateParts(event.date) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SharedNavbar orgName={orgName} primaryColor={primaryColor} />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <Link to="/events" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> All events
        </Link>

        {loading && <p className="text-slate-400 font-medium">Loading event…</p>}
        {error && <p className="text-rose-400 font-medium">{error}</p>}

        {event && dateParts && (
          <>
            {event.imageUrl && (
              <ResilientImage
                src={event.imageUrl}
                fallbackSrc={IMAGE_FALLBACKS.sermon}
                alt={event.name}
                className="w-full h-56 md:h-72 object-cover rounded-3xl"
              />
            )}
            <div className="space-y-4">
              {event.category && (
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{event.category}</span>
              )}
              <h1 className="text-4xl font-black tracking-tight">{event.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {dateParts.weekday}, {dateParts.month} {dateParts.day} · {dateParts.timeLabel}
                </span>
                {(event.location || event.campusName) && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {[event.campusName, event.location].filter(Boolean).join(' · ')}
                  </span>
                )}
                {event.speaker && (
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {event.speaker}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              )}
            </div>

            {event.registrationOpen && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-6">
                <h2 className="text-xl font-black">Register</h2>
                {event.capacity != null && (
                  <p className="text-sm text-slate-400">
                    {event.spotsRemaining != null
                      ? `${event.spotsRemaining} spots remaining`
                      : `${event.registrationCount ?? 0} registered`}
                    {event.capacity ? ` · capacity ${event.capacity}` : ''}
                  </p>
                )}
                {registered ? (
                  <div className="flex items-center gap-3 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                    You are registered. We look forward to seeing you.
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={submitRegistration}>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full h-14 rounded-2xl bg-slate-900 border border-white/10 px-5 font-bold text-white"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full h-14 rounded-2xl bg-slate-900 border border-white/10 px-5 font-bold text-white"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full h-14 rounded-2xl bg-slate-900 border border-white/10 px-5 font-bold text-white"
                    />
                    {registerError && <p className="text-sm text-rose-400">{registerError}</p>}
                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-xs tracking-widest disabled:opacity-60"
                    >
                      {registering ? 'Submitting…' : 'Complete registration'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <SharedFooter orgName={orgName} />
    </div>
  );
}
