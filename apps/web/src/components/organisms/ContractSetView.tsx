import { useState, useEffect } from "react";
import type { ContractDTO } from "@vendor-management/shared";
import { contractSetFor } from "@vendor-management/shared";
import { Card, Button, cn } from "../ui.js";
import { ContractsPanel } from "./ContractsPanel.js";
import { Badge } from "../atoms/Badge.js";

interface ContractSetViewProps {
  readonly vendorId: string;
  readonly side: "BUYER" | "VENDOR";
  readonly onRefresh: () => void;
}

export function ContractSetView({
  vendorId,
  side,
  onRefresh,
}: ContractSetViewProps): React.ReactElement {
  const [contracts, setContracts] = useState<ContractDTO[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractDTO[]>([]);

  const allCleared = filteredContracts.length > 0 && filteredContracts.every(
    (c) => c.state === "EXECUTED"
  );

  useEffect(() => {
    setFilteredContracts(contracts);
  }, [contracts]);

  return (
    <div className="space-y-6">
      <ContractsPanel
        contracts={filteredContracts}
        mode={side}
        onRefresh={onRefresh}
      />

      {side === "BUYER" && (
        <Card className={cn(
          "p-6 border-t-4",
          allCleared ? "bg-emerald-50/40 border-t-emerald-500" : "bg-slate-50/40 border-t-slate-300"
        )}>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Contract execution status
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {filteredContracts.length === 0
                  ? "No contracts in this set"
                  : `${filteredContracts.filter(c => c.state === "EXECUTED").length} of ${filteredContracts.length} contracts executed`}
              </p>
            </div>

            {filteredContracts.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {filteredContracts.map((contract) => (
                    <Badge
                      key={contract.id}
                      variant={
                        contract.state === "EXECUTED"
                          ? "success"
                          : contract.state === "DRAFT_PENDING"
                            ? "neutral"
                            : "info"
                      }
                    >
                      {contract.contractType}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {allCleared && (
              <Button className="w-full md:w-auto">
                Proceed to finalization
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
