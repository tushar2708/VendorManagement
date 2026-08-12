import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient, type Prisma } from '@prisma/client';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(here, '../../../.env') });

const prisma = new PrismaClient();
const RESET = process.argv.includes('--reset');

function gstinFor(stateCode: string, pan: string): string {
  // Format-plausible GSTIN: <state><PAN>1Z5 (15 chars). Not a real checksum.
  return `${stateCode}${pan}1Z5`;
}

type SeedVendor = {
  legalName: string;
  pan: string;
  stateCode: string;
  contactEmail: string;
  city: string;
  state: string;
  processTags: string[];
  certificationTags: string[];
  isVerified: boolean;
  udyamNumber?: string;
  vendorCode?: string;
  prequalScore?: number;
  isInWarmPool?: boolean;
};

const directoryVendors: SeedVendor[] = [
  {
    legalName: 'Shakti Precision Components',
    pan: 'AABCS1234A',
    stateCode: '27',
    contactEmail: 'sales@shakti-precision.in',
    city: 'Pune',
    state: 'Maharashtra',
    processTags: ['HPDC', 'CNC Turning'],
    certificationTags: ['IATF 16949', 'ISO 9001'],
    isVerified: true,
    udyamNumber: 'UDYAM-MH-18-0049217',
    vendorCode: 'V-100482',
    prequalScore: 92,
  },
  {
    legalName: 'Deccan Castworks Pvt Ltd',
    pan: 'AABCD2345B',
    stateCode: '27',
    contactEmail: 'info@deccancast.co.in',
    city: 'Chakan',
    state: 'Maharashtra',
    processTags: ['Gravity Casting', 'Heat Treatment'],
    certificationTags: ['ISO 9001', 'ISO 14001'],
    isVerified: true,
    udyamNumber: 'UDYAM-MH-20-0051456',
    prequalScore: 85,
  },
  {
    legalName: 'Kolhapur Foundry Works',
    pan: 'AABCK3456C',
    stateCode: '27',
    contactEmail: 'kfw@kolhapurfoundry.com',
    city: 'Kolhapur',
    state: 'Maharashtra',
    processTags: ['Forging', 'VMC'],
    certificationTags: ['ISO 9001'],
    isVerified: true,
    prequalScore: 78,
  },
  {
    legalName: 'Aravalli Sheet Metal Pvt Ltd',
    pan: 'AABCA4567D',
    stateCode: '06',
    contactEmail: 'contact@aravalli-sm.in',
    city: 'Manesar',
    state: 'Haryana',
    processTags: ['Sheet Metal', 'Plating'],
    certificationTags: ['IATF 16949'],
    isVerified: true,
    vendorCode: 'V-100483',
    prequalScore: 88,
  },
  {
    legalName: 'Chennai Sheetmetal Works',
    pan: 'AABCC5678E',
    stateCode: '33',
    contactEmail: 'ops@chennai-sm.co.in',
    city: 'Chennai',
    state: 'Tamil Nadu',
    processTags: ['Sheet Metal'],
    certificationTags: ['ISO 9001', 'ISO 14001'],
    isVerified: true,
    vendorCode: 'V-100484',
    prequalScore: 82,
  },
  {
    legalName: 'Bharat Heat Treat Services',
    pan: 'AABCB6789F',
    stateCode: '27',
    contactEmail: 'bharat@heattreat.in',
    city: 'Chakan',
    state: 'Maharashtra',
    processTags: ['Heat Treatment'],
    certificationTags: ['ISO 9001'],
    isVerified: false,
    prequalScore: 68,
  },
  {
    legalName: 'Sundaram Fasteners Ltd',
    pan: 'AABCF1357G',
    stateCode: '33',
    contactEmail: 'procurement@sundaramfast.co.in',
    city: 'Chennai',
    state: 'Tamil Nadu',
    processTags: ['Forging', 'CNC Turning', 'Heat Treatment'],
    certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001'],
    isVerified: true,
    udyamNumber: 'UDYAM-TN-19-0087234',
    vendorCode: 'V-100485',
    prequalScore: 95,
  },
  {
    legalName: 'Bharat Forge Ltd',
    pan: 'AABCG2468H',
    stateCode: '27',
    contactEmail: 'sales@bharatforge.com',
    city: 'Pune',
    state: 'Maharashtra',
    processTags: ['Forging', 'VMC'],
    certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001', 'ISO 45001'],
    isVerified: true,
    vendorCode: 'V-100486',
    prequalScore: 90,
  },
  {
    legalName: 'Minda Industries Ltd',
    pan: 'AABCM3579J',
    stateCode: '06',
    contactEmail: 'vendor@minda.co.in',
    city: 'Manesar',
    state: 'Haryana',
    processTags: ['HPDC', 'Plating', 'Sheet Metal'],
    certificationTags: ['IATF 16949', 'ISO 9001'],
    isVerified: true,
    prequalScore: 87,
  },
  {
    legalName: 'Amara Raja Advanced Cell Technologies',
    pan: 'AABCA4680K',
    stateCode: '37',
    contactEmail: 'supply@amararaja.com',
    city: 'Tirupati',
    state: 'Andhra Pradesh',
    processTags: ['Sheet Metal', 'Heat Treatment'],
    certificationTags: ['ISO 9001', 'ISO 14001'],
    isVerified: true,
    isInWarmPool: true,
  },
  {
    legalName: 'Endurance Technologies Ltd',
    pan: 'AABCE5791L',
    stateCode: '27',
    contactEmail: 'sourcing@endurance.co.in',
    city: 'Aurangabad',
    state: 'Maharashtra',
    processTags: ['HPDC', 'Gravity Casting', 'VMC'],
    certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001'],
    isVerified: true,
    isInWarmPool: true,
  },
  {
    legalName: 'Sona BLW Precision Forgings',
    pan: 'AABCS6802M',
    stateCode: '06',
    contactEmail: 'rfq@sonablw.com',
    city: 'Gurgaon',
    state: 'Haryana',
    processTags: ['Forging', 'CNC Turning', 'Heat Treatment'],
    certificationTags: ['IATF 16949', 'ISO 9001'],
    isVerified: true,
    isInWarmPool: true,
  },
];

const PASSWORD_HASH = process.env.SEED_PASSWORD_HASH ?? '';
if (!PASSWORD_HASH) {
  console.error('[seed] SEED_PASSWORD_HASH not set in .env. Add it before seeding users.');
  process.exit(1);
}

interface SeedUser {
  name: string;
  email: string;
  role: 'BUYER' | 'VENDOR' | 'ADMIN';
  tier: 'EXECUTIVE' | 'LEADERSHIP';
}

const seedUsers: SeedUser[] = [
  { name: 'Priya Sharma', email: 'buyer-exec@test.com', role: 'BUYER', tier: 'EXECUTIVE' },
  { name: 'Rajesh Mehta', email: 'buyer-lead@test.com', role: 'BUYER', tier: 'LEADERSHIP' },
  { name: 'Ankit Patel', email: 'vendor-exec@test.com', role: 'VENDOR', tier: 'EXECUTIVE' },
  { name: 'Sunita Reddy', email: 'vendor-lead@test.com', role: 'VENDOR', tier: 'LEADERSHIP' },
  { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', tier: 'EXECUTIVE' },
];

async function ensureSeedUsers(): Promise<void> {
  for (const u of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: u.role, tier: u.tier } });
      continue;
    }
    const id = crypto.randomBytes(16).toString('base64url');
    const user = await prisma.user.create({
      data: { id, name: u.name, email: u.email, role: u.role, tier: u.tier },
    });
    const accountId = crypto.randomBytes(16).toString('base64url');
    await prisma.account.create({
      data: { id: accountId, userId: user.id, accountId: user.id, providerId: 'credential', password: PASSWORD_HASH },
    });
  }
  console.log(`[seed] Ensured ${seedUsers.length} test users (password: Admin@123 for all)`);
}

type Vendor = Awaited<ReturnType<PrismaClient['vendor']['findMany']>>[number];

function candidateFromVendor(
  v: Vendor,
  inviteStatus: 'PENDING' | 'INVITED' | 'OPENED',
  status?: 'SELECTED' | 'INVITED' | 'PREQUAL_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWARDED' | 'WARM_POOL',
): Prisma.RequestCandidateCreateWithoutRequestInput {
  return {
    source: 'DIRECTORY',
    vendor: { connect: { id: v.id } },
    legalName: v.name,
    contactEmail: v.contactEmail,
    pan: v.panNumber,
    gstin: v.gstin,
    city: v.city,
    state: v.state,
    inviteStatus,
    status: status ?? 'SELECTED',
  };
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seedRequirements(userId: string, prefix: string, vendors: Vendor[]): Promise<void> {
  async function createReq(
    data: Omit<Prisma.VendorRequestCreateInput, 'createdBy'>,
  ): Promise<string> {
    const req = await prisma.vendorRequest.create({
      data: { ...data, createdBy: { connect: { id: userId } } },
      include: { candidates: true },
    });
    for (const c of req.candidates) {
      if (c.inviteStatus === 'INVITED' || c.inviteStatus === 'OPENED') {
        const token = crypto.randomBytes(32).toString('base64url');
        await prisma.vendorInvitation.create({
          data: {
            vendorId: c.vendorId,
            requestId: req.id,
            tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
            magicTokenPlain: token,
            email: c.contactEmail,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: c.inviteStatus === 'OPENED' ? 'OPENED' : 'PENDING',
            openedAt: c.inviteStatus === 'OPENED' ? new Date() : null,
          },
        });
      }
    }
    console.log(`[seed] Created: ${data.title} (${data.status})`);
    return req.id;
  }

  // Pick vendors for this user. Spread them across the dataset.
  const getUserVendors = (): Vendor[] => {
    if (prefix === 'VR-1') return vendors.slice(0, 6); // vendors[0..5]
    if (prefix === 'VR-2') return vendors.slice(3, 9); // vendors[3..8]
    if (prefix === 'VR-3') return vendors.slice(6, 12); // vendors[6..11]
    // VR-4: scattered
    return [vendors[0], vendors[2], vendors[4], vendors[6], vendors[8], vendors[10]];
  };

  const userVendors = getUserVendors();

  // Status sequence (13 requests per user)
  const requests = [
    { num: 1, status: 'DRAFT' as const, vendorIdx: 0, process: 'RFQ' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 28 },
    { num: 2, status: 'CANDIDATES_SELECTED' as const, vendorIdx: 1, process: 'RFQ' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 26 },
    { num: 3, status: 'INVITES_DISPATCHED' as const, vendorIdx: 0, process: 'NOMINATION' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 24 },
    { num: 4, status: 'PREQUAL_IN_PROGRESS' as const, vendorIdx: 2, process: 'RFQ' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 22 },
    { num: 5, status: 'PREQUAL_COMPLETE' as const, vendorIdx: 3, process: 'DIRECT' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 20 },
    { num: 6, status: 'AWARDED' as const, vendorIdx: 4, process: 'RFQ' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 18 },
    { num: 7, status: 'FULL_PACK_SUBMITTED' as const, vendorIdx: 5, process: 'RFQ' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 16 },
    { num: 8, status: 'DEEP_VERIFICATION' as const, vendorIdx: 0, process: 'NOMINATION' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 14 },
    { num: 9, status: 'APPROVALS_IN_PROGRESS' as const, vendorIdx: 1, process: 'DIRECT' as const, type: 'PRODUCTION_PART' as const, createdDaysAgo: 12 },
    { num: 10, status: 'CONTRACT_REVIEW' as const, vendorIdx: 2, process: 'NOMINATION' as const, type: 'INDIRECT_SERVICES' as const, createdDaysAgo: 10 },
    { num: 11, status: 'ERP_PUSH' as const, vendorIdx: 3, process: 'DIRECT' as const, type: 'INDIRECT_SERVICES' as const, createdDaysAgo: 8 },
    { num: 12, status: 'COMPLETED' as const, vendorIdx: 4, process: 'RFQ' as const, type: 'INDIRECT_SERVICES' as const, createdDaysAgo: 18 },
    { num: 13, status: 'CANCELLED' as const, vendorIdx: 5, process: 'RFQ' as const, type: 'INDIRECT_SERVICES' as const, createdDaysAgo: 6 },
  ];

  for (const req of requests) {
    const vendor = userVendors[req.vendorIdx % userVendors.length];
    const requestNumber = `${prefix}${String(req.num).padStart(3, '0')}`;

    let candidates: Prisma.RequestCandidateCreateWithoutRequestInput[] = [];

    if (req.status === 'DRAFT') {
      candidates = [];
    } else if (req.status === 'CANDIDATES_SELECTED') {
      candidates = [
        candidateFromVendor(vendor, 'PENDING', 'SELECTED'),
        candidateFromVendor(userVendors[(req.vendorIdx + 1) % userVendors.length], 'PENDING', 'SELECTED'),
      ];
    } else if (req.status === 'INVITES_DISPATCHED') {
      candidates = [
        candidateFromVendor(vendor, 'INVITED', 'INVITED'),
        candidateFromVendor(userVendors[(req.vendorIdx + 1) % userVendors.length], 'INVITED', 'INVITED'),
      ];
    } else if (req.status === 'PREQUAL_IN_PROGRESS') {
      candidates = [
        candidateFromVendor(vendor, 'OPENED', 'INVITED'),
        candidateFromVendor(userVendors[(req.vendorIdx + 1) % userVendors.length], 'INVITED', 'INVITED'),
      ];
    } else if (req.status === 'PREQUAL_COMPLETE') {
      candidates = [
        {
          ...candidateFromVendor(vendor, 'OPENED', 'PREQUAL_SUBMITTED'),
          score: 88,
          scoreBreakdown: {
            'Quality & Certifications': 92,
            'Commercials & Cost': 75,
            'Delivery & Logistics': 85,
            'Compliance & Financial Risk': 88,
          },
        },
      ];
    } else if (req.status === 'AWARDED') {
      candidates = [
        {
          ...candidateFromVendor(vendor, 'OPENED', 'AWARDED'),
          isAwarded: true,
          score: 89,
          scoreBreakdown: {
            'Quality & Certifications': 92,
            'Commercials & Cost': 65,
            'Delivery & Logistics': 100,
            'Compliance & Financial Risk': 78,
          },
          commercials: {
            basePrice: 1850,
            toolingPerUnit: 10,
            logisticsPerUnit: 50,
            capacity: '1200 T/yr',
            leadTimeDays: 15,
          },
        },
        {
          ...candidateFromVendor(userVendors[(req.vendorIdx + 1) % userVendors.length], 'OPENED', 'WARM_POOL'),
          score: 76,
          scoreBreakdown: {
            'Quality & Certifications': 78,
            'Commercials & Cost': 72,
            'Delivery & Logistics': 80,
            'Compliance & Financial Risk': 74,
          },
        },
      ];
    } else {
      candidates = [candidateFromVendor(vendor, 'OPENED', 'AWARDED')];
    }

    await createReq({
      requestNumber,
      status: req.status,
      title: getTitleForRequest(req.status, req.num),
      category: getCategoryForStatus(req.status),
      process: req.process,
      vendorType: req.type,
      processCategories: getProcessCategories(req.status),
      plantLocation: getPlantLocation(req.num),
      targetAwardDate: daysAgo(-35 + req.num * 3),
      createdAt: daysAgo(req.createdDaysAgo),
      candidates: candidates.length > 0 ? { create: candidates } : undefined,
    });
  }

  // Create scoring criteria for the AWARDED request
  await seedScoringCriteriaForUser(userId, prefix, 6);

  console.log(`[seed] Created 13 requests for ${prefix} (user: ${userId})`);
}

function getTitleForRequest(status: string, num: number): string {
  const titles: { [key: string]: string } = {
    DRAFT: 'Aluminium HPDC housings — EV inverter',
    CANDIDATES_SELECTED: 'Forged steering knuckles',
    INVITES_DISPATCHED: 'CNC-machined transmission shafts',
    PREQUAL_IN_PROGRESS: 'Sheet-metal brackets & mounts',
    PREQUAL_COMPLETE: 'Gravity-cast brake calipers',
    AWARDED: 'Precision-machined drive shafts',
    FULL_PACK_SUBMITTED: 'Heat-treated fastening components',
    DEEP_VERIFICATION: 'Specialized casting tooling',
    APPROVALS_IN_PROGRESS: 'HPDC aluminium pump housings',
    CONTRACT_REVIEW: 'Plating & surface treatment services',
    ERP_PUSH: 'Logistics & supply chain support',
    COMPLETED: 'Quality management & inspection services',
    CANCELLED: 'Prototype machining services',
  };
  return titles[status] ?? `Requirement ${num}`;
}

function getCategoryForStatus(status: string): string {
  const categories: { [key: string]: string } = {
    DRAFT: 'Casting',
    CANDIDATES_SELECTED: 'Forging',
    INVITES_DISPATCHED: 'Machining',
    PREQUAL_IN_PROGRESS: 'Sheet Metal',
    PREQUAL_COMPLETE: 'Casting',
    AWARDED: 'Machining',
    FULL_PACK_SUBMITTED: 'Heat Treatment',
    DEEP_VERIFICATION: 'Casting',
    APPROVALS_IN_PROGRESS: 'Casting',
    CONTRACT_REVIEW: 'Plating',
    ERP_PUSH: 'Logistics',
    COMPLETED: 'QA Services',
    CANCELLED: 'Machining',
  };
  return categories[status] ?? 'General';
}

function getProcessCategories(status: string): string[] {
  const cats: { [key: string]: string[] } = {
    DRAFT: ['Casting', 'Machining'],
    CANDIDATES_SELECTED: ['Forging'],
    INVITES_DISPATCHED: ['Machining'],
    PREQUAL_IN_PROGRESS: ['Sheet Metal', 'Plating'],
    PREQUAL_COMPLETE: ['Casting'],
    AWARDED: ['Machining', 'CNC Turning'],
    FULL_PACK_SUBMITTED: ['Heat Treatment', 'Forging'],
    DEEP_VERIFICATION: ['Casting', 'Tooling'],
    APPROVALS_IN_PROGRESS: ['HPDC'],
    CONTRACT_REVIEW: ['Surface Treatment'],
    ERP_PUSH: ['Logistics'],
    COMPLETED: ['Quality Assurance'],
    CANCELLED: ['Machining', 'Prototyping'],
  };
  return cats[status] ?? ['General'];
}

function getPlantLocation(num: number): string {
  const locations = [
    'Manesar Plant 1',
    'Pune Plant 2',
    'Chennai Plant 3',
    'Aurangabad Plant',
    'Gurgaon Plant',
    'Manesar Plant 1',
    'Chennai Plant 3',
    'Gurgaon Plant',
    'Manesar Plant 1',
    'Pune Plant 2',
    'Chennai Plant 3',
    'Aurangabad Plant',
    'Manesar Plant 1',
  ];
  return locations[num - 1] ?? 'Manesar Plant 1';
}

async function seedScoringCriteriaForUser(userId: string, prefix: string, requestNum: number): Promise<void> {
  const requestNumber = `${prefix}${String(requestNum).padStart(3, '0')}`;
  const vr = await prisma.vendorRequest.findUnique({
    where: { requestNumber },
  });
  if (!vr) return;

  await prisma.scoringCriterion.createMany({
    data: [
      { requirementId: vr.id, name: 'Quality & Certifications', weight: 55, sortOrder: 1 },
      { requirementId: vr.id, name: 'Commercials & Cost', weight: 35, sortOrder: 2 },
      { requirementId: vr.id, name: 'Delivery & Logistics', weight: 65, sortOrder: 3 },
      { requirementId: vr.id, name: 'Compliance & Financial Risk', weight: 55, sortOrder: 4 },
    ],
  });
}

async function seedVerificationChecks(vendors: Vendor[]): Promise<void> {
  const checksData = [
    {
      vendorId: vendors[1].id,
      checks: [
        { type: 'PAN' as const, status: 'PASS' as const, matchScore: 100, notes: 'PAN verified' },
        { type: 'GSTIN' as const, status: 'PASS' as const, matchScore: 100, notes: 'GSTIN valid' },
        { type: 'UDYAM' as const, status: 'PASS' as const, matchScore: 100, notes: 'UDYAM registered' },
        { type: 'BANK_PENNY_DROP' as const, status: 'PASS' as const, matchScore: 100, notes: 'Bank account verified' },
      ],
    },
    {
      vendorId: vendors[3].id,
      checks: [
        { type: 'PAN' as const, status: 'PASS' as const, matchScore: 100, notes: 'PAN verified' },
        { type: 'GSTIN' as const, status: 'PASS' as const, matchScore: 100, notes: 'GSTIN valid' },
        { type: 'UDYAM' as const, status: 'PASS' as const, matchScore: 100, notes: 'UDYAM registered' },
        { type: 'BANK_PENNY_DROP' as const, status: 'PARTIAL_MATCH' as const, matchScore: 85, notes: 'Account name mismatch' },
        { type: 'COMPANY_FILINGS' as const, status: 'PASS' as const, matchScore: 100, notes: 'MCA filings current' },
      ],
    },
    {
      vendorId: vendors[6].id,
      checks: [
        { type: 'PAN' as const, status: 'PASS' as const, matchScore: 100, notes: 'PAN verified' },
        { type: 'GSTIN' as const, status: 'FAIL' as const, matchScore: 0, notes: 'GSTIN not found' },
      ],
    },
    {
      vendorId: vendors[2].id,
      checks: [
        { type: 'PAN' as const, status: 'IN_PROGRESS' as const, matchScore: null, notes: 'Manual review in progress' },
        { type: 'GSTIN' as const, status: 'PENDING' as const, matchScore: null, notes: 'Awaiting vendor documentation' },
      ],
    },
  ];

  for (const item of checksData) {
    for (const check of item.checks) {
      await prisma.verificationCheck.create({
        data: {
          vendorId: item.vendorId,
          type: check.type,
          status: check.status,
          matchScore: check.matchScore,
          notes: check.notes,
        },
      });
    }
  }
  // Add DIRECTOR_UBO_SCREENING and MANUAL_OVERRIDE to cover all types/statuses
  await prisma.verificationCheck.create({
    data: { vendorId: vendors[4].id, type: 'DIRECTOR_UBO_SCREENING', status: 'PASS', matchScore: 95, notes: 'All directors cleared' },
  });
  await prisma.verificationCheck.create({
    data: { vendorId: vendors[4].id, type: 'PAN', status: 'MANUAL_OVERRIDE', matchScore: 70, notes: 'Overridden by reviewer after manual check', verifiedById: null },
  });
  console.log('[seed] Created verification checks for 4 vendors + extra types');
}

async function seedDocuments(vendors: Vendor[]): Promise<void> {
  const docCandidates = [vendors[0], vendors[2], vendors[3]];

  for (const vendor of docCandidates) {
    const docs = [
      {
        name: 'Cancelled cheque.pdf',
        category: 'BANK_DETAILS' as const,
        status: 'UPLOADED' as const,
      },
      {
        name: 'GST Certificate.pdf',
        category: 'STATUTORY' as const,
        status: 'VERIFIED' as const,
      },
      {
        name: 'PAN Card.pdf',
        category: 'STATUTORY' as const,
        status: 'VERIFIED' as const,
      },
      {
        name: 'Signed NDA.pdf',
        category: 'LEGAL' as const,
        status: 'UPLOADED' as const,
      },
      {
        name: 'MSME Certificate.pdf',
        category: 'IDENTITY' as const,
        status: 'PENDING' as const,
      },
    ];

    for (const doc of docs) {
      await prisma.document.create({
        data: {
          vendorId: vendor.id,
          name: doc.name,
          category: doc.category,
          mimeType: 'application/pdf',
          sizeBytes: Math.floor(Math.random() * 450000) + 50000,
          data: 'base64-placeholder',
          status: doc.status,
          uploadedAt: doc.status === 'VERIFIED' ? daysAgo(5) : new Date(),
          verifiedAt: doc.status === 'VERIFIED' ? daysAgo(3) : null,
        },
      });
    }
  }
  // Add CAPABILITY category and REJECTED status to cover all states
  await prisma.document.create({
    data: { vendorId: vendors[1].id, name: 'Capability Statement.pdf', category: 'CAPABILITY', mimeType: 'application/pdf', sizeBytes: 320000, data: 'base64-placeholder', status: 'UPLOADED' },
  });
  await prisma.document.create({
    data: { vendorId: vendors[1].id, name: 'Old Tax Certificate.pdf', category: 'STATUTORY', mimeType: 'application/pdf', sizeBytes: 120000, data: 'base64-placeholder', status: 'REJECTED', rejectionReason: 'Document expired, please upload current version' },
  });
  console.log('[seed] Created 17 documents covering all categories and statuses');
}

async function seedApprovalsForAllUsers(buyerIds: string[], buyerEmails: string[]): Promise<void> {
  const prefixes = ['VR-1', 'VR-2', 'VR-3', 'VR-4'];

  for (let i = 0; i < buyerIds.length; i++) {
    const userId = buyerIds[i];
    const prefix = prefixes[i];
    const requestNumber = `${prefix}009`; // APPROVALS_IN_PROGRESS request

    const vr = await prisma.vendorRequest.findUnique({
      where: { requestNumber },
      include: { candidates: true },
    });

    if (!vr || vr.candidates.length === 0) continue;

    const approvalsData = [
      { stage: 'FINANCIAL_CRIME' as const, status: 'APPROVED' as const, daysAgo: 5, slaRisk: 'ON_TRACK' as const },
      { stage: 'COMPLIANCE' as const, status: 'PENDING' as const, daysAgo: 1, slaRisk: 'ON_TRACK' as const },
      { stage: 'LEGAL' as const, status: 'APPROVED' as const, daysAgo: 3, slaRisk: 'ON_TRACK' as const },
      { stage: 'IT_INFOSEC' as const, status: 'PENDING' as const, daysAgo: 6, slaRisk: 'OVERDUE' as const },
      { stage: 'TAX' as const, status: 'PENDING' as const, daysAgo: 0, slaRisk: 'ON_TRACK' as const },
      { stage: 'PROCUREMENT' as const, status: 'PENDING' as const, daysAgo: 2, slaRisk: 'AT_RISK' as const },
      { stage: 'DATA_PRIVACY' as const, status: 'APPROVED' as const, daysAgo: 2, slaRisk: 'ON_TRACK' as const },
      { stage: 'BUSINESS_OWNER' as const, status: 'IN_PROGRESS' as const, daysAgo: 0, slaRisk: 'ON_TRACK' as const },
    ];

    for (const approval of approvalsData) {
      // Assign approved items to this user, pending items to next user
      const assigneeId = approval.status === 'PENDING' ? buyerIds[(i + 1) % buyerIds.length] : userId;

      await prisma.approval.create({
        data: {
          vendorId: vr.candidates[0].vendorId,
          requestId: vr.id,
          stage: approval.stage,
          status: approval.status,
          slaRisk: approval.slaRisk,
          enteredStageAt: daysAgo(approval.daysAgo),
          completedAt: approval.status === 'APPROVED' ? daysAgo(Math.max(0, approval.daysAgo - 2)) : null,
          assignedToId: assigneeId,
        },
      });
    }

    console.log(`[seed] Created 8 approvals for ${requestNumber} (user: ${buyerEmails[i]})`);
  }
}

async function seedApprovalsForCompletedRequests(buyerIds: string[], buyerEmails: string[]): Promise<void> {
  const prefixes = ['VR-1', 'VR-2', 'VR-3', 'VR-4'];

  for (let i = 0; i < buyerIds.length; i++) {
    const userId = buyerIds[i];
    const prefix = prefixes[i];
    const requestNumber = `${prefix}012`; // COMPLETED request

    const vr = await prisma.vendorRequest.findUnique({
      where: { requestNumber },
      include: { candidates: true },
    });

    if (!vr || vr.candidates.length === 0) continue;

    const approvalsData = [
      { stage: 'FINANCIAL_CRIME' as const, daysAgo: 15 },
      { stage: 'COMPLIANCE' as const, daysAgo: 14 },
      { stage: 'LEGAL' as const, daysAgo: 13 },
      { stage: 'IT_INFOSEC' as const, daysAgo: 12 },
      { stage: 'TAX' as const, daysAgo: 11 },
      { stage: 'PROCUREMENT' as const, daysAgo: 10 },
      { stage: 'DATA_PRIVACY' as const, daysAgo: 9 },
      { stage: 'BUSINESS_OWNER' as const, daysAgo: 8 },
    ];

    for (const approval of approvalsData) {
      await prisma.approval.create({
        data: {
          vendorId: vr.candidates[0].vendorId,
          requestId: vr.id,
          stage: approval.stage,
          status: 'APPROVED',
          slaRisk: 'ON_TRACK',
          enteredStageAt: daysAgo(approval.daysAgo),
          completedAt: daysAgo(approval.daysAgo - 2),
          assignedToId: userId,
        },
      });
    }

    console.log(`[seed] Created 8 approvals for ${requestNumber} (completed, user: ${buyerEmails[i]})`);
  }
}

async function seedContractsForAllUsers(buyerIds: string[], buyerEmails: string[]): Promise<void> {
  const prefixes = ['VR-1', 'VR-2', 'VR-3', 'VR-4'];

  for (let i = 0; i < buyerIds.length; i++) {
    const userId = buyerIds[i];
    const prefix = prefixes[i];

    // CONTRACT_REVIEW request (request 10)
    const contractReviewNumber = `${prefix}010`;
    const vrContractReview = await prisma.vendorRequest.findUnique({
      where: { requestNumber: contractReviewNumber },
      include: { candidates: true },
    });

    if (vrContractReview && vrContractReview.candidates.length > 0) {
      const contract = await prisma.contract.create({
        data: {
          vendorId: vrContractReview.candidates[0].vendorId,
          title: 'Master Supply Agreement',
          status: 'AWAITING_VENDOR_SIGNATURE',
          documentName: `MSA-${contractReviewNumber}.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: 250000,
          documentData: 'base64-placeholder',
        },
      });

      await prisma.contractComment.createMany({
        data: [
          { contractId: contract.id, authorId: userId, content: 'Requested 30-day payment terms instead of 15-day', createdAt: daysAgo(3) },
          { contractId: contract.id, authorId: userId, content: 'Approved — 30-day net terms accepted', createdAt: daysAgo(2) },
          { contractId: contract.id, authorId: userId, content: 'Updated payment schedule clause in section 4.2', createdAt: daysAgo(1) },
        ],
      });

      console.log(`[seed] Created contract for ${contractReviewNumber} (user: ${buyerEmails[i]})`);
    }

    // COMPLETED request (request 12) — signed contract
    const completedNumber = `${prefix}012`;
    const vrCompleted = await prisma.vendorRequest.findUnique({
      where: { requestNumber: completedNumber },
      include: { candidates: true },
    });

    if (vrCompleted && vrCompleted.candidates.length > 0) {
      await prisma.contract.create({
        data: {
          vendorId: vrCompleted.candidates[0].vendorId,
          title: 'Quality Management Services Agreement',
          status: 'SIGNED',
          documentName: `QMS-${completedNumber}.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: 280000,
          documentData: 'base64-placeholder',
          buyerSignedAt: daysAgo(2),
          vendorSignedAt: daysAgo(2),
        },
      });

      console.log(`[seed] Created signed contract for ${completedNumber} (user: ${buyerEmails[i]})`);
    }
  }
}

async function seedActivityLogsForAllUsers(buyerIds: string[], buyerEmails: string[]): Promise<void> {
  const prefixes = ['VR-1', 'VR-2', 'VR-3', 'VR-4'];

  for (let i = 0; i < buyerIds.length; i++) {
    const userId = buyerIds[i];
    const prefix = prefixes[i];
    const completedNumber = `${prefix}012`;

    const vr = await prisma.vendorRequest.findUnique({
      where: { requestNumber: completedNumber },
      include: { candidates: true },
    });

    if (!vr || vr.candidates.length === 0) continue;

    const activities = [
      { action: 'REQUEST_CREATED' as const, message: 'Requirement created', daysAgo: 18 },
      { action: 'CANDIDATES_SELECTED' as const, message: '3 candidates shortlisted', daysAgo: 17 },
      { action: 'INVITES_DISPATCHED' as const, message: 'Magic link invites sent to 3 vendors', daysAgo: 16 },
      { action: 'INVITE_OPENED' as const, message: 'Vendor opened the invite', daysAgo: 15 },
      { action: 'PREQUAL_SUBMITTED' as const, message: 'Vendor submitted pre-qualification', daysAgo: 14 },
      { action: 'VERIFICATION_COMPLETED' as const, message: 'All verification checks passed', daysAgo: 12 },
      { action: 'VENDOR_AWARDED' as const, message: 'Vendor awarded', daysAgo: 11 },
      { action: 'FULL_PACK_SUBMITTED' as const, message: 'Full document pack submitted', daysAgo: 9 },
      { action: 'APPROVAL_APPROVED' as const, message: 'All governance approvals cleared', daysAgo: 7 },
      { action: 'CONTRACT_SIGNED' as const, message: 'Contract signed by both parties', daysAgo: 5 },
      { action: 'ERP_PUSH_COMPLETED' as const, message: 'Vendor pushed to ERP system', daysAgo: 3 },
      { action: 'VENDOR_ACTIVATED' as const, message: 'Onboarding complete', daysAgo: 0 },
    ];

    for (const activity of activities) {
      await prisma.activityLog.create({
        data: {
          requestId: vr.id,
          vendorId: vr.candidates[0].vendorId,
          userId,
          action: activity.action,
          message: activity.message,
          createdAt: daysAgo(activity.daysAgo),
        },
      });
    }

    console.log(`[seed] Created 12 activity logs for ${completedNumber} (user: ${buyerEmails[i]})`);
  }
}

async function seedErpPushRecordsForAllUsers(buyerEmails: string[]): Promise<void> {
  const prefixes = ['VR-1', 'VR-2', 'VR-3', 'VR-4'];

  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];

    // ERP_PUSH request (request 11) — IN_PROGRESS
    const erpPushNumber = `${prefix}011`;
    const vrErpPush = await prisma.vendorRequest.findUnique({
      where: { requestNumber: erpPushNumber },
      include: { candidates: true },
    });

    if (vrErpPush && vrErpPush.candidates.length > 0) {
      await prisma.erpPushRecord.create({
        data: {
          vendorId: vrErpPush.candidates[0].vendorId,
          status: 'IN_PROGRESS',
          apiMethod: 'Business Partner API',
          createdAt: daysAgo(1),
        },
      });
      console.log(`[seed] Created ERP push (IN_PROGRESS) for ${erpPushNumber} (user: ${buyerEmails[i]})`);
    }

    // COMPLETED request (request 12) — SUCCESS
    const completedNumber = `${prefix}012`;
    const vrCompleted = await prisma.vendorRequest.findUnique({
      where: { requestNumber: completedNumber },
      include: { candidates: true },
    });

    if (vrCompleted && vrCompleted.candidates.length > 0) {
      await prisma.erpPushRecord.create({
        data: {
          vendorId: vrCompleted.candidates[0].vendorId,
          status: 'SUCCESS',
          vendorCode: `V-${100000 + i * 1000}`,
          apiMethod: 'Business Partner API',
          totalDays: 18,
          pushedAt: daysAgo(0),
        },
      });
      console.log(`[seed] Created ERP push (SUCCESS) for ${completedNumber} (user: ${buyerEmails[i]})`);
    }
  }
}

async function main(): Promise<void> {
  if (RESET) {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "VendorInvitation","RequestCandidate","VendorRequest","Vendor","Approval","VerificationCheck","Contract","ErpPushRecord","ActivityLog","Document","ContractComment","ScoringCriterion","SlaRule" RESTART IDENTITY CASCADE',
    );
    console.log('[seed] --reset: truncated data tables (User/Session/Account preserved)');
  }

  await ensureSeedUsers();

  const allBuyers = await prisma.user.findMany({ where: { role: 'BUYER' }, orderBy: { createdAt: 'asc' } });

  if (allBuyers.length === 0) {
    console.error('[seed] No buyer users found.');
    process.exit(1);
  }

  console.log(`[seed] Found ${allBuyers.length} buyer users`);

  const existingVendors = await prisma.vendor.count();
  if (existingVendors === 0) {
    await prisma.vendor.createMany({
      data: directoryVendors.map((v) => ({
        name: v.legalName,
        contactEmail: v.contactEmail,
        panNumber: v.pan,
        gstin: gstinFor(v.stateCode, v.pan),
        udyamNumber: v.udyamNumber,
        vendorCode: v.vendorCode,
        prequalScore: v.prequalScore,
        isInWarmPool: v.isInWarmPool ?? false,
        city: v.city,
        state: v.state,
        processTags: v.processTags,
        certifications: v.certificationTags,
        isVerified: v.isVerified,
        isInDirectory: true,
      })),
    });
    console.log(`[seed] Created ${directoryVendors.length} directory vendors`);
  } else {
    console.log(`[seed] Vendors already exist (${existingVendors}), skipped`);
  }

  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'asc' } });

  const existingReqs = await prisma.vendorRequest.count();
  if (existingReqs === 0) {
    const buyerIds = allBuyers.map((b) => b.id);
    const buyerEmails = allBuyers.map((b) => b.email);
    const prefixes = ['VR-1', 'VR-2', 'VR-3', 'VR-4'];

    // Create 13 requests for each buyer
    for (let i = 0; i < Math.min(buyerIds.length, prefixes.length); i++) {
      await seedRequirements(buyerIds[i], prefixes[i], vendors);
    }

    // Create verification checks and documents (shared across users)
    await seedVerificationChecks(vendors);
    await seedDocuments(vendors);

    // Create approvals for each user's APPROVALS_IN_PROGRESS and COMPLETED requests
    await seedApprovalsForAllUsers(buyerIds, buyerEmails);
    await seedApprovalsForCompletedRequests(buyerIds, buyerEmails);

    // Create contracts
    await seedContractsForAllUsers(buyerIds, buyerEmails);

    // Create activity logs
    await seedActivityLogsForAllUsers(buyerIds, buyerEmails);

    // Create ERP push records
    await seedErpPushRecordsForAllUsers(buyerEmails);

    console.log('[seed] Completed all rich data seeding for all users');
  } else {
    console.log(`[seed] Requests already exist (${existingReqs}), skipped`);
  }

  const existingRules = await prisma.slaRule.count();
  if (existingRules === 0) {
    const slaRules = [
      { stage: 'FINANCIAL_CRIME' as const, slaDays: 3, escalateAfterBreach: true },
      { stage: 'COMPLIANCE' as const, slaDays: 3, escalateAfterBreach: true },
      { stage: 'LEGAL' as const, slaDays: 3, escalateAfterBreach: true },
      { stage: 'IT_INFOSEC' as const, slaDays: 4, escalateAfterBreach: true },
      { stage: 'TAX' as const, slaDays: 5, escalateAfterBreach: true },
      { stage: 'PROCUREMENT' as const, slaDays: 3, escalateAfterBreach: true },
      { stage: 'DATA_PRIVACY' as const, slaDays: 3, escalateAfterBreach: true },
      { stage: 'BUSINESS_OWNER' as const, slaDays: 5, escalateAfterBreach: true },
    ];
    await prisma.slaRule.createMany({ data: slaRules });
    console.log(`[seed] Created ${slaRules.length} SLA rules`);
  } else {
    console.log(`[seed] SLA rules already exist (${existingRules}), skipped`);
  }

  try {
    const [userCount, vendorCount, reqCount, candCount, inviteCount, verifyCount, docCount, approvalCount, slaRuleCount, contractCount, erpCount, activityCount] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendorRequest.count(),
      prisma.requestCandidate.count(),
      prisma.vendorInvitation.count(),
      prisma.verificationCheck.count(),
      prisma.document.count(),
      prisma.approval.count(),
      prisma.slaRule.count(),
      prisma.contract.count(),
      prisma.erpPushRecord.count(),
      prisma.activityLog.count(),
    ]);
    console.log('\n[seed] done:');
    console.log(`  User:               ${userCount}`);
    console.log(`  Vendor:             ${vendorCount}`);
    console.log(`  VendorRequest:      ${reqCount}`);
    console.log(`  RequestCandidate:   ${candCount}`);
    console.log(`  VendorInvitation:   ${inviteCount}`);
    console.log(`  VerificationCheck:  ${verifyCount}`);
    console.log(`  Document:           ${docCount}`);
    console.log(`  Approval:           ${approvalCount}`);
    console.log(`  SlaRule:            ${slaRuleCount}`);
    console.log(`  Contract:           ${contractCount}`);
    console.log(`  ErpPushRecord:      ${erpCount}`);
    console.log(`  ActivityLog:        ${activityCount}`);
  } catch {
    console.log('\n[seed] done (summary skipped — transient DB connection drop)');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
