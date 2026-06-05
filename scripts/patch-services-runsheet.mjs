import fs from 'node:fs';

const path = 'src/modules/services/ServicesModule.tsx';
let text = fs.readFileSync(path, 'utf8');

if (!text.includes("from '@/lib/eventLifecycle'")) {
  text = text.replace(
    "import type { ERPModule } from '@/types';",
    "import type { ERPModule } from '@/types';\nimport { defaultRunSheet, type RunSheetSegment } from '@/lib/eventLifecycle';",
  );
}

text = text.replace(
  `const RUN_SHEET_TEMPLATE = [
  { time: '09:00', dur: '05:00', item: 'Pre-service loop', media: 'Bumper / hold slide', owner: 'Media' },
  { time: '09:05', dur: '10:00', item: 'Praise and worship', media: 'Chord charts / tracks', owner: 'Worship lead' },
  { time: '09:15', dur: '03:00', item: 'Welcome and announcements', media: 'Slide deck', owner: 'Host' },
  { time: '09:18', dur: '12:00', item: 'Message', media: 'Notes / props', owner: 'Speaker' },
  { time: '09:30', dur: '05:00', item: 'Closing prayer / song', media: 'Soft loop', owner: 'Worship' },
];

`,
  '',
);

if (!text.includes('const [runSheet, setRunSheet]')) {
  text = text.replace(
    '  const [planSaving, setPlanSaving] = React.useState(false);',
    `  const [planSaving, setPlanSaving] = React.useState(false);
  const [runSheet, setRunSheet] = React.useState<RunSheetSegment[]>([]);
  const [sheetLoading, setSheetLoading] = React.useState(false);
  const [sheetSaving, setSheetSaving] = React.useState(false);`,
  );
}

if (!text.includes('loadRunSheet')) {
  const hook = `
  const loadRunSheet = React.useCallback(async (eventId: string) => {
    setSheetLoading(true);
    try {
      const j = await apiRequest<unknown>(\`events/\${eventId}\`, { method: 'GET' });
      const ev = parseApiResponse<{ runSheet?: RunSheetSegment[] | null }>(j);
      const rows = Array.isArray(ev.runSheet) && ev.runSheet.length > 0 ? ev.runSheet : defaultRunSheet();
      setRunSheet(rows);
    } catch {
      setRunSheet(defaultRunSheet());
    } finally {
      setSheetLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedService) void loadRunSheet(selectedService.id);
    else setRunSheet([]);
  }, [selectedService, loadRunSheet]);

  const saveRunSheet = async () => {
    if (!selectedService) return;
    setSheetSaving(true);
    setLoadError(null);
    try {
      await apiRequest(\`events/\${selectedService.id}/run-sheet\`, { method: 'PUT', body: { runSheet } });
    } catch (err) {
      setLoadError(formatApiError(err));
    } finally {
      setSheetSaving(false);
    }
  };
`;
  text = text.replace('  React.useEffect(() => {\n    void load();\n  }, [load]);', `  React.useEffect(() => {\n    void load();\n  }, [load]);${hook}`);
}

text = text.replace(
  `        <p className="text-sm text-slate-500 font-medium max-w-3xl">
          Run sheet below is an operational template. Persisted logistics, attendance, and media use the linked event and other modules.
          {selectedService.location ? \` Venue: \${selectedService.location}.\` : ''}
        </p>`,
  `        <p className="text-sm text-slate-500 font-medium max-w-3xl">
          Production run sheet is saved on the service event. Logistics, attendance, and media use linked modules.
          {selectedService.location ? \` Venue: \${selectedService.location}.\` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={sheetSaving || sheetLoading} onClick={() => void loadRunSheet(selectedService.id)}>
            Reload
          </Button>
          <Button type="button" size="sm" className="bg-indigo-600" disabled={sheetSaving || sheetLoading} onClick={() => void saveRunSheet()}>
            {sheetSaving ? 'Saving…' : 'Save run sheet'}
          </Button>
        </motion.div>`,
);

text = text.replace(
  `                  {RUN_SHEET_TEMPLATE.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 font-mono font-bold text-indigo-600">{item.time}</td>
                      <td className="px-8 py-5 font-mono text-slate-400 font-bold">{item.dur}</td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-800">{item.item}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="ghost" className="p-0 text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Play size={10} /> Segment
                          </Badge>
                        </motion.div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          {item.media}
                        </motion.div>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">
                        {item.owner}
                      </td>
                    </tr>
                  ))}`,
  `                  {(sheetLoading ? [] : runSheet).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <Input value={item.time} onChange={(e) => setRunSheet((rows) => rows.map((r) => r.id === item.id ? { ...r, time: e.target.value } : r))} className="font-mono text-sm h-9" />
                      </td>
                      <td className="px-4 py-3">
                        <Input value={item.duration} onChange={(e) => setRunSheet((rows) => rows.map((r) => r.id === item.id ? { ...r, duration: e.target.value } : r))} className="font-mono text-sm h-9" />
                      </td>
                      <td className="px-4 py-3">
                        <Input value={item.item} onChange={(e) => setRunSheet((rows) => rows.map((r) => r.id === item.id ? { ...r, item: e.target.value } : r))} className="text-sm h-9 font-bold" />
                      </td>
                      <td className="px-4 py-3">
                        <Input value={item.media ?? ''} onChange={(e) => setRunSheet((rows) => rows.map((r) => r.id === item.id ? { ...r, media: e.target.value } : r))} className="text-sm h-9" />
                      </td>
                      <td className="px-4 py-3">
                        <Input value={item.owner ?? ''} onChange={(e) => setRunSheet((rows) => rows.map((r) => r.id === item.id ? { ...r, owner: e.target.value } : r))} className="text-sm h-9 text-right" />
                      </td>
                    </tr>
                  ))}`,
);

text = text.replace('        </motion.div>', '        </motion.div>').replaceAll('motion.div', 'motion.div');
// fix accidental motion.div from patch
text = text.replace(
  `        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={sheetSaving || sheetLoading} onClick={() => void loadRunSheet(selectedService.id)}>
            Reload
          </Button>
          <Button type="button" size="sm" className="bg-indigo-600" disabled={sheetSaving || sheetLoading} onClick={() => void saveRunSheet()}>
            {sheetSaving ? 'Saving…' : 'Save run sheet'}
          </Button>
        </motion.div>`,
  `        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={sheetSaving || sheetLoading} onClick={() => void loadRunSheet(selectedService.id)}>
            Reload
          </Button>
          <Button type="button" size="sm" className="bg-indigo-600" disabled={sheetSaving || sheetLoading} onClick={() => void saveRunSheet()}>
            {sheetSaving ? 'Saving…' : 'Save run sheet'}
          </Button>
        </motion.div>`.replace('</motion.div>', '</motion.div>'),
);

fs.writeFileSync(path, text.replace('</motion.div>', '</motion.div>').replaceAll('motion.div', 'motion.div'));
console.log('patched services');
