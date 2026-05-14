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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';

type SettingSection = 'organization' | 'branding' | 'financial' | 'paymentGateway' | 'documents' | 'operational' | 'system';

export function SettingsModule() {
  const { settings, setSettings, refreshSettings, error: contextError } = useSettings();
  const [activeSection, setActiveSection] = useState<SettingSection>('organization');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Show context error (e.g. settings failed to load from server) only once
  useEffect(() => {
    if (contextError) {
      setMessage({ type: 'error', text: contextError });
    }
  }, [contextError]);

  const sidebarItems = [
    { id: 'organization', label: 'Organization', icon: Building2, description: 'Identity & contact info' },
    { id: 'branding', label: 'Branding', icon: Palette, description: 'Colors & theme' },
    { id: 'financial', label: 'Financial', icon: Wallet, description: 'Currency & accounts' },
    { id: 'paymentGateway', label: 'Payment Gateway', icon: CreditCard, description: 'Razorpay config' },
    { id: 'documents', label: 'Documents & Signatures', icon: FileSignature, description: 'Seals & signs' },
    { id: 'operational', label: 'Operational Defaults', icon: MonitorCog, description: 'Workflows & care defaults' },
    { id: 'system', label: 'System Preferences', icon: MonitorCog, description: 'Storage, locale & audit' },
  ];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await apiRequest<unknown>('settings', { 
        method: 'POST', 
        body: settings
      });
      parseApiResponse(response);
      await refreshSettings();
      setMessage({ type: 'success', text: 'System settings saved successfully.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (e) {
      setMessage({ type: 'error', text: formatApiError(e) });
    } finally {
      setSaving(false);
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
    if (!file) return;

    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Using fetch with manually built headers because apiRequest handles JSON bodies by default
      // but we need to pass the auth token and tenant id.
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('auth_tenant_id') || 'default-tenant-id';
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api/v1'}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const data = parseApiResponse<{ url: string }>(result);
      updateSection(section, key, data.url);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500 text-left">
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

      {message && (
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-3 font-medium",
          message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
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
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Organization Logo</label>
                      <div className="flex items-center gap-4">
                        {settings.organization.logo && (
                          <img src={settings.organization.logo} alt="Logo" className="w-10 h-10 object-contain bg-slate-50 rounded border" />
                        )}
                        <div className="flex-1">
                           <Input 
                             type="file" 
                             accept="image/*"
                             onChange={handleFileUpload('organization', 'logo')}
                             className="text-xs"
                           />
                        </div>
                      </div>
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
                      <Input 
                        value={settings.financial.voucherPrefix}
                        onChange={(e) => updateSection('financial', 'voucherPrefix', e.target.value)}
                        placeholder="e.g. VCH-" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Numbering Format</label>
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
                        onChange={(e) => updateSection('financial', 'lockedUntilDate', e.target.value || '')}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                     <h4 className="text-sm font-bold text-slate-900 mb-4">Default Account Mapping</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Default Cash Account</label>
                          <Input 
                            value={settings.financial.defaultAccounts.cash}
                            onChange={(e) => updateNestedSection('financial', 'defaultAccounts', 'cash', e.target.value)}
                            placeholder="Account ID or Code" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Default Bank Account</label>
                          <Input 
                            value={settings.financial.defaultAccounts.bank}
                            onChange={(e) => updateNestedSection('financial', 'defaultAccounts', 'bank', e.target.value)}
                            placeholder="Account ID or Code" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Default Tithes Account</label>
                          <Input 
                            value={settings.financial.defaultAccounts.tithes}
                            onChange={(e) => updateNestedSection('financial', 'defaultAccounts', 'tithes', e.target.value)}
                            placeholder="Account ID or Code" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase">Default Offerings Account</label>
                          <Input 
                            value={settings.financial.defaultAccounts.offerings}
                            onChange={(e) => updateNestedSection('financial', 'defaultAccounts', 'offerings', e.target.value)}
                            placeholder="Account ID or Code" 
                          />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {activeSection === 'paymentGateway' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                     <p className="text-sm text-indigo-800 font-medium">Currently supporting Razorpay for seamless domestic and international collections. If providing one key, all three are required.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Razorpay Key ID</label>
                      <Input 
                        value={settings.paymentGateway.razorpayKeyId}
                        onChange={(e) => updateSection('paymentGateway', 'razorpayKeyId', e.target.value)}
                        placeholder="rzp_live_..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Razorpay Key Secret</label>
                      <Input 
                        type="password"
                        value={settings.paymentGateway.razorpayKeySecret}
                        onChange={(e) => updateSection('paymentGateway', 'razorpayKeySecret', e.target.value)}
                        placeholder="••••••••••••••••" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Webhook Secret</label>
                      <Input 
                        type="password"
                        value={settings.paymentGateway.razorpayWebhookSecret}
                        onChange={(e) => updateSection('paymentGateway', 'razorpayWebhookSecret', e.target.value)}
                        placeholder="••••••••••••••••" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'documents' && (
                <div className="space-y-8">
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
                      <p className="text-[10px] text-slate-400 font-medium">Auto-archive operational logs older than this limit.</p>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center pt-6">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.system?.auditLogging || true}
                          onChange={(e) => updateSection('system', 'auditLogging', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        Enable Strict Audit Logging
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium ml-6">Required for SOC-2 or internal compliance.</p>
                    </div>
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
