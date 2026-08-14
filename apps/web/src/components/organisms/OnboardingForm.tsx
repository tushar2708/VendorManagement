import { useState, useEffect, useCallback, useRef } from "react";
import { checklistFor } from "@vendor-management/shared";
import type { FieldDef, DocItemDef } from "@vendor-management/shared";
import {
  saveFields,
  attachDocument,
  deleteDocument,
  submitLink,
} from "../../lib/links-api.js";
import { uploadFile } from "../../lib/files-api.js";
import { fileUrl } from "../../lib/files-api.js";
import { Button, Card } from "../ui.js";
import { track } from "../../lib/analytics.js";

interface OnboardingFormProps {
  linkId: string;
  stage: "PREQUAL" | "FULL";
  processCategories: string[];
  fields: Record<string, string | null>;
  documents: Array<{
    id: string;
    checklistItemKey: string;
    fileName: string;
    fileBlobId: string;
    status: string;
  }>;
  onRefresh: () => void;
}

const AUTOSAVE_DELAY = 700;

export function OnboardingForm({
  linkId,
  stage,
  processCategories,
  fields: initialFields,
  documents: initialDocuments,
  onRefresh,
}: OnboardingFormProps) {
  const [fields, setFields] = useState<Record<string, string | null>>(
    initialFields
  );
  const [documents, setDocuments] = useState(initialDocuments);
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([]);
  const [docDefs, setDocDefs] = useState<DocItemDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const hasChanged = useRef(false);

  // Load checklist on mount or when stage/categories change
  useEffect(() => {
    const checklist = checklistFor(stage, processCategories);
    setFieldDefs(checklist.fields || []);
    setDocDefs(checklist.documents || []);
  }, [stage, processCategories]);

  // Sync local state when props change
  useEffect(() => {
    setFields(initialFields);
  }, [JSON.stringify(initialFields)]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [JSON.stringify(initialDocuments)]);

  // Autosave fields with debounce
  useEffect(() => {
    if (saveTimer) clearTimeout(saveTimer);

    if (!hasChanged.current) return;

    const timer = setTimeout(async () => {
      try {
        await saveFields(linkId, fields);
      } catch (error) {
        console.error("Failed to autosave fields:", error);
      }
    }, AUTOSAVE_DELAY);

    setSaveTimer(timer);

    return () => clearTimeout(timer);
  }, [fields, linkId]);

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      hasChanged.current = true;
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleDocumentUpload = async (
    checklistItemKey: string,
    file: File
  ) => {
    setLoading(true);
    try {
      const uploadedFile = await uploadFile(file, 'document');
      await attachDocument(linkId, {
        checklistItemKey,
        fileBlobId: uploadedFile.fileBlobId,
        fileName: uploadedFile.fileName,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeBytes,
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    setLoading(true);
    try {
      await deleteDocument(linkId, documentId);
      setDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
    } catch (error) {
      console.error("Failed to delete document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentReplace = async (
    documentId: string,
    checklistItemKey: string,
    file: File
  ) => {
    setLoading(true);
    try {
      await deleteDocument(linkId, documentId);
      const uploadedFile = await uploadFile(file, 'document');
      await attachDocument(linkId, {
        checklistItemKey,
        fileBlobId: uploadedFile.fileBlobId,
        fileName: uploadedFile.fileName,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeBytes,
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to replace document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitLink(linkId);
      track("onboarding_form_submitted", {
        link_id: linkId,
        stage,
        field_count: Object.keys(fields).length,
        doc_count: documents.length,
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fields Section */}
      {fieldDefs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <div className="space-y-4">
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {fieldDef.label}
                </label>
                {fieldDef.type === "text" && (
                  <input
                    type="text"
                    value={fields[fieldDef.key] || ""}
                    onChange={(e) =>
                      handleFieldChange(fieldDef.key, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder={fieldDef.label}
                  />
                )}
                {fieldDef.type === "email" && (
                  <input
                    type="email"
                    value={fields[fieldDef.key] || ""}
                    onChange={(e) =>
                      handleFieldChange(fieldDef.key, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder={fieldDef.label}
                  />
                )}
                {fieldDef.required && (
                  <p className="text-xs text-gray-500 mt-1">Required</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents Section */}
      {docDefs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          <div className="space-y-4">
            {docDefs.map((docDef) => {
              const attachedDoc = documents.find(
                (d) => d.checklistItemKey === docDef.key
              );

              return (
                <div key={docDef.key} className="border rounded p-4">
                  <h3 className="text-sm font-medium mb-2">{docDef.label}</h3>

                  {attachedDoc ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <a
                            href={fileUrl(attachedDoc.fileBlobId)}
                            download
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {attachedDoc.fileName}
                          </a>
                          <p className="text-xs text-gray-500">
                            {attachedDoc.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                          Replace
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0];
                              if (file) {
                                handleDocumentReplace(
                                  attachedDoc.id,
                                  docDef.key,
                                  file
                                );
                              }
                            }}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                        <button
                          onClick={() =>
                            handleDocumentDelete(attachedDoc.id)
                          }
                          disabled={loading}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:border-gray-400">
                          <p className="text-xs text-gray-600">
                            Click to upload PDF
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (file) {
                              handleDocumentUpload(docDef.key, file);
                            }
                          }}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                      {docDef.required && (
                        <p className="text-xs text-gray-500 mt-1">Required</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6"
        >
          {loading ? "Saving..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
