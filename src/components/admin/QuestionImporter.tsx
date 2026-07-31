'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload } from 'lucide-react';

type MissionFile = { name: string; path: string; exists: boolean };

export function QuestionImporter({
  files,
  onImport,
}: {
  files: MissionFile[];
  onImport: (filePath: string) => Promise<{ count: number; error?: string }>;
}) {
  const router = useRouter();
  const [importing, setImporting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { count?: number; error?: string }>>({});

  async function handleImport(file: MissionFile) {
    setImporting(file.path);
    try {
      const result = await onImport(file.path);
      setResults((prev) => ({ ...prev, [file.path]: result }));
      router.refresh();
    } catch (err: any) {
      setResults((prev) => ({ ...prev, [file.path]: { error: err.message ?? 'failed' } }));
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="space-y-2">
      {files.map((f) => (
        <div key={f.path} className="bg-white border rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">{f.path}</div>
              {results[f.path] && (
                <div className="text-xs mt-1">
                  {results[f.path].error ? (
                    <span className="text-red-600">✗ {results[f.path].error}</span>
                  ) : (
                    <span className="text-emerald-600">✓ Imported {results[f.path].count} question(s)</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleImport(f)}
            disabled={!f.exists || importing === f.path}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            {importing === f.path ? 'Importing…' : 'Import'}
          </button>
        </div>
      ))}
    </div>
  );
}
