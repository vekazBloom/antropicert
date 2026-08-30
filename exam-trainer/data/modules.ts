export type ModuleMeta = {
  id: number;
  title: string;
  subtitle: string;
  covers: string;
};

/** Titles and coverage lines taken from the cover page of each source PDF. */
export const MODULES: ModuleMeta[] = [
  {
    id: 1,
    title: 'Claude Platform & Model Foundations',
    subtitle: 'How Claude behaves, entry points, capabilities, model choice',
    covers:
      'How Claude Behaves · Core Entry Points (Chat, Projects, Artifacts, Research) · Capability Layer (Skills, Code Execution, Memory) · Choosing Models (Haiku, Sonnet, Opus) · Context Management',
  },
  {
    id: 2,
    title: 'Prompting & Task Execution',
    subtitle: 'The five-component stack, decomposition, iteration',
    covers:
      'Anatomy of an Effective Prompt (the five-component stack) · Task Decomposition for Complex Requests · Iterating to Improve Output · Adapting Strategy by Task Type',
  },
  {
    id: 3,
    title: 'Output Evaluation & Validation',
    subtitle: 'Discernment, hallucinations, fact-checking, human review',
    covers:
      'Discernment — Evaluating Accuracy, Completeness and Fitness · Hallucinations, Inconsistencies & Bias · Fact-Checking and Grounding · Diligence — When Human Review Is Non-Negotiable · Editing for Your Audience · Choosing Output Formats',
  },
  {
    id: 4,
    title: 'Workflow Integration & Solution Design',
    subtitle: 'Requirements, planning, delegation mapping, stakeholders',
    covers:
      'Analyzing Requirements and Use Cases · Research, Planning & Process Optimization · Solution Design, Development & Iteration · Delegation Mapping · Communicating Value and Limitations',
  },
  {
    id: 5,
    title: 'Configuration & Knowledge Management',
    subtitle: 'Projects, connectors, system instructions, maintenance',
    covers:
      'Configuring Claude Projects · Connectors and Uploaded Knowledge · System-Level Instructions That Stick · Maintaining Configurations',
  },
  {
    id: 6,
    title: 'Governance, Risk & Responsible Use',
    subtitle: 'Use-case screening, skill trust, data sensitivity, ethics',
    covers:
      'Appropriate vs Inappropriate Use Cases · Skill Trust and Feature-Level Risk · Data Sensitivity, Privacy & Feature Controls · Organizational Policies · Ethical Implications',
  },
  {
    id: 7,
    title: 'Troubleshooting & Optimization',
    subtitle: 'Diagnosing weak output, adjusting, optimizing workflows',
    covers:
      'Diagnosing Underperforming Prompts and Outputs · Adjusting Approach from Feedback and Results · Optimizing Workflows for Efficiency and Effectiveness',
  },
  {
    id: 8,
    title: 'Module 8 Review Set',
    subtitle: 'Scenario-based review across all eight exam domains',
    covers:
      'Entry point & model selection · Structured prompting · Output validation · Workflow delegation · Project configuration · Governance & ethics · Diagnosing underperformance · The AI Fluency 4Ds',
  },
];

export const MODULE_BY_ID = new Map(MODULES.map((m) => [m.id, m]));

/** Exam rules. */
export const EXAM_QUESTION_COUNT = 53;
export const EXAM_PASS_PCT = 72;
/** 72% of 53 = 38.16, so 39 correct answers are needed to reach the threshold. */
export const EXAM_PASS_CORRECT = Math.ceil((EXAM_PASS_PCT / 100) * EXAM_QUESTION_COUNT);
