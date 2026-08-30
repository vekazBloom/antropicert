import { db, type AttemptRow, type AnswerRow } from '@/lib/db';
import {
  EXAM_PASS_PCT,
  EXAM_QUESTION_COUNT,
  MODULE_BY_ID,
} from '@/data/modules';
import { buildExam } from '@/lib/examBuilder';
import {
  LETTERS,
  QUESTIONS_BY_MODULE,
  getQuestion,
  present,
  shuffleOptions,
  type Letter,
  type PresentedQuestion,
  type Question,
} from '@/lib/questions';

export type PlanItem = { q: string; o: string };

export type CreateInput = {
  userId: number;
  mode: 'practice' | 'exam';
  moduleId?: number;
  scope?: 'all' | 'unseen' | 'wrong';
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  timeLimitSec?: number | null;
};

const now = () => new Date().toISOString();

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Question ids in a module the user has already answered / already got wrong. */
function historyFor(userId: number, moduleId: number) {
  const rows = db
    .prepare(
      `SELECT a.question_id AS qid, MIN(a.is_correct) AS ever_wrong, MAX(a.is_correct) AS ever_right
         FROM answers a
         JOIN attempts t ON t.id = a.attempt_id
        WHERE t.user_id = ?
        GROUP BY a.question_id`
    )
    .all(userId) as { qid: string; ever_wrong: number; ever_right: number }[];

  const seen = new Set<string>();
  const wrong = new Set<string>();
  for (const r of rows) {
    if (!r.qid.startsWith(`m${moduleId}-`)) continue;
    seen.add(r.qid);
    if (r.ever_wrong === 0) wrong.add(r.qid);
  }
  return { seen, wrong };
}

export function createAttempt(input: CreateInput): AttemptRow {
  let questions: Question[];
  let timeLimit = input.timeLimitSec ?? null;

  if (input.mode === 'exam') {
    questions = buildExam(EXAM_QUESTION_COUNT);
  } else {
    const moduleId = input.moduleId;
    if (!moduleId || !MODULE_BY_ID.has(moduleId)) throw new Error('unknown module');
    const bank = QUESTIONS_BY_MODULE.get(moduleId)!;
    const scope = input.scope ?? 'all';
    const { seen, wrong } = historyFor(input.userId, moduleId);

    if (scope === 'unseen') questions = bank.filter((q) => !seen.has(q.id));
    else if (scope === 'wrong') questions = bank.filter((q) => wrong.has(q.id));
    else questions = [...bank];

    if (questions.length === 0) throw new Error('no questions match that scope');
    if (input.shuffleQuestions) questions = shuffled(questions);
    timeLimit = null;
  }

  const useOptionShuffle = input.shuffleOptions !== false;
  const plan: PlanItem[] = questions.map((q) => ({
    q: q.id,
    o: (useOptionShuffle ? shuffleOptions(q) : LETTERS).join(''),
  }));

  const info = db
    .prepare(
      `INSERT INTO attempts (user_id, mode, module_id, scope, plan, time_limit_sec, started_at, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.userId,
      input.mode,
      input.mode === 'practice' ? input.moduleId! : null,
      input.mode === 'practice' ? (input.scope ?? 'all') : null,
      JSON.stringify(plan),
      timeLimit,
      now(),
      plan.length
    );

  return getAttempt(Number(info.lastInsertRowid))!;
}

export function getAttempt(id: number): AttemptRow | undefined {
  return db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as AttemptRow | undefined;
}

export function planOf(attempt: AttemptRow): PlanItem[] {
  return JSON.parse(attempt.plan) as PlanItem[];
}

export function answersOf(attemptId: number): AnswerRow[] {
  return db
    .prepare('SELECT * FROM answers WHERE attempt_id = ? ORDER BY id')
    .all(attemptId) as AnswerRow[];
}

/** Unix ms at which a timed attempt expires, or null when untimed. */
export function deadlineOf(attempt: AttemptRow): number | null {
  if (!attempt.time_limit_sec) return null;
  return new Date(attempt.started_at).getTime() + attempt.time_limit_sec * 1000;
}

export function isExpired(attempt: AttemptRow): boolean {
  const d = deadlineOf(attempt);
  return d !== null && Date.now() > d + 2000; // small grace for network lag
}

/**
 * The payload the browser is allowed to see while an attempt is running.
 * In exam mode this deliberately omits the correct letter and the explanation.
 */
export type RunPayload = {
  attempt: {
    id: number;
    mode: 'practice' | 'exam';
    moduleId: number | null;
    total: number;
    startedAt: string;
    finishedAt: string | null;
    timeLimitSec: number | null;
    deadline: number | null;
  };
  questions: PresentedQuestion[];
  /** questionId -> what the user picked, as a display letter. */
  given: Record<string, Letter>;
  /** Practice only: per-question outcome already revealed to the user. */
  revealed: Record<string, { isCorrect: boolean; correctDisplay: Letter; explanation: string }>;
};

export function runPayload(attempt: AttemptRow): RunPayload {
  const plan = planOf(attempt);
  const questions = plan.map((p) => present(p.q, p.o.split('') as Letter[]));
  const orderById = new Map(plan.map((p) => [p.q, p.o.split('') as Letter[]]));

  const given: Record<string, Letter> = {};
  const revealed: RunPayload['revealed'] = {};

  for (const a of answersOf(attempt.id)) {
    const order = orderById.get(a.question_id);
    if (!order) continue;
    given[a.question_id] = LETTERS[order.indexOf(a.selected as Letter)];
    if (attempt.mode === 'practice') {
      const q = getQuestion(a.question_id);
      revealed[a.question_id] = {
        isCorrect: a.is_correct === 1,
        correctDisplay: LETTERS[order.indexOf(q.correct)],
        explanation: q.explanation,
      };
    }
  }

  return {
    attempt: {
      id: attempt.id,
      mode: attempt.mode,
      moduleId: attempt.module_id,
      total: attempt.total,
      startedAt: attempt.started_at,
      finishedAt: attempt.finished_at,
      timeLimitSec: attempt.time_limit_sec,
      deadline: deadlineOf(attempt),
    },
    questions,
    given,
    revealed,
  };
}

export type AnswerResult = {
  ok: true;
  /** Practice only — withheld during an exam. */
  feedback?: { isCorrect: boolean; correctDisplay: Letter; explanation: string };
};

export function recordAnswer(
  attempt: AttemptRow,
  questionId: string,
  displayLetter: Letter
): AnswerResult {
  if (attempt.finished_at) throw new Error('attempt already finished');
  if (isExpired(attempt)) throw new Error('time is up');

  const item = planOf(attempt).find((p) => p.q === questionId);
  if (!item) throw new Error('question is not part of this attempt');

  const order = item.o.split('') as Letter[];
  const pos = LETTERS.indexOf(displayLetter);
  if (pos < 0) throw new Error('bad answer letter');
  const sourceLetter = order[pos];

  const q = getQuestion(questionId);
  const isCorrect = sourceLetter === q.correct;

  db.prepare(
    `INSERT INTO answers (attempt_id, question_id, selected, is_correct, answered_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(attempt_id, question_id)
     DO UPDATE SET selected = excluded.selected,
                   is_correct = excluded.is_correct,
                   answered_at = excluded.answered_at`
  ).run(attempt.id, questionId, sourceLetter, isCorrect ? 1 : 0, now());

  if (attempt.mode === 'exam') return { ok: true };
  return {
    ok: true,
    feedback: {
      isCorrect,
      correctDisplay: LETTERS[order.indexOf(q.correct)],
      explanation: q.explanation,
    },
  };
}

export type ReviewItem = {
  index: number;
  question: PresentedQuestion;
  moduleTitle: string;
  selectedDisplay: Letter | null;
  correctDisplay: Letter;
  isCorrect: boolean;
  explanation: string;
};

export type Review = {
  attempt: AttemptRow;
  correctCount: number;
  scorePct: number;
  passed: boolean | null;
  durationSec: number;
  perModule: { moduleId: number; title: string; correct: number; total: number }[];
  items: ReviewItem[];
};

/**
 * How many questions an attempt is scored out of.
 *
 * An exam is always out of the full paper — skipping a question is getting it
 * wrong. A practice run can be stopped at any point, so it is scored out of the
 * questions actually answered rather than the whole module.
 */
export function scoredTotal(attempt: AttemptRow, answeredCount: number): number {
  return attempt.mode === 'exam' ? planOf(attempt).length : answeredCount;
}

export function finishAttempt(attempt: AttemptRow): AttemptRow {
  if (attempt.finished_at) return attempt;
  const answers = new Map(answersOf(attempt.id).map((a) => [a.question_id, a]));
  const plan = planOf(attempt);
  const answeredCount = plan.filter((p) => answers.has(p.q)).length;
  const correctCount = plan.filter((p) => answers.get(p.q)?.is_correct === 1).length;
  const total = scoredTotal(attempt, answeredCount);
  const scorePct = total > 0 ? (correctCount / total) * 100 : 0;
  const passed = attempt.mode === 'exam' ? (scorePct >= EXAM_PASS_PCT ? 1 : 0) : null;

  db.prepare(
    `UPDATE attempts
        SET finished_at = ?, total = ?, correct_count = ?, score_pct = ?, passed = ?
      WHERE id = ?`
  ).run(now(), total, correctCount, scorePct, passed, attempt.id);

  return getAttempt(attempt.id)!;
}

export function buildReview(attempt: AttemptRow): Review {
  const answers = new Map(answersOf(attempt.id).map((a) => [a.question_id, a]));
  // A practice run only reviews what was actually answered; an exam reviews the
  // whole paper, including anything left blank.
  const plan = planOf(attempt).filter(
    (p) => attempt.mode === 'exam' || answers.has(p.q)
  );

  const items: ReviewItem[] = plan.map((p, i) => {
    const order = p.o.split('') as Letter[];
    const q = getQuestion(p.q);
    const a = answers.get(p.q);
    return {
      index: i,
      question: present(p.q, order),
      moduleTitle: MODULE_BY_ID.get(q.moduleId)?.title ?? `Module ${q.moduleId}`,
      selectedDisplay: a ? LETTERS[order.indexOf(a.selected as Letter)] : null,
      correctDisplay: LETTERS[order.indexOf(q.correct)],
      isCorrect: a?.is_correct === 1,
      explanation: q.explanation,
    };
  });

  const perModuleMap = new Map<number, { correct: number; total: number }>();
  for (const it of items) {
    const m = it.question.moduleId;
    const e = perModuleMap.get(m) ?? { correct: 0, total: 0 };
    e.total += 1;
    if (it.isCorrect) e.correct += 1;
    perModuleMap.set(m, e);
  }

  const correctCount = items.filter((i) => i.isCorrect).length;
  const end = attempt.finished_at ? new Date(attempt.finished_at) : new Date();

  return {
    attempt,
    correctCount,
    scorePct: plan.length > 0 ? (correctCount / plan.length) * 100 : 0,
    passed: attempt.passed === null ? null : attempt.passed === 1,
    durationSec: Math.max(0, Math.round((end.getTime() - new Date(attempt.started_at).getTime()) / 1000)),
    perModule: [...perModuleMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([moduleId, v]) => ({
        moduleId,
        title: MODULE_BY_ID.get(moduleId)?.title ?? `Module ${moduleId}`,
        correct: v.correct,
        total: v.total,
      })),
    items,
  };
}
