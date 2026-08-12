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
};

const directoryVendors: SeedVendor[] = [
  { legalName: 'Shakti Precision Components', pan: 'AABCS1234A', stateCode: '27', contactEmail: 'sales@shakti-precision.in', city: 'Pune', state: 'Maharashtra', processTags: ['HPDC', 'CNC Turning'], certificationTags: ['IATF 16949', 'ISO 9001'], isVerified: true },
  { legalName: 'Deccan Castworks Pvt Ltd', pan: 'AABCD2345B', stateCode: '27', contactEmail: 'info@deccancast.co.in', city: 'Chakan', state: 'Maharashtra', processTags: ['Gravity Casting', 'Heat Treatment'], certificationTags: ['ISO 9001', 'ISO 14001'], isVerified: true },
  { legalName: 'Kolhapur Foundry Works', pan: 'AABCK3456C', stateCode: '27', contactEmail: 'kfw@kolhapurfoundry.com', city: 'Kolhapur', state: 'Maharashtra', processTags: ['Forging', 'VMC'], certificationTags: ['ISO 9001'], isVerified: true },
  { legalName: 'Aravalli Sheet Metal Pvt Ltd', pan: 'AABCA4567D', stateCode: '06', contactEmail: 'contact@aravalli-sm.in', city: 'Manesar', state: 'Haryana', processTags: ['Sheet Metal', 'Plating'], certificationTags: ['IATF 16949'], isVerified: true },
  { legalName: 'Chennai Sheetmetal Works', pan: 'AABCC5678E', stateCode: '33', contactEmail: 'ops@chennai-sm.co.in', city: 'Chennai', state: 'Tamil Nadu', processTags: ['Sheet Metal'], certificationTags: ['ISO 9001', 'ISO 14001'], isVerified: true },
  { legalName: 'Bharat Heat Treat Services', pan: 'AABCB6789F', stateCode: '27', contactEmail: 'bharat@heattreat.in', city: 'Chakan', state: 'Maharashtra', processTags: ['Heat Treatment'], certificationTags: ['ISO 9001'], isVerified: false },
  { legalName: 'Sundaram Fasteners Ltd', pan: 'AABCF1357G', stateCode: '33', contactEmail: 'procurement@sundaramfast.co.in', city: 'Chennai', state: 'Tamil Nadu', processTags: ['Forging', 'CNC Turning', 'Heat Treatment'], certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001'], isVerified: true },
  { legalName: 'Bharat Forge Ltd', pan: 'AABCG2468H', stateCode: '27', contactEmail: 'sales@bharatforge.com', city: 'Pune', state: 'Maharashtra', processTags: ['Forging', 'VMC'], certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001', 'ISO 45001'], isVerified: true },
  { legalName: 'Minda Industries Ltd', pan: 'AABCM3579J', stateCode: '06', contactEmail: 'vendor@minda.co.in', city: 'Manesar', state: 'Haryana', processTags: ['HPDC', 'Plating', 'Sheet Metal'], certificationTags: ['IATF 16949', 'ISO 9001'], isVerified: true },
  { legalName: 'Amara Raja Advanced Cell Technologies', pan: 'AABCA4680K', stateCode: '37', contactEmail: 'supply@amararaja.com', city: 'Tirupati', state: 'Andhra Pradesh', processTags: ['Sheet Metal', 'Heat Treatment'], certificationTags: ['ISO 9001', 'ISO 14001'], isVerified: true },
  { legalName: 'Endurance Technologies Ltd', pan: 'AABCE5791L', stateCode: '27', contactEmail: 'sourcing@endurance.co.in', city: 'Aurangabad', state: 'Maharashtra', processTags: ['HPDC', 'Gravity Casting', 'VMC'], certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001'], isVerified: true },
  { legalName: 'Sona BLW Precision Forgings', pan: 'AABCS6802M', stateCode: '06', contactEmail: 'rfq@sonablw.com', city: 'Gurgaon', state: 'Haryana', processTags: ['Forging', 'CNC Turning', 'Heat Treatment'], certificationTags: ['IATF 16949', 'ISO 9001'], isVerified: true },
];

async function main(): Promise<void> {
  if (RESET) {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "VendorInvitation","RequestCandidate","VendorRequest","Vendor","Approval","VerificationCheck","Contract","ErpPushRecord","ActivityLog","Document","ContractComment","SlaRule" RESTART IDENTITY CASCADE',
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
  } else {
    console.log(`[seed] Requests already exist (${existingReqs}), skipped`);
  }

  // --- SLA Rules ---
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
    const [userCount, vendorCount, reqCount, candCount, inviteCount, slaRuleCount] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendorRequest.count(),
      prisma.requestCandidate.count(),
      prisma.vendorInvitation.count(),
      prisma.slaRule.count(),
    ]);
    console.log('\n[seed] done:');
    console.log(`  User:              ${userCount}`);
    console.log(`  Vendor:            ${vendorCount}`);
    console.log(`  VendorRequest:     ${reqCount}`);
    console.log(`  RequestCandidate:  ${candCount}`);
    console.log(`  VendorInvitation:  ${inviteCount}`);
    console.log(`  SlaRule:           ${slaRuleCount}`);
  } catch {
    console.log('\n[seed] done (summary skipped — transient DB connection drop)');
  }
}

type Vendor = Awaited<ReturnType<PrismaClient['vendor']['findMany']>>[number];

function candidateFromVendor(
  v: Vendor,
  inviteStatus: 'PENDING' | 'INVITED' | 'OPENED',
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
  };
}

async function seedRequirements(userId: string, vendors: Vendor[]): Promise<void> {
  async function createReq(
    data: Omit<Prisma.VendorRequestCreateInput, 'createdBy'>,
  ): Promise<void> {
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
  }

  await createReq({
    requestNumber: 'VR-1001',
    status: 'DRAFT',
    title: 'Aluminium HPDC housings — EV inverter',
    category: 'Casting',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Casting', 'Machining'],
    plantLocation: 'Manesar Plant 1',
    targetAwardDate: new Date('2026-09-15'),
  });

  await createReq({
    requestNumber: 'VR-1002',
    status: 'CANDIDATES_SELECTED',
    title: 'Forged steering knuckles',
    category: 'Forging',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Forging'],
    plantLocation: 'Pune Plant 2',
    candidates: {
      create: [
        candidateFromVendor(vendors[0], 'PENDING'),
        candidateFromVendor(vendors[2], 'PENDING'),
        {
          source: 'MANUAL',
          legalName: 'Rathi Forgings Ltd',
          contactEmail: 'rathi@forgings.in',
          pan: 'AABCR7890G',
          city: 'Kolhapur',
          state: 'Maharashtra',
          inviteStatus: 'PENDING',
          vendor: { connect: { id: vendors[5].id } },
        },
      ],
    },
  });

  await createReq({
    requestNumber: 'VR-1003',
    status: 'INVITES_DISPATCHED',
    title: 'CNC-machined transmission shafts',
    category: 'Machining',
    process: 'NOMINATION',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Machining'],
    plantLocation: 'Chennai Plant 3',
    targetAwardDate: new Date('2026-10-01'),
    candidates: {
      create: [
        candidateFromVendor(vendors[0], 'INVITED'),
        candidateFromVendor(vendors[4], 'INVITED'),
      ],
    },
  });

  await createReq({
    requestNumber: 'VR-1004',
    status: 'PREQUAL_IN_PROGRESS',
    title: 'Sheet-metal brackets & mounts',
    category: 'Sheet Metal',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Sheet Metal', 'Plating'],
    candidates: {
      create: [
        candidateFromVendor(vendors[3], 'OPENED'),
        candidateFromVendor(vendors[5], 'INVITED'),
      ],
    },
  });

  await createReq({
    requestNumber: 'VR-1005',
    status: 'COMPLETED',
    title: 'Gravity-cast brake calipers',
    category: 'Casting',
    process: 'DIRECT',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Casting'],
    candidates: {
      create: [candidateFromVendor(vendors[1], 'OPENED')],
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
