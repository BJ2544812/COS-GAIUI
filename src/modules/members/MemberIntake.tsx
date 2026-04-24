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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

interface MemberIntakeProps {
  onCancel: () => void;
  onSave: (data: any) => void;
}

export function MemberIntake({ onCancel, onSave }: MemberIntakeProps) {
  const [step, setStep] = React.useState(1);
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
    profileImage: null as string | null,
    familyImage: null as string | null,
  });

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden">
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
                        <div className="w-full h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden">
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
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-500">
                        <ClipboardCheck size={20} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <h3 className="font-bold text-slate-800">Spiritual Growth Track</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {['Baptized', 'Membership Class', 'Volunteer Trained', 'Group Leader'].map(tag => (
                            <div key={tag} className="flex items-center gap-2 group cursor-pointer">
                              <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                                <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-indigo-500 transition-all scale-0 group-hover:scale-100" />
                              </div>
                              <span className="text-sm font-medium text-slate-600">{tag}</span>
                            </div>
                          ))}
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
                    onClick={() => onSave(formData)}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 px-8 rounded-xl font-bold group"
                  >
                    <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Complete Registration
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
