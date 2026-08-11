import { prisma } from "@vendor-management/db";

export async function generateRequestNumber(): Promise<string> {
  const latest = await prisma.vendorRequest.findFirst({
    orderBy: { requestNumber: "desc" },
    select: { requestNumber: true },
  });

  if (!latest) return "VR-1001";

  const seq = parseInt(latest.requestNumber.replace("VR-", ""), 10);
  return `VR-${seq + 1}`;
}
