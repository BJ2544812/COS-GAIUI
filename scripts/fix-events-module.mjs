import { execSync } from 'node:child_process';
import fs from 'node:fs';

const text = execSync('git show HEAD:src/modules/events/EventsModule.tsx', { encoding: 'utf8' });

const markerStart = "  if (view === 'details' && selectedEvent) {";
const markerEnd = '\n  return (\n    <motion.div className="space-y-8 animate-in fade-in duration-700 text-left">'
  .replace('motion.div', 'div');

const start = text.indexOf(markerStart);
const end = text.indexOf(markerEnd, start);
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const t = 'div';
const block = [
  "  if (view === 'details' && selectedEvent) {",
  '    return (',
  `      <${t} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 text-left">`,
  `        <${t} className="flex items-center justify-between flex-wrap gap-3">`,
  "          <Button variant=\"ghost\" onClick={() => { setView('list'); setEventDetail(null); }} className=\"gap-2\">",
  '            <ArrowLeft className="w-4 h-4" /> Back to Events',
  '          </Button>',
  `          <${t} className="flex flex-wrap gap-2">`,
  '            <Button type="button" variant="outline" size="sm" onClick={openSetup} disabled={!eventDetail}>',
  '              <Settings className="w-4 h-4 mr-2" /> Setup',
  '            </Button>',
  '            <Button type="button" variant="outline" size="sm" onClick={downloadAttendanceReport} disabled={!eventAttendees.length}>',
  '              <Download className="w-4 h-4 mr-2" /> Attendance CSV',
  '            </Button>',
  `          </${t}>`,
  `        </${t}>`,
  `        <${t}>`,
  '          <h2 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h2>',
  '          <p className="text-sm text-slate-500 font-medium">',
  '            {selectedEvent.date} · {selectedEvent.type} · {selectedEvent.status}',
  '          </p>',
  `        </${t}>`,
  '        {detailError && <p className="text-sm text-rose-600 font-medium">{detailError}</p>}',
  '        {detailLoading && <p className="text-sm text-slate-500 font-medium">Loading event workspace…</p>}',
  '        {!detailLoading && eventDetail && (',
  '          <EventWorkspace',
  '            eventId={eventDetail.id}',
  '            onModuleChange={onModuleChange}',
  '            currency={settings.financial.currency}',
  '          />',
  '        )}',
  `      </${t}>`,
  '    );',
  '  }',
  '',
].join('\n');

let out = text.slice(0, start) + block + text.slice(end);

if (!out.includes("from '@/components/events/EventWorkspace'")) {
  out = out.replace(
    "import { ServicesModule } from '../services/ServicesModule';",
    "import { ServicesModule } from '../services/ServicesModule';\nimport { EventWorkspace } from '@/components/events/EventWorkspace';\nimport { formatCurrencyAmount } from '@/lib/formatCurrency';\nimport { EVENT_STATUS_LABELS } from '@/lib/eventLifecycle';",
  );
}

if (out.includes("status: e.status ?? 'Draft',")) {
  out = out.replace(
    "status: e.status ?? 'Draft',",
    "status: EVENT_STATUS_LABELS[e.status ?? 'DRAFT'] ?? e.status ?? 'Draft',",
  );
}

fs.writeFileSync('src/modules/events/EventsModule.tsx', out);
console.log('lines', out.split('\n').length);
