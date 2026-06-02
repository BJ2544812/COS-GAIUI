import * as React from 'react';
import {
  Shield,
  Activity,
  ToggleLeft,
  Building2,
  Users,
  Download,
  ScrollText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ModuleHeader } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse, triggerBrowserDownload } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import type { ERPModule } from '@/types';
import type { FeatureFlagMap } from '@/lib/featureFlags';
import { OpsStatusBadge } from '@/components/operations/OpsStatusBadge';
import { OPS_CARD } from '@/lib/operationalStatus';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type Tab = 'health' | 'incidents' | 'operator' | 'governance' | 'flags' | 'audit' | 'exports' | 'deployment';

type IncidentPanel = {
  summary: {
    overall: string;
    openIncidents: number;
    failedWorkflows: number;
    pendingWorkflows: number;
    degradedServices: number;
    realtimeUp: boolean;
  };
  incidents: Array<{ id: string; severity: string; category: string; title: string; detail?: string; createdAt: string }>;
  failedEvents: Array<{ id: string; eventName: string; status: string; error?: string | null }>;
  backupRuns: Array<{ id: string; status: string; createdAt: string; errorDetail?: string | null }>;
  queueMetrics: { mode: string; waiting?: number; failed?: number; active?: number };
  workerHealth: { redisConfigured: boolean; socketHub: boolean };
};

type AdminOverview = {
  health: { overall: string; probes: Array<{ name: string; status: string; detail?: string }> };
  featureFlags: FeatureFlagMap;
  campuses: Array<{ id: string; name: string; type: string | null }>;
  users: Array<{ id: string; email: string; username: string; status: string; role: { name: string } }>;
  eventQueue: { pending: number; processed: number; failed: number };
  recentFailures: Array<{ id: string; eventName: string; status: string; occurredAt: string; error?: string | null }>;
};

const FLAG_LABELS: Record<keyof FeatureFlagMap, string> = {
  sundayMode: 'Sunday service live view',
  ministryIntelligence: 'Church snapshot on Home',
  offlineAttendance: 'Attendance when internet is slow',
  executiveDashboard: 'Church overview on Home',
  pastoralInsights: 'Pastoral care insights',
  crossCampusOps: 'Multiple campuses on one screen',
  realtimePresence: 'See who is online during services',
  experimentalWorkflows: 'Advanced background automations',
};

export function SystemAdminCenterModule({
  onModuleChange,
  initialTab,
}: {
  onModuleChange?: (m: ERPModule) => void;
  initialTab?: Tab;
}) {
  const [tab, setTab] = React.useState<Tab>(initialTab ?? 'health');
  React.useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const [overview, setOverview] = React.useState<AdminOverview | null>(null);
  const [flags, setFlags] = React.useState<FeatureFlagMap | null>(null);
  const [audit, setAudit] = React.useState<{ domainEvents: unknown[]; financialLogs: unknown[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingFlags, setSavingFlags] = React.useState(false);
  const [versionInfo, setVersionInfo] = React.useState<Record<string, unknown> | null>(null);
  const [license, setLicense] = React.useState<{ plan: string; modules: string[] } | null>(null);
  const [backupBusy, setBackupBusy] = React.useState(false);
  const [incidentPanel, setIncidentPanel] = React.useState<IncidentPanel | null>(null);
  const [replayBusy, setReplayBusy] = React.useState(false);
  const [confirmReplay, setConfirmReplay] = React.useState(false);
  const [operatorBusy, setOperatorBusy] = React.useState(false);
  const [diagnostics, setDiagnostics] = React.useState<Record<string, unknown> | null>(null);
  const [maintenance, setMaintenance] = React.useState<{ enabled: boolean; message: string }>({
    enabled: false,
    message: '',
  });
  const [confirmRestore, setConfirmRestore] = React.useState(false);
  const [restorePayload, setRestorePayload] = React.useState<Record<string, unknown> | null>(null);
  const [restoreBusy, setRestoreBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [ov, fl] = await Promise.all([
        apiRequest<unknown>('platform/admin-overview', { method: 'GET' }),
        apiRequest<unknown>('platform/feature-flags', { method: 'GET' }),
      ]);
      setOverview(parseApiResponse<AdminOverview>(ov));
      setFlags(parseApiResponse<FeatureFlagMap>(fl));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAudit = React.useCallback(async () => {
    try {
      const j = await apiRequest<unknown>('platform/compliance-audit', { method: 'GET' });
      setAudit(parseApiResponse(j));
    } catch (e) {
      setError(formatApiError(e));
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (tab === 'audit' && !audit) void loadAudit();
  }, [tab, audit, loadAudit]);

  const saveFlags = async () => {
    if (!flags) return;
    setSavingFlags(true);
    try {
      const j = await apiRequest<unknown>('platform/feature-flags', { method: 'PUT', body: flags });
      setFlags(parseApiResponse<FeatureFlagMap>(j));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSavingFlags(false);
    }
  };

  const loadDeployment = React.useCallback(async () => {
    try {
      const [ver, lic] = await Promise.all([
        fetch(`${(await import('@/lib/apiClient')).API_BASE_URL}/deploy/version`).then((r) => r.json()),
        apiRequest<unknown>('deploy/license', { method: 'GET' }),
      ]);
      if (ver?.data) setVersionInfo(ver.data);
      setLicense(parseApiResponse(lic));
    } catch (e) {
      setError(formatApiError(e));
    }
  }, []);

  React.useEffect(() => {
    if (tab === 'deployment' && !versionInfo) void loadDeployment();
  }, [tab, versionInfo, loadDeployment]);

  const loadOperator = React.useCallback(async () => {
    try {
      const [diag, maint] = await Promise.all([
        apiRequest<unknown>('platform/operator/diagnostics', { method: 'GET' }),
        apiRequest<unknown>('deploy/maintenance', { method: 'GET' }),
      ]);
      setDiagnostics(parseApiResponse(diag));
      const m = parseApiResponse<{ enabled: boolean; message?: string }>(maint);
      setMaintenance({ enabled: m.enabled, message: m.message ?? '' });
    } catch (e) {
      setError(formatApiError(e));
    }
  }, []);

  React.useEffect(() => {
    if (tab === 'operator') void loadOperator();
  }, [tab, loadOperator]);

  const flushCache = async () => {
    setOperatorBusy(true);
    try {
      await apiRequest('platform/operator/cache-flush', { method: 'POST', body: {} });
      await loadOperator();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setOperatorBusy(false);
    }
  };

  const exportDiagnostics = async () => {
    const { API_BASE_URL } = await import('@/lib/apiClient');
    const { getToken, getTenantId } = await import('@/lib/authSession');
    const res = await fetch(`${API_BASE_URL}/platform/operator/diagnostics/export`, {
      headers: { Authorization: `Bearer ${getToken() ?? ''}`, 'x-tenant-id': getTenantId() ?? '' },
    });
    if (!res.ok) throw new Error('Export failed');
    triggerBrowserDownload(await res.blob(), `diagnostics-${Date.now()}.json`);
  };

  const saveMaintenance = async () => {
    setOperatorBusy(true);
    try {
      await apiRequest('deploy/maintenance', {
        method: 'PUT',
        body: { enabled: maintenance.enabled, message: maintenance.message },
      });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setOperatorBusy(false);
    }
  };

  const resetDemo = async () => {
    setOperatorBusy(true);
    try {
      await apiRequest('deploy/demo/reset', { method: 'POST', body: {} });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setOperatorBusy(false);
    }
  };

  const loadIncidents = React.useCallback(async () => {
    try {
      const j = await apiRequest<unknown>('platform/incidents', { method: 'GET' });
      setIncidentPanel(parseApiResponse<IncidentPanel>(j));
    } catch (e) {
      setError(formatApiError(e));
    }
  }, []);

  React.useEffect(() => {
    if (tab === 'incidents') void loadIncidents();
  }, [tab, loadIncidents]);

  const replayFailedWorkflows = async () => {
    setReplayBusy(true);
    try {
      await apiRequest<unknown>('platform/workflows/replay-failed', { method: 'POST', body: {} });
      await loadIncidents();
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setReplayBusy(false);
    }
  };

  const resolveIncident = async (id: string) => {
    try {
      await apiRequest<unknown>(`platform/incidents/${id}/resolve`, { method: 'POST', body: {} });
      await loadIncidents();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const handleRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Record<string, unknown>;
        setRestorePayload(parsed);
        setConfirmRestore(true);
      } catch {
        setError('Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  const runRestore = async () => {
    if (!restorePayload) return;
    setRestoreBusy(true);
    try {
      await apiRequest('deploy/restore', { method: 'POST', body: restorePayload });
      setRestorePayload(null);
      setConfirmRestore(false);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setRestoreBusy(false);
    }
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      const j = await apiRequest<unknown>('deploy/backup', { method: 'POST' });
      const data = parseApiResponse<Record<string, unknown>>(j);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      triggerBrowserDownload(blob, `tenant-backup-${Date.now()}.json`);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBackupBusy(false);
    }
  };

  const exportReport = async (kind: string) => {
    try {
      const { API_BASE_URL } = await import('@/lib/apiClient');
      const { getToken, getTenantId } = await import('@/lib/authSession');
      const res = await fetch(`${API_BASE_URL}/platform/reports/${kind}`, {
        headers: {
          Authorization: `Bearer ${getToken() ?? ''}`,
          'x-tenant-id': getTenantId() ?? '',
        },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      triggerBrowserDownload(blob, `${kind}-report.csv`);
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'health', label: 'System status', icon: Activity },
    { id: 'incidents', label: 'Issues', icon: AlertTriangle },
    { id: 'operator', label: 'Tools', icon: Shield },
    { id: 'governance', label: 'Church setup', icon: Users },
    { id: 'flags', label: 'Advanced options', icon: ToggleLeft },
    { id: 'audit', label: 'Records & history', icon: ScrollText },
    { id: 'exports', label: 'Data exports', icon: Download },
    { id: 'deployment', label: 'Updates', icon: Shield },
  ];

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Church admin"
        subtitle="System status, backups, activity history, and data exports for your church"
        status="live"
        icon={Shield}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} className="gap-2 min-h-[44px]">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest min-h-[44px]',
              tab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading && !overview ? (
        <p className="text-sm text-slate-500 py-12 text-center">Loading admin center…</p>
      ) : (
        <>
          {tab === 'health' && overview && (
            <div className="space-y-6">
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    Overall:{' '}
                    <OpsStatusBadge
                      status={overview.health.overall === 'healthy' ? 'READY' : overview.health.overall === 'degraded' ? 'WARNING' : 'BLOCKED'}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {overview.health.probes.map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                      <span className="font-bold text-slate-800 capitalize">{p.name.replace(/_/g, ' ')}</span>
                      <OpsStatusBadge status={p.status === 'up' ? 'READY' : p.status === 'degraded' ? 'WARNING' : 'OFFLINE'} />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black">Event queue</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Badge className="text-sm font-black">Pending {overview.eventQueue.pending}</Badge>
                  <Badge className="text-sm font-black bg-emerald-100 text-emerald-800">Processed {overview.eventQueue.processed}</Badge>
                  <Badge className="text-sm font-black bg-rose-100 text-rose-800">Failed {overview.eventQueue.failed}</Badge>
                  <Button type="button" variant="outline" onClick={() => onModuleChange?.('workflow-monitor')}>
                    Open system queue
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'incidents' && (
            <div className="space-y-6">
              {!incidentPanel ? (
                <p className="text-sm text-slate-500 py-8 text-center">Loading incident panel…</p>
              ) : (
                <>
                  <Card className={OPS_CARD}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-black">System issues</CardTitle>
                        <CardDescription>
                          Failed tasks, slow services, and options to retry background work
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void loadIncidents()} className="min-h-[44px]">
                          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-indigo-600 min-h-[44px]"
                          disabled={replayBusy}
                          onClick={() => setConfirmReplay(true)}
                        >
                          Replay failed workflows
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Badge className="justify-center py-2 font-black">Open {incidentPanel.summary.openIncidents}</Badge>
                      <Badge className="justify-center py-2 font-black bg-rose-100 text-rose-800">
                        Failed workflows {incidentPanel.summary.failedWorkflows}
                      </Badge>
                      <Badge className="justify-center py-2 font-black bg-amber-100 text-amber-900">
                        Degraded {incidentPanel.summary.degradedServices}
                      </Badge>
                      <Badge className="justify-center py-2 font-black">
                        Queue {incidentPanel.queueMetrics.mode}
                        {typeof incidentPanel.queueMetrics.failed === 'number'
                          ? ` · DLQ ${incidentPanel.queueMetrics.failed}`
                          : ''}
                      </Badge>
                    </CardContent>
                  </Card>

                  {incidentPanel.incidents.length === 0 ? (
                    <Card className={cn(OPS_CARD, 'border-emerald-200 bg-emerald-50/40')}>
                      <CardContent className="py-10 text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                        <p className="font-black text-slate-800">No open incidents</p>
                        <p className="text-sm text-slate-600 max-w-md mx-auto">
                          Monitoring is active. Backup, task, and workflow problems appear here with retry guidance.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className={OPS_CARD}>
                      <CardHeader>
                        <CardTitle className="text-lg font-black">Active incidents</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                        {incidentPanel.incidents.map((inc) => (
                          <div
                            key={inc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-slate-100"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{inc.title}</p>
                              <p className="text-xs text-slate-500 uppercase tracking-widest">{inc.category}</p>
                              {inc.detail && <p className="text-sm text-slate-600 mt-1">{inc.detail}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <OpsStatusBadge
                                status={inc.severity === 'critical' ? 'BLOCKED' : inc.severity === 'warning' ? 'WARNING' : 'READY'}
                              />
                              <Button type="button" size="sm" variant="outline" onClick={() => void resolveIncident(inc.id)}>
                                Resolve
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {incidentPanel.failedEvents.length > 0 && (
                    <Card className="border-rose-200 bg-rose-50/30 rounded-3xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-black text-rose-900">Failed background tasks (can retry)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-48 overflow-y-auto text-sm">
                        {incidentPanel.failedEvents.map((f) => (
                          <p key={f.id} className="font-medium text-rose-950">
                            {f.eventName} — {f.error ?? 'unknown'}
                          </p>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'operator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black">Advanced tools</CardTitle>
                  <CardDescription>Clear caches, retry tasks, and download diagnostics</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="min-h-[44px]" disabled={operatorBusy} onClick={() => void flushCache()}>
                    Flush read caches
                  </Button>
                  <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setConfirmReplay(true)}>
                    Replay failed workflows
                  </Button>
                  <Button type="button" className="min-h-[44px] bg-indigo-600" onClick={() => void exportDiagnostics().catch((e) => setError(formatApiError(e)))}>
                    Export diagnostics JSON
                  </Button>
                  <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => void resetDemo()}>
                    Reset demo mode flag
                  </Button>
                </CardContent>
              </Card>
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black">Maintenance mode</CardTitle>
                  <CardDescription>Blocks staff APIs except settings admins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-3 text-sm font-bold">
                    <Switch checked={maintenance.enabled} onCheckedChange={(v) => setMaintenance((m) => ({ ...m, enabled: v }))} />
                    Enable maintenance
                  </label>
                  <textarea
                    value={maintenance.message}
                    onChange={(e) => setMaintenance((m) => ({ ...m, message: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Message shown to staff during maintenance…"
                  />
                  <Button type="button" className="bg-indigo-600 min-h-[44px]" disabled={operatorBusy} onClick={() => void saveMaintenance()}>
                    Save maintenance settings
                  </Button>
                </CardContent>
              </Card>
              {diagnostics && (
                <Card className={cn(OPS_CARD, 'lg:col-span-2')}>
                  <CardHeader>
                    <CardTitle className="text-lg font-black">Live diagnostics snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs font-mono text-slate-600 max-h-48 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(diagnostics, null, 2)}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {tab === 'governance' && overview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Campuses ({overview.campuses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {overview.campuses.map((c) => (
                    <p key={c.id} className="text-sm font-bold text-slate-800">
                      {c.name} {c.type ? `· ${c.type}` : ''}
                    </p>
                  ))}
                </CardContent>
              </Card>
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Users className="w-5 h-5" /> Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {overview.users.map((u) => (
                    <div key={u.id} className="flex justify-between text-sm">
                      <span className="font-bold">{u.username}</span>
                      <OpsStatusBadge status={u.status === 'Active' ? 'ACTIVE' : 'OFFLINE'} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full mt-2" onClick={() => onModuleChange?.('permissions')}>
                    Roles & permissions
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'flags' && flags && (
            <Card className={OPS_CARD}>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-black">Feature flags</CardTitle>
                  <CardDescription>Turn features on or off for this church</CardDescription>
                </div>
                <Button type="button" onClick={() => void saveFlags()} disabled={savingFlags} className="bg-indigo-600">
                  {savingFlags ? 'Saving…' : 'Save flags'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(FLAG_LABELS) as (keyof FeatureFlagMap)[]).map((key) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-800">{FLAG_LABELS[key]}</span>
                    <Switch
                      checked={flags[key]}
                      onCheckedChange={(v) => setFlags((f) => (f ? { ...f, [key]: v } : f))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === 'audit' && (
            <div className="space-y-6">
              {overview?.recentFailures && overview.recentFailures.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black flex items-center gap-2 text-amber-900">
                      <AlertTriangle className="w-5 h-5" /> Recent workflow failures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                    {overview.recentFailures.map((f) => (
                      <p key={f.id} className="text-xs font-medium text-amber-950">
                        {f.eventName} — {f.error ?? 'unknown'}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
              {audit && (
                <Card className={OPS_CARD}>
                  <CardHeader>
                    <CardTitle className="text-lg font-black">Change records</CardTitle>
                    <CardDescription>Recent system and finance changes (latest 100 each)</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 space-y-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {audit.domainEvents.length} system changes loaded
                    </p>
                    <p>{audit.financialLogs.length} finance changes loaded</p>
                    <Button type="button" variant="outline" onClick={() => onModuleChange?.('audit-logs')}>
                      Open change history
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {tab === 'exports' && (
            <Card className={OPS_CARD}>
              <CardHeader>
                <CardTitle className="text-lg font-black">Church data exports (CSV)</CardTitle>
                <CardDescription>CSV files from your live church data</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {['attendance', 'volunteer', 'operational', 'readiness'].map((k) => (
                  <Button key={k} type="button" variant="outline" className="min-h-[44px] capitalize" onClick={() => void exportReport(k)}>
                    <Download className="w-4 h-4 mr-2" /> {k}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === 'deployment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black">Version & migrations</CardTitle>
                  <CardDescription>Safe upgrade visibility for production operators</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2 font-medium text-slate-700">
                  <p>Package: {(versionInfo?.packageVersion as string) ?? '—'}</p>
                  <p>Node: {(versionInfo?.nodeVersion as string) ?? '—'}</p>
                  <p>Environment: {(versionInfo?.environment as string) ?? '—'}</p>
                  {Array.isArray((versionInfo?.migrations as { applied?: string[] })?.applied) && (
                    <p className="text-xs text-slate-500">
                      Latest migrations: {((versionInfo?.migrations as { applied: string[] }).applied).slice(0, 3).join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className={OPS_CARD}>
                <CardHeader>
                  <CardTitle className="text-lg font-black">License & entitlements</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge className="font-black">{license?.plan ?? 'ministry'}</Badge>
                  {(license?.modules ?? []).map((m) => (
                    <Badge key={m} variant="outline" className="text-[10px] font-bold uppercase">
                      {m}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
              <Card className={cn(OPS_CARD, 'lg:col-span-2')}>
                <CardHeader>
                  <CardTitle className="text-lg font-black">Backup & restore</CardTitle>
                  <CardDescription>
                    Tenant-scoped JSON export (settings, pages, members summary). Restore merges settings and published pages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void downloadBackup()} disabled={backupBusy} className="bg-indigo-600">
                    <Download className="w-4 h-4 mr-2" />
                    {backupBusy ? 'Exporting…' : 'Download backup'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onModuleChange?.('settings')}>
                    Church branding & settings
                  </Button>
                  <label className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-rose-200 text-rose-800 text-sm font-bold cursor-pointer hover:bg-rose-50">
                    Restore from JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleRestoreFile(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmRestore}
        title="Restore church backup?"
        description="This merges settings and published website pages from the backup file. Financial and member records are not overwritten. Download a fresh backup before proceeding."
        confirmLabel="Restore"
        variant="destructive"
        busy={restoreBusy}
        onCancel={() => {
          setConfirmRestore(false);
          setRestorePayload(null);
        }}
        onConfirm={runRestore}
      />

      <ConfirmDialog
        open={confirmReplay}
        title="Replay failed workflows?"
        description="This retries failed background tasks. Only continue if the underlying problem is fixed."
        confirmLabel="Replay"
        variant="destructive"
        busy={replayBusy}
        onCancel={() => setConfirmReplay(false)}
        onConfirm={async () => {
          await replayFailedWorkflows();
          setConfirmReplay(false);
        }}
      />
    </div>
  );
}
