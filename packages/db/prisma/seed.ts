import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();
function generateId(): string { return crypto.randomBytes(16).toString("base64url"); }
const SEED_PASSWORD_HASH = process.env.SEED_PASSWORD_HASH ?? "";

// ═══════════════════════════════════════════════════════════════════════
// SEED DATA — add rows here; the code below iterates over these arrays.
// ═══════════════════════════════════════════════════════════════════════

const ORGS = {
  buyer: { id: "seed-buyer-org", legalName: "Meridian Motors" },
  vendorOrgs: [
    { id: "seed-vendor-org-1", legalName: "Gujarat Metal Works Pvt Ltd", contactEmail: "admin@gujaratmetal.test" },
    { id: "seed-vendor-org-2", legalName: "Ludhiana Steel Group", contactEmail: "admin@ludhianasteel.test" },
  ],
};

const USERS = [
  { name: "Priya Sharma",   email: "buyer@meridian.test",          role: "BUYER",  tier: "EXECUTIVE",  buyerRole: "OWNER",   orgKey: "buyer" },
  { name: "Anil Verma",     email: "quality@meridian.test",        role: "BUYER",  tier: "EXECUTIVE",  buyerRole: "QUALITY", orgKey: "buyer" },
  { name: "Meera Iyer",     email: "finance@meridian.test",        role: "BUYER",  tier: "EXECUTIVE",  buyerRole: "FINANCE", orgKey: "buyer" },
  { name: "Rahul Nair",     email: "tax@meridian.test",            role: "BUYER",  tier: "EXECUTIVE",  buyerRole: "TAX",     orgKey: "buyer" },
  { name: "Sana Khan",      email: "legal@meridian.test",          role: "BUYER",  tier: "EXECUTIVE",  buyerRole: "LEGAL",   orgKey: "buyer" },
  { name: "Vikram Bajaj",   email: "ceo@meridian.test",            role: "BUYER",  tier: "LEADERSHIP", buyerRole: "OWNER",   orgKey: "buyer" },
  { name: "Ramesh Patel",   email: "ramesh@gujaratmetal.test",     role: "VENDOR", tier: "EXECUTIVE",  vendorOrgIdx: 0 },
  { name: "Suresh Mehta",   email: "suresh@gujaratmetal.test",     role: "VENDOR", tier: "LEADERSHIP", vendorOrgIdx: 0 },
  { name: "Harpreet Singh", email: "harpreet@ludhianasteel.test",  role: "VENDOR", tier: "EXECUTIVE",  vendorOrgIdx: 1 },
  { name: "Gurpreet Kaur",  email: "gurpreet@ludhianasteel.test",  role: "VENDOR", tier: "LEADERSHIP", vendorOrgIdx: 1 },
] as const;

const DIRECTORY_VENDORS = [
  { legalName: "Bharat Forge Ltd",           contactEmail: "procurement@bharatforge.test",      pan: "AABCB1234A", primaryGstin: "27AABCB1234A1Z5", city: "Pune",        state: "Maharashtra",    processTags: ["Forging", "CNC Turning"],              certificationTags: ["ISO 9001", "IATF 16949"], badgeState: "VERIFIED" },
  { legalName: "Sundaram Castings",          contactEmail: "sales@sundaramcast.test",           pan: "AADCS5678B", primaryGstin: "33AADCS5678B1Z5", city: "Chennai",     state: "Tamil Nadu",     processTags: ["Gravity Casting", "HPDC"],              certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Precision Auto Components",  contactEmail: "info@precisionauto.test",           pan: "AAECP9012C", primaryGstin: "06AAECP9012C1Z5", city: "Gurgaon",     state: "Haryana",        processTags: ["CNC Turning", "VMC"],                   certificationTags: ["ISO 9001", "ISO 14001"],   badgeState: "VERIFIED" },
  { legalName: "Gujarat Metal Works",        contactEmail: "orders@gujaratmetal.test",          pan: "AAFCG3456D", primaryGstin: "24AAFCG3456D1Z5", city: "Ahmedabad",   state: "Gujarat",        processTags: ["Sheet Metal", "Plating"],               certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Ludhiana Steel Fabricators", contactEmail: "sales@ludhianasteel.test",          pan: "AAGCL7890E", primaryGstin: "03AAGCL7890E1Z5", city: "Ludhiana",    state: "Punjab",         processTags: ["Forging", "Heat Treatment"],            certificationTags: [],                          badgeState: "LISTED"   },
  { legalName: "Coimbatore Precision Tools", contactEmail: "info@cbetools.test",                pan: "AAHCC2345F", primaryGstin: "33AAHCC2345F1Z5", city: "Coimbatore",  state: "Tamil Nadu",     processTags: ["CNC Turning", "Grinding"],              certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Rajkot Engineering Works",   contactEmail: "sales@rajkoteng.test",              pan: "AAICR6789G", primaryGstin: "24AAICR6789G1Z5", city: "Rajkot",      state: "Gujarat",        processTags: ["Casting", "Machining"],                 certificationTags: [],                          badgeState: "VERIFIED" },
  { legalName: "Nashik Forgings Pvt Ltd",    contactEmail: "info@nashikforgings.test",          pan: "AAJCN0123H", primaryGstin: "27AAJCN0123H1Z5", city: "Nashik",      state: "Maharashtra",    processTags: ["Forging"],                              certificationTags: ["ISO 9001", "IATF 16949"],  badgeState: "VERIFIED" },
  { legalName: "Hosur Plating Solutions",    contactEmail: "sales@hosurplating.test",           pan: "AAKCH4567I", primaryGstin: "33AAKCH4567I1Z5", city: "Hosur",       state: "Tamil Nadu",     processTags: ["Plating", "Surface Treatment"],         certificationTags: [],                          badgeState: "LISTED"   },
  { legalName: "Faridabad Stampings Ltd",    contactEmail: "orders@faridabadstamp.test",        pan: "AALCF8901J", primaryGstin: "06AALCF8901J1Z5", city: "Faridabad",   state: "Haryana",        processTags: ["Sheet Metal", "Stamping"],              certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Kolhapur Castings Co",       contactEmail: "info@kolhapurcast.test",            pan: "AAMCK2345K", primaryGstin: "27AAMCK2345K1Z5", city: "Kolhapur",    state: "Maharashtra",    processTags: ["Gravity Casting", "Investment Casting"],certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Jamshedpur Alloy Steel",     contactEmail: "procurement@jamshedpuralloy.test",  pan: "AANCJ6789L", primaryGstin: "20AANCJ6789L1Z5", city: "Jamshedpur",  state: "Jharkhand",      processTags: ["Forging", "Heat Treatment"],            certificationTags: ["ISO 9001", "ISO 14001"],   badgeState: "VERIFIED" },
  { legalName: "Aurangabad Auto Parts",      contactEmail: "sales@aurangabadauto.test",         pan: "AAOCA0123M", primaryGstin: "27AAOCA0123M1Z5", city: "Aurangabad",  state: "Maharashtra",    processTags: ["HPDC", "CNC Turning"],                 certificationTags: [],                          badgeState: "VERIFIED" },
  { legalName: "Bengaluru Tooling Centre",   contactEmail: "info@blrtooling.test",              pan: "AAPCB4567N", primaryGstin: "29AAPCB4567N1Z5", city: "Bengaluru",   state: "Karnataka",      processTags: ["VMC", "Tool & Die"],                    certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Indore Precision Machining", contactEmail: "sales@indoremachining.test",        pan: "AAQCI8901O", primaryGstin: "23AAQCI8901O1Z5", city: "Indore",      state: "Madhya Pradesh", processTags: ["CNC Turning", "Grinding"],              certificationTags: [],                          badgeState: "LISTED"   },
  { legalName: "Vadodara Valves & Fittings", contactEmail: "info@vadodaravalves.test",          pan: "AARCV2345P", primaryGstin: "24AARCV2345P1Z5", city: "Vadodara",    state: "Gujarat",        processTags: ["Casting", "Assembly"],                  certificationTags: ["ISO 9001"],                badgeState: "VERIFIED" },
  { legalName: "Tiruppur Rubber Industries", contactEmail: "orders@tiruppurrubber.test",        pan: "AASCT6789Q", primaryGstin: "33AASCT6789Q1Z5", city: "Tiruppur",    state: "Tamil Nadu",     processTags: ["Rubber Molding", "Assembly"],           certificationTags: [],                          badgeState: "VERIFIED" },
  { legalName: "Noida Electronics Mfg",      contactEmail: "procurement@noidaelec.test",        pan: "AATCN0123R", primaryGstin: "09AATCN0123R1Z5", city: "Noida",       state: "Uttar Pradesh",  processTags: ["SMT", "Assembly"],                      certificationTags: ["ISO 9001", "ISO 13485"],   badgeState: "VERIFIED" },
] as const;

const REQUIREMENTS = [
  { reqNum: "VR-1001", title: "Aluminium HPDC housings — EV inverter",       stage: "DRAFT",               category: "Casting",       process: "RFQ" },
  { reqNum: "VR-1002", title: "Forged steering knuckles — front axle",       stage: "DRAFT",               category: "Forging",       process: "RFQ" },
  { reqNum: "VR-1003", title: "CNC-machined transmission shafts",            stage: "CANDIDATES_SELECTED", category: "Machining",     process: "NOMINATION" },
  { reqNum: "VR-1004", title: "Sheet-metal brackets & mounts",               stage: "CANDIDATES_SELECTED", category: "Sheet Metal",   process: "RFQ" },
  { reqNum: "VR-1005", title: "Gravity-cast brake calipers (2025 program)",  stage: "INVITES_SENT",        category: "Casting",       process: "RFQ" },
  { reqNum: "VR-1006", title: "Plated connector terminals",                  stage: "IN_PROGRESS",         category: "Plating",       process: "DIRECT" },
  { reqNum: "VR-1007", title: "Rubber engine mounts — EV platform",          stage: "IN_PROGRESS",         category: "Rubber Molding",process: "RFQ" },
  { reqNum: "VR-1008", title: "Die-cast gear housing (2024 carry-over)",     stage: "CLOSED",              category: "Casting",       process: "RFQ" },
] as const;

const SLA_RULES = [
  { stage: "FINANCIAL_CRIME", slaDays: 3 },
  { stage: "COMPLIANCE",     slaDays: 5 },
  { stage: "LEGAL",          slaDays: 7 },
  { stage: "IT_INFOSEC",     slaDays: 4 },
  { stage: "TAX",            slaDays: 3 },
  { stage: "PROCUREMENT",    slaDays: 5 },
  { stage: "DATA_PRIVACY",   slaDays: 4 },
  { stage: "BUSINESS_OWNER", slaDays: 5 },
] as const;

const ALL_APPROVAL_STAGES = ["FINANCIAL_CRIME","COMPLIANCE","LEGAL","IT_INFOSEC","TAX","PROCUREMENT","DATA_PRIVACY","BUSINESS_OWNER"] as const;
const ALL_CONTRACT_TYPES  = ["NDA","MSA","QUALITY_AGREEMENT","SUPPLY_AGREEMENT","PRICING_AGREEMENT","DATA_PROCESSING"] as const;

// ═══════════════════════════════════════════════════════════════════════
// STATS — tracks created vs skipped per table for the summary.
// ═══════════════════════════════════════════════════════════════════════

const stats: Record<string, { created: number; skipped: number }> = {};
function track(table: string, wasCreated: boolean) {
  if (!stats[table]) stats[table] = { created: 0, skipped: 0 };
  if (wasCreated) stats[table].created++; else stats[table].skipped++;
}

// ═══════════════════════════════════════════════════════════════════════
// IDEMPOTENT HELPERS — every table goes through one of these.
// ═══════════════════════════════════════════════════════════════════════

async function ensureUser(data: { email: string; name: string; role: string; tier: string; buyerOrgId?: string; buyerRole?: string; vendorOrgId?: string }): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  const id = existing?.id ?? generateId();
  await prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name, role: data.role as any, tier: data.tier as any, buyerOrgId: data.buyerOrgId, buyerRole: data.buyerRole as any, vendorOrgId: data.vendorOrgId },
    create: { id, name: data.name, email: data.email, role: data.role as any, tier: data.tier as any, buyerOrgId: data.buyerOrgId, buyerRole: data.buyerRole as any, vendorOrgId: data.vendorOrgId },
  });
  track("User", !existing);
  if (SEED_PASSWORD_HASH) {
    const hasAccount = await prisma.account.findFirst({ where: { userId: id, providerId: "credential" } });
    if (!hasAccount) {
      await prisma.account.create({ data: { id: generateId(), userId: id, accountId: id, providerId: "credential", password: SEED_PASSWORD_HASH } });
    }
    track("Account", !hasAccount);
  }
  return id;
}

async function ensureDirectoryVendor(v: typeof DIRECTORY_VENDORS[number]): Promise<string> {
  const existing = await prisma.directoryVendor.findUnique({ where: { contactEmail: v.contactEmail } });
  const dv = await prisma.directoryVendor.upsert({
    where: { contactEmail: v.contactEmail },
    update: { legalName: v.legalName, pan: v.pan, primaryGstin: v.primaryGstin, city: v.city, state: v.state, processTags: [...v.processTags], certificationTags: [...v.certificationTags], badgeState: v.badgeState as any },
    create: { legalName: v.legalName, contactEmail: v.contactEmail, pan: v.pan, primaryGstin: v.primaryGstin, city: v.city, state: v.state, processTags: [...v.processTags], certificationTags: [...v.certificationTags], badgeState: v.badgeState as any },
  });
  track("DirectoryVendor", !existing);
  return dv.id;
}

async function ensureRequirement(r: typeof REQUIREMENTS[number], ownerId: string, buyerOrgId: string): Promise<string> {
  const existing = await prisma.vendorRequest.findUnique({ where: { requestNumber: r.reqNum } });
  const req = await prisma.vendorRequest.upsert({
    where: { requestNumber: r.reqNum },
    update: { title: r.title, stage: r.stage as any, category: r.category, process: r.process as any },
    create: { requestNumber: r.reqNum, title: r.title, stage: r.stage as any, category: r.category, process: r.process as any, vendorType: "PRODUCTION_PART", processCategories: [r.category], createdById: ownerId, buyerOrgId },
  });
  track("VendorRequest", !existing);
  return req.id;
}

async function ensureCandidate(requestId: string, vendorEmail: string, buyerOrgId: string): Promise<{ id: string; vendorId: string }> {
  const dv = await prisma.directoryVendor.findFirst({ where: { contactEmail: vendorEmail } });
  if (!dv) throw new Error(`Directory vendor not found: ${vendorEmail}`);
  const existing = await prisma.requestCandidate.findFirst({ where: { requestId, vendorId: dv.id } });
  track("RequestCandidate", !existing);
  if (existing) return { id: existing.id, vendorId: dv.id };
  const c = await prisma.requestCandidate.create({
    data: { requestId, vendorId: dv.id, source: "DIRECTORY", legalName: dv.legalName, contactEmail: dv.contactEmail, pan: dv.pan, gstin: dv.primaryGstin, city: dv.city, state: dv.state, buyerOrgId },
  });
  return { id: c.id, vendorId: dv.id };
}

async function ensureLink(candidateId: string, requestId: string, buyerOrgId: string, data: Record<string, unknown>): Promise<string> {
  const existing = await prisma.vendorBuyerLink.findUnique({ where: { candidateId } });
  track("VendorBuyerLink", !existing);
  if (existing) return existing.id;
  const link = await prisma.vendorBuyerLink.create({ data: { candidateId, requestId, buyerOrgId, ...data } as any });
  return link.id;
}

async function ensureSubmission(linkId: string, stage: string, status: string, submittedAt?: Date): Promise<string> {
  const existing = await prisma.submission.findUnique({ where: { linkId_stage: { linkId, stage: stage as any } } });
  track("Submission", !existing);
  if (existing) return existing.id;
  const s = await prisma.submission.create({ data: { linkId, stage: stage as any, status: status as any, submittedAt } });
  return s.id;
}

async function ensureFieldValues(submissionId: string, linkId: string, fields: Record<string, string>): Promise<void> {
  for (const [fieldKey, value] of Object.entries(fields)) {
    const existing = await prisma.fieldValue.findUnique({ where: { submissionId_fieldKey: { submissionId, fieldKey } } });
    track("FieldValue", !existing);
    if (!existing) await prisma.fieldValue.create({ data: { submissionId, linkId, fieldKey, value } });
  }
}

async function ensureVerificationChecks(linkId: string, checks: Array<{ checkType: string; status: string; matchScore: number; detail: object; subjectValue?: string }>): Promise<void> {
  for (const c of checks) {
    const existing = await prisma.verificationCheck.findFirst({ where: { linkId, checkType: c.checkType as any } });
    track("VerificationCheck", !existing);
    if (!existing) await prisma.verificationCheck.create({ data: { linkId, checkType: c.checkType as any, status: c.status as any, matchScore: c.matchScore, ranAt: new Date(), detail: c.detail, subjectValue: c.subjectValue ?? "" } });
  }
}

async function ensureReviewTasks(linkId: string, tasks: Array<{ stage: string; status: string }>, decidedByEmail: string, userIds: Record<string, string>): Promise<void> {
  for (const t of tasks) {
    const existing = await prisma.reviewTask.findUnique({ where: { linkId_stage: { linkId, stage: t.stage as any } } });
    track("ReviewTask", !existing);
    if (existing) continue;
    const rt = await prisma.reviewTask.create({ data: { linkId, stage: t.stage as any, status: t.status as any, slaHours: 96 } });
    if (t.status !== "PENDING") {
      await prisma.approvalDecision.create({
        data: { reviewTaskId: rt.id, linkId, decision: (t.status === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED") as any, comment: t.status === "APPROVED" ? "Looks good" : "Need updated policy", decidedById: userIds[decidedByEmail] },
      });
    }
  }
}

async function ensureContracts(linkId: string, contracts: Array<{ contractType: string; state: string; executedAt?: Date }>): Promise<void> {
  for (const ct of contracts) {
    const existing = await prisma.contract.findUnique({ where: { linkId_contractType: { linkId, contractType: ct.contractType as any } } });
    track("Contract", !existing);
    if (!existing) await prisma.contract.create({ data: { linkId, contractType: ct.contractType as any, state: ct.state as any, executedAt: ct.executedAt } });
  }
}

async function ensureSlaRule(stage: string, slaDays: number): Promise<void> {
  const existing = await prisma.slaRule.findUnique({ where: { stage: stage as any } });
  await prisma.slaRule.upsert({ where: { stage: stage as any }, update: { slaDays }, create: { stage: stage as any, slaDays } });
  track("SlaRule", !existing);
}

async function ensureInvitation(candidateId: string, requestId: string, buyerOrgId: string, email: string, status: string): Promise<void> {
  const existing = await prisma.vendorInvitation.findFirst({ where: { candidateId } });
  track("VendorInvitation", !existing);
  if (existing) return;
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.vendorInvitation.create({
    data: { tokenHash, magicTokenPlain: token, email, expiresAt: new Date(Date.now() + 14 * 86_400_000), status: status as any, openedAt: status === "OPENED" ? new Date() : null, requestId, buyerOrgId, candidateId },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN — drives the helpers from the data above.
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Session", "Account", "Verification", "BuyerOrg", "VendorOrg", "DirectoryVendor", "VendorRequest", "RequestCandidate", "VendorInvitation", "VendorBuyerLink", "LinkEvent", "Submission", "FieldValue", "FileBlob", "Document", "VerificationCheck", "ReviewTask", "ApprovalDecision", "Contract", "ContractVersion", "ContractComment", "SlaRule", "ScoringCriterion" RESTART IDENTITY CASCADE`);
    console.log("Database truncated.");
  }

  // ── Orgs ──
  const buyerOrg = await prisma.buyerOrg.upsert({ where: { id: ORGS.buyer.id }, update: {}, create: ORGS.buyer });
  const vendorOrgIds: string[] = [];
  for (const vo of ORGS.vendorOrgs) {
    const org = await prisma.vendorOrg.upsert({ where: { id: vo.id }, update: {}, create: vo });
    vendorOrgIds.push(org.id);
  }

  // ── Users ──
  const userIds: Record<string, string> = {};
  for (const u of USERS) {
    const orgData: Record<string, unknown> = {};
    if (u.role === "BUYER") { orgData.buyerOrgId = buyerOrg.id; orgData.buyerRole = (u as any).buyerRole; }
    if (u.role === "VENDOR") { orgData.vendorOrgId = vendorOrgIds[(u as any).vendorOrgIdx]; }
    userIds[u.email] = await ensureUser({ email: u.email, name: u.name, role: u.role, tier: u.tier, ...orgData });
  }

  // ── Directory vendors ──
  for (const v of DIRECTORY_VENDORS) await ensureDirectoryVendor(v);

  // ── Requirements ──
  const reqIds: Record<string, string> = {};
  const ownerId = userIds["buyer@meridian.test"];
  for (const r of REQUIREMENTS) reqIds[r.title] = await ensureRequirement(r, ownerId, buyerOrg.id);

  // ── CANDIDATES_SELECTED requirements ──
  for (const email of ["info@precisionauto.test", "info@cbetools.test", "sales@indoremachining.test", "info@blrtooling.test"])
    await ensureCandidate(reqIds["CNC-machined transmission shafts"], email, buyerOrg.id);
  for (const email of ["orders@gujaratmetal.test", "orders@faridabadstamp.test", "sales@ludhianasteel.test"])
    await ensureCandidate(reqIds["Sheet-metal brackets & mounts"], email, buyerOrg.id);

  // ── INVITES_SENT requirement ──
  const invReq = "Gravity-cast brake calipers (2025 program)";
  const invitedVendors = [
    { email: "sales@sundaramcast.test",    status: "INVITED" },
    { email: "info@kolhapurcast.test",     status: "INVITED" },
    { email: "sales@aurangabadauto.test",  status: "INVITED" },
    { email: "sales@rajkoteng.test",       status: "OPENED"  },
  ];
  for (const iv of invitedVendors) {
    const c = await ensureCandidate(reqIds[invReq], iv.email, buyerOrg.id);
    await ensureInvitation(c.id, reqIds[invReq], buyerOrg.id, iv.email, iv.status === "OPENED" ? "OPENED" : "INVITED");
    await ensureLink(c.id, reqIds[invReq], buyerOrg.id, {
      state: iv.status === "OPENED" ? "PREQUAL_IN_PROGRESS" : "INVITED",
      stage: "PREQUAL",
      vendorUserId: iv.status === "OPENED" ? userIds["ramesh@gujaratmetal.test"] : null,
    });
  }

  // ── IN_PROGRESS requirement 1: "Plated connector terminals" ──
  const ipReq1 = "Plated connector terminals";

  const ipC1 = await ensureCandidate(reqIds[ipReq1], "sales@hosurplating.test", buyerOrg.id);
  const link1 = await ensureLink(ipC1.id, reqIds[ipReq1], buyerOrg.id, { state: "PREQUAL_CLEARED", stage: "PREQUAL", prequalScore: 82 });
  const sub1 = await ensureSubmission(link1, "PREQUAL", "SUBMITTED", new Date(Date.now() - 5 * 86_400_000));
  await ensureFieldValues(sub1, link1, { legalName: "Hosur Plating Solutions", pan: "AAKCH4567I", gstin: "33AAKCH4567I1Z5", contactEmail: "sales@hosurplating.test", city: "Hosur", state: "Tamil Nadu" });
  await ensureVerificationChecks(link1, [
    { checkType: "PAN", status: "PASSED", matchScore: 95, detail: { reason: "Verified" } },
    { checkType: "GST", status: "PASSED", matchScore: 92, detail: { reason: "Verified" } },
    { checkType: "UDYAM", status: "NEEDS_REVIEW", matchScore: 72, detail: { reason: "Partial match" } },
  ]);

  const ipC2 = await ensureCandidate(reqIds[ipReq1], "orders@gujaratmetal.test", buyerOrg.id);
  const link2 = await ensureLink(ipC2.id, reqIds[ipReq1], buyerOrg.id, { vendorUserId: userIds["ramesh@gujaratmetal.test"], vendorOrgId: vendorOrgIds[0], state: "CONTRACTS_IN_PROGRESS", stage: "FULL", prequalScore: 88, awardedAt: new Date(Date.now() - 10 * 86_400_000) });
  const sub2p = await ensureSubmission(link2, "PREQUAL", "SUBMITTED", new Date(Date.now() - 20 * 86_400_000));
  await ensureFieldValues(sub2p, link2, { legalName: "Gujarat Metal Works", pan: "AAFCG3456D", gstin: "24AAFCG3456D1Z5", contactEmail: "orders@gujaratmetal.test", city: "Ahmedabad", state: "Gujarat" });
  const sub2f = await ensureSubmission(link2, "FULL", "SUBMITTED", new Date(Date.now() - 7 * 86_400_000));
  await ensureFieldValues(sub2f, link2, { bankAccountName: "Gujarat Metal Works Pvt Ltd", bankAccountNumber: "50100123456789", bankIfsc: "HDFC0001234", authorizedSignatory: "Ramesh Patel", signatoryDesignation: "Managing Director", annualTurnover: "320000000" });
  await ensureVerificationChecks(link2, [
    { checkType: "PAN", status: "PASSED", matchScore: 98, detail: { reason: "Verified" } },
    { checkType: "GST", status: "PASSED", matchScore: 96, detail: { reason: "Verified" } },
    { checkType: "UDYAM", status: "PASSED", matchScore: 90, detail: { reason: "Verified" } },
    { checkType: "PENNY_DROP", status: "PASSED", matchScore: 100, detail: { reason: "Verified" } },
    { checkType: "GST_FILINGS", status: "NEEDS_REVIEW", matchScore: 68, detail: { reason: "3 months partial" } },
  ]);
  await ensureReviewTasks(link2, [
    { stage: "FINANCIAL_CRIME", status: "APPROVED" }, { stage: "COMPLIANCE", status: "APPROVED" },
    { stage: "LEGAL", status: "PENDING" }, { stage: "IT_INFOSEC", status: "APPROVED" },
    { stage: "TAX", status: "PENDING" }, { stage: "PROCUREMENT", status: "APPROVED" },
    { stage: "DATA_PRIVACY", status: "CHANGES_REQUESTED" }, { stage: "BUSINESS_OWNER", status: "PENDING" },
  ], "quality@meridian.test", userIds);
  await ensureContracts(link2, [
    { contractType: "NDA", state: "EXECUTED" }, { contractType: "MSA", state: "AWAITING_SIGNATURES" },
    { contractType: "QUALITY_AGREEMENT", state: "AGREED" }, { contractType: "SUPPLY_AGREEMENT", state: "DRAFT_UPLOADED" },
    { contractType: "PRICING_AGREEMENT", state: "DRAFT_PENDING" }, { contractType: "DATA_PROCESSING", state: "CHANGES_REQUESTED" },
  ]);

  const ipC3 = await ensureCandidate(reqIds[ipReq1], "info@precisionauto.test", buyerOrg.id);
  await ensureLink(ipC3.id, reqIds[ipReq1], buyerOrg.id, { state: "PREQUAL_IN_PROGRESS", stage: "PREQUAL" });

  const ipC4 = await ensureCandidate(reqIds[ipReq1], "procurement@bharatforge.test", buyerOrg.id);
  const link4 = await ensureLink(ipC4.id, reqIds[ipReq1], buyerOrg.id, { state: "PREQUAL_SUBMITTED", stage: "PREQUAL" });
  const sub4 = await ensureSubmission(link4, "PREQUAL", "SUBMITTED", new Date(Date.now() - 2 * 86_400_000));
  await ensureFieldValues(sub4, link4, { legalName: "Bharat Forge Ltd", pan: "AABCB1234A", gstin: "27AABCB1234A1Z5", contactEmail: "procurement@bharatforge.test", city: "Pune", state: "Maharashtra" });

  const ipC5 = await ensureCandidate(reqIds[ipReq1], "info@vadodaravalves.test", buyerOrg.id);
  await ensureLink(ipC5.id, reqIds[ipReq1], buyerOrg.id, { state: "INVITED", stage: "PREQUAL" });

  // ── IN_PROGRESS requirement 2: "Rubber engine mounts" ──
  const ipReq2 = "Rubber engine mounts — EV platform";
  const ipC6 = await ensureCandidate(reqIds[ipReq2], "orders@tiruppurrubber.test", buyerOrg.id);
  await ensureLink(ipC6.id, reqIds[ipReq2], buyerOrg.id, { state: "AWARDED", stage: "PREQUAL", prequalScore: 85, awardedAt: new Date(Date.now() - 3 * 86_400_000) });

  const ipC7 = await ensureCandidate(reqIds[ipReq2], "procurement@noidaelec.test", buyerOrg.id);
  await ensureLink(ipC7.id, reqIds[ipReq2], buyerOrg.id, { vendorUserId: userIds["harpreet@ludhianasteel.test"], vendorOrgId: vendorOrgIds[1], state: "FULL_IN_PROGRESS", stage: "FULL", prequalScore: 79, awardedAt: new Date(Date.now() - 5 * 86_400_000) });

  const ipC8 = await ensureCandidate(reqIds[ipReq2], "info@nashikforgings.test", buyerOrg.id);
  await ensureLink(ipC8.id, reqIds[ipReq2], buyerOrg.id, { state: "REJECTED", stage: "PREQUAL", prequalScore: 45 });

  // ── CLOSED requirement ──
  const closedReq = "Die-cast gear housing (2024 carry-over)";
  const clC1 = await ensureCandidate(reqIds[closedReq], "sales@sundaramcast.test", buyerOrg.id);
  const link9 = await ensureLink(clC1.id, reqIds[closedReq], buyerOrg.id, {
    vendorUserId: userIds["harpreet@ludhianasteel.test"], vendorOrgId: vendorOrgIds[1],
    state: "ONBOARDED", stage: "FULL", prequalScore: 91,
    awardedAt: new Date(Date.now() - 30 * 86_400_000), onboardedAt: new Date(Date.now() - 3 * 86_400_000), erpVendorCode: "0001A3B2C1",
  });
  await ensureReviewTasks(link9, ALL_APPROVAL_STAGES.map((s) => ({ stage: s, status: "APPROVED" })), "quality@meridian.test", userIds);
  await ensureContracts(link9, ALL_CONTRACT_TYPES.map((ct) => ({ contractType: ct, state: "EXECUTED", executedAt: new Date(Date.now() - 5 * 86_400_000) })));

  const clC2 = await ensureCandidate(reqIds[closedReq], "info@kolhapurcast.test", buyerOrg.id);
  const link10 = await ensureLink(clC2.id, reqIds[closedReq], buyerOrg.id, { state: "ERP_FAILED", stage: "FULL", prequalScore: 78, awardedAt: new Date(Date.now() - 25 * 86_400_000) });
  await ensureReviewTasks(link10, ALL_APPROVAL_STAGES.map((s) => ({ stage: s, status: "APPROVED" })), "finance@meridian.test", userIds);
  await ensureContracts(link10, ALL_CONTRACT_TYPES.map((ct) => ({ contractType: ct, state: "EXECUTED", executedAt: new Date(Date.now() - 8 * 86_400_000) })));

  // ── SLA Rules ──
  for (const s of SLA_RULES) await ensureSlaRule(s.stage, s.slaDays);

  // ── Quotations for the IN_PROGRESS requirement ──
  const reqIP = reqIds[ipReq1];
  if (reqIP) {
    const candidates = await prisma.requestCandidate.findMany({
      where: { requestId: reqIP },
    });
    const quotationPrices = [
      { unitPrice: 1200, toolingPerUnit: 150, freightPerUnit: 80, leadTimeDays: 45 },
      { unitPrice: 1500, toolingPerUnit: 200, freightPerUnit: 100, leadTimeDays: 40 },
      { unitPrice: 1800, toolingPerUnit: 250, freightPerUnit: 120, leadTimeDays: 35 },
    ];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const prices = quotationPrices[i] ?? quotationPrices[quotationPrices.length - 1];
      await prisma.quotation.upsert({
        where: { requestId_vendorId: { requestId: reqIP, vendorId: c.vendorId } },
        create: {
          requestId: reqIP,
          vendorId: c.vendorId,
          unitPrice: prices.unitPrice,
          toolingPerUnit: prices.toolingPerUnit,
          freightPerUnit: prices.freightPerUnit,
          leadTimeDays: prices.leadTimeDays,
          location: 'Pune, Maharashtra',
          capacityNote: '200 tons/month',
          capturedById: ownerId,
        },
        update: {},
      });
    }
    track("Quotation", candidates.length > 0);
  }

  // ── Mobile verification on CEO user ──
  const ceoId = userIds['ceo@meridian.test'];
  if (ceoId) {
    await prisma.user.update({
      where: { id: ceoId },
      data: {
        mobileNumber: '+919876543210',
        mobileVerifiedAt: new Date(),
      },
    });
  }

  // ── Summary ──
  const [users, dvs, reqs, cands, links, tasks, contracts, subs, checks, quotations] = await Promise.all([
    prisma.user.count(), prisma.directoryVendor.count(), prisma.vendorRequest.count(),
    prisma.requestCandidate.count(), prisma.vendorBuyerLink.count(), prisma.reviewTask.count(),
    prisma.contract.count(), prisma.submission.count(), prisma.verificationCheck.count(), prisma.quotation.count(),
  ]);
  console.log("\nSeed complete.\n");
  console.log("  Table                 Created   Skipped   Total");
  console.log("  ─────────────────────────────────────────────────");
  const rows = [
    ["User", users], ["DirectoryVendor", dvs], ["VendorRequest", reqs],
    ["RequestCandidate", cands], ["VendorBuyerLink", links], ["VendorInvitation", await prisma.vendorInvitation.count()],
    ["Submission", subs], ["FieldValue", await prisma.fieldValue.count()],
    ["VerificationCheck", checks], ["ReviewTask", tasks], ["Contract", contracts],
    ["Quotation", quotations], ["SlaRule", await prisma.slaRule.count()], ["Account", await prisma.account.count()],
  ] as const;
  for (const [name, total] of rows) {
    const s = stats[name] ?? { created: 0, skipped: 0 };
    console.log(`  ${name.padEnd(22)} ${String(s.created).padStart(5)}     ${String(s.skipped).padStart(5)}     ${String(total).padStart(5)}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
