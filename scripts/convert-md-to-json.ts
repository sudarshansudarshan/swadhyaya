/**
 * Convert mission_{1..6}.md files → JSON question bank.
 * Then seed to MongoDB via the seed script.
 */
import * as fs from 'fs';
import * as path from 'path';

type ParsedQuestion = {
  id: string;
  topicId: string;
  prompt: string;
  options: { text: string; correct: boolean }[];
  explanation?: string;
  tags: string[];
  source: 'CONCEPTUAL_BANK';
};

type ParsedTopic = {
  id: string;
  moduleId: number;
  number: number;
  title: string;
  vocabulary: { allowed: string[]; forbidden: string[] };
  questions: ParsedQuestion[];
};

export function parseConceptualMd(filePath: string, moduleId: number): ParsedTopic[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const topics: ParsedTopic[] = [];

  const topicRegex = /^## Q(\d+)\.(\d+)\s+—\s+(.+?)$/gm;
  const subHeadings = [...content.matchAll(topicRegex)];

  for (let i = 0; i < subHeadings.length; i++) {
    const match = subHeadings[i];
    const topicNumber = parseInt(match[2], 10);
    const title = match[3].trim();
    const topicId = `${moduleId}.${topicNumber}`;

    const startIdx = match.index! + match[0].length;
    const endIdx = i + 1 < subHeadings.length ? subHeadings[i + 1].index! : content.length;
    const section = content.slice(startIdx, endIdx);

    const vocabMatch = section.match(/Vocabulary allowed:\s*(.+?)\n/s);
    const forbMatch = section.match(/Vocabulary forbidden:\s*(.+?)(?:\n|$)/s);
    const vocabulary = {
      allowed: vocabMatch ? parseList(vocabMatch[1]) : [],
      forbidden: forbMatch ? parseList(forbMatch[1]) : [],
    };

    const questionRegex = /### Q(\d+)\s+([\s\S]+?)(?=### Q\d+|$)/g;
    const questions: ParsedQuestion[] = [];
    let qMatch;
    while ((qMatch = questionRegex.exec(section)) !== null) {
      const qNumber = qMatch[1];
      const qBody = qMatch[2];
      const question = parseQuestionBody(qNumber, qBody, topicId);
      if (question) questions.push(question);
    }

    topics.push({
      id: topicId,
      moduleId,
      number: topicNumber,
      title,
      vocabulary,
      questions,
    });
  }

  return topics;
}

function parseList(text: string): string[] {
  return text
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s && s !== 'as' && s.length > 1);
}

function parseQuestionBody(
  qNumber: string,
  body: string,
  topicId: string
): ParsedQuestion | null {
  const questionMatch = body.match(/\*\*Question:\*\*\s+([\s\S]+?)(?=-|\*\*Correct)/);
  if (!questionMatch) return null;
  const prompt = questionMatch[1].trim();

  const optionRegex = /^[ \t]*-\s+([a-z])\)\s+(.+?)$/gm;
  const options: { text: string; correct: boolean }[] = [];
  let optMatch;
  while ((optMatch = optionRegex.exec(body)) !== null) {
    const text = optMatch[2].trim();
    options.push({ text, correct: false });
  }

  const correctMatch = body.match(/\*\*Correct:\*\*\s+([a-z])\)/);
  const correctLetter = correctMatch ? correctMatch[1] : null;
  if (correctLetter) {
    const idx = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
    if (options[idx]) options[idx].correct = true;
  }

  const explanationMatch = body.match(/\*\*Explanation:\*\*\s+([\s\S]+?)$/);
  const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;

  const tagMatch = prompt.match(/^\[([^\]]+)\]/);
  const tags = tagMatch ? [tagMatch[1].trim()] : [];

  const id = `${topicId}.q${qNumber}`;
  return {
    id,
    topicId,
    prompt: prompt.replace(/^\[[^\]]+\]\s*/, '').trim(),
    options,
    explanation,
    tags,
    source: 'CONCEPTUAL_BANK',
  };
}

export function parseAllMissions(mdDir: string): ParsedTopic[] {
  const all: ParsedTopic[] = [];
  for (let m = 1; m <= 6; m++) {
    const file = path.join(mdDir, `mission_${m}.md`);
    if (!fs.existsSync(file)) {
      console.warn(`Missing: ${file}`);
      continue;
    }
    const topics = parseConceptualMd(file, m);
    all.push(...topics);
    console.log(`mission_${m}.md → ${topics.length} topics, ${topics.reduce((s, t) => s + t.questions.length, 0)} questions`);
  }
  return all;
}

export function writeJson(outDir: string, topics: ParsedTopic[]) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  for (const topic of topics) {
    const file = path.join(outDir, `${topic.id}.json`);
    fs.writeFileSync(file, JSON.stringify(topic, null, 2));
  }
  const summary = {
    totalTopics: topics.length,
    totalQuestions: topics.reduce((s, t) => s + t.questions.length, 0),
    byModule: Array.from({ length: 6 }, (_, i) => ({
      module: i + 1,
      topics: topics.filter((t) => t.moduleId === i + 1).length,
      questions: topics.filter((t) => t.moduleId === i + 1).reduce((s, t) => s + t.questions.length, 0),
    })),
  };
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('Summary:', summary);
}

export function slugForTopic(topic: ParsedTopic): string {
  const map: Record<string, string> = {
    '1.1': 'gargi-matrix-loom',
    '1.2': 'bhavabhuti-range-of-B',
    '1.3': 'kalidasa-verses-line',
    '1.4': 'kalidasa-verses-line',
    '1.5': 'aryabhata-quadratic',
    '1.6': 'aryabhata-quadratic',
    '1.7': 'bhaskaracharya-cubic',
    '1.8': 'panini-linear-map',
    '1.9': 'aryabhata-quadratic',
    '1.10': 'aryabhata-quadratic',
    '1.11': 'bhaskaracharya-cubic',
    '1.12': 'panini-dimensions',
    '1.13': 'panini-linear-map',
    '1.14': 'bhavabhuti-singular-matrix',
    '1.15': 'gargi-matrix-loom',
    '1.16': 'nullspace-line',
    '2.1': 'hill-cipher',
    '2.2': 'jayadeva-cafe-equations',
    '2.3': 'tulsidas-cafe-overdetermined',
    '2.4': 'bhavabhuti-range-of-B',
    '2.5': 'chanakya-bookclub-line',
    '2.6': 'markov-city-chain',
    '2.7': 'markov-mood-chain',
    '3.1': 'charaka-perpendicular-vectors',
    '3.2': 'charaka-perpendicular-vectors',
    '3.3': 'charaka-perpendicular-vectors',
    '3.4': 'vyasa-perpendicular-plane',
    '3.5': 'bharavi-3d-line',
    '3.6': 'bharavi-3d-line',
    '3.7': 'vidyapati-3d-line',
    '3.8': 'vyasa-perpendicular-plane',
    '3.9': 'nagarjuna-matrix-function',
    '3.10': 'nagarjuna-matrix-function',
    '3.11': 'orthogonal-complements',
    '3.12': 'bhaskara-cubic-find-x',
    '3.13': 'nagarjuna-slope-peaks',
    '3.14': 'bhavabhuti-range-of-B',
    '3.15': 'collapse-dimension',
    '4.1': 'nagarjuna-matrix-function',
    '4.2': 'orthogonal-complements',
    '4.3': 'nullspace-line',
    '4.4': 'orthogonal-complements',
    '4.5': 'nagarjuna-matrix-function',
    '4.6': 'panini-dimensions',
    '4.7': 'spanning-plane',
    '5.1': 'patanjali-three-subspaces',
    '5.2': 'patanjali-three-subspaces',
    '5.3': 'nagarjuna-matrix-function',
    '5.4': 'patanjali-three-subspaces',
    '5.5': 'patanjali-three-subspaces',
    '6.1': 'tenali-birbal-fruit-stall',
    '6.2': 'tenali-birbal-fruit-stall',
    '6.3': 'tenali-birbal-fruit-stall',
  };
  return map[topic.id] ?? 'tenali-birbal-fruit-stall';
}

export function promptForTopic(topic: ParsedTopic): string {
  return `Module ${topic.moduleId}, Section ${topic.number}: ${topic.title}`;
}

if (require.main === module) {
  const mdDir = process.argv[2] ?? '/Users/muditagrawal/Downloads/conceptual question';
  const outDir = process.argv[3] ?? path.join(process.cwd(), 'packages/questions');

  const topics = parseAllMissions(mdDir);
  writeJson(outDir, topics);

  const mappingFile = path.join(outDir, 'activity-mapping.json');
  const mapping: Record<string, string> = {};
  for (const t of topics) {
    mapping[t.id] = slugForTopic(t);
  }
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
  console.log(`Wrote activity mapping → ${mappingFile}`);
}
