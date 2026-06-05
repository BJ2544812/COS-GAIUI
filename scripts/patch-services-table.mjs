import fs from 'node:fs';

const path = 'src/modules/services/ServicesModule.tsx';
let text = fs.readFileSync(path, 'utf8');

const start = text.indexOf('                <tbody className="divide-y divide-slate-50 text-sm">');
const end = text.indexOf('                </tbody>', start) + '                </tbody>'.length;
if (start < 0 || end < start) {
  console.error('tbody block not found');
  process.exit(1);
}

const newTbody = `                <tbody className="divide-y divide-slate-50 text-sm">
                  {sheetLoading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-center text-slate-400">Loading run sheet…</td>
                    </tr>
                  ) : (
                    runSheet.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <Input value={item.time} onChange={(e) => setRunSheet((rows) => rows.map((r) => (r.id === item.id ? { ...r, time: e.target.value } : r)))} className="font-mono text-sm h-9" />
                        </td>
                        <td className="px-4 py-3">
                          <Input value={item.duration} onChange={(e) => setRunSheet((rows) => rows.map((r) => (r.id === item.id ? { ...r, duration: e.target.value } : r)))} className="font-mono text-sm h-9" />
                        </td>
                        <td className="px-4 py-3">
                          <Input value={item.item} onChange={(e) => setRunSheet((rows) => rows.map((r) => (r.id === item.id ? { ...r, item: e.target.value } : r)))} className="text-sm h-9 font-bold" />
                        </td>
                        <td className="px-4 py-3">
                          <Input value={item.media ?? ''} onChange={(e) => setRunSheet((rows) => rows.map((r) => (r.id === item.id ? { ...r, media: e.target.value } : r)))} className="text-sm h-9" />
                        </td>
                        <td className="px-4 py-3">
                          <Input value={item.owner ?? ''} onChange={(e) => setRunSheet((rows) => rows.map((r) => (r.id === item.id ? { ...r, owner: e.target.value } : r)))} className="text-sm h-9" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>`;

text = text.slice(0, start) + newTbody + text.slice(end);
if (text.includes('RUN_SHEET_TEMPLATE')) {
  console.error('RUN_SHEET_TEMPLATE still referenced');
  process.exit(1);
}
fs.writeFileSync(path, text);
console.log('ok');
