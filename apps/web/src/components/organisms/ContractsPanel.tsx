import { useState } from "react";
import type { ContractDTO } from "@vendor-management/shared";
import {
  CONTRACT_TYPE_LABEL,
  CONTRACT_STATE_LABEL,
  VENDOR_TURN_CONTRACT_STATES,
} from "@vendor-management/shared";
import {
  uploadDraft,
  uploadRevision,
  buyerSign,
  vendorRequestChanges,
  vendorAgree,
  vendorSign,
} from "../../lib/contracts-api.js";
import { fileUrl } from "../../lib/files-api.js";
import { Badge } from "../atoms/Badge.js";
import { Button, Card } from "../ui.js";

interface ContractsPanelProps {
  contracts: ContractDTO[];
  mode: "BUYER" | "VENDOR";
  onRefresh: () => void;
}

export function ContractsPanel({
  contracts,
  mode,
  onRefresh,
}: ContractsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [requestChangesId, setRequestChangesId] = useState<string | null>(null);
  const [requestChangesText, setRequestChangesText] = useState("");

  const handleFileUpload = async (
    contractId: string,
    file: File,
    action: "draft" | "revision" | "buyer-signed" | "vendor-signed"
  ) => {
    setLoading(contractId);
    try {
      if (action === "draft") {
        await uploadDraft(contractId, file);
      } else if (action === "revision") {
        await uploadRevision(contractId, file);
      } else if (action === "buyer-signed") {
        await buyerSign(contractId, file);
      } else if (action === "vendor-signed") {
        await vendorSign(contractId, file);
      }
      onRefresh();
    } finally {
      setLoading(null);
    }
  };

  const handleRequestChanges = async (contractId: string) => {
    setLoading(contractId);
    try {
      await vendorRequestChanges(contractId, requestChangesText);
      setRequestChangesId(null);
      setRequestChangesText("");
      onRefresh();
    } finally {
      setLoading(null);
    }
  };

  const handleVendorAgree = async (contractId: string) => {
    setLoading(contractId);
    try {
      await vendorAgree(contractId);
      onRefresh();
    } finally {
      setLoading(null);
    }
  };

  if (contracts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">No contracts yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <Card key={contract.id} className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {CONTRACT_TYPE_LABEL[contract.contractType] || contract.contractType}
                </span>
                <Badge variant="info">
                  {CONTRACT_STATE_LABEL[contract.state] || contract.state}
                </Badge>
              </div>
            </div>

            {/* Current version download */}
            {contract.currentVersionId && (() => {
              const currentVersion = contract.versions.find(v => v.id === contract.currentVersionId);
              return currentVersion ? (
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl(currentVersion.fileBlobId)}
                    download
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Download Current Version
                  </a>
                </div>
              ) : null;
            })()}

            {/* Comments list */}
            {contract.comments && contract.comments.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold text-gray-600">Comments</p>
                {contract.comments.map((comment, idx) => (
                  <div key={idx} className="text-xs text-gray-600">
                    <p className="font-medium">{comment.authorSide}</p>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4">
              {mode === "BUYER" && (
                <div className="space-y-2">
                  {contract.state === "DRAFT_PENDING" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Upload Draft
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file) {
                            handleFileUpload(contract.id, file, "draft");
                          }
                        }}
                        disabled={loading === contract.id}
                        className="text-sm"
                      />
                    </div>
                  )}

                  {contract.state === "CHANGES_REQUESTED" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Upload Revision
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file) {
                            handleFileUpload(contract.id, file, "revision");
                          }
                        }}
                        disabled={loading === contract.id}
                        className="text-sm"
                      />
                    </div>
                  )}

                  {(contract.state === "AWAITING_SIGNATURES" ||
                    contract.state === "PARTIALLY_EXECUTED") && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Upload Buyer-Signed
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file) {
                            handleFileUpload(
                              contract.id,
                              file,
                              "buyer-signed"
                            );
                          }
                        }}
                        disabled={loading === contract.id}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {mode === "VENDOR" && (
                <div className="space-y-3">
                  {VENDOR_TURN_CONTRACT_STATES.includes(contract.state as any) && (
                    <>
                      {requestChangesId === contract.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={requestChangesText}
                            onChange={(e) => setRequestChangesText(e.target.value)}
                            placeholder="Describe requested changes"
                            className="w-full text-xs border rounded px-2 py-2"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleRequestChanges(contract.id)
                              }
                              disabled={loading === contract.id}
                            >
                              Send Request
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setRequestChangesId(null);
                                setRequestChangesText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setRequestChangesId(contract.id)}
                        >
                          Request Changes
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleVendorAgree(contract.id)}
                        disabled={loading === contract.id}
                      >
                        Agree
                      </Button>
                    </>
                  )}

                  {(contract.state === "AWAITING_SIGNATURES" || contract.state === "PARTIALLY_EXECUTED") && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Upload Signed
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file) {
                            handleFileUpload(
                              contract.id,
                              file,
                              "vendor-signed"
                            );
                          }
                        }}
                        disabled={loading === contract.id}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
