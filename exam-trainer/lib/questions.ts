import raw from '@/data/questions.json';

export type Letter = 'A' | 'B' | 'C' | 'D';
export const LETTERS: Letter[] = ['A', 'B', 'C', 'D'];

export type Question = {
  id: string;
  moduleId: number;
  number: number;
  section: string;
  sectionTitle: string;
  question: string;
  options: Record<Letter, string>;
  correct: Letter;
  explanation: string;
};

export const QUESTIONS = raw as Question[];

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export const QUESTIONS_BY_MODULE = QUESTIONS.reduce<Map<number, Question[]>>((acc, q) => {
  const list = acc.get(q.moduleId) ?? [];
  list.push(q);
  acc.set(q.moduleId, list);
  return acc;
}, new Map());

export function getQuestion(id: string): Question {
  const q = QUESTION_BY_ID.get(id);
  if (!q) throw new Error(`unknown question id: ${id}`);
  return q;
}

/**
 * A question as it is presented inside one attempt. `order` lists the source
 * letters in display order, so display position 0 shows `options[order[0]]`
 * under the label "A".
 */
export type PresentedQuestion = {
  id: string;
  moduleId: number;
  sectionTitle: string;
  question: string;
  /** Display-ordered option text, always four entries. */
  options: string[];
  /** Source letters in display order, e.g. ['C','A','D','B']. */
  order: Letter[];
};

/**
 * A handful of questions use an option whose wording depends on where it sits
 * in the list ("None of the above ..."). Those keep their original order.
 */
function isOrderSensitive(q: Question): boolean {
  return LETTERS.some((l) => /\b(above|following)\b/i.test(q.options[l]));
}

export function shuffleOptions(q: Question, rand: () => number = Math.random): Letter[] {
  if (isOrderSensitive(q)) return [...LETTERS];
  const order = [...LETTERS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function present(id: string, order: Letter[]): PresentedQuestion {
  const q = getQuestion(id);
  return {
    id: q.id,
    moduleId: q.moduleId,
    sectionTitle: q.sectionTitle,
    question: q.question,
    options: order.map((l) => q.options[l]),
    order,
  };
}

/** Display label ("A".."D") of the position holding a given source letter. */
export function displayLetterOf(order: Letter[], sourceLetter: Letter): Letter {
  return LETTERS[order.indexOf(sourceLetter)];
}
