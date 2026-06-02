import * as React from 'react';
import {
  User, Users, Heart, Calendar, Mail, Phone, Edit3, ChevronLeft, Award, Plus, FileText, UploadCloud, Trash2, Camera,
  CreditCard, Activity, Clock, BookOpen, ShieldCheck, DollarSign, MessageSquare, CalendarPlus, CheckCircle2,
  AlertCircle, Briefcase, FileSignature, Wallet, Check, ChevronRight, Hash, Star, UserCheck, MapPin, ExternalLink
} from 'lucide-react';
import { formatAddressLine, googleMapsUrl } from '@/lib/memberAddress';
import { GROWTH_PIPELINE, growthStageLabel, pipelineIndex, type GrowthStageKey } from '@/lib/memberGrowthStages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  ApiError, getMember, updateMember, uploadProfileImage, uploadFamilyImage,
  createMemberDocument, deleteMemberDocument, updateMemberDocument,
  createMemberMilestone, deleteMemberMilestone,
  createMemberResponsibility, deleteMemberResponsibility,
  linkMemberFamily, unlinkMemberFamily,
  createMemberDonation,
  getMemberCareNotes, createMemberCareNote,
  listMembers, type MemberDto,
  generateMemberIdentityDocument,
  type IdentityDocTemplate,
} from './memberApi';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { COMMON_SERVING_ROLES, ENTITY_TYPES, SERVING_STATUS_OPTIONS, servingTierForRole } from '@/lib/servingRoles';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { AppAvatar } from '@/components/ui/app-avatar';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/SettingsContext';
import { MinistryJourneyTimeline } from '@/components/intelligence/MinistryJourneyTimeline';
import { ResponsiveTableWrap } from '@/components/modules/ModuleHeader';

function dateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

interface MemberProfileDetailProps {
  memberId: string;
  onBack: () => void;
  onMemberUpdated?: () => void | Promise<void>;
}

type TabType = 'overview' | 'journey' | 'attendance' | 'family' | 'giving' | 'documents' | 'timeline';

export function MemberProfileDetail({ memberId, onBack, onMemberUpdated }: MemberProfileDetailProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('overview');
  
  const [member, setMember] = React.useState<MemberDto | null>(null);
  const [familyMembers, setFamilyMembers] = React.useState<MemberDto[]>([]);
  
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = React.useState<string | null>(null);
  
  const [editForm, setEditForm] = React.useState({
    name: '', email: '', phone: '', status: 'Active', growthStage: 'Visitor', role: '', membershipDate: '', dob: '',
    gender: '', aadhaar: '', pan: '', familyId: '',
    workforceClass: '', employmentType: '', department: '', reportingManagerId: '',
    addressLine1: '', addressLine2: '', city: '', stateRegion: '', postalCode: '', country: 'India',
    latitude: '', longitude: '',
  });
  const [growthStageSaving, setGrowthStageSaving] = React.useState(false);
  const [responsibilityOpen, setResponsibilityOpen] = React.useState(false);
  const [responsibilityForm, setResponsibilityForm] = React.useState({
    role: '',
    entityType: 'Ministry',
    entityId: '',
    status: 'Active',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    notes: '',
  });
  const [structureMinistries, setStructureMinistries] = React.useState<{ id: string; name: string }[]>([]);
  const [structureSmallGroups, setStructureSmallGroups] = React.useState<{ id: string; name: string }[]>([]);
  const [responsibilitySaving, setResponsibilitySaving] = React.useState(false);
  const [acceptanceOpen, setAcceptanceOpen] = React.useState(false);
  const [acceptanceDocId, setAcceptanceDocId] = React.useState<string | null>(null);
  const [acceptanceForm, setAcceptanceForm] = React.useState({ signerName: '', signatureDataUrl: '' });
  const [acceptanceSaving, setAcceptanceSaving] = React.useState(false);

  const [allFamilies, setAllFamilies] = React.useState<any[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const aadhaarRegex = /^[0-9]{12}$/;

  // Photo uploads
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const familyPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoError, setPhotoError] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  // Other Modal states
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [notesText, setNotesText] = React.useState('');
  const [notesSaving, setNotesSaving] = React.useState(false);

  // New states for missing features
  const [milestoneOpen, setMilestoneOpen] = React.useState(false);
  const [milestoneForm, setMilestoneForm] = React.useState({ type: 'Salvation', date: dateInputValue(new Date().toISOString()), notes: '' });
  const [milestoneSaving, setMilestoneSaving] = React.useState(false);

  const [documentOpen, setDocumentOpen] = React.useState(false);
  const [documentForm, setDocumentForm] = React.useState({ type: 'Aadhaar', number: '', notes: '' });
  const [documentFile, setDocumentFile] = React.useState<File | null>(null);
  const [documentSaving, setDocumentSaving] = React.useState(false);
  const { settings } = useSettings();
  const [identityGenerating, setIdentityGenerating] = React.useState<IdentityDocTemplate | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = React.useState(false);
  const [generateTemplate, setGenerateTemplate] = React.useState<IdentityDocTemplate | null>(null);
  const [generateForm, setGenerateForm] = React.useState({
    candidateDob: '',
    fatherName: '',
    motherName: '',
    baptismDate: '',
    baptismPlace: '',
    officiantName: '',
    witnessName: '',
    date: new Date().toISOString().slice(0, 10),
    visitorEmail: '',
    visitorPhone: '',
    prayerRequest: '',
  });

  const [familyLinkOpen, setFamilyLinkOpen] = React.useState(false);
  const [familyLinkForm, setFamilyLinkForm] = React.useState({ familyId: '', familyName: '' });
  const [familyLinking, setFamilyLinking] = React.useState(false);

  const [cropOpen, setCropOpen] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<File | null>(null);
  const [cropType, setCropType] = React.useState<'profile' | 'family'>('profile');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMember(memberId);
      setMember(data);
      
      if (data.familyId) {
        // Fetch family members
        const all = await listMembers({ familyId: data.familyId });
        setFamilyMembers(all);
      } else {
        setFamilyMembers([]);
      }
    } catch (e: any) {
      setLoadError(e.message || 'Failed to load member profile');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!updateSuccess) return;
    const t = window.setTimeout(() => setUpdateSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [updateSuccess]);

  const initEditForm = async () => {
    if (!member) return;
    setSaveError(null);
    setEditForm({
      name: member.name ?? '',
      email: member.email ?? '',
      phone: member.phone ?? '',
      status: member.status ?? 'Active',
      growthStage: member.growthStage ?? 'Visitor',
      role: member.role ?? '',
      membershipDate: dateInputValue(member.membershipDate),
      dob: dateInputValue(member.dob),
      gender: member.gender ?? '',
      aadhaar: member.aadhaar ?? '',
      pan: member.pan ?? '',
      familyId: member.familyId ?? '',
      workforceClass: (member as any).workforceClass ?? '',
      employmentType: (member as any).employmentType ?? '',
      department: (member as any).department ?? '',
      reportingManagerId: (member as any).reportingManagerId ?? '',
      addressLine1: member.addressLine1 ?? '',
      addressLine2: member.addressLine2 ?? '',
      city: member.city ?? '',
      stateRegion: member.stateRegion ?? '',
      postalCode: member.postalCode ?? '',
      country: member.country ?? 'India',
      latitude: member.latitude != null ? String(member.latitude) : '',
      longitude: member.longitude != null ? String(member.longitude) : '',
    });

    if (allFamilies.length === 0) {
      try {
        const res = await apiRequest<{ status: string; data: any[] }>('/families', { method: 'GET' });
        setAllFamilies(res.data || []);
      } catch (e) {
        console.error("Failed to fetch families", e);
      }
    }
  };

  const saveEdit = async () => {
    if (!member) return;
    try {
      setSaving(true);
      setSaveError(null);
      setValidationErrors({});

      // Validation
      const errors: Record<string, string> = {};
      if (editForm.pan && !panRegex.test(editForm.pan.toUpperCase())) {
        errors.pan = "Invalid PAN format (e.g. ABCDE1234F)";
      }
      if (editForm.aadhaar && !aadhaarRegex.test(editForm.aadhaar)) {
        errors.aadhaar = "Aadhaar must be exactly 12 digits";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      const updated = await updateMember(member.id, {
        ...editForm,
        dob: editForm.dob || null,
        membershipDate: editForm.membershipDate || null,
        aadhaar: editForm.aadhaar || null,
        pan: editForm.pan?.toUpperCase() || null,
        addressLine1: editForm.addressLine1 || null,
        addressLine2: editForm.addressLine2 || null,
        city: editForm.city || null,
        stateRegion: editForm.stateRegion || null,
        postalCode: editForm.postalCode || null,
        country: editForm.country || 'India',
        latitude: editForm.latitude ? Number(editForm.latitude) : null,
        longitude: editForm.longitude ? Number(editForm.longitude) : null,
      });

      setMember(prev => prev ? { ...prev, ...updated } : updated);
      setUpdateSuccess('Profile updated successfully.');
      setIsEditOpen(false);
      await onMemberUpdated?.();
      void loadData();
    } catch (e: any) {
      setSaveError(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File, type: 'profile' | 'family' = 'profile') => {
    if (!member) return;
    
    try {
      setUploadingPhoto(true);
      setPhotoError(false);
      
      if (type === 'profile') {
        const res = await uploadProfileImage(member.id, file);
        setMember(prev => prev ? { ...prev, profileImageUrl: res } : null);
      } else if (member.familyId) {
        const res = await uploadFamilyImage(member.familyId, file);
        setMember(prev => prev ? { ...prev, family: prev.family ? { ...prev.family, imageUrl: res } : null } : null);
      }
      setPhotoPreview(null);
    } catch (err) {
      setPhotoError(true);
    } finally {
      setUploadingPhoto(false);
      setCropOpen(false);
    }
  };

  const onPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'family') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageToCrop(file);
    setCropType(type);
    setCropOpen(true);
  };

  const saveMilestone = async () => {
    if (!member) return;
    try {
      setMilestoneSaving(true);
      await createMemberMilestone(member.id, milestoneForm);
      setMilestoneOpen(false);
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setMilestoneSaving(false);
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!member) return;
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await deleteMemberMilestone(member.id, id);
      void loadData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const saveDocument = async () => {
    if (!member) return;
    try {
      setDocumentSaving(true);
      await createMemberDocument(member.id, documentForm, documentFile || undefined);
      setDocumentOpen(false);
      setDocumentFile(null);
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setDocumentSaving(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!member) return;
    if (!confirm('Delete this document?')) return;
    try {
      await deleteMemberDocument(member.id, id);
      void loadData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const openGenerateModal = (template: IdentityDocTemplate) => {
    if (!member) return;
    setGenerateTemplate(template);
    setGenerateForm({
      candidateDob: member.dob ? member.dob.slice(0, 10) : '',
      fatherName: '',
      motherName: '',
      baptismDate: new Date().toISOString().slice(0, 10),
      baptismPlace: '',
      officiantName: settings?.documents?.authorizedSignatoryName || '',
      witnessName: '',
      date: new Date().toISOString().slice(0, 10),
      visitorEmail: member.email || '',
      visitorPhone: member.phone || '',
      prayerRequest: '',
    });
    setGenerateModalOpen(true);
  };

  const submitGenerateDoc = async () => {
    if (!member || !generateTemplate) return;
    try {
      setIdentityGenerating(generateTemplate);
      setGenerateModalOpen(false);
      await generateMemberIdentityDocument(member.id, generateTemplate, generateForm);
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIdentityGenerating(null);
      setGenerateTemplate(null);
    }
  };

  const openDocAcceptance = (docId: string) => {
    setAcceptanceDocId(docId);
    setAcceptanceForm({ signerName: member?.name ?? '', signatureDataUrl: '' });
    setAcceptanceOpen(true);
  };

  const submitDocAcceptance = async () => {
    if (!member || !acceptanceDocId) return;
    const signerName = acceptanceForm.signerName.trim();
    if (!signerName) return;
    try {
      setAcceptanceSaving(true);
      await updateMemberDocument(member.id, acceptanceDocId, {
        acceptedAt: new Date().toISOString(),
        signerName,
        signatureDataUrl: acceptanceForm.signatureDataUrl.trim() || null,
      });
      setAcceptanceOpen(false);
      setAcceptanceDocId(null);
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setAcceptanceSaving(false);
    }
  };

  const saveGrowthStage = async (stage: GrowthStageKey) => {
    if (!member || member.growthStage === stage) return;
    try {
      setGrowthStageSaving(true);
      const updated = await updateMember(member.id, { growthStage: stage });
      setMember((prev) => (prev ? { ...prev, ...updated } : updated));
      setUpdateSuccess(`Growth stage updated to ${growthStageLabel(stage)}.`);
      await onMemberUpdated?.();
    } catch (e: any) {
      console.error(e);
    } finally {
      setGrowthStageSaving(false);
    }
  };

  React.useEffect(() => {
    void (async () => {
      try {
        const [minRes, sgRes] = await Promise.all([
          apiRequest('structure/ministries'),
          apiRequest('structure/small-groups'),
        ]);
        setStructureMinistries(parseApiResponse<{ id: string; name: string }[]>(minRes) || []);
        setStructureSmallGroups(parseApiResponse<{ id: string; name: string }[]>(sgRes) || []);
      } catch {
        /* optional */
      }
    })();
  }, []);

  const resolveResponsibilityLabel = (r: { entityType: string; entityId?: string | null }) => {
    if (r.entityType === 'Ministry' && r.entityId) {
      return structureMinistries.find((m) => m.id === r.entityId)?.name ?? 'Ministry';
    }
    if (r.entityType === 'SmallGroup' && r.entityId) {
      return structureSmallGroups.find((g) => g.id === r.entityId)?.name ?? 'Small Group';
    }
    return r.entityType;
  };

  const saveResponsibility = async () => {
    if (!member || !responsibilityForm.role.trim()) return;
    try {
      setResponsibilitySaving(true);
      await createMemberResponsibility(member.id, {
        role: responsibilityForm.role.trim(),
        entityType: responsibilityForm.entityType,
        entityId: responsibilityForm.entityId || undefined,
        status: responsibilityForm.status,
        startDate: responsibilityForm.startDate ? new Date(responsibilityForm.startDate).toISOString() : undefined,
        endDate: responsibilityForm.endDate ? new Date(responsibilityForm.endDate).toISOString() : undefined,
        notes: responsibilityForm.notes || undefined,
      });
      setResponsibilityOpen(false);
      setResponsibilityForm({
        role: '',
        entityType: 'Ministry',
        entityId: '',
        status: 'Active',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        notes: '',
      });
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setResponsibilitySaving(false);
    }
  };

  const removeResponsibility = async (resId: string) => {
    if (!member) return;
    if (!confirm('Remove this assignment?')) return;
    try {
      await deleteMemberResponsibility(member.id, resId);
      void loadData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleLinkFamily = async () => {
    if (!member) return;
    try {
      setFamilyLinking(true);
      await linkMemberFamily(member.id, familyLinkForm);
      setFamilyLinkOpen(false);
      window.dispatchEvent(new Event('kos:families-refresh'));
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setFamilyLinking(false);
    }
  };

  const handleUnlinkFamily = async () => {
    if (!member || !confirm('Unlink from family?')) return;
    try {
      await unlinkMemberFamily(member.id);
      window.dispatchEvent(new Event('kos:families-refresh'));
      void loadData();
    } catch (e: any) {
      console.error(e);
    }
  };

  const openNotes = () => {
    setNotesText('');
    setNotesOpen(true);
  };

  const saveNote = async () => {
    if (!member || !notesText.trim()) return;
    try {
      setNotesSaving(true);
      await createMemberCareNote(member.id, { note: notesText });
      setNotesOpen(false);
      void loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setNotesSaving(false);
    }
  };

  // Main UI
  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
           <div className="flex flex-col items-center gap-4 text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading profile…</p>
           </div>
        </div>
      ) : (loadError || !member) ? (
        <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
          <Button variant="ghost" className="gap-2 text-slate-500 font-bold mb-4" onClick={onBack} aria-label="Back">
            <ChevronLeft size={16} /> Back to Directory
          </Button>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
            {loadError ?? 'Member not found.'}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900 animate-in fade-in slide-in-from-right-4 duration-500">
          
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)] px-4 sm:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
             <div className="flex items-center gap-5">
                <Button variant="ghost" size="icon" className="rounded-full shrink-0 bg-slate-50 hover:bg-slate-100" onClick={onBack} aria-label="Back">
                   <ChevronLeft size={20} className="text-slate-600" />
                </Button>
                
                <div className="relative group shrink-0">
                   <div className="cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                      <input type="file" ref={photoInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPhotoSelect(e, 'profile')} />
                      <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative transition-all group-hover:scale-[1.02] ring-1 ring-slate-100">
                         <AppAvatar 
                           src={photoPreview || (member.profileImageUrl ? `${SERVER_ROOT}${member.profileImageUrl}?t=${Date.now()}` : undefined)} 
                           name={member.name} 
                           className="w-full h-full rounded-none border-none shadow-none"
                         />
                         {uploadingPhoto && (
                           <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[2px] z-20">
                              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
                           </div>
                         )}
                         <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] z-10">
                            <Camera size={32} className="text-white mb-2 transform scale-75 group-hover:scale-100 transition-transform drop-shadow-md" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Update Photo</span>
                         </div>
                      </div>
                   </div>
                </div>
                <div>
                   <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">{member.name}</h1>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">{member.status}</Badge>
                      <span className="text-xs font-bold text-slate-400">ID: {member.id.slice(0, 8)}</span>
                   </div>
                </div>
             </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => {
                    console.log("Edit clicked");
                    void initEditForm();
                    setIsEditOpen(true);
                  }} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 rounded-xl px-6 h-11 font-black transition-all active:scale-95"
                >
                   <Edit3 size={18} className="mr-2" /> Edit Profile
                </Button>
              </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
             {updateSuccess && (
               <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2">
                 <CheckCircle2 size={18} className="text-emerald-500" /> {updateSuccess}
               </div>
             )}
             
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* 2. LEFT SUMMARY PANEL (Compact Snapshot) */}
                <div className="lg:col-span-1 space-y-6">
                   <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                         <User size={14} className="text-slate-400" />
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Snapshot</h3>
                      </div>
                      <CardContent className="p-0">
                         <div className="divide-y divide-slate-100 text-sm">
                            <div className="px-5 py-3 flex justify-between items-center">
                               <span className="text-slate-500 font-medium">DOB</span>
                               <span className="font-bold text-slate-900">{member.dob ? new Date(member.dob).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '—'}</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center">
                               <span className="text-slate-500 font-medium">Joined</span>
                               <span className="font-bold text-slate-900">{member.membershipDate ? new Date(member.membershipDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '—'}</span>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center">
                               <span className="text-slate-500 font-medium">Family</span>
                               <div className="flex items-center gap-2 max-w-[150px]">
                                  {member.familyId && (
                                    <AppAvatar 
                                      src={member.family?.imageUrl} 
                                      name={member.family?.name} 
                                      className="w-6 h-6 shrink-0"
                                    />
                                  )}
                                  <span className="font-bold text-indigo-600 truncate">{member.family?.name || 'Unlinked'}</span>
                               </div>
                            </div>
                            <div className="px-5 py-3 flex justify-between items-center bg-slate-50/50">
                               <span className="text-slate-500 font-medium flex items-center gap-1"><Activity size={14}/> Engagement</span>
                               <span className="font-bold text-slate-900">{member.attendances?.length || 0}v • {member.donations?.length || 0}g</span>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                   
                   <Card className="rounded-2xl shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <FileSignature size={14} className="text-slate-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Pastoral Notes</h3>
                         </div>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-full" onClick={openNotes}><Edit3 size={14}/></Button>
                      </div>
                      <CardContent className="p-5">
                         {(member.careNotes || []).length === 0 ? (
                            <p className="text-sm text-slate-400 font-medium italic">No private staff notes recorded.</p>
                         ) : (
                            <div className="space-y-4">
                               {(member.careNotes || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 1).map((note: any) => (
                                  <div key={note.id} className="space-y-2">
                                     <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-3">{note.note}</p>
                                     <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(note.date).toLocaleDateString()}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         )}
                      </CardContent>
                   </Card>
                </div>
                
                <div className="lg:col-span-3">
                    <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar whitespace-nowrap">
                      {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'journey', label: 'Spiritual Journey' },
                        { id: 'attendance', label: 'Attendance' },
                        { id: 'family', label: 'Family' },
                        { id: 'giving', label: 'Giving' },
                        { id: 'documents', label: 'Records' },
                        { id: 'timeline', label: 'Timeline' },
                      ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as TabType)} className={cn("pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2", activeTab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                   
                   <div className="animate-in fade-in slide-in-from-bottom-2">
                      {activeTab === 'overview' && (
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="rounded-2xl shadow-sm border-slate-200 bg-white">
                                 <CardHeader className="pb-4 border-b border-slate-100">
                                    <CardTitle className="text-base font-bold text-slate-900">Contact Identity</CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-5 space-y-5">
                                    <div className="flex items-start gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                          <Mail size={18} />
                                       </div>
                                       <div>
                                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Email Address</p>
                                          <p className="font-bold text-slate-900">{member.email || 'None on file'}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                          <Phone size={18} />
                                       </div>
                                       <div>
                                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Mobile Phone</p>
                                          <p className="font-bold text-slate-900">{member.phone || 'None on file'}</p>
                                       </div>
                                    </div>
                                 </CardContent>
                              </Card>

                              <Card className="rounded-2xl shadow-sm border-slate-200 bg-white md:col-span-2">
                                 <CardHeader className="pb-4 border-b border-slate-100">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><MapPin size={16}/> Address &amp; Location</CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-5 space-y-3">
                                    {(() => {
                                      const line = formatAddressLine(member);
                                      const mapUrl = googleMapsUrl(member);
                                      return line ? (
                                        <>
                                          <p className="font-bold text-slate-900">{line}</p>
                                          {mapUrl && (
                                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800">
                                              <ExternalLink size={14} /> Open in Google Maps
                                            </a>
                                          )}
                                        </>
                                      ) : (
                                        <p className="text-sm text-slate-500 font-medium">No address on file. Add via Edit Profile for pastoral visitation.</p>
                                      );
                                    })()}
                                 </CardContent>
                              </Card>

                              <Card className="rounded-2xl shadow-sm border-slate-200 bg-white">
                                 <CardHeader className="pb-4 border-b border-slate-100 flex-row items-center justify-between">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><ShieldCheck size={16}/> Verification records</CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-5 space-y-4">
                                    <div>
                                       <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Aadhaar Number</p>
                                       <p className="font-bold text-slate-900 tabular-nums">{member.aadhaar || '—'}</p>
                                    </div>
                                    <div>
                                       <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">PAN Number</p>
                                       <p className="font-bold text-slate-900 uppercase">{member.pan || '—'}</p>
                                    </div>
                                 </CardContent>
                              </Card>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="md:col-span-2 space-y-6">
                                <Card className="rounded-2xl shadow-sm border-slate-200 bg-white">
                                   <CardHeader className="pb-4 border-b border-slate-100 flex-row items-center justify-between">
                                      <CardTitle className="text-base font-bold text-slate-900">Recent Engagement</CardTitle>
                                   </CardHeader>
                                   <CardContent className="p-0">
                                      {(!member.attendances || member.attendances.length === 0) ? (
                                         <p className="p-8 text-center text-sm text-slate-500 font-medium">No activity recorded yet.</p>
                                      ) : (
                                         <div className="divide-y divide-slate-100">
                                            {member.attendances.slice(0, 5).map((a: any, i: number) => (
                                               <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                                                     <Activity size={18}/>
                                                  </div>
                                                  <div className="flex-1">
                                                     <p className="text-sm font-bold text-slate-900">Attended {a.session?.name || a.type}</p>
                                                     <p className="text-xs font-medium text-slate-500">{new Date(a.date || a.checkInTime).toLocaleDateString()}</p>
                                                  </div>
                                               </div>
                                            ))}
                                         </div>
                                      )}
                                   </CardContent>
                                </Card>
                             </div>

                             <Card className="rounded-2xl shadow-sm border-slate-200 bg-white">
                                <CardHeader className="pb-4 border-b border-slate-100">
                                   <CardTitle className="text-base font-bold text-slate-900">Household</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                   {member.familyId ? (
                                     <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                           <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
                                              <AppAvatar src={member.family?.imageUrl ? `${SERVER_ROOT}${member.family.imageUrl}` : undefined} name={member.family?.name} />
                                           </div>
                                           <div>
                                              <p className="text-sm font-black text-slate-900">{member.family?.name}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{familyMembers.length} Members</p>
                                           </div>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-slate-50">
                                           {familyMembers.slice(0, 3).map(f => (
                                              <div key={f.id} className="flex items-center gap-2">
                                                 <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                 <span className="text-xs font-bold text-slate-600">{f.name}</span>
                                                 {f.id === member.id && <span className="text-[8px] font-black text-indigo-400 ml-auto">SELF</span>}
                                              </div>
                                           ))}
                                           {familyMembers.length > 3 && <p className="text-[9px] text-slate-400 font-bold italic">+{familyMembers.length - 3} more members</p>}
                                        </div>
                                        <button onClick={() => setActiveTab('family')} className="w-full mt-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 flex items-center justify-center gap-1">Manage Household <ChevronRight size={10} /></button>
                                     </div>
                                   ) : (
                                     <div className="py-4 text-center">
                                        <Users size={24} className="mx-auto mb-2 text-slate-200" />
                                        <p className="text-xs font-bold text-slate-400">Independent Profile</p>
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('family')} className="mt-3 h-8 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">Link Family</Button>
                                     </div>
                                   )}
                                </CardContent>
                             </Card>
                           </div>
                        </div>
                      )}

                       {activeTab === 'journey' && (
                        <div className="space-y-6">
                           {/* Growth Stage Pipeline */}
                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="pb-4 border-b border-slate-100">
                                 <CardTitle className="text-base font-bold text-slate-900">Spiritual Growth Pipeline</CardTitle>
                                 <CardDescription className="text-xs font-medium">Visualizing current standing in the discipleship journey.</CardDescription>
                              </CardHeader>
                              <CardContent className="p-8">
                                 <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                                    <div className="absolute left-0 right-0 h-1 bg-slate-100 top-1/2 -translate-y-1/2" />
                                    {GROWTH_PIPELINE.map((stage, i) => {
                                      const currentIdx = pipelineIndex(member.growthStage);
                                      const isCompleted = i < currentIdx;
                                      const isActive = i === currentIdx;
                                      
                                      return (
                                        <button key={stage.key} type="button" disabled={growthStageSaving} onClick={() => void saveGrowthStage(stage.key)} className="relative z-10 flex flex-col items-center gap-2 min-w-[70px]">
                                           <div className={cn(
                                             "w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-all",
                                             isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-indigo-600 text-white scale-110" : "bg-white text-slate-300"
                                           )}>
                                              {isCompleted ? <Check size={16} /> : <span className="text-[10px] font-black">{i + 1}</span>}
                                           </div>
                                           <span className={cn(
                                             "text-[10px] font-black uppercase tracking-widest",
                                             isActive ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                                           )}>
                                             {stage.label}
                                           </span>
                                        </button>
                                      );
                                    })}
                                 </div>
                                 <p className="text-center text-xs font-bold text-slate-500 mt-4">
                                   Current stage: {growthStageLabel(member.growthStage)}
                                   {' · '}
                                   <select
                                     className="ml-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-black uppercase"
                                     value={member.growthStage === 'Staff' ? 'CoreTeam' : (member.growthStage || 'Visitor')}
                                     disabled={growthStageSaving}
                                     onChange={(e) => void saveGrowthStage(e.target.value as GrowthStageKey)}
                                   >
                                     {GROWTH_PIPELINE.map((s) => (
                                       <option key={s.key} value={s.key}>{s.label}</option>
                                     ))}
                                   </select>
                                 </p>
                              </CardContent>
                           </Card>

                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden p-6">
                              <MinistryJourneyTimeline memberId={memberId} />
                           </Card>

                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                                 <div>
                                    <CardTitle className="text-base font-bold text-slate-900">Spiritual Milestones</CardTitle>
                                    <CardDescription className="text-xs font-medium">Tracking specific faith events and commitments.</CardDescription>
                                 </div>
                                 <Button onClick={() => setMilestoneOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-9 rounded-xl px-4 gap-2">
                                    <Plus size={16} /> Add Milestone
                                 </Button>
                              </CardHeader>
                              <CardContent className="p-0">
                                 {(!member.milestones || member.milestones.length === 0) ? (
                                    <div className="p-12 text-center text-slate-400">
                                       <Award size={32} className="mx-auto mb-3 opacity-20" />
                                       <p className="text-sm font-bold">No milestones recorded.</p>
                                    </div>
                                 ) : (
                                    <div className="divide-y divide-slate-100">
                                       {member.milestones.map((m: any) => (
                                          <div key={m.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                                                   <CheckCircle2 size={18} />
                                                </div>
                                                <div>
                                                   <p className="text-sm font-bold text-slate-900">{m.type}</p>
                                                   <p className="text-xs font-medium text-slate-500">{new Date(m.date).toLocaleDateString()}</p>
                                                </div>
                                             </div>
                                             <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600" onClick={() => deleteMilestone(m.id)}>
                                                <Trash2 size={16} />
                                             </Button>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </CardContent>
                           </Card>

                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                                 <div>
                                 <CardTitle className="text-base font-bold text-slate-900">Roles & Responsibilities</CardTitle>
                                 <CardDescription className="text-xs font-medium">Current assignments in church departments.</CardDescription>
                                 </div>
                                 <Button onClick={() => setResponsibilityOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-9 rounded-xl px-4 gap-2">
                                    <Plus size={16} /> Assign Role
                                 </Button>
                              </CardHeader>
                              <CardContent className="p-0">
                                 {(!member.responsibilities || member.responsibilities.length === 0) ? (
                                    <div className="p-12 text-center text-slate-400">
                                       <Briefcase size={32} className="mx-auto mb-3 opacity-20" />
                                       <p className="text-sm font-bold">No active responsibilities.</p>
                                    </div>
                                 ) : (
                                    <div className="divide-y divide-slate-100">
                                       {member.responsibilities.map((r: any) => (
                                          <div key={r.id} className="flex items-center justify-between p-5">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                                   <Briefcase size={18} />
                                                </div>
                                                <div>
                                                   <p className="text-sm font-bold text-slate-900">{r.role}</p>
                                                   <p className="text-xs font-medium text-slate-500">{r.status} • {resolveResponsibilityLabel(r)} · {servingTierForRole(r.role)}</p>
                                                </div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                               <Badge className="bg-slate-100 text-slate-600 border-none uppercase tracking-widest text-[10px] font-black">{r.status}</Badge>
                                               <Button variant="ghost" size="icon" className="text-rose-400" onClick={() => void removeResponsibility(r.id)}><Trash2 size={16} /></Button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </CardContent>
                           </Card>
                        </div>
                      )}

                      {activeTab === 'attendance' && (
                        <div className="space-y-6">
                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="border-b border-slate-100 pb-4">
                                 <CardTitle className="text-base font-bold text-slate-900">Attendance History</CardTitle>
                                 <CardDescription className="text-xs font-medium">Record of participation in services and events.</CardDescription>
                              </CardHeader>
                              <CardContent className="p-0">
                                 {(!member.attendances || member.attendances.length === 0) ? (
                                    <div className="p-16 flex flex-col items-center justify-center text-slate-400 text-center">
                                       <Calendar size={32} className="mb-4 opacity-20"/>
                                       <p className="font-bold text-slate-900 mb-1">No attendance records</p>
                                       <p className="text-sm font-medium">This member has not been checked into any sessions yet.</p>
                                    </div>
                                 ) : (
                                    <ResponsiveTableWrap className="border-0 rounded-none">
                                    <table className="w-full min-w-[640px] text-sm text-left">
                                       <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-widest font-black">
                                          <tr>
                                             <th className="px-6 py-4">Session / Event</th>
                                             <th className="px-6 py-4">Date</th>
                                             <th className="px-6 py-4">Status</th>
                                             <th className="px-6 py-4">Method</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                          {(member.attendances || []).sort((a: any, b: any) => new Date(b.checkInTime || 0).getTime() - new Date(a.checkInTime || 0).getTime()).map((a: any) => (
                                             <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                   <div className="flex flex-col">
                                                      <span className="font-bold text-slate-900">{a.session?.name || 'Unknown Session'}</span>
                                                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{a.session?.type || a.type}</span>
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <div className="flex flex-col">
                                                      <span className="font-bold text-slate-700">{new Date(a.checkInTime || a.date).toLocaleDateString()}</span>
                                                      <span className="text-[10px] text-slate-400 font-bold">{a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <Badge className={cn(
                                                      "border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                                      a.status === 'PRESENT' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                                   )}>
                                                      {a.status}
                                                   </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.method || 'Manual'}</span>
                                                </td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                    </ResponsiveTableWrap>
                                 )}
                              </CardContent>
                           </Card>
                        </div>
                      )}

                      {activeTab === 'family' && (
                        <div className="space-y-6">
                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <input type="file" ref={familyPhotoInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPhotoSelect(e, 'family')} />
                                    <div className="relative group" onClick={() => {
                                       if (!member.familyId) return;
                                       setCropType('family');
                                       familyPhotoInputRef.current?.click();
                                    }}>
                                       <div className={cn("w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md transition-all", member.familyId && "cursor-pointer group-hover:scale-105")}>
                                          <AppAvatar src={member.family?.imageUrl ? `${SERVER_ROOT}${member.family.imageUrl}` : undefined} name={member.family?.name || '?'} className="w-full h-full rounded-none" />
                                          {member.familyId && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                               <Camera size={16} className="text-white" />
                                            </div>
                                          )}
                                       </div>
                                    </div>
                                    <div>
                                       <CardTitle className="text-base font-bold text-slate-900">Household Structure</CardTitle>
                                       <CardDescription className="text-xs font-bold mt-1 uppercase tracking-widest text-indigo-600">{member.family?.name || 'No household record'}</CardDescription>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="bg-white shadow-sm font-bold h-9 rounded-xl border-slate-200" onClick={() => {
                                       setFamilyLinkForm({ familyId: member.familyId || '', familyName: '' });
                                       setFamilyLinkOpen(true);
                                    }}>
                                       {member.familyId ? 'Change Family' : 'Link Family'}
                                    </Button>
                                    {member.familyId && <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 font-bold h-9 rounded-xl" onClick={handleUnlinkFamily}>Unlink</Button>}
                                 </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                 {familyMembers.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center justify-center text-slate-400 text-center">
                                       <Users size={32} className="mb-4 opacity-20"/>
                                       <p className="font-bold text-slate-900 mb-1">Independent Profile</p>
                                       <p className="text-sm font-medium">This member is not linked to any other family accounts.</p>
                                    </div>
                                 ) : (
                                    <ResponsiveTableWrap className="border-0 rounded-none">
                                    <table className="w-full min-w-[480px] text-sm text-left">
                                       <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-widest font-black">
                                          <tr>
                                             <th className="px-6 py-4">Name</th>
                                             <th className="px-6 py-4">Relation</th>
                                             <th className="px-6 py-4 text-right">Actions</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                          {familyMembers.map(f => (
                                             <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                   <div className="flex items-center gap-3">
                                                      <AppAvatar src={f.profileImageUrl ? `${SERVER_ROOT}${f.profileImageUrl}` : undefined} name={f.name} className="w-8 h-8 rounded-full shadow-sm" />
                                                      <span className="font-bold text-slate-900">{f.name}</span>
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <Badge variant="secondary" className="bg-slate-100 text-slate-600 shadow-none border-none uppercase tracking-widest text-[10px] font-black">
                                                      {f.id === member.id ? 'Self' : 'Family'}
                                                   </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                   <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-slate-400">View Profile</Button>
                                                </td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                    </ResponsiveTableWrap>
                                 )}
                              </CardContent>
                           </Card>
                        </div>
                      )}

                      {activeTab === 'giving' && (
                        <div className="space-y-6">
                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="border-b border-slate-100 pb-4">
                                 <CardTitle className="text-base font-bold text-slate-900">Contribution History</CardTitle>
                                 <CardDescription className="text-xs font-medium">Recent donations and financial engagement.</CardDescription>
                              </CardHeader>
                              <CardContent className="p-0">
                                 {(!member.donations || member.donations.length === 0) ? (
                                    <div className="p-16 text-center text-slate-400">
                                       <DollarSign size={48} className="mx-auto mb-4 opacity-10" />
                                       <p className="font-bold text-slate-900">No contribution data</p>
                                       <p className="text-sm font-medium">This member hasn't recorded any giving yet.</p>
                                    </div>
                                 ) : (
                                    <div className="divide-y divide-slate-100">
                                       {member.donations.map((d: any) => (
                                          <div key={d.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                   <DollarSign size={18} />
                                                </div>
                                                <div>
                                                   <p className="text-sm font-bold text-slate-900">₹{d.amount.toLocaleString()}</p>
                                                   <p className="text-xs font-medium text-slate-500">{d.campaign?.name || 'General Fund'} • {new Date(d.date).toLocaleDateString()}</p>
                                                </div>
                                             </div>
                                             <Badge variant="outline" className="text-slate-500 font-bold text-[10px]">{d.method}</Badge>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </CardContent>
                           </Card>
                        </div>
                      )}

                      {activeTab === 'documents' && (
                        <div className="space-y-6">
                           <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
                              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row flex-wrap items-center justify-between gap-3">
                                 <div>
                                    <CardTitle className="text-base font-bold text-slate-900">Identity Documents</CardTitle>
                                    <CardDescription className="text-xs font-medium">ID, baptism, and other verification files on file.</CardDescription>
                                 </div>
                                 <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                                      disabled={!!identityGenerating}
                                      onClick={() => openGenerateModal('visitor_declaration')}
                                    >
                                      {identityGenerating === 'visitor_declaration' ? '…' : 'Visitor decl.'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                                      disabled={!!identityGenerating}
                                      onClick={() => openGenerateModal('member_declaration')}
                                    >
                                      {identityGenerating === 'member_declaration' ? '…' : 'Member decl.'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                                      disabled={!!identityGenerating}
                                      onClick={() => openGenerateModal('baptism_certificate')}
                                    >
                                      {identityGenerating === 'baptism_certificate' ? '…' : 'Baptism cert.'}
                                    </Button>
                                    <Button onClick={() => setDocumentOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-9 rounded-xl px-4 gap-2">
                                       <UploadCloud size={16} /> Upload
                                    </Button>
                                 </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                 {(!member.documents || member.documents.length === 0) ? (
                                    <div className="p-16 text-center text-slate-400">
                                       <FileText size={48} className="mx-auto mb-4 opacity-10" />
                                       <p className="font-bold text-slate-900">No documents</p>
                                       <p className="text-sm font-medium">Verification documents have not been uploaded.</p>
                                    </div>
                                 ) : (
                                    <div className="divide-y divide-slate-100">
                                       {member.documents.map((d: any) => (
                                          <div key={d.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                   <FileText size={18} />
                                                </div>
                                                <div>
                                                   <p className="text-sm font-bold text-slate-900">{d.type}</p>
                                                   <p className="text-xs font-medium text-slate-500">
                                                      {d.number || 'No number'} • {new Date(d.createdAt).toLocaleDateString()}
                                                      {d.acceptedAt ? ` • Accepted ${new Date(d.acceptedAt).toLocaleDateString()}` : ''}
                                                   </p>
                                                   {d.signerName ? (
                                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Signer: {d.signerName}</p>
                                                   ) : null}
                                                </div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                {d.fileUrl && (
                                                  <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => window.open(`${SERVER_ROOT}${d.fileUrl}`, '_blank')}>View / Print</Button>
                                                )}
                                                {(d.type === 'DeclarationForm' || String(d.type).startsWith('Generated')) && !d.acceptedAt && (
                                                  <Button variant="ghost" size="sm" className="text-emerald-700 font-bold" onClick={() => openDocAcceptance(d.id)}>
                                                     Record acceptance
                                                  </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600" onClick={() => deleteDoc(d.id)}>
                                                   <Trash2 size={16} />
                                                </Button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </CardContent>
                           </Card>
                        </div>
                      )}

                      {activeTab === 'timeline' && (
                        <div className="space-y-8">
                           <div className="relative pl-8 space-y-12 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-100">
                              {[
                                ...(member.careNotes || []).map((n: any) => ({ ...n, timelineType: 'note', icon: <MessageSquare size={14}/>, color: 'violet' })),
                                ...(member.milestones || []).map((m: any) => ({ ...m, timelineType: 'milestone', icon: <Award size={14}/>, color: 'amber' })),
                              ].sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()).map((item, idx) => (
                                <div key={idx} className="relative">
                                   <div className={cn("absolute -left-8 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10", 
                                     item.color === 'violet' ? 'bg-violet-500 text-white' : 'bg-amber-500 text-white')}>
                                      {item.icon}
                                   </div>
                                   <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 ml-4 animate-in slide-in-from-left-4">
                                      <div className="flex items-center justify-between mb-2">
                                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {item.timelineType === 'note' ? 'Pastoral Note' : item.type} • {new Date(item.date || item.createdAt || 0).toLocaleDateString()}
                                         </p>
                                         {item.timelineType === 'note' && <Badge className="bg-violet-50 text-violet-600 border-none px-2 py-0 text-[9px] font-black tracking-tighter">PRIVATE</Badge>}
                                      </div>
                                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{item.note || item.notes || 'Status updated.'}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODALS (Always Mounted) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Edit3 size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 leading-none">Edit Member Profile</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-xs mt-1">Update personal and church-related information.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col max-h-[75vh]">
            {saveError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl border border-rose-100 flex items-center gap-2">
                <AlertCircle size={16} /> {saveError}
              </div>
            )}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User size={14} className="text-indigo-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Basic Information</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Full Name</label>
                  <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Email Address</label>
                     <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Phone Number</label>
                     <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                   </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Calendar size={14} className="text-amber-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Personal Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Date of Birth</label>
                    <Input type="date" value={editForm.dob} onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Gender</label>
                    <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Verification</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Aadhaar Number</label>
                    <Input value={editForm.aadhaar} onChange={e => setEditForm(f => ({ ...f, aadhaar: e.target.value }))} className={cn("shadow-sm border-slate-200 h-11 bg-white font-medium", validationErrors.aadhaar && "border-rose-500 focus:ring-rose-500/10")} />
                    {validationErrors.aadhaar && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{validationErrors.aadhaar}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">PAN Number</label>
                    <Input value={editForm.pan} onChange={e => setEditForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className={cn("shadow-sm border-slate-200 h-11 bg-white font-medium uppercase", validationErrors.pan && "border-rose-500 focus:ring-rose-500/10")} />
                    {validationErrors.pan && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{validationErrors.pan}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Award size={14} className="text-violet-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Church Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Member Status</label>
                    <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Left">Left Church</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Growth Stage</label>
                    <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editForm.growthStage} onChange={e => setEditForm(f => ({ ...f, growthStage: e.target.value }))}>
                      {GROWTH_PIPELINE.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Primary Role</label>
                    <Input value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" placeholder="e.g. Volunteer" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Joined Date</label>
                    <Input type="date" value={editForm.membershipDate} onChange={e => setEditForm(f => ({ ...f, membershipDate: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Workforce class</label>
                    <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold" value={editForm.workforceClass} onChange={e => setEditForm(f => ({ ...f, workforceClass: e.target.value }))}>
                      <option value="">—</option>
                      <option value="staff">Staff</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="pastor">Pastor</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Employment type</label>
                    <Input value={editForm.employmentType} onChange={e => setEditForm(f => ({ ...f, employmentType: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" placeholder="Full-time" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Department</label>
                    <Input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" placeholder="Worship, Finance, Youth…" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MapPin size={14} className="text-rose-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Address</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Address Line 1</label>
                  <Input value={editForm.addressLine1} onChange={e => setEditForm(f => ({ ...f, addressLine1: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">City</label>
                    <Input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">State</label>
                    <Input value={editForm.stateRegion} onChange={e => setEditForm(f => ({ ...f, stateRegion: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">PIN</label>
                    <Input value={editForm.postalCode} onChange={e => setEditForm(f => ({ ...f, postalCode: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Latitude</label>
                    <Input value={editForm.latitude} onChange={e => setEditForm(f => ({ ...f, latitude: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" placeholder="Optional" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Longitude</label>
                    <Input value={editForm.longitude} onChange={e => setEditForm(f => ({ ...f, longitude: e.target.value }))} className="shadow-sm border-slate-200 h-11 bg-white font-medium" placeholder="Optional" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Users size={14} className="text-blue-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Family Connection</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 pl-1">Assign to Family</label>
                  <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editForm.familyId} onChange={e => setEditForm(f => ({ ...f, familyId: e.target.value }))}>
                    <option value="">No Family / Independent</option>
                    {allFamilies.map(fam => (
                      <option key={fam.id} value={fam.id}>{fam.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="font-bold text-slate-600 hover:bg-slate-200/50">Cancel Changes</Button>
              <Button onClick={() => void saveEdit()} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 shadow-lg shadow-indigo-100">
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-md">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <MessageSquare size={20} />
              </div>
              <DialogTitle className="text-xl font-black text-slate-900">Add Pastoral Note</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-6 bg-slate-50/50 space-y-4">
             <Textarea value={notesText} onChange={e => setNotesText(e.target.value)} placeholder="Type a note about this member..." className="min-h-[150px] bg-white border-slate-200 shadow-sm rounded-xl focus:ring-violet-500/20" />
          </div>
          <DialogFooter className="p-4 border-t border-slate-100 bg-white">
             <Button variant="ghost" onClick={() => setNotesOpen(false)} disabled={notesSaving} className="font-bold">Cancel</Button>
             <Button onClick={() => void saveNote()} disabled={notesSaving || !notesText.trim()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-200">
                {notesSaving ? 'Saving...' : 'Save Note'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={milestoneOpen} onOpenChange={setMilestoneOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-md">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2"><Award className="text-amber-500"/> Spiritual Milestone</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Milestone Type</label>
               <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm" value={milestoneForm.type} onChange={e => setMilestoneForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Salvation">Salvation</option>
                  <option value="Baptism">Baptism</option>
                  <option value="MembershipClass">Membership Class</option>
                  <option value="SmallGroupLeader">Small Group Leader</option>
                  <option value="Other">Other</option>
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Date</label>
               <Input type="date" value={milestoneForm.date} onChange={e => setMilestoneForm(f => ({ ...f, date: e.target.value }))} className="h-11 font-bold" />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Notes (Optional)</label>
               <Textarea value={milestoneForm.notes} onChange={e => setMilestoneForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-50 border-slate-200" />
             </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
             <Button variant="ghost" onClick={() => setMilestoneOpen(false)} className="font-bold">Cancel</Button>
             <Button onClick={() => void saveMilestone()} disabled={milestoneSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black">
                {milestoneSaving ? 'Saving...' : 'Add Milestone'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={documentOpen} onOpenChange={setDocumentOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-md">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2"><UploadCloud className="text-blue-500"/> Upload Document</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Document Type</label>
               <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm" value={documentForm.type} onChange={e => setDocumentForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="BaptismCert">Baptism Certificate</option>
                  <option value="Other">Other</option>
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Document Number</label>
               <Input value={documentForm.number} onChange={e => setDocumentForm(f => ({ ...f, number: e.target.value }))} className="h-11 font-bold" placeholder="Optional" />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Select File</label>
               <Input type="file" onChange={e => setDocumentFile(e.target.files?.[0] || null)} className="h-11" accept="image/*,application/pdf" />
             </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
             <Button variant="ghost" onClick={() => setDocumentOpen(false)} className="font-bold">Cancel</Button>
             <Button onClick={() => void saveDocument()} disabled={documentSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black">
                {documentSaving ? 'Uploading...' : 'Save Document'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={familyLinkOpen} onOpenChange={setFamilyLinkOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-md">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2"><Users className="text-indigo-500"/> Link Family</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Select Existing Family</label>
               <select className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm" value={familyLinkForm.familyId} onChange={e => setFamilyLinkForm(f => ({ ...f, familyId: e.target.value, familyName: '' }))}>
                  <option value="">Create New / None</option>
                  {allFamilies.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
             </div>
             <div className="relative py-2 text-center">
                <span className="bg-white px-2 text-[10px] font-black text-slate-300 relative z-10">OR</span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 z-0"></div>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Create New Family Name</label>
               <Input value={familyLinkForm.familyName} onChange={e => setFamilyLinkForm(f => ({ ...f, familyName: e.target.value, familyId: '' }))} className="h-11 font-bold" placeholder="e.g. Smith Household" />
             </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
             <Button variant="ghost" onClick={() => setFamilyLinkOpen(false)} className="font-bold">Cancel</Button>
             <Button onClick={() => void handleLinkFamily()} disabled={familyLinking} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black">
                {familyLinking ? 'Linking...' : 'Link Family'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={responsibilityOpen} onOpenChange={setResponsibilityOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-md">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900">Assign Role / Responsibility</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Role title</label>
              <select className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold mb-2" value={responsibilityForm.role} onChange={e => setResponsibilityForm(f => ({ ...f, role: e.target.value }))}>
                <option value="">Select role…</option>
                {COMMON_SERVING_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <Input value={responsibilityForm.role} onChange={e => setResponsibilityForm(f => ({ ...f, role: e.target.value }))} className="h-11 font-bold" placeholder="Or type custom role" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Serving area</label>
                <select className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold" value={responsibilityForm.entityType} onChange={e => setResponsibilityForm(f => ({ ...f, entityType: e.target.value, entityId: '' }))}>
                  {ENTITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Status</label>
                <select className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold" value={responsibilityForm.status} onChange={e => setResponsibilityForm(f => ({ ...f, status: e.target.value }))}>
                  {SERVING_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            {(responsibilityForm.entityType === 'Ministry' || responsibilityForm.entityType === 'SmallGroup') && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Link to team</label>
                <select className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold" value={responsibilityForm.entityId} onChange={e => setResponsibilityForm(f => ({ ...f, entityId: e.target.value }))}>
                  <option value="">General (not linked)</option>
                  {(responsibilityForm.entityType === 'Ministry' ? structureMinistries : structureSmallGroups).map((ent) => (
                    <option key={ent.id} value={ent.id}>{ent.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Start date</label>
                <Input type="date" value={responsibilityForm.startDate} onChange={e => setResponsibilityForm(f => ({ ...f, startDate: e.target.value }))} className="h-11 font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">End date (optional)</label>
                <Input type="date" value={responsibilityForm.endDate} onChange={e => setResponsibilityForm(f => ({ ...f, endDate: e.target.value }))} className="h-11 font-bold" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Notes</label>
              <Textarea value={responsibilityForm.notes} onChange={e => setResponsibilityForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-50" />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setResponsibilityOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveResponsibility()} disabled={responsibilitySaving || !responsibilityForm.role.trim()} className="bg-indigo-600 text-white font-black">
              {responsibilitySaving ? 'Saving…' : 'Save assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={acceptanceOpen} onOpenChange={setAcceptanceOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-md">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900">Record declaration acceptance</DialogTitle>
            <DialogDescription className="text-xs font-medium">Pastoral review — records who signed this document.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Signer name</label>
              <Input value={acceptanceForm.signerName} onChange={e => setAcceptanceForm(f => ({ ...f, signerName: e.target.value }))} className="h-11 font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Signature data URL (optional)</label>
              <Textarea value={acceptanceForm.signatureDataUrl} onChange={e => setAcceptanceForm(f => ({ ...f, signatureDataUrl: e.target.value }))} className="bg-slate-50 text-xs" placeholder="Optional captured signature" />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAcceptanceOpen(false)}>Cancel</Button>
            <Button onClick={() => void submitDocAcceptance()} disabled={acceptanceSaving || !acceptanceForm.signerName.trim()} className="bg-emerald-600 text-white font-black">
              {acceptanceSaving ? 'Saving…' : 'Record acceptance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl overflow-hidden max-w-xl">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-black text-slate-900">
              {generateTemplate === 'visitor_declaration' ? 'Visitor Connection Declaration Form' :
               generateTemplate === 'member_declaration' ? 'Faith Alignment & Membership Covenant' :
               'Sacred Certificate of Holy Baptism'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Confirm member details and register fields before generating the document.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {generateTemplate === 'baptism_certificate' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Candidate DOB</label>
                    <Input type="date" value={generateForm.candidateDob} onChange={e => setGenerateForm(f => ({ ...f, candidateDob: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Baptism Date</label>
                    <Input type="date" value={generateForm.baptismDate} onChange={e => setGenerateForm(f => ({ ...f, baptismDate: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Father / Guardian Name</label>
                    <Input value={generateForm.fatherName} onChange={e => setGenerateForm(f => ({ ...f, fatherName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Mother's Name</label>
                    <Input value={generateForm.motherName} onChange={e => setGenerateForm(f => ({ ...f, motherName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Sanctuary / Baptism Location</label>
                  <Input value={generateForm.baptismPlace} onChange={e => setGenerateForm(f => ({ ...f, baptismPlace: e.target.value }))} className="h-11 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Officiating Minister</label>
                    <Input value={generateForm.officiantName} onChange={e => setGenerateForm(f => ({ ...f, officiantName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Attesting Witness</label>
                    <Input value={generateForm.witnessName} onChange={e => setGenerateForm(f => ({ ...f, witnessName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
              </>
            )}

            {generateTemplate === 'member_declaration' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Candidate DOB</label>
                    <Input type="date" value={generateForm.candidateDob} onChange={e => setGenerateForm(f => ({ ...f, candidateDob: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Registry Enrolment Date</label>
                    <Input type="date" value={generateForm.date} onChange={e => setGenerateForm(f => ({ ...f, date: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Authorized Signatory Pastor</label>
                    <Input value={generateForm.officiantName} onChange={e => setGenerateForm(f => ({ ...f, officiantName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Attesting Board Trustee</label>
                    <Input value={generateForm.witnessName} onChange={e => setGenerateForm(f => ({ ...f, witnessName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
              </>
            )}

            {generateTemplate === 'visitor_declaration' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Date of Visit</label>
                    <Input type="date" value={generateForm.date} onChange={e => setGenerateForm(f => ({ ...f, date: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Connector / Hospitality Lead</label>
                    <Input value={generateForm.witnessName} onChange={e => setGenerateForm(f => ({ ...f, witnessName: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Visitor Email</label>
                    <Input value={generateForm.visitorEmail} onChange={e => setGenerateForm(f => ({ ...f, visitorEmail: e.target.value }))} className="h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Visitor Contact Number</label>
                    <Input value={generateForm.visitorPhone} onChange={e => setGenerateForm(f => ({ ...f, visitorPhone: e.target.value }))} className="h-11 font-bold" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Hospitality Host / Authorized Minister</label>
                  <Input value={generateForm.officiantName} onChange={e => setGenerateForm(f => ({ ...f, officiantName: e.target.value }))} className="h-11 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Prayer Intentions & Pastoral Requests</label>
                  <Textarea value={generateForm.prayerRequest} onChange={e => setGenerateForm(f => ({ ...f, prayerRequest: e.target.value }))} className="bg-slate-50 font-medium text-slate-700 italic" />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setGenerateModalOpen(false)}>Cancel</Button>
            <Button onClick={() => void submitGenerateDoc()} disabled={!!identityGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black">
              {identityGenerating ? 'Generating…' : 'Generate & File Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        image={imageToCrop ? URL.createObjectURL(imageToCrop) : null}
        onCropComplete={(blob) => {
          const file = new File([blob], imageToCrop?.name || 'photo.jpg', { type: 'image/jpeg' });
          void handlePhotoUpload(file, cropType);
        }}
        aspect={cropType === 'profile' ? 1 : 16/9}
      />
    </>
  );
}

