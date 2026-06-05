/**
 * Grace Community Church — single coherent identity for realistic UAT seeding.
 * All records in seedGraceCommunity.ts reference these definitions.
 */

export const CHURCH = {
  name: 'Grace Community Church',
  shortName: 'Grace Community',
  foundedYear: 1998,
  tagline: 'Growing in faith, serving with compassion.',
  vision:
    'A caring Chennai community where every person can know Christ, grow in discipleship, and serve the city with compassion.',
  mission:
    'We gather for worship, nurture families in small groups, and send members to serve through outreach and missions.',
  history:
    'Grace Community Church began in 1998 as a small Bible study in Anna Nagar. Today we worship at our main campus on Church Lane with a north campus extension, serving families across Chennai through worship, youth ministry, and community outreach.',
  address: '42 Church Lane, Anna Nagar, Chennai 600040',
  phone: '+91 44 2616 7890',
  email: 'office@gracecommunity.in',
  website: 'https://gracecommunity.in',
  serviceTimes: '9:00 AM • 11:00 AM • 5:00 PM (Youth)',
} as const;

export type StaffSpec = {
  id: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  username: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
};

export const STAFF: StaffSpec[] = [
  {
    id: 'staff-pastor',
    name: 'Ravi Nair',
    jobTitle: 'Senior Pastor',
    email: 'ravi.nair@gracecommunity.in',
    phone: '+91 98410 22101',
    username: 'pastor',
    baseSalary: 95000,
    allowances: 8000,
    deductions: 4500,
  },
  {
    id: 'staff-associate',
    name: 'David Kurian',
    jobTitle: 'Associate Pastor',
    email: 'david.kurian@gracecommunity.in',
    phone: '+91 98410 22102',
    username: 'associate',
    baseSalary: 75000,
    allowances: 6000,
    deductions: 3800,
  },
  {
    id: 'staff-admin',
    name: 'Sarah Thomas',
    jobTitle: 'Church Administrator',
    email: 'sarah.thomas@gracecommunity.in',
    phone: '+91 98410 22103',
    username: 'churchadmin',
    baseSalary: 55000,
    allowances: 4000,
    deductions: 2800,
  },
  {
    id: 'staff-finance',
    name: 'James Joseph',
    jobTitle: 'Finance Manager',
    email: 'james.joseph@gracecommunity.in',
    phone: '+91 98410 22104',
    username: 'finance',
    baseSalary: 62000,
    allowances: 5000,
    deductions: 3200,
  },
  {
    id: 'staff-youth',
    name: 'Anita George',
    jobTitle: 'Youth Pastor',
    email: 'anita.george@gracecommunity.in',
    phone: '+91 98410 22105',
    username: 'youth',
    baseSalary: 58000,
    allowances: 4500,
    deductions: 3000,
  },
  {
    id: 'staff-worship',
    name: 'Thomas Menon',
    jobTitle: 'Worship Leader',
    email: 'thomas.menon@gracecommunity.in',
    phone: '+91 98410 22106',
    username: 'worship',
    baseSalary: 52000,
    allowances: 4000,
    deductions: 2600,
  },
];

export type MemberSpec = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  growthStage: string;
  familyKey?: string;
  address?: string;
};

export const MEMBERS: MemberSpec[] = [
  { id: 'm01', name: 'Ravi Nair', email: 'ravi.nair@gracecommunity.in', phone: '9841011001', city: 'Chennai', growthStage: 'Leader', familyKey: 'nair' },
  { id: 'm02', name: 'Lakshmi Nair', email: 'lakshmi.nair@gracecommunity.in', phone: '9841011002', city: 'Chennai', growthStage: 'Member', familyKey: 'nair' },
  { id: 'm03', name: 'David Kurian', email: 'david.kurian@gracecommunity.in', phone: '9841011003', city: 'Chennai', growthStage: 'Leader', familyKey: 'kurian' },
  { id: 'm04', name: 'Meera Kurian', email: 'meera.kurian@gracecommunity.in', phone: '9841011004', city: 'Chennai', growthStage: 'Member', familyKey: 'kurian' },
  { id: 'm05', name: 'Sarah Thomas', email: 'sarah.thomas@gracecommunity.in', phone: '9841011005', city: 'Chennai', growthStage: 'Staff', familyKey: 'thomas' },
  { id: 'm06', name: 'Philip Thomas', email: 'philip.thomas@gracecommunity.in', phone: '9841011006', city: 'Chennai', growthStage: 'Member', familyKey: 'thomas' },
  { id: 'm07', name: 'James Joseph', email: 'james.joseph@gracecommunity.in', phone: '9841011007', city: 'Chennai', growthStage: 'Staff', familyKey: 'joseph' },
  { id: 'm08', name: 'Susan Joseph', email: 'susan.joseph@gracecommunity.in', phone: '9841011008', city: 'Chennai', growthStage: 'Member', familyKey: 'joseph' },
  { id: 'm09', name: 'Anita George', email: 'anita.george@gracecommunity.in', phone: '9841011009', city: 'Chennai', growthStage: 'Staff', familyKey: 'george' },
  { id: 'm10', name: 'George Mathew', email: 'george.mathew@gracecommunity.in', phone: '9841011010', city: 'Chennai', growthStage: 'Member', familyKey: 'george' },
  { id: 'm11', name: 'Thomas Menon', email: 'thomas.menon@gracecommunity.in', phone: '9841011011', city: 'Chennai', growthStage: 'Staff', familyKey: 'menon' },
  { id: 'm12', name: 'Deepa Menon', email: 'deepa.menon@gracecommunity.in', phone: '9841011012', city: 'Chennai', growthStage: 'Member', familyKey: 'menon' },
  { id: 'm13', name: 'Priya Paul', email: 'priya.paul@gracecommunity.in', phone: '9841011013', city: 'Chennai', growthStage: 'Member', familyKey: 'paul' },
  { id: 'm14', name: 'Arun Paul', email: 'arun.paul@gracecommunity.in', phone: '9841011014', city: 'Chennai', growthStage: 'Member', familyKey: 'paul' },
  { id: 'm15', name: 'Grace Cherian', email: 'grace.cherian@gracecommunity.in', phone: '9841011015', city: 'Chennai', growthStage: 'Regular Attendee', familyKey: 'cherian' },
  { id: 'm16', name: 'Ben Cherian', email: 'ben.cherian@gracecommunity.in', phone: '9841011016', city: 'Chennai', growthStage: 'Regular Attendee', familyKey: 'cherian' },
  { id: 'm17', name: 'Arjun Varughese', email: 'arjun.varughese@gracecommunity.in', phone: '9841011017', city: 'Bangalore', growthStage: 'Member', familyKey: 'varughese' },
  { id: 'm18', name: 'Reena Varughese', email: 'reena.varughese@gracecommunity.in', phone: '9841011018', city: 'Bangalore', growthStage: 'Member', familyKey: 'varughese' },
  { id: 'm19', name: 'Neha Mathew', email: 'neha.mathew@gracecommunity.in', phone: '9841011019', city: 'Chennai', growthStage: 'Visitor', familyKey: 'mathew' },
  { id: 'm20', name: 'Sam Mathew', email: 'sam.mathew@gracecommunity.in', phone: '9841011020', city: 'Chennai', growthStage: 'Visitor', familyKey: 'mathew' },
  { id: 'm21', name: 'Kevin Joseph', email: 'kevin.joseph@gracecommunity.in', phone: '9841011021', city: 'Chennai', growthStage: 'Regular Attendee' },
  { id: 'm22', name: 'Maria Kurian', email: 'maria.kurian@gracecommunity.in', phone: '9841011022', city: 'Chennai', growthStage: 'Regular Attendee' },
  { id: 'm23', name: 'Daniel Nair', email: 'daniel.nair@gracecommunity.in', phone: '9841011023', city: 'Chennai', growthStage: 'Member' },
  { id: 'm24', name: 'Rachel Thomas', email: 'rachel.thomas@gracecommunity.in', phone: '9841011024', city: 'Chennai', growthStage: 'Member' },
  { id: 'm25', name: 'Joshua George', email: 'joshua.george@gracecommunity.in', phone: '9841011025', city: 'Chennai', growthStage: 'Regular Attendee' },
  { id: 'm26', name: 'Esther Menon', email: 'esther.menon@gracecommunity.in', phone: '9841011026', city: 'Chennai', growthStage: 'Member' },
  { id: 'm27', name: 'Michael Paul', email: 'michael.paul@gracecommunity.in', phone: '9841011027', city: 'Chennai', growthStage: 'Visitor' },
  { id: 'm28', name: 'Leah Cherian', email: 'leah.cherian@gracecommunity.in', phone: '9841011028', city: 'Chennai', growthStage: 'Visitor' },
];

export const MINISTRIES = [
  { id: 'min-worship', name: 'Worship & Arts' },
  { id: 'min-youth', name: 'Youth Ministry' },
  { id: 'min-children', name: "Children's Ministry" },
  { id: 'min-outreach', name: 'Outreach & Missions' },
  { id: 'min-care', name: 'Pastoral Care' },
] as const;

export const SMALL_GROUPS = [
  { id: 'sg-anna', name: 'Grace Home Group — Anna Nagar', meetingDay: 'Thursday', leaderMemberId: 'm13' },
  { id: 'sg-north', name: 'Grace Home Group — Kilpauk', meetingDay: 'Wednesday', leaderMemberId: 'm17' },
  { id: 'sg-youth', name: 'Young Adults — City Center', meetingDay: 'Friday', leaderMemberId: 'm25' },
  { id: 'sg-couples', name: 'Married Couples — Church Lane', meetingDay: 'Saturday', leaderMemberId: 'm03' },
] as const;

/** Full order-of-service used for live Sunday Service demos (type Service events). */
export const SUNDAY_SERVICE_RUN_SHEET = [
  { id: 'seg-pre', time: '09:00', duration: '05:00', item: 'Pre-service', segmentType: 'media', media: 'Welcome loop', owner: 'Media Team' },
  { id: 'seg-worship', time: '09:05', duration: '12:00', item: 'Worship set', segmentType: 'worship', media: 'Charts C', owner: 'Thomas Menon' },
  { id: 'seg-announce', time: '09:17', duration: '04:00', item: 'Announcements', segmentType: 'announcements', owner: 'Ravi Nair' },
  { id: 'seg-sermon', time: '09:21', duration: '28:00', item: 'Message — Walking in Grace', segmentType: 'sermon', owner: 'Ravi Nair' },
  { id: 'seg-response', time: '09:49', duration: '06:00', item: 'Response & prayer', segmentType: 'prayer', owner: 'David Kurian' },
  { id: 'seg-close', time: '09:55', duration: '05:00', item: 'Closing worship', segmentType: 'worship', owner: 'Thomas Menon' },
] as const;

export const EVENTS = [
  {
    id: 'ev-sunday',
    name: 'Sunday Worship — 9:00 AM',
    type: 'Service',
    days: 0,
    hour: 9,
    minute: 0,
    registrationOpen: false,
    location: 'Main Sanctuary',
  },
  {
    id: 'ev-sunday-1130',
    name: 'Sunday Worship — 11:30 AM',
    type: 'Service',
    days: 0,
    hour: 11,
    minute: 30,
    registrationOpen: false,
    location: 'Main Sanctuary',
  },
  { id: 'ev-prayer', name: 'Wednesday Prayer Meeting', type: 'Prayer', days: 2, registrationOpen: false, location: 'Prayer Chapel' },
  { id: 'ev-youth', name: 'Youth Fellowship Night', type: 'Youth', days: 5, registrationOpen: false, location: 'Youth Hall' },
  { id: 'ev-leadership', name: 'Leadership Training', type: 'Training', days: 12, registrationOpen: true, location: 'Conference Room' },
  { id: 'ev-baptism', name: 'Baptism Service', type: 'Worship', days: 18, registrationOpen: true, location: 'Main Sanctuary' },
  { id: 'ev-marriage', name: 'Marriage Seminar', type: 'Seminar', days: 40, registrationOpen: true, location: 'Fellowship Hall' },
  { id: 'ev-christmas', name: 'Christmas Outreach', type: 'Outreach', days: 120, registrationOpen: true, location: 'City Streets' },
  { id: 'ev-easter', name: 'Easter Celebration', type: 'Worship', days: -7, registrationOpen: false, location: 'Main Sanctuary' },
  { id: 'ev-vbs', name: 'Vacation Bible School', type: 'Children', days: 60, registrationOpen: true, location: 'Grace Kids Wing' },
] as const;

export const SERMON_SERIES = [
  { title: 'Walking in Grace', speaker: 'Ravi Nair' },
  { title: 'Foundations of Faith', speaker: 'David Kurian' },
  { title: 'Family on Mission', speaker: 'Ravi Nair' },
] as const;
