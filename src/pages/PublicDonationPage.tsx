import * as React from 'react';
import { DONATION_CATEGORIES, DONATION_LANGS, type DonationLang, t } from '@/lib/donationI18n';
import { apiFetch, TENANT_FALLBACK } from '@/lib/apiClient';

declare global {
  interface Window {
    Cashfree?: new (opts: { mode: string }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => void;
    };
  }
}

function loadCashfreeSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(s);
  });
}

export function PublicDonationPage() {
  const [lang, setLang] = React.useState<DonationLang>('en');
  const [step, setStep] = React.useState(0);
  const [category, setCategory] = React.useState<string>(DONATION_CATEGORIES[0]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [amount, setAmount] = React.useState('1000');
  const [coverFee, setCoverFee] = React.useState(false);
  const [anonymous, setAnonymous] = React.useState(false);
  const [feePreview, setFeePreview] = React.useState<{ donationAmount: number; gatewayFee: number; grossAmount: number } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const tenantId = TENANT_FALLBACK;

  const apiPost = async (path: string, body: unknown) => {
    const res = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || json?.error || 'Request failed');
    return json.data ?? json;
  };

  React.useEffect(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setFeePreview(null);
      return;
    }
    const tmr = setTimeout(() => {
      void apiPost('website/public/giving/estimate-fee', { amount: n, donorCoveredFee: coverFee })
        .then(setFeePreview)
        .catch(() => setFeePreview(null));
    }, 300);
    return () => clearTimeout(tmr);
  }, [amount, coverFee]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    const paymentId = params.get('cf_payment_id') || params.get('payment_id');
    if (orderId && paymentId) {
      setBusy(true);
      void apiPost('website/public/giving/verify', {
        gateway: 'cashfree',
        cashfreeOrderId: orderId,
        cashfreePaymentId: paymentId,
      })
        .then(() => setDone(true))
        .catch((e) => setError(e instanceof Error ? e.message : 'Verification failed'))
        .finally(() => setBusy(false));
    }
  }, []);

  const startPayment = async () => {
    try {
      setBusy(true);
      setError(null);
      const order = await apiPost('website/public/giving/order', {
        gateway: 'cashfree',
        amount: Number(amount),
        donorCoveredFee: coverFee,
        donorName: anonymous ? undefined : name,
        donorPhone: phone,
        donorEmail: 'donor@example.com',
        isAnonymous: anonymous,
        donationCategory: category,
      });
      if (order.gateway !== 'cashfree' || !order.paymentSessionId) {
        throw new Error('Cashfree is not available. Configure gateway in Settings.');
      }
      await loadCashfreeSdk();
      const mode = order.environment === 'production' ? 'production' : 'sandbox';
      const cf = new window.Cashfree!({ mode });
      cf.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: '_self',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t(lang, 'error'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-4">
          <p className="text-2xl font-black text-emerald-700">✓</p>
          <p className="text-lg font-semibold text-slate-800">{t(lang, 'success')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <header className="text-center space-y-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as DonationLang)}
            className="text-xs font-bold uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {DONATION_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <h1 className="text-3xl font-black text-slate-900">{t(lang, 'title')}</h1>
          <p className="text-sm text-slate-500">{t(lang, 'subtitle')}</p>
        </header>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm px-4 py-3">{error}</div>
        )}

        {step === 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600">{t(lang, 'stepType')}</h2>
            <div className="grid grid-cols-1 gap-2">
              {DONATION_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    category === c ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold text-sm"
              onClick={() => setStep(1)}
            >
              {t(lang, 'continue')}
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600">{t(lang, 'stepDetails')}</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              {t(lang, 'anonymous')}
            </label>
            {!anonymous && (
              <input
                className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm"
                placeholder={t(lang, 'name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm"
              placeholder={t(lang, 'phone')}
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm font-bold"
              placeholder={t(lang, 'amount')}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            />
            <label className="block space-y-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={coverFee} onChange={(e) => setCoverFee(e.target.checked)} />
                {t(lang, 'coverFee')}
              </span>
              <span className="text-xs text-slate-500">{t(lang, 'coverFeeHint')}</span>
            </label>
            {feePreview && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1 text-slate-600">
                <p>Donation: ₹{feePreview.donationAmount.toFixed(2)}</p>
                {coverFee && <p>Processing: ₹{feePreview.gatewayFee.toFixed(2)}</p>}
                <p className="font-bold text-slate-900">Total: ₹{feePreview.grossAmount.toFixed(2)}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold" onClick={() => setStep(0)}>
                Back
              </button>
              <button
                type="button"
                disabled={busy || !phone || Number(amount) <= 0}
                className="flex-1 h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
                onClick={() => void startPayment()}
              >
                {busy ? t(lang, 'loading') : t(lang, 'payNow')}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

