import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { QuestionImporter } from '@/components/admin/QuestionImporter';
import * as fs from 'fs';
import * as path from 'path';

export default async function BulkImportPage() {
  await requireAdmin();

  const mdDir = '/Users/muditagrawal/Downloads/conceptual question';
  const missionFiles = ['mission_1.md', 'mission_2.md', 'mission_3.md', 'mission_4.md', 'mission_5.md', 'mission_6.md'].map((f) => ({
    name: f,
    path: path.join(mdDir, f),
    exists: fs.existsSync(path.join(mdDir, f)),
  }));

  const existingCount = await prisma.question.count();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Import Questions</h1>
        <p className="text-muted-foreground">
          {existingCount} question(s) currently in the bank
        </p>
      </div>

      <QuestionImporter
        files={missionFiles}
        onImport={async (filePath: string) => {
          'use server';
          const { parseConceptualMd } = await import('@/../scripts/convert-md-to-json');
          const { prisma } = await import('@/lib/prisma');
          const filename = path.basename(filePath);
          const moduleMatch = filename.match(/mission_(\d+)/);
          if (!moduleMatch) return { count: 0, error: 'invalid_filename' };
          const moduleId = parseInt(moduleMatch[1], 10);
          const topics = parseConceptualMd(filePath, moduleId);
          let count = 0;
          for (const t of topics) {
            for (const q of t.questions) {
              await prisma.question.upsert({
                where: { id: q.id },
                create: {
                  id: q.id,
                  topicId: q.topicId,
                  prompt: q.prompt,
                  options: q.options,
                  explanation: q.explanation,
                  tags: q.tags,
                  source: 'CONCEPTUAL_BANK',
                },
                update: {},
              });
              count++;
            }
          }
          return { count };
        }}
      />
    </div>
  );
}
