import fs from 'fs';
const p = 'src/modules/settings/SettingsModule.tsx';
let s = fs.readFileSync(p, 'utf8');
const a = s.indexOf("{activeSection === 'paymentGateway'");
const b = s.indexOf("{activeSection === 'documents'", a);
if (a < 0 || b < 0) throw new Error('sections not found');
const neu = `{activeSection === 'paymentGateway' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-sm text-indigo-900">
                      <strong>Online giving</strong> uses Cashfree (UPI & cards). Gifts post to <strong>Gateway Clearing</strong> in Finance until you import and post each settlement batch.
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

                  <motion.div className="pt-4 border-t border-slate-100 space-y-4">
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
                    </motion.div>
                    <motion.div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Webhook secret</label>
                      <p className="text-xs text-slate-500">Webhook URL: <code className="text-indigo-600">/api/v1/giving/webhooks/cashfree</code> on your public API host.</p>
                      <Input
                        type="password"
                        value={settings.paymentGateway.cashfreeWebhookSecret || ''}
                        onChange={(e) => updateSection('paymentGateway', 'cashfreeWebhookSecret', e.target.value)}
                        placeholder="••••••••"
                      />
                    </motion.div>
                  </motion.div>

                  <details className="pt-4 border-t border-slate-100">
                    <summary className="text-sm font-semibold text-slate-600 cursor-pointer">Razorpay (optional legacy)</summary>
                    <motion.div className="mt-4 space-y-4">
                      <motion.div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Key ID</label>
                        <Input value={settings.paymentGateway.razorpayKeyId} onChange={(e) => updateSection('paymentGateway', 'razorpayKeyId', e.target.value)} placeholder="rzp_…" />
                      </motion.div>
                      <motion.div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Key secret</label>
                        <Input type="password" value={settings.paymentGateway.razorpayKeySecret} onChange={(e) => updateSection('paymentGateway', 'razorpayKeySecret', e.target.value)} />
                      </motion.div>
                      <motion.div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Webhook secret</label>
                        <Input type="password" value={settings.paymentGateway.razorpayWebhookSecret} onChange={(e) => updateSection('paymentGateway', 'razorpayWebhookSecret', e.target.value)} />
                      </motion.div>
                    </motion.div>
                  </details>
                </motion.div>
              )}

              `;
// fix typos - I keep making mistakes. Write correct version:
const correct = `{activeSection === 'paymentGateway' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-sm text-indigo-900">
                      <strong>Online giving</strong> uses Cashfree (UPI & cards). Gifts post to <strong>Gateway Clearing</strong> in Finance until you import and post each settlement batch.
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
                      <p className="text-xs text-slate-500">Webhook URL: <code className="text-indigo-600">/api/v1/giving/webhooks/cashfree</code> on your public API host.</p>
                      <Input
                        type="password"
                        value={settings.paymentGateway.cashfreeWebhookSecret || ''}
                        onChange={(e) => updateSection('paymentGateway', 'cashfreeWebhookSecret', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
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

              `;

s = s.slice(0, a) + correct + s.slice(b);
fs.writeFileSync(p, s);
console.log('patched payment gateway');
