import React, { useState, useEffect } from 'react';
import {
  Building2,
  Palette,
  Wallet,
  CreditCard,
  FileSignature,
  MonitorCog,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiFetch, apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { ModuleHeader, ActionButton, PageLayout } from '@/components/modules/ModuleHeader';
import { AccountSelect } from '@/components/settings/AccountSelect';
import { BrandingUploadField } from '@/components/settings/BrandingUploadField';
import { AccountChartPanel } from '@/components/settings/AccountChartPanel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OpsFeedback } from '@/components/operations/OpsFeedback';
import { StructureModule } from '@/modules/structure/StructureModule';

type SettingSection = 'organization' | 'branding' | 'financial' | 'paymentGateway' | 'documents' | 'operational' | 'system' | 'structure';

const UCOS_SETTINGS_SECTION = 'ucos_settings_section';

function resolveInitialSection(initialSection?: string): SettingSection {
  if (initialSection === 'structure') return 'structure';
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(UCOS_SETTINGS_SECTION);
    if (stored === 'structure') {
      sessionStorage.removeItem(UCOS_SETTINGS_SECTION);
      return 'structure';
    }
  }
  return 'organization';
}

function settingsPayloadFromState(settings: ReturnType<typeof useSettings>['settings']) {
  const { _meta, ...rest } = settings;
  return rest;
}

export function SettingsModule({ initialSection }: { initialSection?: string } = {}) {
  const { settings, setSettings, refreshSettings, error: contextError, isLoading } = useSettings();
  const [activeSection, setActiveSection] = useState<SettingSection>(() => resolveInitialSection(initialSection));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [accountRefreshKey, setAccountRefreshKey] = React.useState(0);
  const [confirmPeriodLock, setConfirmPeriodLock] = React.useState(false);
  const [pendingLockDate, setPendingLockDate] = React.useState('');
  const [testingCashfree, setTestingCashfree] = React.useState(false);

  // Show context error (e.g. settings failed to load from server) only once
  useEffect(() => {
    if (contextError) {
      setMessage({ type: 'error', text: contextError });
    }
  }, [contextError]);

  React.useEffect(() => {
    if (initialSection === 'structure') setActiveSection('structure');
  }, [initialSection]);

  const sidebarItems = [
    { id: 'organization', label: 'Organization', icon: Building2, description: 'Identity & contact info' },
    { id: 'structure', label: 'Church Structure', icon: Layers, description: 'Campuses, ministries & hierarchy' },
    { id: 'branding', label: 'Branding', icon: Palette, description: 'Colors & theme' },
    { id: 'financial', label: 'Financial', icon: Wallet, description: 'Currency & accounts' },
    { id: 'paymentGateway', label: 'Online Giving', icon: CreditCard, description: 'Cashfree & cards' },
    { id: 'documents', label: 'Documents & Signatures', icon: FileSignature, description: 'Seals & signs' },
    { id: 'operational', label: 'Church workflows', icon: MonitorCog, description: 'Tasks, care & notifications' },
    { id: 'system', label: 'System Preferences', icon: MonitorCog, description: 'Storage, locale & audit' },
  ];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await apiRequest<unknown>('settings', {
        method: 'POST',
        body: settingsPayloadFromState(settings),
      });
      parseApiResponse(response);
      await refreshSettings();
      setMessage({ type: 'success', text: 'System settings saved successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: formatApiError(e) });
    } finally {
      setSaving(false);
    }
  };

  const testCashfree = async () => {
    setTestingCashfree(true);
    setMessage(null);
    try {
      await apiRequest('settings/test-cashfree', {
        method: 'POST',
        body: {
          cashfreeAppId: settings.paymentGateway.cashfreeAppId,
          cashfreeSecretKey: settings.paymentGateway.cashfreeSecretKey,
          cashfreeEnvironment: settings.paymentGateway.cashfreeEnvironment,
        },
      });
      setMessage({ type: 'success', text: 'Cashfree credentials verified successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: formatApiError(e) });
    } finally {
      setTestingCashfree(false);
    }
  };

  const updateSection = (section: SettingSection, key: string, value: any) => {
    setSettings(prev => {
      const newSection = { ...prev[section], [key]: value };
      return { ...prev, [section]: newSection };
    });
  };

  const updateNestedSection = (section: SettingSection, nestedObj: string, key: string, value: any) => {
    setSettings(prev => {
      const parentObj = (prev as any)[section][nestedObj];
      const newNestedObj = { ...parentObj, [key]: value };
      const newSection = { ...prev[section], [nestedObj]: newNestedObj };
      return { ...prev, [section]: newSection };
    });
  };

  const handleFileUpload = (section: SettingSection, key: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose an image file (PNG, JPEG, WebP, GIF, or SVG).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be 5 MB or smaller.' });
      return;
    }
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch('upload', { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Upload failed');
      }
      const result = await response.json();
      const data = parseApiResponse<{ url: string }>(result);
      updateSection(section, key, data.url);
      setMessage({ type: 'success', text: 'Image uploaded — click Save All Settings to persist.' });
    } catch (error) {
      setMessage({ type: 'error', text: formatApiError(error) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3 text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-medium">Loading settings…</span>
      </div>
    );
  }

  return (
    <PageLayout className="max-w-6xl mx-auto pb-24">
      <ModuleHeader
        title="System Settings"
        subtitle={
          <span className="flex items-center">
            Configure global organizational parameters and integrations.
            {settings._meta && (
              <span className="ml-2 text-xs text-slate-400 font-normal">
                v{settings._meta.version}
                {settings._meta.isDefault && ' · defaults'}
                {settings._meta.updatedAt && ` · saved ${new Date(settings._meta.updatedAt).toLocaleDateString()}`}
              </span>
            )}
          </span>
        }
        status="live"
        icon={MonitorCog}
        actions={
          <ActionButton 
            label={saving ? 'Saving...' : 'Save All Settings'} 
            icon={Save} 
            variant="primary" 
            onClick={handleSave} 
            disabled={saving}
          />
        }
      />

      {message?.type === 'success' && (
        <OpsFeedback message={message.text} onDismiss={() => setMessage(null)} />
      )}
      {message?.type === 'error' && (
        <div className="p-4 rounded-lg flex items-center gap-3 font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <aside className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingSection)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border",
                activeSection === item.id 
                  ? "bg-indigo-50 border-indigo-100 shadow-sm" 
                  : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                activeSection === item.id 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-slate-100 text-slate-500"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={cn(
                  "font-bold text-sm",
                  activeSection === item.id ? "text-indigo-900" : "text-slate-700"
                )}>{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </button>
          ))}
        </aside>

        <main>
          {activeSection === 'structure' ? (
            <StructureModule embedded />
          ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <CardTitle className="text-xl text-slate-800">
                {sidebarItems.find(i => i.id === activeSection)?.label}
              </CardTitle>
              <CardDescription>
                {sidebarItems.find(i => i.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              
              {activeSection === 'organization' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Organization Name *</label>
                      <Input 
                        value={settings.organization.name}
                        onChange={(e) => updateSection('organization', 'name', e.target.value)}
                        placeholder="Grace Community Church" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <BrandingUploadField
                        label="Organization logo"
                        hint="App shell, login, and public website."
                        value={settings.organization.logo}
                        onChange={(url) => updateSection('organization', 'logo', url)}
                        onError={(t) => setMessage({ type: 'error', text: t })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Tagline</label>
                      <Input
                        value={(settings.organization as { tagline?: string }).tagline || ''}
                        onChange={(e) => updateSection('organization', 'tagline', e.target.value)}
                        placeholder="Welcoming everyone home"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Physical Address</label>
                      <Input 
                        value={settings.organization.address}
                        onChange={(e) => updateSection('organization', 'address', e.target.value)}
                        placeholder="123 Faith Avenue" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                      <Input 
                        value={settings.organization.phone}
                        onChange={(e) => updateSection('organization', 'phone', e.target.value)}
                        placeholder="+91 98765 43210" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Email Address</label>
                      <Input 
                        value={settings.organization.email}
                        onChange={(e) => updateSection('organization', 'email', e.target.value)}
                        placeholder="contact@church.org" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Registration Number</label>
                      <Input 
                        value={settings.organization.registrationNumber}
                        onChange={(e) => updateSection('organization', 'registrationNumber', e.target.value)}
                        placeholder="Reg No. 12345/2020" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Tax ID (PAN/GST)</label>
                      <Input 
                        value={settings.organization.taxId}
                        onChange={(e) => updateSection('organization', 'taxId', e.target.value)}
                        placeholder="ABCDE1234F" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'branding' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Primary Color</label>
                      <div className="flex gap-3">
                        <Input 
                          type="color" 
                          value={settings.branding.primaryColor}
                          onChange={(e) => updateSection('branding', 'primaryColor', e.target.value)}
                          className="w-14 h-10 p-1" 
                        />
                        <Input 
                          value={settings.branding.primaryColor}
                          onChange={(e) => updateSection('branding', 'primaryColor', e.target.value)}
                          className="flex-1 font-mono uppercase" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Secondary Color</label>
                      <div className="flex gap-3">
                        <Input 
                          type="color" 
                          value={settings.branding.secondaryColor}
                          onChange={(e) => updateSection('branding', 'secondaryColor', e.target.value)}
                          className="w-14 h-10 p-1" 
                        />
                        <Input 
                          value={settings.branding.secondaryColor}
                          onChange={(e) => updateSection('branding', 'secondaryColor', e.target.value)}
                          className="flex-1 font-mono uppercase" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Theme Mode</label>
                      <select 
                        value={settings.branding.themeMode}
                        onChange={(e) => updateSection('branding', 'themeMode', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <BrandingUploadField
                        label="Email header logo"
                        hint="Optional logo for email templates."
                        value={(settings.branding as { emailHeaderLogo?: string }).emailHeaderLogo || ''}
                        onChange={(url) => updateSection('branding', 'emailHeaderLogo', url)}
                        onError={(t) => setMessage({ type: 'error', text: t })}
                      />
                    </div>
                    <BrandingUploadField
                      label="Favicon"
                      hint="Browser tab icon (square image recommended)."
                      value={(settings.branding as { favicon?: string }).favicon || ''}
                      onChange={(url) => updateSection('branding', 'favicon', url)}
                      onError={(t) => setMessage({ type: 'error', text: t })}
                    />
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Public website tagline</label>
                      <Input
                        value={(settings.branding as { publicTagline?: string }).publicTagline || ''}
                        onChange={(e) => updateSection('branding', 'publicTagline', e.target.value)}
                        placeholder="A church for the city"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'financial' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Base Currency *</label>
                      <select 
                        value={settings.financial.currency}
                        onChange={(e) => updateSection('financial', 'currency', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Financial Year Start Month *</label>
                      <select 
                        value={settings.financial.financialYearStart}
                        onChange={(e) => updateSection('financial', 'financialYearStart', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="April">April (Standard Indian FY)</option>
                        <option value="January">January (Calendar Year)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Voucher Prefix</label>
                      <p className="text-xs text-slate-500">Used for payment, receipt, journal, contra, payroll, and event expense vouchers.</p>
                      <Input 
                        value={settings.financial.voucherPrefix}
                        onChange={(e) => updateSection('financial', 'voucherPrefix', e.target.value)}
                        placeholder="e.g. VCH-" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Numbering Format</label>
                      <p className="text-xs text-slate-500">Zero-pad width for voucher sequence. Donation receipts use RCP-FY-##### format.</p>
                      <Input 
                        value={settings.financial.numberingFormat}
                        onChange={(e) => updateSection('financial', 'numberingFormat', e.target.value)}
                        placeholder="e.g. 00000" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">Period lock (posting)</label>
                      <p className="text-xs text-slate-500">
                        Voucher dates on or before this day cannot be posted. Leave empty to allow all dates. Format: YYYY-MM-DD.
                      </p>
                      <Input
                        type="date"
                        value={settings.financial.lockedUntilDate || ''}
                        onChange={(e) => {
                          const v = e.target.value || '';
                          if (v && !settings.financial.lockedUntilDate) {
                            setPendingLockDate(v);
                            setConfirmPeriodLock(true);
                          } else {
                            updateSection('financial', 'lockedUntilDate', v);
                          }
                        }}
                      />
                    </div>
                  </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
                    Map the accounts used for gifts, bank deposits, and online payouts. Your accountant can help choose the right ledger accounts.
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                     <h4 className="text-sm font-bold text-slate-900">Everyday accounts (cash & income)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Cash on hand</label>
                          <AccountSelect key={`cash-${accountRefreshKey}`} filterType="Asset" value={settings.financial.defaultAccounts.cash || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'cash', id)} placeholder="Cash account" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Church bank account</label>
                          <p className="text-xs text-slate-500">Where settled online gifts arrive after reconciliation.</p>
                          <AccountSelect filterType="Asset" value={settings.financial.defaultAccounts.bank || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'bank', id)} placeholder="Bank account" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Tithes income</label>
                          <AccountSelect filterType="Revenue" value={settings.financial.defaultAccounts.tithes || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'tithes', id)} placeholder="Tithes" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Offerings income</label>
                          <AccountSelect filterType="Revenue" value={settings.financial.defaultAccounts.offerings || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'offerings', id)} placeholder="Offerings" />
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                     <h4 className="text-sm font-bold text-slate-900">Online giving (Cashfree) accounts</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Gateway clearing</label>
                          <p className="text-xs text-slate-500">Required for UPI/card gifts until settlement.</p>
                          <AccountSelect filterType="Asset" value={settings.financial.defaultAccounts.gatewayClearing || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'gatewayClearing', id)} placeholder="Clearing account" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Donor-covered fee income</label>
                          <AccountSelect filterType="Revenue" value={settings.financial.defaultAccounts.gatewayRecoveryIncome || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'gatewayRecoveryIncome', id)} placeholder="Recovery income" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Gateway processing fees</label>
                          <AccountSelect filterType="Expense" value={settings.financial.defaultAccounts.gatewayChargesExpense || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'gatewayChargesExpense', id)} placeholder="Fee expense" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Estimated fee % (donor calculator)</label>
                          <Input type="number" step="0.1" value={String(settings.financial.gatewayFeePercent ?? 1.8)} onChange={(e) => updateSection('financial', 'gatewayFeePercent', Number(e.target.value))} />
                        </div>
                     </div>
                  </div>

                  <AccountChartPanel onAccountsChange={() => setAccountRefreshKey((k) => k + 1)} />
                </div>
              )}

              {activeSection === 'paymentGateway' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-sm text-indigo-900">
                      <strong>Online giving</strong> uses Cashfree (UPI and cards). Gifts are held in a pending account until you import each payout and record the bank deposit in Finance → Settlements.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Accept online gifts</p>
                      <p className="text-xs text-slate-500">Turn off to hide public donate checkout while keeping records.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(settings.paymentGateway as { onlineGivingEnabled?: boolean }).onlineGivingEnabled !== false}
                      onChange={(e) => updateSection('paymentGateway', 'onlineGivingEnabled', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Primary gateway</label>
                    <select
                      value={settings.paymentGateway.primaryGateway || 'cashfree'}
                      onChange={(e) => updateSection('paymentGateway', 'primaryGateway', e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white"
                    >
                      <option value="cashfree">Cashfree (recommended)</option>
                      <option value="razorpay">Razorpay (legacy)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">Cashfree credentials</h4>
                    <p className="text-xs text-slate-500">From Cashfree Dashboard → Developers. Use Sandbox while testing; switch to Production only after UAT.</p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Environment</label>
                      <select
                        value={settings.paymentGateway.cashfreeEnvironment || 'sandbox'}
                        onChange={(e) => updateSection('paymentGateway', 'cashfreeEnvironment', e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white"
                      >
                        <option value="sandbox">Sandbox (testing)</option>
                        <option value="production">Production (live gifts)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">App ID</label>
                      <Input
                        value={settings.paymentGateway.cashfreeAppId || ''}
                        onChange={(e) => updateSection('paymentGateway', 'cashfreeAppId', e.target.value)}
                        placeholder="TEST… or live App ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Secret key</label>
                      <Input
                        type="password"
                        value={settings.paymentGateway.cashfreeSecretKey || ''}
                        onChange={(e) => updateSection('paymentGateway', 'cashfreeSecretKey', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Webhook secret</label>
                      <p className="text-xs text-slate-500">In Cashfree, set the webhook path to <code className="text-indigo-600">/api/v1/giving/webhooks/cashfree</code> on your live site URL.</p>
                      <Input
                        type="password"
                        value={settings.paymentGateway.cashfreeWebhookSecret || ''}
                        onChange={(e) => updateSection('paymentGateway', 'cashfreeWebhookSecret', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={testingCashfree}
                      onClick={() => void testCashfree()}
                      className="min-h-[44px]"
                    >
                      {testingCashfree ? 'Testing…' : 'Test Cashfree connection'}
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">Donor experience</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Thank-you message</label>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 border border-slate-200 rounded-md text-sm"
                        value={(settings.paymentGateway as { thankYouMessage?: string }).thankYouMessage || ''}
                        onChange={(e) => updateSection('paymentGateway', 'thankYouMessage', e.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings.paymentGateway as { donorConfirmationEmail?: boolean }).donorConfirmationEmail !== false}
                        onChange={(e) => updateSection('paymentGateway', 'donorConfirmationEmail', e.target.checked)}
                        className="h-4 w-4"
                      />
                      Send donor confirmation email when configured
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings.paymentGateway as { recurringGivingEnabled?: boolean }).recurringGivingEnabled === true}
                        onChange={(e) => updateSection('paymentGateway', 'recurringGivingEnabled', e.target.checked)}
                        className="h-4 w-4"
                      />
                      Enable recurring giving options (when supported)
                    </label>
                  </div>

                  <details className="pt-4 border-t border-slate-100">
                    <summary className="text-sm font-semibold text-slate-600 cursor-pointer">Razorpay (optional legacy)</summary>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Key ID</label>
                        <Input value={settings.paymentGateway.razorpayKeyId} onChange={(e) => updateSection('paymentGateway', 'razorpayKeyId', e.target.value)} placeholder="rzp_…" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Key secret</label>
                        <Input type="password" value={settings.paymentGateway.razorpayKeySecret} onChange={(e) => updateSection('paymentGateway', 'razorpayKeySecret', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Webhook secret</label>
                        <Input type="password" value={settings.paymentGateway.razorpayWebhookSecret} onChange={(e) => updateSection('paymentGateway', 'razorpayWebhookSecret', e.target.value)} />
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {activeSection === 'documents' && (
                <div className="space-y-8">
                  <p className="text-sm text-slate-600 max-w-2xl">
                    Signatures, seal, and organization logo (under Organization) appear on voucher PDFs and donation receipts.
                    Configure before go-live for CA-ready printouts.
                  </p>
                  <div className="space-y-4 max-w-lg">
                    <label className="text-sm font-semibold text-slate-700">Authorized Signatory Name</label>
                    <Input 
                      value={settings.documents.authorizedSignatoryName}
                      onChange={(e) => updateSection('documents', 'authorizedSignatoryName', e.target.value)}
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pastor Signature</label>
                      {settings.documents.pastorSignature ? (
                        <div className="bg-white p-4 rounded border h-24 flex justify-center items-center">
                          <img src={settings.documents.pastorSignature} alt="Pastor Signature" className="max-h-16 object-contain" />
                        </div>
                      ) : (
                        <div className="bg-slate-100 p-4 rounded border h-24 flex justify-center items-center text-slate-400 text-sm">
                          No signature
                        </div>
                      )}
                      <Input type="file" accept="image/*" onChange={handleFileUpload('documents', 'pastorSignature')} className="text-xs" />
                    </div>

                    <div className="space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accountant Signature</label>
                      {settings.documents.accountantSignature ? (
                        <div className="bg-white p-4 rounded border h-24 flex justify-center items-center">
                          <img src={settings.documents.accountantSignature} alt="Accountant Signature" className="max-h-16 object-contain" />
                        </div>
                      ) : (
                        <div className="bg-slate-100 p-4 rounded border h-24 flex justify-center items-center text-slate-400 text-sm">
                          No signature
                        </div>
                      )}
                      <Input type="file" accept="image/*" onChange={handleFileUpload('documents', 'accountantSignature')} className="text-xs" />
                    </div>

                    <div className="space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Seal / Stamp</label>
                      {settings.documents.sealStamp ? (
                        <div className="bg-white p-4 rounded border h-24 flex justify-center items-center">
                          <img src={settings.documents.sealStamp} alt="Seal" className="max-h-16 object-contain" />
                        </div>
                      ) : (
                        <div className="bg-slate-100 p-4 rounded border h-24 flex justify-center items-center text-slate-400 text-sm">
                          No seal
                        </div>
                      )}
                      <Input type="file" accept="image/*" onChange={handleFileUpload('documents', 'sealStamp')} className="text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'operational' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Notification Delivery</label>
                      <select 
                        value={settings.operational?.notificationDelivery || 'in_app'}
                        onChange={(e) => updateSection('operational', 'notificationDelivery', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="in_app">In-App Only (Recommended)</option>
                        <option value="email">Email Only</option>
                        <option value="both">Both In-App & Email</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Default Care Case Confidentiality</label>
                      <select 
                        value={settings.operational?.defaultConfidentiality || 'PUBLIC'}
                        onChange={(e) => updateSection('operational', 'defaultConfidentiality', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="PUBLIC">Public (All Staff)</option>
                        <option value="PASTORAL">Pastoral (Counselors & Pastors)</option>
                        <option value="RESTRICTED">Restricted (Admins Only)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.operational?.autoAssignCareCases || false}
                          onChange={(e) => updateSection('operational', 'autoAssignCareCases', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        Auto-Assign New Care Cases to Default Pastor
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.operational?.requireFollowUpApproval || true}
                          onChange={(e) => updateSection('operational', 'requireFollowUpApproval', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        Require Approval for External Follow-ups
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'system' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Timezone</label>
                      <select 
                        value={settings.system.timezone}
                        onChange={(e) => updateSection('system', 'timezone', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Date Format</label>
                      <select 
                        value={settings.system.dateFormat}
                        onChange={(e) => updateSection('system', 'dateFormat', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Language</label>
                      <select 
                        value={settings.system.language}
                        onChange={(e) => updateSection('system', 'language', e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Data Retention Policy (Days)</label>
                      <Input 
                        type="number"
                        value={settings.system?.dataRetentionDays || 365}
                        onChange={(e) => updateSection('system', 'dataRetentionDays', parseInt(e.target.value))}
                      />
                      <p className="text-[10px] text-slate-400 font-medium">Auto-archive activity logs older than this limit.</p>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center pt-6">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.system?.auditLogging || true}
                          onChange={(e) => updateSection('system', 'auditLogging', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        Keep a detailed change log
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium ml-6">Recommended for treasurers and administrators who need a full history of changes.</p>
                    </div>
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmPeriodLock}
        title="Enable period lock?"
        description="Voucher dates on or before this day will be blocked from posting. Existing posted entries are not changed."
        confirmLabel="Enable lock"
        variant="destructive"
        onCancel={() => {
          setConfirmPeriodLock(false);
          setPendingLockDate('');
        }}
        onConfirm={() => {
          updateSection('financial', 'lockedUntilDate', pendingLockDate);
          setConfirmPeriodLock(false);
          setPendingLockDate('');
        }}
      />
    </PageLayout>
  );
}
