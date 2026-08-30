#!/usr/bin/env node
/**
 * Extracts the CCAO-F question bank from the 8 source PDFs into data/questions.json.
 *
 * Each PDF holds questions in the body and an answer key with explanations at the end.
 * Two key formats exist:
 *   modules 1-7: "7. C — Five components ..."
 *   module 8:    "1. Answer: A. For a single, low-volume ..."
 *
 * Re-runnable. Exits non-zero if any question fails validation.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, '..');
const PDF_DIR = resolve(PROJECT, '..');
const OUT = join(PROJECT, 'data', 'questions.json');

const SOURCES = [
  { moduleId: 1, file: 'CCAO-F_Practice_Exam.pdf', expected: 100 },
  { moduleId: 2, file: 'CCAO-F_Module2_Practice_Exam.pdf', expected: 102 },
  { moduleId: 3, file: 'CCAO-F_Module3_Practice_Exam.pdf', expected: 100 },
  { moduleId: 4, file: 'CCAO-F_Module4_Practice_Exam.pdf', expected: 100 },
  { moduleId: 5, file: 'CCAO-F_Module5_Practice_Exam.pdf', expected: 100 },
  { moduleId: 6, file: 'CCAO-F_Module6_Practice_Exam.pdf', expected: 100 },
  { moduleId: 7, file: 'CCAO-F_Module7_Practice_Exam.pdf', expected: 95 },
  { moduleId: 8, file: 'Claude_Associate_Foundations_Practice_Questions.pdf', expected: 60 },
];

const LETTERS = ['A', 'B', 'C', 'D'];

/** Collapse runs of whitespace, normalise the odd ligature/quote artifacts pdftotext leaves. */
function tidy(s) {
  return s
    .replace(/­/g, '')      // soft hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

/** Flush-left "B. Anatomy of an Effective Prompt" subsection heading. */
const SECTION_RE = /^([A-H])\.\s+([A-Z][^\n]{3,80})$/;

/** Lines that are page furniture rather than content. */
function isNoise(line) {
  const t = line.trim();
  if (!t) return true;
  if (/^\d+$/.test(t)) return true;                                   // bare page number
  if (/^Claude Certified Associate/i.test(t)) return true;
  if (/^\(CCAO-F\)/.test(t)) return true;
  if (/^Practice Question Bank$/i.test(t)) return true;
  return false;
}

function pdfText(file) {
  const path = join(PDF_DIR, file);
  if (!existsSync(path)) throw new Error(`missing source PDF: ${path}`);
  const raw = execFileSync('pdftotext', ['-layout', path, '-'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  // pdftotext separates pages with a form feed, which glues itself to the first
  // character of the next page. JS `^` under /m does not treat \f as a line
  // break, so a question or key entry landing at a page top would never match.
  return raw.replace(/\f/g, '\n');
}

/** Parse the trailing answer key into { [number]: { correct, explanation } }. */
function parseAnswerKey(text) {
  const key = {};
  const re = /^[ \t]*(\d+)\.[ \t]+(?:Answer:[ \t]*)?([A-D])\b[\s.—-]+([\s\S]*?)(?=^[ \t]*\d+\.[ \t]+(?:Answer:[ \t]*)?[A-D]\b|$(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[3]
      .split('\n')
      .filter((l) => !isNoise(l))
      .filter((l) => !SECTION_RE.test(l.trim()))
      .join(' ');
    key[Number(m[1])] = { correct: m[2], explanation: tidy(body) };
  }
  return key;
}

/**
 * Parse the question body. Returns [{ number, section, sectionTitle, question, options }].
 * Options are indented at least two spaces, which is what separates them from a
 * flush-left subsection heading of the same "X. Text" shape.
 */
function parseQuestions(text) {
  const lines = text.split('\n');
  const out = [];
  let section = null;
  let sectionTitle = null;
  let current = null;

  const flush = () => {
    if (!current) return;
    out.push(current);
    current = null;
  };

  for (const raw of lines) {
    if (isNoise(raw)) continue;
    const trimmed = raw.trim();
    const indent = raw.length - raw.trimStart().length;

    // Subsection heading (flush left, or nearly so once pdftotext centres a page).
    const sec = trimmed.match(SECTION_RE);
    if (sec && indent < 2) {
      // A heading letter can be A-H; A-D collide with option letters, hence the
      // indent check — options are always indented by at least two spaces.
      flush();
      section = sec[1];
      sectionTitle = tidy(sec[2]);
      continue;
    }

    // New question: "12. What component ..." at low indent.
    const q = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (q && indent < 4) {
      flush();
      current = {
        number: Number(q[1]),
        section,
        sectionTitle,
        questionLines: [q[2]],
        options: {},
        pendingOption: null,
      };
      continue;
    }

    if (!current) continue;

    // Option line: indented "A. text"
    const opt = trimmed.match(/^([A-D])\.\s+(.*)$/);
    if (opt && indent >= 2 && !current.options[opt[1]]) {
      current.pendingOption = opt[1];
      current.options[opt[1]] = [opt[2]];
      continue;
    }

    // Continuation of whatever we are currently accumulating.
    if (current.pendingOption) current.options[current.pendingOption].push(trimmed);
    else current.questionLines.push(trimmed);
  }
  flush();

  return out.map((q) => ({
    number: q.number,
    section: q.section,
    sectionTitle: q.sectionTitle,
    question: tidy(q.questionLines.join(' ')),
    options: Object.fromEntries(
      Object.entries(q.options).map(([k, v]) => [k, tidy(v.join(' '))])
    ),
  }));
}

function main() {
  const all = [];
  const problems = [];

  for (const src of SOURCES) {
    const text = pdfText(src.file);
    const split = text.search(/Answer Key & (Explanations|Rationale)/);
    if (split === -1) throw new Error(`${src.file}: no answer key marker found`);
    const head = text.slice(0, split);
    const tail = text.slice(split).replace(/^.*$/m, ''); // drop the marker line itself

    const key = parseAnswerKey(tail);
    const questions = parseQuestions(head);

    for (const q of questions) {
      const id = `m${src.moduleId}-${String(q.number).padStart(3, '0')}`;
      const k = key[q.number];
      const optKeys = Object.keys(q.options).sort();

      if (optKeys.join('') !== 'ABCD') {
        problems.push(`${id}: expected options ABCD, got [${optKeys.join(',')}]`);
        continue;
      }
      if (LETTERS.some((l) => !q.options[l])) {
        problems.push(`${id}: an option is empty`);
        continue;
      }
      if (!q.question) {
        problems.push(`${id}: empty question text`);
        continue;
      }
      if (!k) {
        problems.push(`${id}: no answer key entry`);
        continue;
      }
      if (!LETTERS.includes(k.correct)) {
        problems.push(`${id}: bad correct letter "${k.correct}"`);
        continue;
      }
      if (!k.explanation) {
        problems.push(`${id}: empty explanation`);
        continue;
      }

      all.push({
        id,
        moduleId: src.moduleId,
        number: q.number,
        section: q.section,
        sectionTitle: q.sectionTitle,
        question: q.question,
        options: { A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D },
        correct: k.correct,
        explanation: k.explanation,
      });
    }

    const got = all.filter((x) => x.moduleId === src.moduleId).length;
    const flag = got === src.expected ? 'ok' : 'MISMATCH';
    console.log(`module ${src.moduleId}  ${String(got).padStart(3)}/${src.expected}  ${flag}  ${src.file}`);
    if (got !== src.expected) {
      problems.push(`module ${src.moduleId}: parsed ${got} questions, expected ${src.expected}`);
    }
  }

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }

  all.sort((a, b) => a.moduleId - b.moduleId || a.number - b.number);
  writeFileSync(OUT, JSON.stringify(all, null, 2) + '\n');
  console.log(`\n${all.length} questions across ${SOURCES.length} modules -> ${OUT}`);
}

main();
