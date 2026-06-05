import fs from 'fs';

const p = 'src/modules/finance/FinanceModule.tsx';
let s = fs.readFileSync(p, 'utf8');
const marker = '  return (\n    <motion.div className="space-y-6">';
const marker2 = '  return (\n    <div className="space-y-6">';
const fnStart = s.indexOf('function DocumentCenterPanel');
const retIdx = s.indexOf(marker2, fnStart);
const closeIdx = s.indexOf('      </SectionCard>\n    </motion.div>\n  );', fnStart);
const closeIdx2 = s.indexOf('      </SectionCard>\n    </div>\n  );', fnStart);
const endIdx = closeIdx2 > fnStart ? closeIdx2 + '      </SectionCard>\n    </motion.div>\n  );'.length : closeIdx2 + '      </SectionCard>\n    </div>\n  );'.length;

const replacement = `  return (
    <div className="space-y-6">
      {docError && <FeedbackBanner tone="error">{docError}</FeedbackBanner>}
      <SectionCard title="Financial Document Center" subtitle="Vouchers and receipts with server PDF preview and download">
        <motion.div className="flex flex-wrap gap-3 items-end mb-4">
          <motion.div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setDocPage(0); void loadRegistry(); } }}
              placeholder="Search number, narration, donor..."
              className="w-full pl-9 pr-3 h-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </motion.div>
          <select value={docKind} onChange={(e) => { setDocKind(e.target.value as typeof docKind); setDocPage(0); }} className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white">
            <option value="all">All Documents</option>
            <option value="voucher">Vouchers</option>
            <option value="receipt">Receipts</option>
          </select>
          <select value={voucherType} onChange={(e) => { setVoucherType(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white">
            <option value="">All Voucher Types</option>
            <option value="receipt">Receipt</option>
            <option value="payment">Payment</option>
            <option value="journal">Journal</option>
            <option value="contra">Contra</option>
          </select>
          <select value={docStatus} onChange={(e) => { setDocStatus(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="issued">Issued</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs rounded-lg border border-slate-200" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs rounded-lg border border-slate-200" />
          <Button variant="outline" size="sm" onClick={() => { setDocPage(0); void loadRegistry(); }}>Apply</Button>
          <Button variant="outline" size="sm" onClick={() => { setDocSearch(''); setDocKind('all'); setVoucherType(''); setDocStatus(''); setDateFrom(''); setDateTo(''); setDocPage(0); }}>Reset</Button>
          <Button variant="secondary" size="sm" onClick={() => void handleBatchDownload()} disabled={!items.length}><Download className="w-3.5 h-3.5 mr-1" /> Batch PDF</Button>
        </motion.div>
        {previewUrl && (
          <motion.div className="mb-4 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <motion.div className="flex items-center justify-between px-4 py-2 border-b bg-white">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">PDF Preview</span>
              <Button variant="ghost" size="sm" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>Close</Button>
            </motion.div>
            <iframe title="Document preview" src={previewUrl} className="w-full h-[480px] bg-white" />
          </motion.div>
        )}
        {loading ? (
          <motion.div className="py-16 text-center text-sm text-slate-400 animate-pulse">Loading document registry…</motion.div>
        ) : items.length === 0 ? (
          <EmptyState title="No documents found" description="Adjust filters or post vouchers to populate the registry." icon={FileSearch} />
        ) : (
          <>
            <motion.div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Number</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Kind</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Party</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((row) => {
                    const dt = d(row.date);
                    return (
                      <tr key={\`\${row.kind}-\${row.id}\`} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-indigo-700">{row.number}</td>
                        <td className="px-4 py-2.5 text-xs capitalize">{row.kind}</td>
                        <td className="px-4 py-2.5 text-xs">{row.type}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{dt ? dt.toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[180px] truncate">{row.donorName || row.narration || row.fundName || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-right">{fmt(row.amount)}</td>
                        <td className="px-4 py-2.5"><span className={cn('inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase', row.status === 'posted' && 'bg-emerald-100 text-emerald-700', row.status === 'issued' && 'bg-emerald-100 text-emerald-700', row.status === 'draft' && 'bg-amber-100 text-amber-700')}>{row.status}</span></td>
                        <td className="px-4 py-2.5">
                          <motion.div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => void handlePreview(row)}><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => void handleDownload(row)}><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => void handlePrint(row)}><Printer className="w-4 h-4" /></Button>
                          </motion.div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
            <motion.div className="flex items-center justify-between pt-3">
              <p className="text-xs text-slate-500">{items.length} on this page</p>
              <motion.div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={docPage === 0} onClick={() => setDocPage(docPage - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={items.length < DOC_PAGE_SIZE} onClick={() => setDocPage(docPage + 1)}>Next</Button>
              </motion.div>
            </motion.div>
          </>
        )}
      </SectionCard>
    </motion.div>
  );`;

// Fix accidental motion.div in patch - use div only
const fixed = replacement.replace(/motion\.div/g, 'motion.div').replace(/motion\.div/g, 'div');
// Actually I used motion.div by mistake - fix to div
const fixed2 = replacement.replace(/<motion\.div/g, '<div').replace(/<\/motion\.motion.div>/g, '</div>').replace(/<\/motion\.div>/g, '</motion.div>');

// Simpler: write replacement without motion
const clean = replacement.replace(/motion\.div/g, 'motion.div');
// Let me just use div in the template string directly - rewrite file without motion

const actualReplacement = replacement
  .replace(/<motion\.div/g, '<div')
  .replace(/<\/motion\.motion.div>/g, '</div>')
  .replace(/<\/motion\.motion.div>/g, '</div>');

// manual fix
const actual = `  return (
    <div className="space-y-6">
      {docError && <FeedbackBanner tone="error">{docError}</FeedbackBanner>}
      <SectionCard title="Financial Document Center" subtitle="Vouchers and receipts with server PDF preview and download">
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <motion.div className="relative flex-1 min-w-[200px]">
`;

console.log('retIdx', retIdx, 'end search', s.indexOf('      </SectionCard>\n    </div>\n  );', fnStart));
if (retIdx < 0) throw new Error('return not found');
const end = s.indexOf('      </SectionCard>\n    </div>\n  );', fnStart);
if (end < 0) throw new Error('end not found');
const endFull = end + '      </SectionCard>\n    </div>\n  );'.length;

// Read full replacement from external - use built string without motion
const full = fs.readFileSync('scratch/doc-center-return.tsx', 'utf8');
s = s.slice(0, retIdx) + full + s.slice(endFull);
fs.writeFileSync(p, s);
console.log('patched ok');
