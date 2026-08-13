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

  // ── Orgs ──────────────────────────────────────────────────────────────

  const buyerOrg = await prisma.buyerOrg.create({ data: { legalName: "Meridian Motors" } });

  const vendorOrg1 = await prisma.vendorOrg.create({
    data: { legalName: "Gujarat Metal Works Pvt Ltd", contactEmail: "admin@gujaratmetal.test" },
  });
  const vendorOrg2 = await prisma.vendorOrg.create({
    data: { legalName: "Ludhiana Steel Group", contactEmail: "admin@ludhianasteel.test" },
  });

  // ── Buyer users ───────────────────────────────────────────────────────

  const buyerUsers = [
    { name: "Priya Sharma", email: "buyer@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "OWNER" as const },
    { name: "Anil Verma", email: "quality@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "QUALITY" as const },
    { name: "Meera Iyer", email: "finance@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "FINANCE" as const },
    { name: "Rahul Nair", email: "tax@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "TAX" as const },
    { name: "Sana Khan", email: "legal@meridian.test", role: "BUYER" as const, tier: "EXECUTIVE" as const, buyerRole: "LEGAL" as const },
    { name: "Vikram Bajaj", email: "ceo@meridian.test", role: "BUYER" as const, tier: "LEADERSHIP" as const, buyerRole: "OWNER" as const },
  ];

  const userIds: Record<string, string> = {};
  for (const u of buyerUsers) {
    const id = generateId();
    await prisma.user.create({
      data: { id, name: u.name, email: u.email, role: u.role, tier: u.tier, buyerOrgId: buyerOrg.id, buyerRole: u.buyerRole },
    });
    if (SEED_PASSWORD_HASH) {
      await prisma.account.create({
        data: { id: generateId(), userId: id, accountId: id, providerId: "credential", password: SEED_PASSWORD_HASH },
      });
    }
    userIds[u.email] = id;
  }

  // ── Vendor users ──────────────────────────────────────────────────────

  const vendorUsers = [
    { name: "Ramesh Patel", email: "ramesh@gujaratmetal.test", role: "VENDOR" as const, tier: "EXECUTIVE" as const, vendorOrgId: vendorOrg1.id },
    { name: "Suresh Mehta", email: "suresh@gujaratmetal.test", role: "VENDOR" as const, tier: "LEADERSHIP" as const, vendorOrgId: vendorOrg1.id },
    { name: "Harpreet Singh", email: "harpreet@ludhianasteel.test", role: "VENDOR" as const, tier: "EXECUTIVE" as const, vendorOrgId: vendorOrg2.id },
    { name: "Gurpreet Kaur", email: "gurpreet@ludhianasteel.test", role: "VENDOR" as const, tier: "LEADERSHIP" as const, vendorOrgId: vendorOrg2.id },
  ];

  for (const v of vendorUsers) {
    const id = generateId();
    await prisma.user.create({
      data: { id, name: v.name, email: v.email, role: v.role, tier: v.tier, vendorOrgId: v.vendorOrgId },
    });
    if (SEED_PASSWORD_HASH) {
      await prisma.account.create({
        data: { id: generateId(), userId: id, accountId: id, providerId: "credential", password: SEED_PASSWORD_HASH },
      });
    }
    userIds[v.email] = id;
  }

  // ── Directory vendors (18) ────────────────────────────────────────────

  const directoryVendors = [
    { legalName: "Bharat Forge Ltd", contactEmail: "procurement@bharatforge.test", pan: "AABCB1234A", primaryGstin: "27AABCB1234A1Z5", city: "Pune", state: "Maharashtra", processTags: ["Forging", "CNC Turning"], certificationTags: ["ISO 9001", "IATF 16949"], badgeState: "VERIFIED" as const },
    { legalName: "Sundaram Castings", contactEmail: "sales@sundaramcast.test", pan: "AADCS5678B", primaryGstin: "33AADCS5678B1Z5", city: "Chennai", state: "Tamil Nadu", processTags: ["Gravity Casting", "HPDC"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Precision Auto Components", contactEmail: "info@precisionauto.test", pan: "AAECP9012C", primaryGstin: "06AAECP9012C1Z5", city: "Gurgaon", state: "Haryana", processTags: ["CNC Turning", "VMC"], certificationTags: ["ISO 9001", "ISO 14001"], badgeState: "VERIFIED" as const },
    { legalName: "Gujarat Metal Works", contactEmail: "orders@gujaratmetal.test", pan: "AAFCG3456D", primaryGstin: "24AAFCG3456D1Z5", city: "Ahmedabad", state: "Gujarat", processTags: ["Sheet Metal", "Plating"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Ludhiana Steel Fabricators", contactEmail: "sales@ludhianasteel.test", pan: "AAGCL7890E", primaryGstin: "03AAGCL7890E1Z5", city: "Ludhiana", state: "Punjab", processTags: ["Forging", "Heat Treatment"], certificationTags: [], badgeState: "LISTED" as const },
    { legalName: "Coimbatore Precision Tools", contactEmail: "info@cbetools.test", pan: "AAHCC2345F", primaryGstin: "33AAHCC2345F1Z5", city: "Coimbatore", state: "Tamil Nadu", processTags: ["CNC Turning", "Grinding"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Rajkot Engineering Works", contactEmail: "sales@rajkoteng.test", pan: "AAICR6789G", primaryGstin: "24AAICR6789G1Z5", city: "Rajkot", state: "Gujarat", processTags: ["Casting", "Machining"], certificationTags: [], badgeState: "VERIFIED" as const },
    { legalName: "Nashik Forgings Pvt Ltd", contactEmail: "info@nashikforgings.test", pan: "AAJCN0123H", primaryGstin: "27AAJCN0123H1Z5", city: "Nashik", state: "Maharashtra", processTags: ["Forging"], certificationTags: ["ISO 9001", "IATF 16949"], badgeState: "VERIFIED" as const },
    { legalName: "Hosur Plating Solutions", contactEmail: "sales@hosurplating.test", pan: "AAKCH4567I", primaryGstin: "33AAKCH4567I1Z5", city: "Hosur", state: "Tamil Nadu", processTags: ["Plating", "Surface Treatment"], certificationTags: [], badgeState: "LISTED" as const },
    { legalName: "Faridabad Stampings Ltd", contactEmail: "orders@faridabadstamp.test", pan: "AALCF8901J", primaryGstin: "06AALCF8901J1Z5", city: "Faridabad", state: "Haryana", processTags: ["Sheet Metal", "Stamping"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Kolhapur Castings Co", contactEmail: "info@kolhapurcast.test", pan: "AAMCK2345K", primaryGstin: "27AAMCK2345K1Z5", city: "Kolhapur", state: "Maharashtra", processTags: ["Gravity Casting", "Investment Casting"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Jamshedpur Alloy Steel", contactEmail: "procurement@jamshedpuralloy.test", pan: "AANCJ6789L", primaryGstin: "20AANCJ6789L1Z5", city: "Jamshedpur", state: "Jharkhand", processTags: ["Forging", "Heat Treatment"], certificationTags: ["ISO 9001", "ISO 14001"], badgeState: "VERIFIED" as const },
    { legalName: "Aurangabad Auto Parts", contactEmail: "sales@aurangabadauto.test", pan: "AAOCA0123M", primaryGstin: "27AAOCA0123M1Z5", city: "Aurangabad", state: "Maharashtra", processTags: ["HPDC", "CNC Turning"], certificationTags: [], badgeState: "VERIFIED" as const },
    { legalName: "Bengaluru Tooling Centre", contactEmail: "info@blrtooling.test", pan: "AAPCB4567N", primaryGstin: "29AAPCB4567N1Z5", city: "Bengaluru", state: "Karnataka", processTags: ["VMC", "Tool & Die"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Indore Precision Machining", contactEmail: "sales@indoremachining.test", pan: "AAQCI8901O", primaryGstin: "23AAQCI8901O1Z5", city: "Indore", state: "Madhya Pradesh", processTags: ["CNC Turning", "Grinding"], certificationTags: [], badgeState: "LISTED" as const },
    { legalName: "Vadodara Valves & Fittings", contactEmail: "info@vadodaravalves.test", pan: "AARCV2345P", primaryGstin: "24AARCV2345P1Z5", city: "Vadodara", state: "Gujarat", processTags: ["Casting", "Assembly"], certificationTags: ["ISO 9001"], badgeState: "VERIFIED" as const },
    { legalName: "Tiruppur Rubber Industries", contactEmail: "orders@tiruppurrubber.test", pan: "AASCT6789Q", primaryGstin: "33AASCT6789Q1Z5", city: "Tiruppur", state: "Tamil Nadu", processTags: ["Rubber Molding", "Assembly"], certificationTags: [], badgeState: "VERIFIED" as const },
    { legalName: "Noida Electronics Mfg", contactEmail: "procurement@noidaelec.test", pan: "AATCN0123R", primaryGstin: "09AATCN0123R1Z5", city: "Noida", state: "Uttar Pradesh", processTags: ["SMT", "Assembly"], certificationTags: ["ISO 9001", "ISO 13485"], badgeState: "VERIFIED" as const },
  ];

  const vendorIds: Record<string, string> = {};
  for (const v of directoryVendors) {
    const dv = await prisma.directoryVendor.create({ data: v });
    vendorIds[v.contactEmail] = dv.id;
  }

  // ── Requirements (8 total) ────────────────────────────────────────────

  const ownerId = userIds["buyer@meridian.test"];
  const requirements = [
    { title: "Aluminium HPDC housings — EV inverter", stage: "DRAFT" as const, category: "Casting", process: "RFQ" as const },
    { title: "Forged steering knuckles — front axle", stage: "DRAFT" as const, category: "Forging", process: "RFQ" as const },
    { title: "CNC-machined transmission shafts", stage: "CANDIDATES_SELECTED" as const, category: "Machining", process: "NOMINATION" as const },
    { title: "Sheet-metal brackets & mounts", stage: "CANDIDATES_SELECTED" as const, category: "Sheet Metal", process: "RFQ" as const },
    { title: "Gravity-cast brake calipers (2025 program)", stage: "INVITES_SENT" as const, category: "Casting", process: "RFQ" as const },
    { title: "Plated connector terminals", stage: "IN_PROGRESS" as const, category: "Plating", process: "DIRECT" as const },
    { title: "Rubber engine mounts — EV platform", stage: "IN_PROGRESS" as const, category: "Rubber Molding", process: "RFQ" as const },
    { title: "Die-cast gear housing (2024 carry-over)", stage: "CLOSED" as const, category: "Casting", process: "RFQ" as const },
  ];

  const reqIds: Record<string, string> = {};
  let reqNum = 1001;
  for (const r of requirements) {
    const req = await prisma.vendorRequest.create({
      data: {
        requestNumber: `VR-${reqNum++}`,
        title: r.title,
        stage: r.stage,
        category: r.category,
        process: r.process,
        vendorType: "PRODUCTION_PART",
        processCategories: [r.category],
        createdById: ownerId,
        buyerOrgId: buyerOrg.id,
      },
    });
    reqIds[r.title] = req.id;
  }

  // ── Helper to create a candidate ──────────────────────────────────────

  async function addCandidate(reqTitle: string, vendorEmail: string, opts: { inviteStatus?: string; source?: string } = {}) {
    const dv = await prisma.directoryVendor.findFirst({ where: { contactEmail: vendorEmail } });
    if (!dv) throw new Error(`Directory vendor not found: ${vendorEmail}`);
    return prisma.requestCandidate.create({
      data: {
        requestId: reqIds[reqTitle],
        vendorId: dv.id,
        source: (opts.source ?? "DIRECTORY") as any,
        legalName: dv.legalName,
        contactEmail: dv.contactEmail,
        pan: dv.pan,
        gstin: dv.primaryGstin,
        city: dv.city,
        state: dv.state,
        inviteStatus: (opts.inviteStatus ?? "PENDING") as any,
        buyerOrgId: buyerOrg.id,
      },
    });
  }

  // ── Candidates for CANDIDATES_SELECTED requirements ───────────────────

  // "CNC-machined transmission shafts" — 4 candidates, no invites
  await addCandidate("CNC-machined transmission shafts", "info@precisionauto.test");
  await addCandidate("CNC-machined transmission shafts", "info@cbetools.test");
  await addCandidate("CNC-machined transmission shafts", "sales@indoremachining.test");
  await addCandidate("CNC-machined transmission shafts", "info@blrtooling.test");

  // "Sheet-metal brackets & mounts" — 3 candidates, no invites
  await addCandidate("Sheet-metal brackets & mounts", "orders@gujaratmetal.test");
  await addCandidate("Sheet-metal brackets & mounts", "orders@faridabadstamp.test");
  await addCandidate("Sheet-metal brackets & mounts", "sales@ludhianasteel.test");

  // ── INVITES_SENT requirement — candidates with invitations ────────────

  const invReqTitle = "Gravity-cast brake calipers (2025 program)";
  const invCand1 = await addCandidate(invReqTitle, "sales@sundaramcast.test", { inviteStatus: "INVITED" });
  const invCand2 = await addCandidate(invReqTitle, "info@kolhapurcast.test", { inviteStatus: "INVITED" });
  const invCand3 = await addCandidate(invReqTitle, "sales@aurangabadauto.test", { inviteStatus: "INVITED" });
  const invCand4 = await addCandidate(invReqTitle, "sales@rajkoteng.test", { inviteStatus: "OPENED" });

  for (const c of [invCand1, invCand2, invCand3, invCand4]) {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.vendorInvitation.create({
      data: {
        tokenHash,
        magicTokenPlain: token,
        email: c.contactEmail!,
        expiresAt: new Date(Date.now() + 14 * 86_400_000),
        status: c.inviteStatus === "OPENED" ? "OPENED" : "INVITED",
        openedAt: c.inviteStatus === "OPENED" ? new Date() : null,
        vendorId: c.vendorId,
        requestId: reqIds[invReqTitle],
        buyerOrgId: buyerOrg.id,
        candidateId: c.id,
      },
    });
    await prisma.vendorBuyerLink.create({
      data: {
        candidateId: c.id,
        requestId: reqIds[invReqTitle],
        buyerOrgId: buyerOrg.id,
        state: c.inviteStatus === "OPENED" ? "PREQUAL_IN_PROGRESS" : "INVITED",
        stage: "PREQUAL",
        vendorUserId: c.inviteStatus === "OPENED" ? userIds["ramesh@gujaratmetal.test"] : null,
      },
    });
  }

  // ── IN_PROGRESS requirement 1: "Plated connector terminals" ───────────
  // Links at various prequal/full stages

  const ipReq1 = "Plated connector terminals";
  const ipC1 = await addCandidate(ipReq1, "sales@hosurplating.test", { inviteStatus: "REGISTERED" });
  const ipC2 = await addCandidate(ipReq1, "orders@gujaratmetal.test", { inviteStatus: "REGISTERED" });
  const ipC3 = await addCandidate(ipReq1, "info@precisionauto.test", { inviteStatus: "OPENED" });
  const ipC4 = await addCandidate(ipReq1, "procurement@bharatforge.test", { inviteStatus: "REGISTERED" });
  const ipC5 = await addCandidate(ipReq1, "info@vadodaravalves.test", { inviteStatus: "INVITED" });

  // Link 1: PREQUAL_CLEARED (cleared, awaiting award)
  const link1 = await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC1.id, requestId: reqIds[ipReq1], buyerOrgId: buyerOrg.id, state: "PREQUAL_CLEARED", stage: "PREQUAL", prequalScore: 82 },
  });
  const sub1 = await prisma.submission.create({ data: { linkId: link1.id, stage: "PREQUAL", status: "SUBMITTED", submittedAt: new Date(Date.now() - 5 * 86_400_000) } });
  await prisma.fieldValue.createMany({ data: [
    { submissionId: sub1.id, linkId: link1.id, fieldKey: "legalName", value: "Hosur Plating Solutions" },
    { submissionId: sub1.id, linkId: link1.id, fieldKey: "pan", value: "AAKCH4567I" },
    { submissionId: sub1.id, linkId: link1.id, fieldKey: "gstin", value: "33AAKCH4567I1Z5" },
    { submissionId: sub1.id, linkId: link1.id, fieldKey: "contactEmail", value: "sales@hosurplating.test" },
    { submissionId: sub1.id, linkId: link1.id, fieldKey: "city", value: "Hosur" },
    { submissionId: sub1.id, linkId: link1.id, fieldKey: "state", value: "Tamil Nadu" },
  ]});
  await prisma.verificationCheck.createMany({ data: [
    { linkId: link1.id, checkType: "PAN", status: "PASSED", matchScore: 95, ranAt: new Date(), detail: { reason: "Verified" } },
    { linkId: link1.id, checkType: "GST", status: "PASSED", matchScore: 92, ranAt: new Date(), detail: { reason: "Verified" } },
    { linkId: link1.id, checkType: "UDYAM", status: "NEEDS_REVIEW", matchScore: 72, ranAt: new Date(), detail: { reason: "Partial match" } },
  ]});

  // Link 2: CONTRACTS_IN_PROGRESS (full lifecycle, contracts + approvals)
  const link2 = await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC2.id, requestId: reqIds[ipReq1], buyerOrgId: buyerOrg.id, vendorUserId: userIds["ramesh@gujaratmetal.test"], vendorOrgId: vendorOrg1.id, state: "CONTRACTS_IN_PROGRESS", stage: "FULL", prequalScore: 88, awardedAt: new Date(Date.now() - 10 * 86_400_000) },
  });
  const sub2p = await prisma.submission.create({ data: { linkId: link2.id, stage: "PREQUAL", status: "SUBMITTED", submittedAt: new Date(Date.now() - 20 * 86_400_000) } });
  await prisma.fieldValue.createMany({ data: [
    { submissionId: sub2p.id, linkId: link2.id, fieldKey: "legalName", value: "Gujarat Metal Works" },
    { submissionId: sub2p.id, linkId: link2.id, fieldKey: "pan", value: "AAFCG3456D" },
    { submissionId: sub2p.id, linkId: link2.id, fieldKey: "gstin", value: "24AAFCG3456D1Z5" },
    { submissionId: sub2p.id, linkId: link2.id, fieldKey: "contactEmail", value: "orders@gujaratmetal.test" },
    { submissionId: sub2p.id, linkId: link2.id, fieldKey: "city", value: "Ahmedabad" },
    { submissionId: sub2p.id, linkId: link2.id, fieldKey: "state", value: "Gujarat" },
  ]});
  const sub2f = await prisma.submission.create({ data: { linkId: link2.id, stage: "FULL", status: "SUBMITTED", submittedAt: new Date(Date.now() - 7 * 86_400_000) } });
  await prisma.fieldValue.createMany({ data: [
    { submissionId: sub2f.id, linkId: link2.id, fieldKey: "bankAccountName", value: "Gujarat Metal Works Pvt Ltd" },
    { submissionId: sub2f.id, linkId: link2.id, fieldKey: "bankAccountNumber", value: "50100123456789" },
    { submissionId: sub2f.id, linkId: link2.id, fieldKey: "bankIfsc", value: "HDFC0001234" },
    { submissionId: sub2f.id, linkId: link2.id, fieldKey: "authorizedSignatory", value: "Ramesh Patel" },
    { submissionId: sub2f.id, linkId: link2.id, fieldKey: "signatoryDesignation", value: "Managing Director" },
    { submissionId: sub2f.id, linkId: link2.id, fieldKey: "annualTurnover", value: "320000000" },
  ]});
  await prisma.verificationCheck.createMany({ data: [
    { linkId: link2.id, checkType: "PAN", status: "PASSED", matchScore: 98, ranAt: new Date(), detail: { reason: "Verified" } },
    { linkId: link2.id, checkType: "GST", status: "PASSED", matchScore: 96, ranAt: new Date(), detail: { reason: "Verified" } },
    { linkId: link2.id, checkType: "UDYAM", status: "PASSED", matchScore: 90, ranAt: new Date(), detail: { reason: "Verified" } },
    { linkId: link2.id, checkType: "PENNY_DROP", status: "PASSED", matchScore: 100, ranAt: new Date(), detail: { reason: "Verified" } },
    { linkId: link2.id, checkType: "GST_FILINGS", status: "NEEDS_REVIEW", matchScore: 68, ranAt: new Date(), detail: { reason: "3 months partial" } },
  ]});
  const approvalStages = [
    { stage: "FINANCIAL_CRIME" as const, status: "APPROVED" as const },
    { stage: "COMPLIANCE" as const, status: "APPROVED" as const },
    { stage: "LEGAL" as const, status: "PENDING" as const },
    { stage: "IT_INFOSEC" as const, status: "APPROVED" as const },
    { stage: "TAX" as const, status: "PENDING" as const },
    { stage: "PROCUREMENT" as const, status: "APPROVED" as const },
    { stage: "DATA_PRIVACY" as const, status: "CHANGES_REQUESTED" as const },
    { stage: "BUSINESS_OWNER" as const, status: "PENDING" as const },
  ];
  for (const a of approvalStages) {
    const rt = await prisma.reviewTask.create({ data: { linkId: link2.id, stage: a.stage, status: a.status, slaHours: 96 } });
    if (a.status !== "PENDING") {
      await prisma.approvalDecision.create({
        data: { reviewTaskId: rt.id, linkId: link2.id, decision: a.status === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED", comment: a.status === "APPROVED" ? "Looks good" : "Need updated policy", decidedById: userIds["quality@meridian.test"] },
      });
    }
  }
  const contractDefs = [
    { contractType: "NDA" as const, state: "EXECUTED" as const },
    { contractType: "MSA" as const, state: "AWAITING_SIGNATURES" as const },
    { contractType: "QUALITY_AGREEMENT" as const, state: "AGREED" as const },
    { contractType: "SUPPLY_AGREEMENT" as const, state: "DRAFT_UPLOADED" as const },
    { contractType: "PRICING_AGREEMENT" as const, state: "DRAFT_PENDING" as const },
    { contractType: "DATA_PROCESSING" as const, state: "CHANGES_REQUESTED" as const },
  ];
  for (const ct of contractDefs) {
    await prisma.contract.create({ data: { linkId: link2.id, contractType: ct.contractType, state: ct.state } });
  }

  // Link 3: PREQUAL_IN_PROGRESS (vendor is filling form)
  await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC3.id, requestId: reqIds[ipReq1], buyerOrgId: buyerOrg.id, state: "PREQUAL_IN_PROGRESS", stage: "PREQUAL" },
  });

  // Link 4: PREQUAL_SUBMITTED (submitted, awaiting buyer review)
  const link4 = await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC4.id, requestId: reqIds[ipReq1], buyerOrgId: buyerOrg.id, state: "PREQUAL_SUBMITTED", stage: "PREQUAL" },
  });
  const sub4 = await prisma.submission.create({ data: { linkId: link4.id, stage: "PREQUAL", status: "SUBMITTED", submittedAt: new Date(Date.now() - 2 * 86_400_000) } });
  await prisma.fieldValue.createMany({ data: [
    { submissionId: sub4.id, linkId: link4.id, fieldKey: "legalName", value: "Bharat Forge Ltd" },
    { submissionId: sub4.id, linkId: link4.id, fieldKey: "pan", value: "AABCB1234A" },
    { submissionId: sub4.id, linkId: link4.id, fieldKey: "gstin", value: "27AABCB1234A1Z5" },
    { submissionId: sub4.id, linkId: link4.id, fieldKey: "contactEmail", value: "procurement@bharatforge.test" },
    { submissionId: sub4.id, linkId: link4.id, fieldKey: "city", value: "Pune" },
    { submissionId: sub4.id, linkId: link4.id, fieldKey: "state", value: "Maharashtra" },
  ]});

  // Link 5: INVITED (not yet started)
  await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC5.id, requestId: reqIds[ipReq1], buyerOrgId: buyerOrg.id, state: "INVITED", stage: "PREQUAL" },
  });

  // ── IN_PROGRESS requirement 2: "Rubber engine mounts" ─────────────────

  const ipReq2 = "Rubber engine mounts — EV platform";
  const ipC6 = await addCandidate(ipReq2, "orders@tiruppurrubber.test", { inviteStatus: "REGISTERED" });
  const ipC7 = await addCandidate(ipReq2, "procurement@noidaelec.test", { inviteStatus: "REGISTERED" });
  const ipC8 = await addCandidate(ipReq2, "info@nashikforgings.test", { inviteStatus: "REGISTERED" });

  // Link 6: AWARDED (vendor needs to start full pack)
  const link6 = await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC6.id, requestId: reqIds[ipReq2], buyerOrgId: buyerOrg.id, state: "AWARDED", stage: "PREQUAL", prequalScore: 85, awardedAt: new Date(Date.now() - 3 * 86_400_000) },
  });

  // Link 7: FULL_IN_PROGRESS (vendor filling full pack)
  const link7 = await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC7.id, requestId: reqIds[ipReq2], buyerOrgId: buyerOrg.id, vendorUserId: userIds["harpreet@ludhianasteel.test"], vendorOrgId: vendorOrg2.id, state: "FULL_IN_PROGRESS", stage: "FULL", prequalScore: 79, awardedAt: new Date(Date.now() - 5 * 86_400_000) },
  });

  // Link 8: REJECTED
  await prisma.vendorBuyerLink.create({
    data: { candidateId: ipC8.id, requestId: reqIds[ipReq2], buyerOrgId: buyerOrg.id, state: "REJECTED", stage: "PREQUAL", prequalScore: 45 },
  });

  // ── CLOSED requirement: "Die-cast gear housing" ───────────────────────

  const closedReq = "Die-cast gear housing (2024 carry-over)";
  const clC1 = await addCandidate(closedReq, "sales@sundaramcast.test", { inviteStatus: "REGISTERED" });
  const clC2 = await addCandidate(closedReq, "info@kolhapurcast.test", { inviteStatus: "REGISTERED" });

  // Link 9: ONBOARDED (complete lifecycle)
  const link9 = await prisma.vendorBuyerLink.create({
    data: {
      candidateId: clC1.id, requestId: reqIds[closedReq], buyerOrgId: buyerOrg.id,
      vendorUserId: userIds["harpreet@ludhianasteel.test"], vendorOrgId: vendorOrg2.id,
      state: "ONBOARDED", stage: "FULL", prequalScore: 91,
      awardedAt: new Date(Date.now() - 30 * 86_400_000),
      onboardedAt: new Date(Date.now() - 3 * 86_400_000),
      erpVendorCode: "0001A3B2C1",
    },
  });
  for (const stage of ["FINANCIAL_CRIME", "COMPLIANCE", "LEGAL", "IT_INFOSEC", "TAX", "PROCUREMENT", "DATA_PRIVACY", "BUSINESS_OWNER"] as const) {
    const rt = await prisma.reviewTask.create({ data: { linkId: link9.id, stage, status: "APPROVED", slaHours: 96 } });
    await prisma.approvalDecision.create({ data: { reviewTaskId: rt.id, linkId: link9.id, decision: "APPROVED", comment: "Approved", decidedById: userIds["quality@meridian.test"] } });
  }
  for (const ct of ["NDA", "MSA", "QUALITY_AGREEMENT", "SUPPLY_AGREEMENT", "PRICING_AGREEMENT", "DATA_PROCESSING"] as const) {
    await prisma.contract.create({ data: { linkId: link9.id, contractType: ct, state: "EXECUTED", executedAt: new Date(Date.now() - 5 * 86_400_000) } });
  }

  // Link 10: ERP_FAILED (sync failed, can retry)
  const link10 = await prisma.vendorBuyerLink.create({
    data: {
      candidateId: clC2.id, requestId: reqIds[closedReq], buyerOrgId: buyerOrg.id,
      state: "ERP_FAILED", stage: "FULL", prequalScore: 78,
      awardedAt: new Date(Date.now() - 25 * 86_400_000),
    },
  });
  for (const stage of ["FINANCIAL_CRIME", "COMPLIANCE", "LEGAL", "IT_INFOSEC", "TAX", "PROCUREMENT", "DATA_PRIVACY", "BUSINESS_OWNER"] as const) {
    const rt = await prisma.reviewTask.create({ data: { linkId: link10.id, stage, status: "APPROVED", slaHours: 96 } });
    await prisma.approvalDecision.create({ data: { reviewTaskId: rt.id, linkId: link10.id, decision: "APPROVED", comment: "Approved", decidedById: userIds["finance@meridian.test"] } });
  }
  for (const ct of ["NDA", "MSA", "QUALITY_AGREEMENT", "SUPPLY_AGREEMENT", "PRICING_AGREEMENT", "DATA_PROCESSING"] as const) {
    await prisma.contract.create({ data: { linkId: link10.id, contractType: ct, state: "EXECUTED", executedAt: new Date(Date.now() - 8 * 86_400_000) } });
  }

  // ── SLA Rules ─────────────────────────────────────────────────────────

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

  // ── Print summary ─────────────────────────────────────────────────────

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.directoryVendor.count(),
    prisma.vendorRequest.count(),
    prisma.requestCandidate.count(),
    prisma.vendorBuyerLink.count(),
    prisma.reviewTask.count(),
    prisma.contract.count(),
    prisma.submission.count(),
    prisma.verificationCheck.count(),
  ]);

  console.log("Seed complete.");
  console.log(`  Users: ${counts[0]} (${buyerUsers.length} buyers + ${vendorUsers.length} vendors)`);
  console.log(`  Directory vendors: ${counts[1]}`);
  console.log(`  Requirements: ${counts[2]}`);
  console.log(`  Candidates: ${counts[3]}`);
  console.log(`  VendorBuyerLinks: ${counts[4]}`);
  console.log(`  ReviewTasks: ${counts[5]}`);
  console.log(`  Contracts: ${counts[6]}`);
  console.log(`  Submissions: ${counts[7]}`);
  console.log(`  VerificationChecks: ${counts[8]}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
