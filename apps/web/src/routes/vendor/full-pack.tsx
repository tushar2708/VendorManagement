import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, getDocuments, type VendorDocument } from '../../lib/vendor-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Button } from '../../components/ui.js';
import { Icon } from '../../components/atoms/Icon.js';
import { Badge } from '../../components/atoms/Badge.js';

const MAX_SIZE_BYTES = 1_048_576;

const SECTIONS: { readonly title: string; readonly category: 'BANK_DETAILS' | 'STATUTORY' | 'LEGAL' }[] = [
  { title: 'Bank details', category: 'BANK_DETAILS' },
  { title: 'Statutory', category: 'STATUTORY' },
  { title: 'Legal', category: 'LEGAL' },
];

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FullPackPage(): React.ReactElement {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function load(): void {
    getDocuments().then(setDocuments).catch(() => undefined);
  }

  useEffect(load, []);

  async function handleFileSelect(category: 'BANK_DETAILS' | 'STATUTORY' | 'LEGAL', file: File | undefined): Promise<void> {
    if (!file) return;
    setError(null);
    if (file.size > MAX_SIZE_BYTES) {
      setError(`${file.name} is larger than 1MB. Please upload a smaller file.`);
      return;
    }
    setUploadingCategory(category);
    try {
      const data = await readFileAsBase64(file);
      await uploadDocument({ name: file.name, category, mimeType: file.type, sizeBytes: file.size, data });
      load();
    } catch (e: unknown) {
      setError(errorMessage(e, 'Could not upload this file.'));
    } finally {
      setUploadingCategory(null);
    }
  }

  const uploadedCount = documents.length;
  const totalSections = SECTIONS.length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h1>
      <p className="mt-1 text-sm text-slate-500">Upload your bank, statutory and legal documents. PDF, JPG or PNG, max 1MB each.</p>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${Math.min(100, (uploadedCount / totalSections) * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{uploadedCount} of {totalSections} categories have at least one document</p>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="mt-6 space-y-4">
        {SECTIONS.map((section) => {
          const sectionDocs = documents.filter((d) => d.category === section.category);
          return (
            <Card key={section.category} className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={uploadingCategory === section.category}
                  onClick={() => fileInputs.current[section.category]?.click()}
                >
                  {uploadingCategory === section.category ? 'Uploading…' : 'Upload file'}
                </Button>
                <input
                  ref={(el) => { fileInputs.current[section.category] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => { void handleFileSelect(section.category, e.target.files?.[0]); e.target.value = ''; }}
                />
              </div>
              {sectionDocs.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No documents uploaded yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sectionDocs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Icon name="file-text" size={16} className="text-slate-400" />
                        {d.name}
                      </span>
                      <Badge variant={d.status === 'UPLOADED' ? 'success' : 'neutral'}>{d.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button disabled={uploadedCount < totalSections} onClick={() => navigate('/vendor/contract')}>
          Submit full pack
        </Button>
      </div>
    </div>
  );
}
