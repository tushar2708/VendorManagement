import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function generateId(): string {
  return crypto.randomBytes(16).toString("base64url");
}

const SEED_PASSWORD_HASH = process.env.SEED_PASSWORD_HASH ?? "";

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Session", "Account", "Verification", "BuyerOrg", "VendorOrg", "DirectoryVendor", "VendorRequest", "RequestCandidate", "VendorInvitation", "VendorBuyerLink", "LinkEvent", "Submission", "FieldValue", "FileBlob", "Document", "VerificationCheck", "ReviewTask", "ApprovalDecision", "Contract", "ContractVersion", "ContractComment", "SlaRule", "ScoringCriterion" RESTART IDENTITY CASCADE`);
    console.log("Database truncated.");
  }

  const buyerOrg = await prisma.buyerOrg.create({
    data: { legalName: "Meridian Motors" },
  });

  const vendorOrg = await prisma.vendorOrg.create({
    data: { legalName: "Tata Components", contactEmail: "admin@tatacomponents.test" },
  });

  const users = [
    { name: "Priya Sharma", email: "buyer@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "OWNER" as const, buyerOrgId: buyerOrg.id },
    { name: "Anil Verma", email: "quality@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "QUALITY" as const, buyerOrgId: buyerOrg.id },
    { name: "Meera Iyer", email: "finance@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "FINANCE" as const, buyerOrgId: buyerOrg.id },
    { name: "Rahul Nair", email: "tax@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "TAX" as const, buyerOrgId: buyerOrg.id },
    { name: "Sana Khan", email: "legal@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "LEGAL" as const, buyerOrgId: buyerOrg.id },
    { name: "Vikram Bajaj", email: "ceo@meridian.test", role: "BUYER" as const, tier: "LEADERSHIP" as const, buyerRole: "OWNER" as const, buyerOrgId: buyerOrg.id },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const id = generateId();
    await prisma.user.create({
      data: {
        id,
        name: u.name,
        email: u.email,
        role: u.role,
        tier: u.tier,
        buyerOrgId: u.buyerOrgId,
        buyerRole: u.buyerRole,
      },
    });
    if (SEED_PASSWORD_HASH) {
      await prisma.account.create({
        data: {
          id: generateId(),
          userId: id,
          accountId: id,
          providerId: "credential",
          password: SEED_PASSWORD_HASH,
        },
      });
    }
    createdUsers[u.email] = id;
  }

  const directoryVendors = [
    { legalName: "Bharat Forge Ltd", contactEmail: "procurement@bharatforge.test", pan: "AABCB1234A", primaryGstin: "27AABCB1234A1Z5", city: "Pune", state: "Maharashtra", processTags: ["Forging", "CNC Turning"], badgeState: "VERIFIED" as const },
    { legalName: "Sundaram Castings", contactEmail: "sales@sundaramcast.test", pan: "AADCS5678B", primaryGstin: "33AADCS5678B1Z5", city: "Chennai", state: "Tamil Nadu", processTags: ["Gravity Casting", "HPDC"], badgeState: "VERIFIED" as const },
    { legalName: "Precision Auto Components", contactEmail: "info@precisionauto.test", pan: "AAECP9012C", primaryGstin: "06AAECP9012C1Z5", city: "Gurgaon", state: "Haryana", processTags: ["CNC Turning", "VMC"], badgeState: "VERIFIED" as const },
    { legalName: "Gujarat Metal Works", contactEmail: "orders@gujaratmetal.test", pan: "AAFCG3456D", primaryGstin: "24AAFCG3456D1Z5", city: "Ahmedabad", state: "Gujarat", processTags: ["Sheet Metal", "Plating"], badgeState: "VERIFIED" as const },
    { legalName: "Ludhiana Steel Fabricators", contactEmail: "sales@ludhianasteel.test", pan: "AAGCL7890E", primaryGstin: "03AAGCL7890E1Z5", city: "Ludhiana", state: "Punjab", processTags: ["Forging", "Heat Treatment"], badgeState: "LISTED" as const },
    { legalName: "Coimbatore Precision Tools", contactEmail: "info@cbetools.test", pan: "AAHCC2345F", primaryGstin: "33AAHCC2345F1Z5", city: "Coimbatore", state: "Tamil Nadu", processTags: ["CNC Turning", "Grinding"], badgeState: "VERIFIED" as const },
  ];

  const createdVendors: Record<string, string> = {};
  for (const v of directoryVendors) {
    const dv = await prisma.directoryVendor.create({ data: v });
    createdVendors[v.contactEmail] = dv.id;
  }

  const ownerId = createdUsers["buyer@meridian.test"];

  const requirements = [
    { title: "Aluminium HPDC housings — EV inverter", stage: "DRAFT" as const, category: "Casting" },
    { title: "Forged steering knuckles", stage: "CANDIDATES_SELECTED" as const, category: "Forging" },
    { title: "CNC-machined transmission shafts", stage: "INVITES_SENT" as const, category: "Machining" },
    { title: "Sheet-metal brackets & mounts", stage: "IN_PROGRESS" as const, category: "Sheet Metal" },
    { title: "Gravity-cast brake calipers (2025 program)", stage: "CLOSED" as const, category: "Casting" },
  ];

  let reqNum = 1001;
  for (const r of requirements) {
    await prisma.vendorRequest.create({
      data: {
        requestNumber: `VR-${reqNum++}`,
        title: r.title,
        stage: r.stage,
        category: r.category,
        process: "RFQ",
        vendorType: "PRODUCTION_PART",
        processCategories: [r.category],
        createdById: ownerId,
        buyerOrgId: buyerOrg.id,
      },
    });
  }

  const slaRules = [
    { stage: "FINANCIAL_CRIME" as const, slaDays: 3 },
    { stage: "COMPLIANCE" as const, slaDays: 5 },
    { stage: "LEGAL" as const, slaDays: 7 },
    { stage: "IT_INFOSEC" as const, slaDays: 4 },
    { stage: "TAX" as const, slaDays: 3 },
    { stage: "PROCUREMENT" as const, slaDays: 5 },
    { stage: "DATA_PRIVACY" as const, slaDays: 4 },
    { stage: "BUSINESS_OWNER" as const, slaDays: 5 },
  ];

  for (const s of slaRules) {
    await prisma.slaRule.create({ data: s });
  }

  console.log("Seed complete.");
  console.log(`  BuyerOrg: ${buyerOrg.id}`);
  console.log(`  Users: ${Object.keys(createdUsers).length}`);
  console.log(`  Directory vendors: ${Object.keys(createdVendors).length}`);
  console.log(`  Requirements: ${requirements.length}`);
  console.log(`  SLA rules: ${slaRules.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
