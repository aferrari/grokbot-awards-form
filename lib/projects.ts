export type Project = {
  id: string;
  name: string;
  description: string;
};

export const PROJECTS: Project[] = [
  { id: "project-1", name: "Project 1", description: "Edit name and description in lib/projects.ts" },
  { id: "project-2", name: "Project 2", description: "Edit name and description in lib/projects.ts" },
  { id: "project-3", name: "Project 3", description: "Edit name and description in lib/projects.ts" },
  { id: "project-4", name: "Project 4", description: "Edit name and description in lib/projects.ts" },
  { id: "project-5", name: "Project 5", description: "Edit name and description in lib/projects.ts" },
  { id: "project-6", name: "Project 6", description: "Edit name and description in lib/projects.ts" },
  { id: "project-7", name: "Project 7", description: "Edit name and description in lib/projects.ts" },
  { id: "project-8", name: "Project 8", description: "Edit name and description in lib/projects.ts" },
  { id: "project-9", name: "Project 9", description: "Edit name and description in lib/projects.ts" },
  { id: "project-10", name: "Project 10", description: "Edit name and description in lib/projects.ts" },
];

export const PROJECT_IDS = new Set(PROJECTS.map((p) => p.id));
