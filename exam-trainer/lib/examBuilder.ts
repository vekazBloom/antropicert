import { EXAM_QUESTION_COUNT } from '@/data/modules';
import { QUESTIONS_BY_MODULE, type Question } from '@/lib/questions';

/**
 * Spread `total` picks across the modules in proportion to how many questions
 * each module holds, using largest-remainder rounding so the parts sum exactly
 * to `total` and every module contributes at least one question.
 */
export function allocate(total = EXAM_QUESTION_COUNT): Map<number, number> {
  const moduleIds = [...QUESTIONS_BY_MODULE.keys()].sort((a, b) => a - b);
  const sizes = moduleIds.map((id) => QUESTIONS_BY_MODULE.get(id)!.length);
  const bankTotal = sizes.reduce((a, b) => a + b, 0);

  const exact = sizes.map((s) => (s / bankTotal) * total);
  const floors = exact.map((e) => Math.max(1, Math.floor(e)));

  let remaining = total - floors.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .sort((a, b) => b.rem - a.rem);

  let cursor = 0;
  while (remaining > 0) {
    floors[byRemainder[cursor % byRemainder.length].i] += 1;
    remaining -= 1;
    cursor += 1;
  }
  while (remaining < 0) {
    const target = byRemainder[cursor % byRemainder.length].i;
    if (floors[target] > 1) {
      floors[target] -= 1;
      remaining += 1;
    }
    cursor += 1;
  }

  return new Map(moduleIds.map((id, i) => [id, floors[i]]));
}

function sample<T>(items: T[], n: number, rand: () => number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Builds one exam: stratified across all modules, then shuffled as a whole. */
export function buildExam(total = EXAM_QUESTION_COUNT, rand: () => number = Math.random): Question[] {
  const perModule = allocate(total);
  const picked: Question[] = [];
  for (const [moduleId, n] of perModule) {
    picked.push(...sample(QUESTIONS_BY_MODULE.get(moduleId)!, n, rand));
  }
  return sample(picked, picked.length, rand);
}
