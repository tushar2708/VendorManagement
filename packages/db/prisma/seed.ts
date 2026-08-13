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

  // ── Candidates for requirements with CANDIDATES_SELECTED or later stages ──

  // Requirement "Forged steering knuckles" (CANDIDATES_SELECTED) — 3 candidates, no invites
  const reqCS = await prisma.vendorRequest.findFirst({ where: { title: "Forged steering knuckles" } });
  if (reqCS) {
    const dvBharat = createdVendors["procurement@bharatforge.test"];
    const dvSundaram = createdVendors["sales@sundaramcast.test"];
    await prisma.requestCandidate.createMany({
      data: [
        { requestId: reqCS.id, vendorId: dvBharat, source: "DIRECTORY", legalName: "Bharat Forge Ltd", contactEmail: "procurement@bharatforge.test", pan: "AABCB1234A", gstin: "27AABCB1234A1Z5", city: "Pune", state: "Maharashtra", buyerOrgId: buyerOrg.id },
        { requestId: reqCS.id, vendorId: dvSundaram, source: "DIRECTORY", legalName: "Sundaram Castings", contactEmail: "sales@sundaramcast.test", pan: "AADCS5678B", gstin: "33AADCS5678B1Z5", city: "Chennai", state: "Tamil Nadu", buyerOrgId: buyerOrg.id },
        { requestId: reqCS.id, vendorId: createdVendors["info@precisionauto.test"], source: "MANUAL", legalName: "Precision Auto Components", contactEmail: "info@precisionauto.test", pan: "AAECP9012C", city: "Gurgaon", state: "Haryana", buyerOrgId: buyerOrg.id },
      ],
    });
  }

  // Requirement "Sheet-metal brackets & mounts" (IN_PROGRESS) — 2 candidates with links
  const reqIP = await prisma.vendorRequest.findFirst({ where: { title: "Sheet-metal brackets & mounts" } });
  if (reqIP) {
    const dvGujarat = createdVendors["orders@gujaratmetal.test"];
    const dvLudhiana = createdVendors["sales@ludhianasteel.test"];

    const cand1 = await prisma.requestCandidate.create({
      data: { requestId: reqIP.id, vendorId: dvGujarat, source: "DIRECTORY", legalName: "Gujarat Metal Works", contactEmail: "orders@gujaratmetal.test", pan: "AAFCG3456D", gstin: "24AAFCG3456D1Z5", city: "Ahmedabad", state: "Gujarat", inviteStatus: "OPENED", buyerOrgId: buyerOrg.id },
    });
    const cand2 = await prisma.requestCandidate.create({
      data: { requestId: reqIP.id, vendorId: dvLudhiana, source: "DIRECTORY", legalName: "Ludhiana Steel Fabricators", contactEmail: "sales@ludhianasteel.test", pan: "AAGCL7890E", gstin: "03AAGCL7890E1Z5", city: "Ludhiana", state: "Punjab", inviteStatus: "OPENED", buyerOrgId: buyerOrg.id },
    });

    // Link 1: Gujarat Metal — PREQUAL_CLEARED (cleared prequal, awaiting award)
    const link1 = await prisma.vendorBuyerLink.create({
      data: {
        candidateId: cand1.id, requestId: reqIP.id, buyerOrgId: buyerOrg.id,
        state: "PREQUAL_CLEARED", stage: "PREQUAL", prequalScore: 82,
      },
    });
    await prisma.linkEvent.createMany({
      data: [
        { linkId: link1.id, toState: "INVITED", actorType: "SYSTEM", side: "SYSTEM" },
        { linkId: link1.id, fromState: "INVITED", toState: "PREQUAL_IN_PROGRESS", actorType: "VENDOR", side: "VENDOR" },
        { linkId: link1.id, fromState: "PREQUAL_IN_PROGRESS", toState: "PREQUAL_SUBMITTED", actorType: "VENDOR", side: "VENDOR" },
        { linkId: link1.id, fromState: "PREQUAL_SUBMITTED", toState: "PREQUAL_UNDER_REVIEW", actorType: "BUYER", side: "BUYER" },
        { linkId: link1.id, fromState: "PREQUAL_UNDER_REVIEW", toState: "PREQUAL_CLEARED", actorType: "BUYER", side: "BUYER", note: "Pre-qual cleared with score 82" },
      ],
    });
    const sub1 = await prisma.submission.create({ data: { linkId: link1.id, stage: "PREQUAL", status: "SUBMITTED", submittedAt: new Date() } });
    await prisma.fieldValue.createMany({
      data: [
        { submissionId: sub1.id, linkId: link1.id, fieldKey: "legalName", value: "Gujarat Metal Works" },
        { submissionId: sub1.id, linkId: link1.id, fieldKey: "pan", value: "AAFCG3456D" },
        { submissionId: sub1.id, linkId: link1.id, fieldKey: "gstin", value: "24AAFCG3456D1Z5" },
        { submissionId: sub1.id, linkId: link1.id, fieldKey: "contactEmail", value: "orders@gujaratmetal.test" },
        { submissionId: sub1.id, linkId: link1.id, fieldKey: "city", value: "Ahmedabad" },
        { submissionId: sub1.id, linkId: link1.id, fieldKey: "state", value: "Gujarat" },
      ],
    });
    await prisma.verificationCheck.createMany({
      data: [
        { linkId: link1.id, checkType: "PAN", status: "PASSED", matchScore: 95, ranAt: new Date(), detail: { reason: "Verified" } },
        { linkId: link1.id, checkType: "GST", status: "PASSED", matchScore: 92, ranAt: new Date(), detail: { reason: "Verified" } },
        { linkId: link1.id, checkType: "UDYAM", status: "NEEDS_REVIEW", matchScore: 72, ranAt: new Date(), detail: { reason: "Partial match" } },
      ],
    });

    // Link 2: Ludhiana Steel — CONTRACTS_IN_PROGRESS (awarded, full pack done, contracts + approvals in progress)
    const link2 = await prisma.vendorBuyerLink.create({
      data: {
        candidateId: cand2.id, requestId: reqIP.id, buyerOrgId: buyerOrg.id,
        state: "CONTRACTS_IN_PROGRESS", stage: "FULL", prequalScore: 88,
        awardedAt: new Date(Date.now() - 7 * 86_400_000),
      },
    });
    await prisma.linkEvent.createMany({
      data: [
        { linkId: link2.id, toState: "INVITED", actorType: "SYSTEM", side: "SYSTEM" },
        { linkId: link2.id, fromState: "INVITED", toState: "PREQUAL_IN_PROGRESS", actorType: "VENDOR", side: "VENDOR" },
        { linkId: link2.id, fromState: "PREQUAL_IN_PROGRESS", toState: "PREQUAL_SUBMITTED", actorType: "VENDOR", side: "VENDOR" },
        { linkId: link2.id, fromState: "PREQUAL_SUBMITTED", toState: "PREQUAL_UNDER_REVIEW", actorType: "BUYER", side: "BUYER" },
        { linkId: link2.id, fromState: "PREQUAL_UNDER_REVIEW", toState: "PREQUAL_CLEARED", actorType: "BUYER", side: "BUYER" },
        { linkId: link2.id, fromState: "PREQUAL_CLEARED", toState: "AWARDED", actorType: "BUYER", side: "BUYER" },
        { linkId: link2.id, fromState: "AWARDED", toState: "FULL_IN_PROGRESS", actorType: "VENDOR", side: "VENDOR" },
        { linkId: link2.id, fromState: "FULL_IN_PROGRESS", toState: "FULL_SUBMITTED", actorType: "VENDOR", side: "VENDOR" },
        { linkId: link2.id, fromState: "FULL_SUBMITTED", toState: "FULL_UNDER_REVIEW", actorType: "BUYER", side: "BUYER" },
        { linkId: link2.id, fromState: "FULL_UNDER_REVIEW", toState: "CONTRACTS_IN_PROGRESS", actorType: "BUYER", side: "BUYER" },
      ],
    });

    // Submissions for link2
    const sub2prequal = await prisma.submission.create({ data: { linkId: link2.id, stage: "PREQUAL", status: "SUBMITTED", submittedAt: new Date(Date.now() - 14 * 86_400_000) } });
    await prisma.fieldValue.createMany({
      data: [
        { submissionId: sub2prequal.id, linkId: link2.id, fieldKey: "legalName", value: "Ludhiana Steel Fabricators" },
        { submissionId: sub2prequal.id, linkId: link2.id, fieldKey: "pan", value: "AAGCL7890E" },
        { submissionId: sub2prequal.id, linkId: link2.id, fieldKey: "gstin", value: "03AAGCL7890E1Z5" },
        { submissionId: sub2prequal.id, linkId: link2.id, fieldKey: "contactEmail", value: "sales@ludhianasteel.test" },
        { submissionId: sub2prequal.id, linkId: link2.id, fieldKey: "city", value: "Ludhiana" },
        { submissionId: sub2prequal.id, linkId: link2.id, fieldKey: "state", value: "Punjab" },
      ],
    });
    const sub2full = await prisma.submission.create({ data: { linkId: link2.id, stage: "FULL", status: "SUBMITTED", submittedAt: new Date(Date.now() - 5 * 86_400_000) } });
    await prisma.fieldValue.createMany({
      data: [
        { submissionId: sub2full.id, linkId: link2.id, fieldKey: "bankAccountName", value: "Ludhiana Steel Fabricators Pvt Ltd" },
        { submissionId: sub2full.id, linkId: link2.id, fieldKey: "bankAccountNumber", value: "50100123456789" },
        { submissionId: sub2full.id, linkId: link2.id, fieldKey: "bankIfsc", value: "HDFC0001234" },
        { submissionId: sub2full.id, linkId: link2.id, fieldKey: "authorizedSignatory", value: "Harpreet Singh" },
        { submissionId: sub2full.id, linkId: link2.id, fieldKey: "signatoryDesignation", value: "Managing Director" },
        { submissionId: sub2full.id, linkId: link2.id, fieldKey: "annualTurnover", value: "450000000" },
      ],
    });

    // Verification checks for link2
    await prisma.verificationCheck.createMany({
      data: [
        { linkId: link2.id, checkType: "PAN", status: "PASSED", matchScore: 98, ranAt: new Date(), detail: { reason: "Verified" } },
        { linkId: link2.id, checkType: "GST", status: "PASSED", matchScore: 96, ranAt: new Date(), detail: { reason: "Verified" } },
        { linkId: link2.id, checkType: "UDYAM", status: "PASSED", matchScore: 90, ranAt: new Date(), detail: { reason: "Verified" } },
        { linkId: link2.id, checkType: "PENNY_DROP", status: "PASSED", matchScore: 100, ranAt: new Date(), detail: { reason: "Verified" } },
        { linkId: link2.id, checkType: "GST_FILINGS", status: "NEEDS_REVIEW", matchScore: 68, ranAt: new Date(), detail: { reason: "Partial match" } },
      ],
    });

    // Review tasks for link2 (8 stages — mix of statuses)
    const approvalStages = [
      { stage: "FINANCIAL_CRIME" as const, status: "APPROVED" as const, slaHours: 72 },
      { stage: "COMPLIANCE" as const, status: "APPROVED" as const, slaHours: 120 },
      { stage: "LEGAL" as const, status: "PENDING" as const, slaHours: 168 },
      { stage: "IT_INFOSEC" as const, status: "APPROVED" as const, slaHours: 96 },
      { stage: "TAX" as const, status: "PENDING" as const, slaHours: 72 },
      { stage: "PROCUREMENT" as const, status: "APPROVED" as const, slaHours: 120 },
      { stage: "DATA_PRIVACY" as const, status: "CHANGES_REQUESTED" as const, slaHours: 96 },
      { stage: "BUSINESS_OWNER" as const, status: "PENDING" as const, slaHours: 120 },
    ];
    for (const a of approvalStages) {
      const rt = await prisma.reviewTask.create({
        data: { linkId: link2.id, stage: a.stage, status: a.status, slaHours: a.slaHours },
      });
      if (a.status === "APPROVED") {
        await prisma.approvalDecision.create({
          data: { reviewTaskId: rt.id, linkId: link2.id, decision: "APPROVED", comment: "Looks good", decidedById: createdUsers["quality@meridian.test"] },
        });
      }
      if (a.status === "CHANGES_REQUESTED") {
        await prisma.approvalDecision.create({
          data: { reviewTaskId: rt.id, linkId: link2.id, decision: "CHANGES_REQUESTED", comment: "Need updated data privacy policy", decidedById: createdUsers["legal@meridian.test"] },
        });
      }
    }

    // Contracts for link2 (6 types — mix of states)
    const contractTypes = [
      { contractType: "NDA" as const, state: "EXECUTED" as const },
      { contractType: "MSA" as const, state: "AWAITING_SIGNATURES" as const },
      { contractType: "QUALITY_AGREEMENT" as const, state: "AGREED" as const },
      { contractType: "SUPPLY_AGREEMENT" as const, state: "DRAFT_UPLOADED" as const },
      { contractType: "PRICING_AGREEMENT" as const, state: "DRAFT_PENDING" as const },
      { contractType: "DATA_PROCESSING" as const, state: "CHANGES_REQUESTED" as const },
    ];
    for (const ct of contractTypes) {
      await prisma.contract.create({
        data: { linkId: link2.id, contractType: ct.contractType, state: ct.state },
      });
    }
  }

  // Requirement "Gravity-cast brake calipers" (CLOSED) — 1 candidate, ONBOARDED
  const reqClosed = await prisma.vendorRequest.findFirst({ where: { title: { startsWith: "Gravity-cast" } } });
  if (reqClosed) {
    const dvCbe = createdVendors["info@cbetools.test"];
    const candClosed = await prisma.requestCandidate.create({
      data: { requestId: reqClosed.id, vendorId: dvCbe, source: "DIRECTORY", legalName: "Coimbatore Precision Tools", contactEmail: "info@cbetools.test", pan: "AAHCC2345F", gstin: "33AAHCC2345F1Z5", city: "Coimbatore", state: "Tamil Nadu", inviteStatus: "REGISTERED", buyerOrgId: buyerOrg.id },
    });
    const linkClosed = await prisma.vendorBuyerLink.create({
      data: {
        candidateId: candClosed.id, requestId: reqClosed.id, buyerOrgId: buyerOrg.id,
        state: "ONBOARDED", stage: "FULL", prequalScore: 91,
        awardedAt: new Date(Date.now() - 30 * 86_400_000),
        onboardedAt: new Date(Date.now() - 3 * 86_400_000),
        erpVendorCode: "0001A3B2C1",
      },
    });
    await prisma.linkEvent.createMany({
      data: [
        { linkId: linkClosed.id, toState: "INVITED", actorType: "SYSTEM", side: "SYSTEM" },
        { linkId: linkClosed.id, fromState: "INVITED", toState: "PREQUAL_IN_PROGRESS", actorType: "VENDOR", side: "VENDOR" },
        { linkId: linkClosed.id, fromState: "PREQUAL_IN_PROGRESS", toState: "PREQUAL_SUBMITTED", actorType: "VENDOR", side: "VENDOR" },
        { linkId: linkClosed.id, fromState: "PREQUAL_SUBMITTED", toState: "PREQUAL_UNDER_REVIEW", actorType: "BUYER", side: "BUYER" },
        { linkId: linkClosed.id, fromState: "PREQUAL_UNDER_REVIEW", toState: "PREQUAL_CLEARED", actorType: "BUYER", side: "BUYER" },
        { linkId: linkClosed.id, fromState: "PREQUAL_CLEARED", toState: "AWARDED", actorType: "BUYER", side: "BUYER" },
        { linkId: linkClosed.id, fromState: "AWARDED", toState: "FULL_IN_PROGRESS", actorType: "VENDOR", side: "VENDOR" },
        { linkId: linkClosed.id, fromState: "FULL_IN_PROGRESS", toState: "FULL_SUBMITTED", actorType: "VENDOR", side: "VENDOR" },
        { linkId: linkClosed.id, fromState: "FULL_SUBMITTED", toState: "FULL_UNDER_REVIEW", actorType: "BUYER", side: "BUYER" },
        { linkId: linkClosed.id, fromState: "FULL_UNDER_REVIEW", toState: "CONTRACTS_IN_PROGRESS", actorType: "BUYER", side: "BUYER" },
        { linkId: linkClosed.id, fromState: "CONTRACTS_IN_PROGRESS", toState: "APPROVED", actorType: "SYSTEM", side: "SYSTEM", note: "Join gate passed" },
        { linkId: linkClosed.id, fromState: "APPROVED", toState: "ERP_SYNCING", actorType: "BUYER", side: "BUYER" },
        { linkId: linkClosed.id, fromState: "ERP_SYNCING", toState: "ONBOARDED", actorType: "SYSTEM", side: "SYSTEM", note: "ERP sync complete" },
      ],
    });

    // All 8 review tasks APPROVED for closed link
    for (const stage of ["FINANCIAL_CRIME", "COMPLIANCE", "LEGAL", "IT_INFOSEC", "TAX", "PROCUREMENT", "DATA_PRIVACY", "BUSINESS_OWNER"] as const) {
      const rt = await prisma.reviewTask.create({
        data: { linkId: linkClosed.id, stage, status: "APPROVED", slaHours: 96 },
      });
      await prisma.approvalDecision.create({
        data: { reviewTaskId: rt.id, linkId: linkClosed.id, decision: "APPROVED", comment: "Approved", decidedById: createdUsers["quality@meridian.test"] },
      });
    }

    // All 6 contracts EXECUTED for closed link
    for (const contractType of ["NDA", "MSA", "QUALITY_AGREEMENT", "SUPPLY_AGREEMENT", "PRICING_AGREEMENT", "DATA_PROCESSING"] as const) {
      await prisma.contract.create({
        data: { linkId: linkClosed.id, contractType, state: "EXECUTED", executedAt: new Date(Date.now() - 5 * 86_400_000) },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`  BuyerOrg: ${buyerOrg.id}`);
  console.log(`  Users: ${Object.keys(createdUsers).length}`);
  console.log(`  Directory vendors: ${Object.keys(createdVendors).length}`);
  console.log(`  Requirements: ${requirements.length}`);
  console.log(`  SLA rules: ${slaRules.length}`);
  const linkCount = await prisma.vendorBuyerLink.count();
  const taskCount = await prisma.reviewTask.count();
  const contractCount = await prisma.contract.count();
  console.log(`  VendorBuyerLinks: ${linkCount}`);
  console.log(`  ReviewTasks: ${taskCount}`);
  console.log(`  Contracts: ${contractCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
