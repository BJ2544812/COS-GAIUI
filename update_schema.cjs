const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const enumsAndModels = `
// ---------------------------------------------------------
// Discipleship V2 Enums
// ---------------------------------------------------------

enum TaskTargetType {
  MEMBER
  CARE_CASE
  SMALL_GROUP
  PRAYER_REQUEST
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ConfidentialityLevel {
  PUBLIC
  GROUP
  PASTORAL
  SENIOR_PASTORAL
  RESTRICTED
}

enum CareCaseStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}

enum SmallGroupRole {
  LEADER
  HOST
  PARTICIPANT
}

// ---------------------------------------------------------
// Geographic & Small Group Models
// ---------------------------------------------------------

model Region {
  id        String   @id @default(uuid())
  tenantId  String
  campusId  String?
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  campus Campus? @relation(fields: [campusId], references: [id], onDelete: SetNull)
  zones  Zone[]
}

model Zone {
  id        String   @id @default(uuid())
  tenantId  String
  regionId  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  region      Region       @relation(fields: [regionId], references: [id], onDelete: Cascade)
  smallGroups SmallGroup[]
}

model SmallGroup {
  id         String   @id @default(uuid())
  tenantId   String
  zoneId     String?
  name       String
  type       String   // e.g. "Cell", "Interest"
  meetingDay String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  zone   Zone?  @relation(fields: [zoneId], references: [id], onDelete: SetNull)
  members SmallGroupMember[]
}

model SmallGroupMember {
  id        String         @id @default(uuid())
  tenantId  String
  groupId   String
  memberId  String
  role      SmallGroupRole @default(PARTICIPANT)
  joinedAt  DateTime       @default(now())

  tenant Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  group  SmallGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  member Member     @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([tenantId, groupId])
  @@index([tenantId, memberId])
}

// ---------------------------------------------------------
// Audit-Ready Care System
// ---------------------------------------------------------

model CareCase {
  id                   String               @id @default(uuid())
  tenantId             String
  memberId             String
  assignedUserId       String?
  category             String
  urgency              TaskPriority         @default(MEDIUM)
  confidentialityLevel ConfidentialityLevel @default(PASTORAL)
  status               CareCaseStatus       @default(OPEN)
  createdById          String?
  updatedById          String?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  tenant       Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  member       Member    @relation("CareCaseSubject", fields: [memberId], references: [id], onDelete: Cascade)
  assignedUser User?     @relation("AssignedPastor", fields: [assignedUserId], references: [id], onDelete: SetNull)
  createdBy    User?     @relation("CareCaseCreator", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy    User?     @relation("CareCaseUpdater", fields: [updatedById], references: [id], onDelete: SetNull)
  logs         CareLog[]

  @@index([tenantId, assignedUserId, status])
}

model CareLog {
  id              String   @id @default(uuid())
  tenantId        String
  careCaseId      String
  authorId        String
  interactionType String
  content         String
  date            DateTime @default(now())
  createdById     String?
  createdAt       DateTime @default(now())

  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  careCase CareCase @relation(fields: [careCaseId], references: [id], onDelete: Cascade)
  author   User     @relation("CareLogAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  createdBy User?   @relation("CareLogCreator", fields: [createdById], references: [id], onDelete: SetNull)
}

model PrayerRequest {
  id          String               @id @default(uuid())
  tenantId    String
  requesterId String?
  content     String
  visibility  ConfidentialityLevel @default(PUBLIC)
  status      String               @default("Active")
  createdById String?
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  tenant    Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  requester Member? @relation("PrayerRequester", fields: [requesterId], references: [id], onDelete: SetNull)
  createdBy User?   @relation("PrayerRequestCreator", fields: [createdById], references: [id], onDelete: SetNull)

  @@index([tenantId, requesterId, status])
}

// ---------------------------------------------------------
// Scalable Mentorship & Journey
// ---------------------------------------------------------

model Pathway {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant   Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  steps    PathwayStep[]
  progress MemberPathwayProgress[]
}

model PathwayStep {
  id        String @id @default(uuid())
  tenantId  String
  pathwayId String
  name      String
  sequence  Int

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pathway Pathway @relation(fields: [pathwayId], references: [id], onDelete: Cascade)
}

model MemberPathwayProgress {
  id               String   @id @default(uuid())
  tenantId         String
  memberId         String
  pathwayId        String
  currentStepId    String?
  assignedMentorId String?
  status           String   @default("InProgress")
  updatedAt        DateTime @updatedAt

  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  member         Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  pathway        Pathway  @relation(fields: [pathwayId], references: [id], onDelete: Cascade)
  assignedMentor Member?  @relation("AssignedMentor", fields: [assignedMentorId], references: [id], onDelete: SetNull)
}

model Mentorship {
  id         String    @id @default(uuid())
  tenantId   String
  mentorId   String
  discipleId String
  startDate  DateTime  @default(now())
  endDate    DateTime?
  status     String    @default("Active")
  notes      String?

  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  mentor   Member @relation("Mentor", fields: [mentorId], references: [id], onDelete: Cascade)
  disciple Member @relation("Disciple", fields: [discipleId], references: [id], onDelete: Cascade)

  @@index([tenantId, mentorId])
  @@index([tenantId, discipleId])
}

// ---------------------------------------------------------
// Universal Task Engine
// ---------------------------------------------------------

model Task {
  id               String         @id @default(uuid())
  tenantId         String
  title            String
  description      String?
  assignedUserId   String?
  assignedMemberId String?
  targetType       TaskTargetType
  targetId         String
  dueDate          DateTime?
  status           TaskStatus     @default(PENDING)
  priority         TaskPriority   @default(MEDIUM)
  createdById      String?
  updatedById      String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  tenant         Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  assignedUser   User?   @relation("AssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedMember Member? @relation("AssignedMember", fields: [assignedMemberId], references: [id], onDelete: SetNull)
  createdBy      User?   @relation("TaskCreator", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy      User?   @relation("TaskUpdater", fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([tenantId, assignedUserId, status])
  @@index([tenantId, targetType, targetId])
}

// ---------------------------------------------------------
// Analytics Intelligence
// ---------------------------------------------------------

model MemberEngagementSnapshot {
  id               String   @id @default(uuid())
  tenantId         String
  memberId         String
  score            Float
  attendanceMetric Float?
  givingMetric     Float?
  calculatedAt     DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([tenantId, memberId, calculatedAt])
}
`;

// Add new relationships to Tenant
const tenantModelMatch = content.match(/model Tenant \{[^}]+\}/);
if (tenantModelMatch) {
  let tenantBlock = tenantModelMatch[0];
  const newRelations = `
  regions           Region[]
  zones             Zone[]
  smallGroups       SmallGroup[]
  smallGroupMembers SmallGroupMember[]
  careCases         CareCase[]
  careLogs          CareLog[]
  prayerRequests    PrayerRequest[]
  pathways          Pathway[]
  pathwaySteps      PathwayStep[]
  memberPathwayProgress MemberPathwayProgress[]
  mentorships       Mentorship[]
  tasks             Task[]
  memberEngagementSnapshots MemberEngagementSnapshot[]`;
  tenantBlock = tenantBlock.replace(/}$/, newRelations + '\n}');
  content = content.replace(tenantModelMatch[0], tenantBlock);
}

// Add new relationships to User
const userModelMatch = content.match(/model User \{[^}]+\}/);
if (userModelMatch) {
  let userBlock = userModelMatch[0];
  const newRelations = `
  memberId          String? @unique
  member            Member? @relation(fields: [memberId], references: [id], onDelete: SetNull)
  assignedCareCases CareCase[] @relation("AssignedPastor")
  createdCareCases  CareCase[] @relation("CareCaseCreator")
  updatedCareCases  CareCase[] @relation("CareCaseUpdater")
  careLogs          CareLog[]  @relation("CareLogAuthor")
  createdCareLogs   CareLog[]  @relation("CareLogCreator")
  createdPrayerRequests PrayerRequest[] @relation("PrayerRequestCreator")
  assignedTasks     Task[] @relation("AssignedUser")
  createdTasks      Task[] @relation("TaskCreator")
  updatedTasks      Task[] @relation("TaskUpdater")`;
  userBlock = userBlock.replace(/@@unique/, newRelations + '\n\n  @@unique');
  content = content.replace(userModelMatch[0], userBlock);
}

// Add new relationships to Member
const memberModelMatch = content.match(/model Member \{[^}]+\}/);
if (memberModelMatch) {
  let memberBlock = memberModelMatch[0];
  const newRelations = `
  user              User?
  smallGroupMembers SmallGroupMember[]
  careCases         CareCase[] @relation("CareCaseSubject")
  prayerRequests    PrayerRequest[] @relation("PrayerRequester")
  pathwayProgress   MemberPathwayProgress[]
  pathwayMentoring  MemberPathwayProgress[] @relation("AssignedMentor")
  mentees           Mentorship[] @relation("Mentor")
  mentors           Mentorship[] @relation("Disciple")
  assignedTasks     Task[] @relation("AssignedMember")
  engagementSnapshots MemberEngagementSnapshot[]`;
  memberBlock = memberBlock.replace(/@@index/, newRelations + '\n\n  @@index');
  content = content.replace(memberModelMatch[0], memberBlock);
}

// Add new relationships to Campus
const campusModelMatch = content.match(/model Campus \{[^}]+\}/);
if (campusModelMatch) {
  let campusBlock = campusModelMatch[0];
  const newRelations = `
  regions Region[]`;
  campusBlock = campusBlock.replace(/}$/, newRelations + '\n}');
  content = content.replace(campusModelMatch[0], campusBlock);
}

fs.writeFileSync('prisma/schema.prisma', content + '\n' + enumsAndModels);
