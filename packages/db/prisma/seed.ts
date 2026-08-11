import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient, type Prisma } from '@prisma/client';

// Load the shared root .env whether run from the repo root or packages/db.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(here, '../../../.env') });

const prisma = new PrismaClient();

const RESET = process.argv.includes('--reset');

// A known dev login — printed after seeding.
const SEED_USER_EMAIL = 'buyer@meridian.test';
const SEED_USER_PASSWORD = 'Password123!';

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
  badgeState: 'VERIFIED' | 'LISTED';
};

const directoryVendors: SeedVendor[] = [
  { legalName: 'Chakan Precision Castings Pvt Ltd', pan: 'AABCC1234A', stateCode: '27', contactEmail: 'sales@chakanprecision.test', city: 'Chakan', state: 'Maharashtra', processTags: ['HPDC', 'Gravity Casting'], certificationTags: ['IATF 16949', 'ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Pune AutoForge Industries', pan: 'AAECP2345B', stateCode: '27', contactEmail: 'contact@puneautoforge.test', city: 'Pune', state: 'Maharashtra', processTags: ['Forging', 'Heat Treatment'], certificationTags: ['IATF 16949'], badgeState: 'VERIFIED' },
  { legalName: 'Oragadam Machined Components', pan: 'AADCO3456C', stateCode: '33', contactEmail: 'info@oragadammachined.test', city: 'Oragadam', state: 'Tamil Nadu', processTags: ['CNC Turning', 'VMC'], certificationTags: ['IATF 16949', 'ISO 14001'], badgeState: 'VERIFIED' },
  { legalName: 'Chennai Sheetmetal Works', pan: 'AAFCC4567D', stateCode: '33', contactEmail: 'rfq@chennaisheetmetal.test', city: 'Chennai', state: 'Tamil Nadu', processTags: ['Sheet Metal'], certificationTags: ['ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Manesar Die Casting Co', pan: 'AAGCM5678E', stateCode: '06', contactEmail: 'sales@manesardiecasting.test', city: 'Manesar', state: 'Haryana', processTags: ['HPDC'], certificationTags: ['IATF 16949', 'ISO 9001', 'ISO 14001'], badgeState: 'VERIFIED' },
  { legalName: 'Gurgaon Plating Solutions', pan: 'AAHCG6789F', stateCode: '06', contactEmail: 'ops@gurgaonplating.test', city: 'Manesar', state: 'Haryana', processTags: ['Plating', 'Heat Treatment'], certificationTags: ['ISO 9001'], badgeState: 'LISTED' },
  { legalName: 'Rajkot Turned Parts Pvt Ltd', pan: 'AAJCR7890G', stateCode: '24', contactEmail: 'enquiry@rajkotturned.test', city: 'Rajkot', state: 'Gujarat', processTags: ['CNC Turning'], certificationTags: ['IATF 16949'], badgeState: 'VERIFIED' },
  { legalName: 'Saurashtra Forgings Ltd', pan: 'AAKCS8901H', stateCode: '24', contactEmail: 'sales@saurashtraforgings.test', city: 'Rajkot', state: 'Gujarat', processTags: ['Forging'], certificationTags: ['IATF 16949', 'ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Coimbatore Casting & Machining', pan: 'AALCC9012J', stateCode: '33', contactEmail: 'info@cbecasting.test', city: 'Coimbatore', state: 'Tamil Nadu', processTags: ['Gravity Casting', 'VMC'], certificationTags: ['ISO 9001', 'ISO 14001'], badgeState: 'VERIFIED' },
  { legalName: 'Kovai Precision Engineering', pan: 'AAMCK0123K', stateCode: '33', contactEmail: 'quotes@kovaiprecision.test', city: 'Coimbatore', state: 'Tamil Nadu', processTags: ['CNC Turning', 'VMC'], certificationTags: ['IATF 16949'], badgeState: 'VERIFIED' },
  { legalName: 'Ludhiana Auto Components', pan: 'AANCL1234L', stateCode: '03', contactEmail: 'sales@ludhianaauto.test', city: 'Ludhiana', state: 'Punjab', processTags: ['Sheet Metal', 'Plating'], certificationTags: ['ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Punjab Fasteners & Forgings', pan: 'AAPCP2345M', stateCode: '03', contactEmail: 'info@punjabfasteners.test', city: 'Ludhiana', state: 'Punjab', processTags: ['Forging', 'Heat Treatment'], certificationTags: ['IATF 16949', 'ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Deccan Alloy Castings', pan: 'AAQCD3456N', stateCode: '27', contactEmail: 'sales@deccanalloy.test', city: 'Pune', state: 'Maharashtra', processTags: ['Gravity Casting', 'HPDC'], certificationTags: ['ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Bharat Heat Treat Services', pan: 'AARCB4567P', stateCode: '27', contactEmail: 'ops@bharatheattreat.test', city: 'Chakan', state: 'Maharashtra', processTags: ['Heat Treatment'], certificationTags: ['ISO 9001', 'ISO 14001'], badgeState: 'LISTED' },
  { legalName: 'Southern Machined Systems', pan: 'AASCS5678Q', stateCode: '33', contactEmail: 'rfq@southernmachined.test', city: 'Chennai', state: 'Tamil Nadu', processTags: ['VMC', 'CNC Turning'], certificationTags: ['IATF 16949', 'ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Aravalli Sheet Metal Pvt Ltd', pan: 'AATCA6789R', stateCode: '06', contactEmail: 'sales@aravallisheet.test', city: 'Manesar', state: 'Haryana', processTags: ['Sheet Metal'], certificationTags: ['ISO 9001'], badgeState: 'VERIFIED' },
  { legalName: 'Gujarat Precision Forge', pan: 'AAUCG7890S', stateCode: '24', contactEmail: 'info@gujaratforge.test', city: 'Rajkot', state: 'Gujarat', processTags: ['Forging', 'VMC'], certificationTags: ['IATF 16949'], badgeState: 'VERIFIED' },
  { legalName: 'Kongu Plating Industries', pan: 'AAVCK8901T', stateCode: '33', contactEmail: 'sales@konguplating.test', city: 'Coimbatore', state: 'Tamil Nadu', processTags: ['Plating'], certificationTags: ['ISO 9001', 'ISO 14001'], badgeState: 'VERIFIED' },
];

async function main(): Promise<void> {
  if (RESET) {
    // Truncate app tables (note: different table names from PR's schema).
    await prisma.$executeRawUnsafe(
      'TRUNCATE "VendorInvitation","RequestCandidate","VendorRequest","Vendor","Approval","VerificationCheck","Contract","ErpPushRecord","ActivityLog","Document","ContractComment","User","Session","Account","Verification" RESTART IDENTITY CASCADE',
    );
    console.log('[seed] --reset: truncated all app tables');
  }

  // Login user (idempotent by unique email).
  // Better Auth uses Account.password for password storage, not User.password.
  let user = await prisma.user.findUnique({ where: { email: SEED_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: SEED_USER_EMAIL,
        name: 'Priya Sharma',
        role: 'BUYER',
      },
    });
    // Create an Account record with the password hash for this user.
    const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 12);
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: passwordHash,
      },
    });
  }

  // Directory vendors (skip if already populated, unless reset cleared them).
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
        isVerified: v.badgeState === 'VERIFIED',
        isInDirectory: true,
      })),
    });
  }
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'asc' } });

  // Vendor requests — one per stage. Skip if already populated.
  const existingReqs = await prisma.vendorRequest.count();
  if (existingReqs === 0) {
    await seedRequirements(user.id, vendors);
  }

  const [userCount, vendorCount, reqCount, candCount, inviteCount] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.vendorRequest.count(),
    prisma.requestCandidate.count(),
    prisma.vendorInvitation.count(),
  ]);

  console.log('\n[seed] done:');
  console.log(`  users=${userCount} vendors=${vendorCount} requirements=${reqCount} candidates=${candCount} invitations=${inviteCount}`);
  console.log('\n[seed] Login with:');
  console.log(`  email:    ${SEED_USER_EMAIL}`);
  console.log(`  password: ${SEED_USER_PASSWORD}\n`);
}

type Vendor = Awaited<ReturnType<PrismaClient['vendor']['findMany']>>[number];

// Snapshot a directory vendor's fields into a candidate.
function candidateFromVendor(
  v: Vendor,
  invited: boolean,
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
    inviteStatus: invited ? 'OPENED' : 'PENDING',
  };
}

async function seedRequirements(userId: string, vendors: Vendor[]): Promise<void> {
  // Create a vendor request with its candidates, then generate a vendor invitation row
  // for every candidate that is OPENED (invitation→request is a separate relation).
  async function createRequirement(
    data: Omit<Prisma.VendorRequestCreateInput, 'createdBy'>,
  ): Promise<void> {
    const req = await prisma.vendorRequest.create({
      data: {
        ...data,
        createdBy: { connect: { id: userId } },
      },
      include: { candidates: true },
    });
    for (const c of req.candidates) {
      if (c.inviteStatus === 'OPENED') {
        const token = crypto.randomBytes(32).toString('base64url');
        await prisma.vendorInvitation.create({
          data: {
            vendorId: c.vendorId,
            requestId: req.id,
            tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
            magicTokenPlain: token,
            email: c.contactEmail,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'OPENED',
            openedAt: new Date(),
          },
        });
      }
    }
  }

  // 1) DRAFT — no candidates.
  await createRequirement({
    requestNumber: `REQ-${Date.now()}-001`,
    status: 'DRAFT',
    title: 'Aluminium HPDC housings — EV inverter',
    category: 'Casting',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['HPDC', 'CNC Turning'],
    plantLocation: 'Chakan Plant 2',
    targetAwardDate: new Date('2026-10-15'),
  });

  // 2) CANDIDATES_SELECTED — a couple of candidates, none invited.
  await createRequirement({
    requestNumber: `REQ-${Date.now()}-002`,
    status: 'CANDIDATES_SELECTED',
    title: 'Forged steering knuckles',
    category: 'Forging',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Forging', 'Machining'],
    plantLocation: 'Manesar Plant 1',
    targetAwardDate: new Date('2026-11-01'),
    candidates: {
      create: [
        candidateFromVendor(vendors[1], false),
        candidateFromVendor(vendors[7], false),
        {
          source: 'MANUAL',
          legalName: 'Nashik Precision Turnings',
          contactEmail: 'sales@nashikprecision.test',
          pan: 'AAWCN9012U',
          city: 'Nashik',
          state: 'Maharashtra',
          inviteStatus: 'PENDING',
          vendor: { connect: { id: vendors[1].id } },
        },
      ],
    },
  });

  // 3) INVITES_DISPATCHED — candidates invited (invitations generated).
  await createRequirement({
    requestNumber: `REQ-${Date.now()}-003`,
    status: 'INVITES_DISPATCHED',
    title: 'CNC-machined transmission shafts',
    category: 'Machining',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['CNC Turning', 'VMC'],
    plantLocation: 'Oragadam Plant',
    targetAwardDate: new Date('2026-09-30'),
    candidates: {
      create: [
        candidateFromVendor(vendors[2], true),
        candidateFromVendor(vendors[9], true),
      ],
    },
  });

  // 4) PREQUAL_IN_PROGRESS — invited, one candidate has opened its invite.
  await createRequirement({
    requestNumber: `REQ-${Date.now()}-004`,
    status: 'PREQUAL_IN_PROGRESS',
    title: 'Sheet-metal brackets & mounts',
    category: 'Sheet Metal',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Sheet Metal', 'Plating'],
    plantLocation: 'Ludhiana Plant',
    targetAwardDate: new Date('2026-09-10'),
    candidates: {
      create: [
        { ...candidateFromVendor(vendors[10], true), inviteStatus: 'OPENED' },
        candidateFromVendor(vendors[3], true),
      ],
    },
  });

  // 5) COMPLETED.
  await createRequirement({
    requestNumber: `REQ-${Date.now()}-005`,
    status: 'COMPLETED',
    title: 'Gravity-cast brake calipers (2025 program)',
    category: 'Casting',
    process: 'RFQ',
    vendorType: 'PRODUCTION_PART',
    processCategories: ['Gravity Casting'],
    plantLocation: 'Pune Plant 3',
    targetAwardDate: new Date('2026-06-01'),
    candidates: {
      create: [candidateFromVendor(vendors[8], true)],
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
