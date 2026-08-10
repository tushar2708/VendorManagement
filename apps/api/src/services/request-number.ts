import { prisma } from "@vendor-management/db";

export async function generateRequestNumber(): Promise<string> {
  const latest = await prisma.vendorRequest.findFirst({
    orderBy: { createdAt: "desc" },
    select: { requestNumber: true },
  });

  if (!latest) return "VR-1001";

  const currentNumber = parseInt(latest.requestNumber.replace("VR-", ""), 10);
  return `VR-${currentNumber + 1}`;
}
