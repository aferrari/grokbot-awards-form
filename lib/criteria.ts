export const CRITERIA = [
  {
    key: "creativity" as const,
    label: "Creativity",
    hint: "How creative was this project?",
  },
  {
    key: "usefulness" as const,
    label: "Usefulness",
    hint: "How useful is this project?",
  },
  {
    key: "demo" as const,
    label: "Demo",
    hint: "How great was the presentation?",
  },
];

export type CriterionKey = (typeof CRITERIA)[number]["key"];

export type ProjectScores = Record<CriterionKey, number | null>;

export type SubmissionPayload = {
  judgeName: string;
  scores: Record<string, ProjectScores>;
};
