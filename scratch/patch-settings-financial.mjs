import fs from 'fs';
const p = 'src/modules/settings/SettingsModule.tsx';
let s = fs.readFileSync(p, 'utf8');
const marker = 'Default Account Mapping';
const idx = s.indexOf(marker);
if (idx < 0) throw new Error('marker not found');
const blockStart = s.lastIndexOf('<div className="pt-6 border-t border-slate-100">', idx);
const blockEnd = s.indexOf("{activeSection === 'paymentGateway'", idx);
const finalBlock = `                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
                    Online gifts never go straight to the bank. They land in <strong>Gateway Clearing</strong> until Cashfree settles — then move to your bank account.
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                     <h4 className="text-sm font-bold text-slate-900">Everyday accounts (cash & income)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Cash on hand</label>
                          <AccountSelect filterType="Asset" value={settings.financial.defaultAccounts.cash || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'cash', id)} placeholder="Cash account" />
                        </motion.div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Church bank account</label>
                          <p className="text-xs text-slate-500">Where settled online gifts arrive after reconciliation.</p>
                          <AccountSelect filterType="Asset" value={settings.financial.defaultAccounts.bank || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'bank', id)} placeholder="Bank account" />
                        </motion.div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Tithes income</label>
                          <AccountSelect filterType="Revenue" value={settings.financial.defaultAccounts.tithes || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'tithes', id)} placeholder="Tithes" />
                        </motion.div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Offerings income</label>
                          <AccountSelect filterType="Revenue" value={settings.financial.defaultAccounts.offerings || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'offerings', id)} placeholder="Offerings" />
                        </motion.div>
                     </motion.div>
                  </motion.div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                     <h4 className="text-sm font-bold text-slate-900">Online giving (Cashfree) accounts</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Gateway clearing</label>
                          <p className="text-xs text-slate-500">Required for UPI/card gifts until settlement.</p>
                          <AccountSelect filterType="Asset" value={settings.financial.defaultAccounts.gatewayClearing || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'gatewayClearing', id)} placeholder="Clearing account" />
                        </motion.div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Donor-covered fee income</label>
                          <AccountSelect filterType="Revenue" value={settings.financial.defaultAccounts.gatewayRecoveryIncome || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'gatewayRecoveryIncome', id)} placeholder="Recovery income" />
                        </motion.div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Gateway processing fees</label>
                          <AccountSelect filterType="Expense" value={settings.financial.defaultAccounts.gatewayChargesExpense || ''} onChange={(id) => updateNestedSection('financial', 'defaultAccounts', 'gatewayChargesExpense', id)} placeholder="Fee expense" />
                        </motion.div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Estimated fee % (donor calculator)</label>
                          <Input type="number" step="0.1" value={String(settings.financial.gatewayFeePercent ?? 1.8)} onChange={(e) => updateSection('financial', 'gatewayFeePercent', Number(e.target.value))} />
                        </motion.div>
                     </motion.div>
                  </motion.div>

`;
// STILL WRONG - fix all motion.div to div
const clean = finalBlock.replace(/<\/?motion\.div/g, (x) => x.replace('motion.', ''));
s = s.slice(0, blockStart) + clean + s.slice(blockEnd);
fs.writeFileSync(p, s);
console.log('patched financial');
