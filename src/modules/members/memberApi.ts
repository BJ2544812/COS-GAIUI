import { apiRequest, parseApiResponse, stripUndefined, ApiError } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/apiConfig';
import { getToken, getTenantId } from '@/lib/authSession';

export { ApiError };

// ------------------------------------------------------------------
// Member DTO
// ------------------------------------------------------------------
export interface MemberDto {
  id: string;
  tenantId: string;
  familyId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  dob: string | null;
  profileImageUrl: string | null;
  membershipDate: string | null;
  status: string;
  growthStage: string;
  gender: string | null;
  aadhaar: string | null;
  pan: string | null;
  createdAt: string;
  updatedAt: string;
  family?: { id: string; name: string; imageUrl?: string | null; tenantId: string; createdAt: string; updatedAt: string } | null;
  documents?: MemberDocumentDto[];
  milestones?: SpiritualMilestoneDto[];
  attendances?: any[];
  careNotes?: CareNoteDto[];
  donations?: any[];
  responsibilities?: any[];
}

// ------------------------------------------------------------------
// CareNote DTO
// ------------------------------------------------------------------
export interface CareNoteDto {
  id: string;
  tenantId: string;
  memberId: string;
  authorId: string;
  note: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; username: string };
}

// ------------------------------------------------------------------
// MemberDocument DTO
// ------------------------------------------------------------------
export interface MemberDocumentDto {
  id: string;
  memberId: string;
  tenantId: string;
  type: string;         // Aadhaar, PAN, BaptismCert, DeclarationForm, Other
  number: string | null; // Masked: ****1234
  fileUrl: string | null;
  verified: boolean;
  notes: string | null;
  acceptedAt?: string | null;
  signerName?: string | null;
  signatureDataUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------
// SpiritualMilestone DTO
// ------------------------------------------------------------------
export interface SpiritualMilestoneDto {
  id: string;
  memberId: string;
  tenantId: string;
  type: string;   // Salvation, Baptism, MembershipClass, SmallGroupLeader, Other
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------
// Core Member API
// ------------------------------------------------------------------
export async function listMembers(filters?: { familyId?: string }): Promise<MemberDto[]> {
  const query = filters?.familyId ? `?familyId=${encodeURIComponent(filters.familyId)}` : '';
  const json = await apiRequest<{ status: string; data: MemberDto[] }>(`/members${query}`, { method: 'GET' });
  return parseApiResponse<MemberDto[]>(json);
}

export async function getMember(id: string): Promise<MemberDto> {
  const json = await apiRequest<{ status: string; data: MemberDto }>(`/members/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  return parseApiResponse<MemberDto>(json);
}

export type MemberCreateBody = {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  dob?: string;
  familyId?: string | null;
  membershipDate?: string;
  status?: string;
  growthStage?: string;
  gender?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
};

export async function createMember(body: MemberCreateBody): Promise<MemberDto> {
  const json = await apiRequest<{ status: string; data: MemberDto }>('/members', {
    method: 'POST',
    body: stripUndefined({ ...body } as Record<string, unknown>),
  });
  return parseApiResponse<MemberDto>(json);
}

export type MemberUpdateBody = Partial<Omit<MemberCreateBody, 'email' | 'phone' | 'role' | 'familyId' | 'membershipDate' | 'dob'>> & {
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  dob?: string | null;
  familyId?: string | null;
  membershipDate?: string | null;
  gender?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
};

export async function updateMember(id: string, body: MemberUpdateBody): Promise<MemberDto> {
  const json = await apiRequest<{ status: string; data: MemberDto }>(`/members/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: stripUndefined({ ...body } as Record<string, unknown>),
  });
  return parseApiResponse<MemberDto>(json);
}

// ------------------------------------------------------------------
// Profile Image Upload (multipart)
// ------------------------------------------------------------------
export async function uploadProfileImage(memberId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const token = getToken();
  const tenantId = getTenantId();
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/members/${encodeURIComponent(memberId)}/profile-image`;
  console.log("API CALL:", url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    },
    body: form,
  });

  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new ApiError(res.status, data.error ?? 'Upload failed');
  }
  return data.data.profileImageUrl as string;
}

// ------------------------------------------------------------------
// Documents API
// ------------------------------------------------------------------
export async function getMemberDocuments(memberId: string): Promise<MemberDocumentDto[]> {
  const json = await apiRequest<{ status: string; data: MemberDocumentDto[] }>(
    `/members/${encodeURIComponent(memberId)}/documents`,
    { method: 'GET' }
  );
  return parseApiResponse<MemberDocumentDto[]>(json);
}

export async function createMemberDocument(
  memberId: string,
  data: { type: string; number?: string; notes?: string },
  file?: File
): Promise<MemberDocumentDto> {
  if (file) {
    const form = new FormData();
    form.append('file', file);
    form.append('type', data.type);
    if (data.number) form.append('number', data.number);
    if (data.notes) form.append('notes', data.notes);

    const token = getToken();
    const tenantId = getTenantId();
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/members/${encodeURIComponent(memberId)}/documents`;
    console.log("API CALL:", url);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      },
      body: form,
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'success') {
      throw new ApiError(res.status, json.error ?? 'Failed to create document');
    }
    return json.data as MemberDocumentDto;
  }

  const json = await apiRequest<{ status: string; data: MemberDocumentDto }>(
    `/members/${encodeURIComponent(memberId)}/documents`,
    { method: 'POST', body: stripUndefined(data as any) }
  );
  return parseApiResponse<MemberDocumentDto>(json);
}

export async function updateMemberDocument(
  memberId: string,
  docId: string,
  data: Partial<{
    type: string;
    number: string;
    verified: boolean;
    notes: string;
    acceptedAt: string | null;
    signerName: string | null;
    signatureDataUrl: string | null;
  }>
): Promise<MemberDocumentDto> {
  const json = await apiRequest<{ status: string; data: MemberDocumentDto }>(
    `/members/${encodeURIComponent(memberId)}/documents/${encodeURIComponent(docId)}`,
    { method: 'PATCH', body: stripUndefined(data as any) }
  );
  return parseApiResponse<MemberDocumentDto>(json);
}

export async function deleteMemberDocument(memberId: string, docId: string): Promise<void> {
  await apiRequest(`/members/${encodeURIComponent(memberId)}/documents/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
  });
}

// ------------------------------------------------------------------
// Spiritual Milestones API
// ------------------------------------------------------------------
export async function getMemberMilestones(memberId: string): Promise<SpiritualMilestoneDto[]> {
  const json = await apiRequest<{ status: string; data: SpiritualMilestoneDto[] }>(
    `/members/${encodeURIComponent(memberId)}/milestones`,
    { method: 'GET' }
  );
  return parseApiResponse<SpiritualMilestoneDto[]>(json);
}

export async function createMemberMilestone(
  memberId: string,
  data: { type: string; date: string; notes?: string }
): Promise<SpiritualMilestoneDto> {
  const json = await apiRequest<{ status: string; data: SpiritualMilestoneDto }>(
    `/members/${encodeURIComponent(memberId)}/milestones`,
    { method: 'POST', body: stripUndefined(data as any) }
  );
  return parseApiResponse<SpiritualMilestoneDto>(json);
}

export async function updateMemberMilestone(
  memberId: string,
  milestoneId: string,
  data: Partial<{ type: string; date: string; notes: string }>
): Promise<SpiritualMilestoneDto> {
  const json = await apiRequest<{ status: string; data: SpiritualMilestoneDto }>(
    `/members/${encodeURIComponent(memberId)}/milestones/${encodeURIComponent(milestoneId)}`,
    { method: 'PATCH', body: stripUndefined(data as any) }
  );
  return parseApiResponse<SpiritualMilestoneDto>(json);
}

export async function deleteMemberMilestone(memberId: string, milestoneId: string): Promise<void> {
  await apiRequest(
    `/members/${encodeURIComponent(memberId)}/milestones/${encodeURIComponent(milestoneId)}`,
    { method: 'DELETE' }
  );
}

// ------------------------------------------------------------------
// Responsibilities API
// ------------------------------------------------------------------
export async function getMemberResponsibilities(memberId: string): Promise<any[]> {
  const json = await apiRequest<{ status: string; data: any[] }>(
    `/members/${encodeURIComponent(memberId)}/responsibilities`,
    { method: 'GET' }
  );
  return parseApiResponse<any[]>(json);
}

export async function createMemberResponsibility(
  memberId: string,
  data: { role: string; entityType?: string; entityId?: string; status?: string; allocatedFunds?: number; usedFunds?: number; notes?: string }
): Promise<any> {
  const json = await apiRequest<{ status: string; data: any }>(
    `/members/${encodeURIComponent(memberId)}/responsibilities`,
    { method: 'POST', body: stripUndefined(data as any) }
  );
  return parseApiResponse<any>(json);
}

export async function deleteMemberResponsibility(memberId: string, resId: string): Promise<void> {
  await apiRequest(
    `/members/${encodeURIComponent(memberId)}/responsibilities/${encodeURIComponent(resId)}`,
    { method: 'DELETE' }
  );
}

export type IdentityDocTemplate = 'visitor_declaration' | 'member_declaration' | 'baptism_certificate';

export async function generateMemberIdentityDocument(
  memberId: string,
  template: IdentityDocTemplate,
): Promise<MemberDocumentDto> {
  const json = await apiRequest<{ status: string; data: MemberDocumentDto }>(
    `/members/${encodeURIComponent(memberId)}/generated-documents`,
    { method: 'POST', body: { template } },
  );
  return parseApiResponse<MemberDocumentDto>(json);
}

// ------------------------------------------------------------------
// Care Notes (Discipleship) API
// ------------------------------------------------------------------
export async function getMemberCareNotes(memberId: string): Promise<CareNoteDto[]> {
  const json = await apiRequest<{ status: string; data: CareNoteDto[] }>(
    `/members/${encodeURIComponent(memberId)}/care-notes`,
    { method: 'GET' }
  );
  return parseApiResponse<CareNoteDto[]>(json);
}

export async function createMemberCareNote(
  memberId: string,
  data: { note: string; date?: string }
): Promise<CareNoteDto> {
  const json = await apiRequest<{ status: string; data: CareNoteDto }>(
    `/members/${encodeURIComponent(memberId)}/care-notes`,
    { 
      method: 'POST', 
      body: { 
        note: data.note, 
      } 
    }
  );
  return parseApiResponse<CareNoteDto>(json);
}

export async function updateMemberCareNote(
  id: string,
  data: { note: string }
): Promise<CareNoteDto> {
  const json = await apiRequest<{ status: string; data: CareNoteDto }>(
    `/discipleship/${encodeURIComponent(id)}`,
    { method: 'PUT', body: data }
  );
  return parseApiResponse<CareNoteDto>(json);
}

export async function deleteMemberCareNote(id: string): Promise<void> {
  await apiRequest(`/discipleship/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ------------------------------------------------------------------
// Family Linking API
// ------------------------------------------------------------------
export async function linkMemberFamily(
  memberId: string,
  data: { familyId?: string; familyName?: string },
): Promise<MemberDto> {
  const json = await apiRequest<{ status: string; data: MemberDto }>(
    `/members/${encodeURIComponent(memberId)}/family/link`,
    { method: 'POST', body: stripUndefined(data as any) },
  );
  return parseApiResponse<MemberDto>(json);
}

export async function unlinkMemberFamily(memberId: string): Promise<void> {
  await apiRequest(
    `/members/${encodeURIComponent(memberId)}/family/unlink`,
    { method: 'POST' }
  );
}

// ------------------------------------------------------------------
// Donation & Event (Cross-Module)
// ------------------------------------------------------------------
export async function createMemberDonation(memberId: string, data: { amount: number; method: string; date: string; reference?: string }): Promise<void> {
  // Use the giving/donations endpoint but ensure donorId is set
  await apiRequest('/giving/donations', {
    method: 'POST',
    body: { ...data, donorId: memberId }
  });
}

// ------------------------------------------------------------------
// Family Image Upload (multipart)
// ------------------------------------------------------------------
export async function uploadFamilyImage(familyId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const token = getToken();
  const tenantId = getTenantId();
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/families/${encodeURIComponent(familyId)}/image`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    },
    body: form,
  });

  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new ApiError(res.status, data.error ?? 'Upload failed');
  }
  return data.data.imageUrl as string;
}

