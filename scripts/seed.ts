/**
 * Seed script — creates the initial course, modules, sections, items,
 * instructors, cohorts, and viva slots.
 *
 * Run with: pnpm seed
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parseAllMissions, slugForTopic, promptForTopic } from './convert-md-to-json';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Swadhyaya...');

  const mdDir = '/Users/muditagrawal/Downloads/conceptual question';
  const allTopics = parseAllMissions(mdDir);

  console.log(`Parsed ${allTopics.length} topics, ${allTopics.reduce((s, t) => s + t.questions.length, 0)} questions`);

  // 1. Course
  const course = await prisma.course.upsert({
    where: { id: 'linear-algebra' },
    create: {
      id: 'linear-algebra',
      title: 'Linear Algebra',
      description: 'A conceptual introduction to linear algebra through 6 modules and 53 topics.',
      isPublished: true,
    },
    update: {},
  });
  console.log(`✓ Course: ${course.title}`);

  // 2. Modules + Sections + Items
  for (const topic of allTopics) {
    const moduleRecord = await prisma.module.upsert({
      where: {
        courseId_number: { courseId: course.id, number: topic.moduleId },
      },
      create: {
        courseId: course.id,
        number: topic.moduleId,
        title: null,
      },
      update: {},
    });

    const section = await prisma.section.upsert({
      where: {
        moduleId_number: { moduleId: moduleRecord.id, number: topic.number },
      },
      create: {
        moduleId: moduleRecord.id,
        number: topic.number,
        title: topic.title,
        prompt: promptForTopic(topic),
        activityHtmlSlug: slugForTopic(topic),
        questionBankId: topic.id,
      },
      update: {
        title: topic.title,
        prompt: promptForTopic(topic),
        activityHtmlSlug: slugForTopic(topic),
        questionBankId: topic.id,
      },
    });

    for (const order of [1, 2, 3]) {
      const type = order === 1 ? 'VIDEO' : order === 2 ? 'ACTIVITY' : 'QUIZ';
      await prisma.item.upsert({
        where: {
          sectionId_order: { sectionId: section.id, order },
        },
        create: {
          sectionId: section.id,
          order,
          type,
          title: `${type === 'VIDEO' ? 'Video' : type === 'ACTIVITY' ? 'Activity' : 'Quiz'}: ${topic.title}`,
          description: type === 'VIDEO'
            ? 'Watch the video lesson before unlocking the activity.'
            : type === 'ACTIVITY'
            ? 'Complete the interactive activity to unlock the quiz.'
            : 'Answer 20 conceptual questions to complete this topic.',
          videoRequired: true,
          videoMinWatchSeconds: 30,
          activityRequired: true,
          activityMinSeconds: 60,
          activityHtmlSlug: type === 'ACTIVITY' ? slugForTopic(topic) : null,
          quizQuestionSource: 'CONCEPTUAL_BANK',
          quizQuestionCount: 20,
          quizPassThreshold: 14,
          quizShuffle: true,
        },
        update: {},
      });
    }
  }
  console.log('✓ Modules, Sections, Items');
  console.log('✓ 1 course × 6 modules × 53 sections × 3 items = 954 items');

  // 3. Question bank
  let questionCount = 0;
  for (const topic of allTopics) {
    for (const q of topic.questions) {
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
          difficulty: 'EASY',
        },
        update: {
          prompt: q.prompt,
          options: q.options,
          explanation: q.explanation,
          tags: q.tags,
        },
      });
      questionCount++;
    }
  }
  console.log(`✓ Question bank: ${questionCount} questions`);

  // 4. Instructors (seeded)
  const instructors = [
    {
      name: 'Prof. Sudarshan Iyengar',
      email: 'sudarshan@iitrpr.ac.in',
      role: 'ADMIN' as const,
      staffRole: 'LEAD_INSTRUCTOR' as const,
      preset: 'lead',
    },
    {
      name: 'Dr. Sample TA',
      email: 'ta.swadhyaya@iitrpr.ac.in',
      role: 'INSTRUCTOR' as const,
      staffRole: 'TEACHING_ASSISTANT' as const,
      preset: 'ta',
    },
    {
      name: 'Dr. Reviewer',
      email: 'reviewer@iitrpr.ac.in',
      role: 'INSTRUCTOR' as const,
      staffRole: 'TEACHING_ASSISTANT' as const,
      preset: 'reviewer',
    },
  ];

  const { PRESETS } = await import('../src/lib/permissions');

  for (const inst of instructors) {
    const moduleIds = (await prisma.module.findMany({ where: { courseId: course.id } })).map((m) => m.id);
    const user = await prisma.user.upsert({
      where: { email: inst.email },
      create: {
        email: inst.email,
        name: inst.name,
        role: inst.role,
      },
      update: { role: inst.role },
    });
    await prisma.instructor.upsert({
      where: { email: inst.email },
      create: {
        userId: user.id,
        name: inst.name,
        email: inst.email,
        staffRole: inst.staffRole,
        preset: inst.preset,
        permissions: PRESETS[inst.preset] ?? {},
        moduleIds,
        active: true,
      },
      update: {
        userId: user.id,
        permissions: PRESETS[inst.preset] ?? {},
      },
    });
  }
  console.log(`✓ Instructors: ${instructors.length}`);

  for (const moduleRecord of await prisma.module.findMany({ where: { courseId: course.id } })) {
    const instructor = await prisma.instructor.findFirst({
      where: { staffRole: 'LEAD_INSTRUCTOR' },
    });
    if (!instructor) continue;

    const now = new Date();
    for (let day = 1; day <= 7; day++) {
      for (const hour of [9, 10, 11, 14, 15, 16]) {
        const start = new Date(now);
        start.setDate(now.getDate() + day);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1, 0, 0, 0);
        await prisma.vivaSlot.upsert({
          where: {
            instructorId_startUtc: {
              instructorId: instructor.id,
              startUtc: start,
            },
          },
          create: {
            instructorId: instructor.id,
            moduleId: moduleRecord.id,
            startUtc: start,
            endUtc: end,
            capacity: 1,
            meetingsUrl: `https://meet.jit.si/swadhyaya-${moduleRecord.id}-${day}-${hour}`,
          },
          update: {},
        });
      }
    }
  }
  console.log('✓ Viva slots: 7 days × 6 hours × 6 modules = 252 slots');

  // 6. Cohort
  await prisma.cohort.upsert({
    where: { name: 'IIT Ropar 2026 BTech' },
    create: {
      name: 'IIT Ropar 2026 BTech',
      description: 'BTech cohort 2026',
      courseIds: [course.id],
    },
    update: {},
  });
  console.log('✓ Cohort: IIT Ropar 2026 BTech');

  // 7. Admin + demo student accounts (so email sign-in works on a fresh DB)
  const accounts = [
    { email: 'admin@iitrpr.ac.in', name: 'admin', role: 'ADMIN' as const },
    { email: 'mudit@iitrpr.ac.in', name: 'mudit', role: 'STUDENT' as const },
  ];
  for (const acc of accounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      create: { email: acc.email, name: acc.name, role: acc.role },
      update: {},
    });
  }
  console.log(`✓ Accounts: ${accounts.map((a) => a.email).join(', ')}`);

  console.log('\n✅ Seed complete.');
}

function staffRolePermission(role: 'ADMIN' | 'INSTRUCTOR'): 'LEAD_INSTRUCTOR' | 'TEACHING_ASSISTANT' {
  return role === 'ADMIN' ? 'LEAD_INSTRUCTOR' : 'TEACHING_ASSISTANT';
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
