import * as React from 'react';
import { 
  UserPlus, 
  User, 
  Users, 
  MapPin, 
  Calendar, 
  Heart, 
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { INTAKE_SPIRITUAL_TRACK_LABELS, type IntakeFormData } from './buildMemberPayload';
import { VisitorWorkflowBanner } from '@/components/operations/VisitorWorkflowBanner';

interface MemberIntakeProps {
  onCancel: () => void;
  onModuleChange?: (module: import('@/types').ERPModule) => void;
  onSave: (
    data: IntakeFormData & Record<string, unknown>,
    files: { profile?: File | null; family?: File | null },
  ) => Promise<void>;
}

export function MemberIntake({ onCancel, onSave, onModuleChange }: MemberIntakeProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const profileRef = React.useRef<HTMLInputElement>(null);
  const familyRef = React.useRef<HTMLInputElement>(null);
  const profileFileRef = React.useRef<File | null>(null);
  const familyFileRef = React.useRef<File | null>(null);
  const [spiritualTrack, setSpiritualTrack] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(INTAKE_SPIRITUAL_TRACK_LABELS.map((k) => [k, false])) as Record<string, boolean>,
  );
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    campus: '',
    joinDate: new Date().toISOString().split('T')[0],
    familyRole: 'Head of Household',
    familyName: '',
    growthStage: 'Visitor' as const,
    profileImage: null as string | null,
    familyImage: null as string | null,
    aadhaar: '',
    pan: '',
    declarationAccepted: false,
  });

  const updateForm = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const steps = [
    { name: 'Personal Details', icon: User },
    { name: 'Contact & Campus', icon: MapPin },
    { name: 'Family Grouping', icon: Users },
    { name: 'Spiritual Status', icon: Heart },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Member Intake</h1>
            <p className="text-sm text-slate-500 font-medium">Step {step} of 4: {steps[step-1].name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-8 h-1.5 rounded-full transition-all duration-300",
                step > i ? "bg-indigo-600" : "bg-slate-200"
              )} 
            />
          ))}
        </div>
      </div>

      <VisitorWorkflowBanner variant="intake" onModuleChange={onModuleChange} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {steps.map((s, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                step === i + 1 ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 opacity-60 hover:opacity-100"
              )}
              onClick={() => step > i + 1 && setStep(i + 1)}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                step === i + 1 ? "bg-indigo-600 text-white" : "bg-slate-100"
              )}>
                <s.icon size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest leading-none">{s.name}</span>
            </div>
          ))}
        </div>

        <div className="md:col-span-3">
          <Card className="rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50">
            <CardContent className="p-8">
              {submitError && (
                <div
                  className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
                  role="alert"
                >
                  {submitError}
                </div>
              )}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="file" 
                          ref={profileRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              profileFileRef.current = f;
                              const url = URL.createObjectURL(f);
                              updateForm('profileImage', url);
                            }
                          }}
                        />
                        <div 
                          onClick={() => profileRef.current?.click()}
                          className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden"
                        >
                           {formData.profileImage ? (
                             <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                             <>
                               <UserPlus size={24} />
                               <span className="text-[8px] font-bold mt-1">UPLOAD</span>
                             </>
                           )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium max-w-[120px]">Recommended: Square JPG/PNG, Max 2MB</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">First Name</label>
                      <Input 
                        placeholder="John" 
                        value={formData.firstName}
                        onChange={(e) => updateForm('firstName', e.target.value)}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Last Name</label>
                      <Input 
                        placeholder="Doe" 
                        value={formData.lastName}
                        onChange={(e) => updateForm('lastName', e.target.value)}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Birth Date</label>
                      <Input 
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => updateForm('birthDate', e.target.value)}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                      <select 
                        className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white outline-none ring-offset-background focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        value={formData.gender}
                        onChange={(e) => updateForm('gender', e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                    <Input 
                      placeholder="john.doe@example.com" 
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                      <Input 
                        placeholder="+1 (555) 000-0000" 
                        value={formData.phone}
                        onChange={(e) => updateForm('phone', e.target.value)}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Campus</label>
                      <select 
                        className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white outline-none ring-offset-background focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        value={formData.campus}
                        onChange={(e) => updateForm('campus', e.target.value)}
                      >
                        <option value="">Select Campus</option>
                        <option value="Downtown">Downtown Campus</option>
                        <option value="Westside">Westside Regional</option>
                        <option value="North">North Point</option>
                        <option value="Online">Online Campus</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-bold text-indigo-900">Family/Household Association</p>
                        <p className="text-xs text-indigo-600">Group members who live in the same household.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Family Household Photo</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="file" 
                          ref={familyRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              familyFileRef.current = f;
                              const url = URL.createObjectURL(f);
                              updateForm('familyImage', url);
                            }
                          }}
                        />
                        <div 
                          onClick={() => familyRef.current?.click()}
                          className="w-full h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden"
                        >
                           {formData.familyImage ? (
                             <img src={formData.familyImage} alt="Family" className="w-full h-full object-cover" />
                           ) : (
                             <>
                               <Users size={32} />
                               <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Upload Family Portrait</span>
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Family Last Name</label>
                        <Input 
                          placeholder="Doe Family" 
                          value={formData.familyName}
                          onChange={(e) => updateForm('familyName', e.target.value)}
                          className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Household Role</label>
                        <select 
                          className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white outline-none ring-offset-background focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          value={formData.familyRole}
                          onChange={(e) => updateForm('familyRole', e.target.value)}
                        >
                          <option value="Head of Household">Head of Household</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Other">Other Family Member</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500" htmlFor="growthStage">
                      Growth stage
                    </label>
                    <select
                      id="growthStage"
                      value={formData.growthStage}
                      onChange={(e) =>
                        updateForm(
                          'growthStage',
                          e.target.value === 'Member' ? 'Member' : 'Visitor',
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800"
                    >
                      <option value="Visitor">Visitor</option>
                      <option value="Member">Member</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aadhaar (optional)</label>
                      <Input
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="12-digit Aadhaar"
                        value={formData.aadhaar}
                        onChange={(e) => updateForm('aadhaar', e.target.value)}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">PAN (optional)</label>
                      <Input
                        placeholder="e.g. ABCDE1234F"
                        value={formData.pan}
                        onChange={(e) => updateForm('pan', e.target.value.toUpperCase())}
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white uppercase"
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-slate-200 bg-white p-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.declarationAccepted}
                      onChange={(e) => updateForm('declarationAccepted', e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-700 leading-snug">
                      I confirm this person (or guardian) has accepted the church&apos;s visitor / membership declaration policy where applicable. A declaration record will be stored on the member profile.
                    </span>
                  </label>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-500">
                        <ClipboardCheck size={20} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <h3 className="font-bold text-slate-800">Spiritual Growth Track</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Selected items are saved as milestones on the member record and appear after registration.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {INTAKE_SPIRITUAL_TRACK_LABELS.map((tag) => {
                            const on = !!spiritualTrack[tag];
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setSpiritualTrack((prev) => ({ ...prev, [tag]: !prev[tag] }))}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-indigo-300"
                              >
                                <div
                                  className={cn(
                                    'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                                    on ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white',
                                  )}
                                >
                                  {on ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{tag}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
                  className="font-bold text-slate-500"
                >
                  {step === 1 ? 'Cancel Registration' : 'Back to previous step'}
                </Button>
                
                {step < 4 ? (
                  <Button 
                    onClick={() => setStep(step + 1)}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 px-8 rounded-xl font-bold"
                  >
                    Continue to {steps[step].name} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      setSubmitError(null);
                      setSaving(true);
                      try {
                        await onSave(
                          { ...formData, spiritualTrack },
                          { profile: profileFileRef.current, family: familyFileRef.current },
                        );
                      } catch (e) {
                        setSubmitError(e instanceof Error ? e.message : 'Request failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 px-8 rounded-xl font-bold group"
                  >
                    <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> {saving ? 'Saving…' : 'Complete Registration'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
