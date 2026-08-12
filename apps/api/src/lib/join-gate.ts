import { prisma } from "@vendor-management/db";

export async function checkJoinGate(linkId: string): Promise<boolean> {
  const [totalTasks, approvedTasks, totalContracts, executedContracts] = await Promise.all([
    prisma.reviewTask.count({ where: { linkId } }),
    prisma.reviewTask.count({ where: { linkId, status: "APPROVED" } }),
    prisma.contract.count({ where: { linkId } }),
    prisma.contract.count({ where: { linkId, state: "EXECUTED" } }),
  ]);

  return totalTasks > 0 && totalTasks === approvedTasks &&
         totalContracts > 0 && totalContracts === executedContracts;
}
