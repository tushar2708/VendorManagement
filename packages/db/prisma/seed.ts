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

async function main(): Promise<void> {
  if (RESET) {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "VendorInvitation","RequestCandidate","VendorRequest","Vendor","Approval","VerificationCheck","Contract","ErpPushRecord","ActivityLog","Document","ContractComment","ScoringCriterion","SlaRule" RESTART IDENTITY CASCADE',
    );
    console.log('[seed] --reset: truncated data tables (User/Session/Account preserved)');
  }

  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error('[seed] No user found. Sign up via the UI first, then re-run.');
    process.exit(1);
  }
  console.log(`[seed] Using user: ${user.email} (${user.id})`);

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
    await seedRequirements(user.id, vendors);
    await seedVerificationChecks(vendors);
    await seedDocuments(vendors);
    await seedApprovals(user.id, vendors);
    await seedContracts(user.id, vendors);
    await seedActivityLogs(user.id, vendors);
    await seedErpPushRecords(vendors);
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

async function seedRequirements(userId: string, vendors: Vendor[]): Promise<void> {
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

  // VR-1001: DRAFT
  await createReq({
    requestNumber: 'VR-1001',
    status: 'DRAFT',
    title: 'Aluminium HPDC housings — EV inverter',
    category: 'Casting',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Casting', 'Machining'],
    plantLocation: 'Manesar Plant 1',
    targetAwardDate: daysAgo(-35),
  });

  // VR-1002: CANDIDATES_SELECTED
  await createReq({
    requestNumber: 'VR-1002',
    status: 'CANDIDATES_SELECTED',
    title: 'Forged steering knuckles',
    category: 'Forging',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Forging'],
    plantLocation: 'Pune Plant 2',
    targetAwardDate: daysAgo(-30),
    candidates: {
      create: [
        candidateFromVendor(vendors[0], 'PENDING', 'SELECTED'),
        candidateFromVendor(vendors[2], 'PENDING', 'SELECTED'),
        {
          source: 'MANUAL',
          legalName: 'Rathi Forgings Ltd',
          contactEmail: 'rathi@forgings.in',
          pan: 'AABCR7890G',
          city: 'Kolhapur',
          state: 'Maharashtra',
          inviteStatus: 'PENDING',
          status: 'SELECTED',
          vendor: { connect: { id: vendors[5].id } },
        },
      ],
    },
  });

  // VR-1003: INVITES_DISPATCHED
  await createReq({
    requestNumber: 'VR-1003',
    status: 'INVITES_DISPATCHED',
    title: 'CNC-machined transmission shafts',
    category: 'Machining',
    process: 'NOMINATION',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Machining'],
    plantLocation: 'Chennai Plant 3',
    targetAwardDate: daysAgo(-25),
    candidates: {
      create: [
        candidateFromVendor(vendors[6], 'INVITED', 'INVITED'),
        candidateFromVendor(vendors[4], 'INVITED', 'INVITED'),
      ],
    },
  });

  // VR-1004: PREQUAL_IN_PROGRESS
  await createReq({
    requestNumber: 'VR-1004',
    status: 'PREQUAL_IN_PROGRESS',
    title: 'Sheet-metal brackets & mounts',
    category: 'Sheet Metal',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Sheet Metal', 'Plating'],
    plantLocation: 'Aurangabad Plant',
    targetAwardDate: daysAgo(-20),
    candidates: {
      create: [
        candidateFromVendor(vendors[3], 'OPENED', 'INVITED'),
        candidateFromVendor(vendors[5], 'INVITED', 'INVITED'),
      ],
    },
  });

  // VR-1005: PREQUAL_COMPLETE
  await createReq({
    requestNumber: 'VR-1005',
    status: 'PREQUAL_COMPLETE',
    title: 'Gravity-cast brake calipers',
    category: 'Casting',
    process: 'DIRECT',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Casting'],
    plantLocation: 'Manesar Plant 1',
    targetAwardDate: daysAgo(-18),
    candidates: {
      create: [
        {
          ...candidateFromVendor(vendors[1], 'OPENED', 'PREQUAL_SUBMITTED'),
          score: 88,
          scoreBreakdown: {
            'Quality & Certifications': 92,
            'Commercials & Cost': 75,
            'Delivery & Logistics': 85,
            'Compliance & Financial Risk': 88,
          },
        },
      ],
    },
  });

  // VR-1006: AWARDED
  await createReq({
    requestNumber: 'VR-1006',
    status: 'AWARDED',
    title: 'Precision-machined drive shafts',
    category: 'Machining',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Machining', 'CNC Turning'],
    plantLocation: 'Pune Plant 2',
    targetAwardDate: daysAgo(-15),
    candidates: {
      create: [
        {
          ...candidateFromVendor(vendors[7], 'OPENED', 'AWARDED'),
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
          ...candidateFromVendor(vendors[9], 'OPENED', 'WARM_POOL'),
          score: 76,
          scoreBreakdown: {
            'Quality & Certifications': 78,
            'Commercials & Cost': 72,
            'Delivery & Logistics': 80,
            'Compliance & Financial Risk': 74,
          },
        },
        {
          ...candidateFromVendor(vendors[8], 'OPENED', 'REJECTED'),
          score: 62,
          scoreBreakdown: {
            'Quality & Certifications': 65,
            'Commercials & Cost': 55,
            'Delivery & Logistics': 70,
            'Compliance & Financial Risk': 58,
          },
        },
      ],
    },
  });

  // VR-1007: FULL_PACK_SUBMITTED
  await createReq({
    requestNumber: 'VR-1007',
    status: 'FULL_PACK_SUBMITTED',
    title: 'Heat-treated fastening components',
    category: 'Heat Treatment',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Heat Treatment', 'Forging'],
    plantLocation: 'Chennai Plant 3',
    targetAwardDate: daysAgo(-12),
    candidates: {
      create: [
        candidateFromVendor(vendors[0], 'OPENED', 'AWARDED'),
      ],
    },
  });

  // VR-1008: DEEP_VERIFICATION
  await createReq({
    requestNumber: 'VR-1008',
    status: 'DEEP_VERIFICATION',
    title: 'Specialized casting tooling',
    category: 'Casting',
    process: 'NOMINATION',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Casting', 'Tooling'],
    plantLocation: 'Gurgaon Plant',
    targetAwardDate: daysAgo(-10),
    candidates: {
      create: [
        candidateFromVendor(vendors[2], 'OPENED', 'AWARDED'),
      ],
    },
  });

  // VR-1009: APPROVALS_IN_PROGRESS
  await createReq({
    requestNumber: 'VR-1009',
    status: 'APPROVALS_IN_PROGRESS',
    title: 'HPDC aluminium pump housings',
    category: 'Casting',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['HPDC'],
    plantLocation: 'Manesar Plant 1',
    targetAwardDate: daysAgo(-8),
    candidates: {
      create: [
        candidateFromVendor(vendors[6], 'OPENED', 'AWARDED'),
      ],
    },
  });

  // VR-1010: CONTRACT_REVIEW
  await createReq({
    requestNumber: 'VR-1010',
    status: 'CONTRACT_REVIEW',
    title: 'Plating & surface treatment services',
    category: 'Plating',
    process: 'DIRECT',
    vendorType: 'INDIRECT_SERVICES',
    processCategories: ['Surface Treatment'],
    plantLocation: 'Pune Plant 2',
    targetAwardDate: daysAgo(-5),
    candidates: {
      create: [
        candidateFromVendor(vendors[3], 'OPENED', 'AWARDED'),
      ],
    },
  });

  // VR-1011: ERP_PUSH
  await createReq({
    requestNumber: 'VR-1011',
    status: 'ERP_PUSH',
    title: 'Logistics & supply chain support',
    category: 'Logistics',
    process: 'NOMINATION',
    vendorType: 'INDIRECT_SERVICES',
    processCategories: ['Logistics'],
    plantLocation: 'Chennai Plant 3',
    targetAwardDate: daysAgo(-3),
    candidates: {
      create: [
        candidateFromVendor(vendors[4], 'OPENED', 'AWARDED'),
      ],
    },
  });

  // VR-1012: COMPLETED
  await createReq({
    requestNumber: 'VR-1012',
    status: 'COMPLETED',
    title: 'Quality management & inspection services',
    category: 'QA Services',
    process: 'RFQ',
    vendorType: 'INDIRECT_SERVICES',
    processCategories: ['Quality Assurance'],
    plantLocation: 'Aurangabad Plant',
    targetAwardDate: daysAgo(-1),
    candidates: {
      create: [
        candidateFromVendor(vendors[11], 'OPENED', 'AWARDED'),
      ],
    },
  });

  // VR-1013: CANCELLED
  await createReq({
    requestNumber: 'VR-1013',
    status: 'CANCELLED',
    title: 'Prototype machining services',
    category: 'Machining',
    process: 'RFQ',
    vendorType: 'INDIRECT_SERVICES',
    processCategories: ['Machining', 'Prototyping'],
    plantLocation: 'Manesar Plant 1',
    targetAwardDate: daysAgo(-2),
    candidates: {
      create: [
        candidateFromVendor(vendors[10], 'PENDING', 'SELECTED'),
      ],
    },
  });

  await seedScoringCriteria();
}

async function seedScoringCriteria(): Promise<void> {
  const vr1006 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1006' },
  });
  if (!vr1006) return;

  await prisma.scoringCriterion.createMany({
    data: [
      {
        requirementId: vr1006.id,
        name: 'Quality & Certifications',
        weight: 55,
        sortOrder: 1,
      },
      {
        requirementId: vr1006.id,
        name: 'Commercials & Cost',
        weight: 35,
        sortOrder: 2,
      },
      {
        requirementId: vr1006.id,
        name: 'Delivery & Logistics',
        weight: 65,
        sortOrder: 3,
      },
      {
        requirementId: vr1006.id,
        name: 'Compliance & Financial Risk',
        weight: 55,
        sortOrder: 4,
      },
    ],
  });
  console.log('[seed] Created 4 scoring criteria for VR-1006');
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
  console.log('[seed] Created verification checks for 4 vendors');
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
  console.log('[seed] Created 15 documents for 3 vendors');
}

async function seedApprovals(userId: string, vendors: Vendor[]): Promise<void> {
  const vr1009 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1009' },
    include: { candidates: true },
  });
  const vr1012 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1012' },
    include: { candidates: true },
  });

  if (!vr1009 || vr1009.candidates.length === 0) return;

  const approvalsData = [
    {
      stage: 'FINANCIAL_CRIME' as const,
      status: 'APPROVED' as const,
      daysAgo: 5,
      slaRisk: 'ON_TRACK' as const,
    },
    {
      stage: 'COMPLIANCE' as const,
      status: 'APPROVED' as const,
      daysAgo: 4,
      slaRisk: 'ON_TRACK' as const,
    },
    {
      stage: 'LEGAL' as const,
      status: 'APPROVED' as const,
      daysAgo: 3,
      slaRisk: 'ON_TRACK' as const,
    },
    {
      stage: 'IT_INFOSEC' as const,
      status: 'PENDING' as const,
      daysAgo: 6,
      slaRisk: 'OVERDUE' as const,
    },
    {
      stage: 'TAX' as const,
      status: 'APPROVED' as const,
      daysAgo: 2,
      slaRisk: 'ON_TRACK' as const,
    },
    {
      stage: 'PROCUREMENT' as const,
      status: 'PENDING' as const,
      daysAgo: 1,
      slaRisk: 'AT_RISK' as const,
    },
    {
      stage: 'DATA_PRIVACY' as const,
      status: 'APPROVED' as const,
      daysAgo: 2,
      slaRisk: 'ON_TRACK' as const,
    },
    {
      stage: 'BUSINESS_OWNER' as const,
      status: 'PENDING' as const,
      daysAgo: 0,
      slaRisk: 'ON_TRACK' as const,
    },
  ];

  for (const approval of approvalsData) {
    await prisma.approval.create({
      data: {
        vendorId: vr1009.candidates[0].vendorId,
        requestId: vr1009.id,
        stage: approval.stage,
        status: approval.status,
        slaRisk: approval.slaRisk,
        enteredStageAt: daysAgo(approval.daysAgo),
        completedAt: approval.status === 'APPROVED' ? daysAgo(Math.max(0, approval.daysAgo - 2)) : null,
        assignedToId: approval.status === 'APPROVED' ? userId : null,
      },
    });
  }
  console.log('[seed] Created 8 approvals for VR-1009');

  if (vr1012 && vr1012.candidates.length > 0) {
    for (const approval of approvalsData) {
      await prisma.approval.create({
        data: {
          vendorId: vr1012.candidates[0].vendorId,
          requestId: vr1012.id,
          stage: approval.stage,
          status: 'APPROVED',
          slaRisk: 'ON_TRACK',
          enteredStageAt: daysAgo(approval.daysAgo + 10),
          completedAt: daysAgo(approval.daysAgo + 8),
          assignedToId: userId,
        },
      });
    }
    console.log('[seed] Created 8 approvals for VR-1012');
  }
}

async function seedContracts(userId: string, vendors: Vendor[]): Promise<void> {
  const vr1010 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1010' },
    include: { candidates: true },
  });
  const vr1012 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1012' },
    include: { candidates: true },
  });

  if (vr1010 && vr1010.candidates.length > 0) {
    const contract1010 = await prisma.contract.create({
      data: {
        vendorId: vr1010.candidates[0].vendorId,
        title: 'Master Supply Agreement',
        status: 'AWAITING_VENDOR_SIGNATURE',
        documentName: 'MSA-VR1010.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 250000,
        documentData: 'base64-placeholder',
      },
    });

    await prisma.contractComment.createMany({
      data: [
        {
          contractId: contract1010.id,
          authorId: userId,
          content: 'Requested 30-day payment terms instead of 15-day',
          createdAt: daysAgo(3),
        },
        {
          contractId: contract1010.id,
          authorId: userId,
          content: 'Approved — 30-day net terms accepted',
          createdAt: daysAgo(2),
        },
        {
          contractId: contract1010.id,
          authorId: userId,
          content: 'Updated payment schedule clause in section 4.2',
          createdAt: daysAgo(1),
        },
      ],
    });
    console.log('[seed] Created contract for VR-1010 with 3 comments');
  }

  if (vr1012 && vr1012.candidates.length > 0) {
    await prisma.contract.create({
      data: {
        vendorId: vr1012.candidates[0].vendorId,
        title: 'Quality Management Services Agreement',
        status: 'SIGNED',
        documentName: 'QMS-VR1012.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 280000,
        documentData: 'base64-placeholder',
        buyerSignedAt: daysAgo(2),
        vendorSignedAt: daysAgo(2),
      },
    });
    console.log('[seed] Created signed contract for VR-1012');
  }
}

async function seedActivityLogs(userId: string, vendors: Vendor[]): Promise<void> {
  const vr1012 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1012' },
    include: { candidates: true },
  });
  const vr1004 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1004' },
    include: { candidates: true },
  });

  if (vr1012 && vr1012.candidates.length > 0) {
    const activities = [
      { action: 'REQUEST_CREATED' as const, message: 'Requirement created', daysAgo: 14 },
      { action: 'CANDIDATES_SELECTED' as const, message: '3 candidates shortlisted', daysAgo: 13 },
      { action: 'INVITES_DISPATCHED' as const, message: 'Magic link invites sent to 3 vendors', daysAgo: 12 },
      { action: 'INVITE_OPENED' as const, message: 'Shakti Precision opened the invite', daysAgo: 11 },
      { action: 'PREQUAL_SUBMITTED' as const, message: 'Shakti Precision submitted pre-qualification', daysAgo: 10 },
      { action: 'VERIFICATION_COMPLETED' as const, message: 'All verification checks passed', daysAgo: 8 },
      { action: 'VENDOR_AWARDED' as const, message: 'Shakti Precision Components awarded', daysAgo: 7 },
      { action: 'FULL_PACK_SUBMITTED' as const, message: 'Full document pack submitted', daysAgo: 5 },
      { action: 'APPROVAL_APPROVED' as const, message: 'All governance approvals cleared', daysAgo: 3 },
      { action: 'CONTRACT_SIGNED' as const, message: 'Contract signed by both parties', daysAgo: 2 },
      { action: 'ERP_PUSH_COMPLETED' as const, message: 'Vendor pushed to SAP — code V-100482', daysAgo: 1 },
      { action: 'VENDOR_ACTIVATED' as const, message: 'Onboarding complete', daysAgo: 0 },
    ];

    for (const activity of activities) {
      await prisma.activityLog.create({
        data: {
          requestId: vr1012.id,
          vendorId: vr1012.candidates[0].vendorId,
          userId,
          action: activity.action,
          message: activity.message,
          createdAt: daysAgo(activity.daysAgo),
        },
      });
    }
    console.log('[seed] Created 12 activity logs for VR-1012');
  }

  if (vr1004 && vr1004.candidates.length > 0) {
    const partialActivities = [
      { action: 'REQUEST_CREATED' as const, message: 'Sheet metal brackets RFQ created', daysAgo: 6 },
      { action: 'CANDIDATES_SELECTED' as const, message: '2 candidates selected from directory', daysAgo: 5 },
      { action: 'INVITES_DISPATCHED' as const, message: 'Magic link invites sent', daysAgo: 4 },
      { action: 'INVITE_OPENED' as const, message: 'One vendor opened the invite', daysAgo: 3 },
    ];

    for (const activity of partialActivities) {
      await prisma.activityLog.create({
        data: {
          requestId: vr1004.id,
          vendorId: vr1004.candidates[0].vendorId,
          userId,
          action: activity.action,
          message: activity.message,
          createdAt: daysAgo(activity.daysAgo),
        },
      });
    }
    console.log('[seed] Created 4 activity logs for VR-1004');
  }
}

async function seedErpPushRecords(vendors: Vendor[]): Promise<void> {
  const vr1011 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1011' },
    include: { candidates: true },
  });
  const vr1012 = await prisma.vendorRequest.findUnique({
    where: { requestNumber: 'VR-1012' },
    include: { candidates: true },
  });

  if (vr1011 && vr1011.candidates.length > 0) {
    await prisma.erpPushRecord.create({
      data: {
        vendorId: vr1011.candidates[0].vendorId,
        status: 'IN_PROGRESS',
        apiMethod: 'Business Partner API',
        createdAt: daysAgo(1),
      },
    });
  }

  if (vr1012 && vr1012.candidates.length > 0) {
    await prisma.erpPushRecord.create({
      data: {
        vendorId: vr1012.candidates[0].vendorId,
        status: 'SUCCESS',
        vendorCode: 'V-100482',
        apiMethod: 'Business Partner API',
        totalDays: 14,
        pushedAt: daysAgo(1),
      },
    });
  }

  console.log('[seed] Created 2 ERP push records');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
