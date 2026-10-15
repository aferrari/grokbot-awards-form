export type Project = {
  id: string;
  name: string;
  description: string;
};

const MAX_PROJECTS = 40;
const MAX_NAME = 120;
const MAX_DESCRIPTION = 400;

export function parseProjectList(input: unknown): Project[] | string {
  const items = coerceItems(input);
  if (typeof items === "string") return items;
  if (items.length === 0) {
    return "Send at least one project";
  }
  if (items.length > MAX_PROJECTS) {
    return `Send at most ${MAX_PROJECTS} projects`;
  }

  const projects: Project[] = [];
  const usedIds = new Set<string>();

  for (const item of items) {
    const name = item.name.trim();
    const description = item.description.trim();
    if (!name) return "Every project needs a name";
    if (name.length > MAX_NAME) {
      return `Project names must be ${MAX_NAME} characters or fewer`;
    }
    if (description.length > MAX_DESCRIPTION) {
      return `Descriptions must be ${MAX_DESCRIPTION} characters or fewer`;
    }
    projects.push({
      id: uniqueId(name, projects.length, usedIds),
      name,
      description,
    });
  }

  return projects;
}

function coerceItems(input: unknown): Array<{ name: string; description: string }> | string {
  if (typeof input === "string") return parseLines(input);
  if (Array.isArray(input)) return parseEntries(input);
  if (!input || typeof input !== "object") return "Send a list of projects";

  const projects = (input as { projects?: unknown }).projects;
  if (typeof projects === "string") return parseLines(projects);
  if (Array.isArray(projects)) return parseEntries(projects);
  return "Send a list of projects";
}

function parseLines(text: string): Array<{ name: string; description: string }> | string {
  const items: Array<{ name: string; description: string }> = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "");
    if (!line || line.startsWith("#")) continue;
    const pipe = line.indexOf("|");
    if (pipe === -1) {
      items.push({ name: line.trim(), description: "" });
    } else {
      items.push({
        name: line.slice(0, pipe).trim(),
        description: line.slice(pipe + 1).trim(),
      });
    }
  }
  return items;
}

function parseEntries(entries: unknown[]): Array<{ name: string; description: string }> | string {
  const items: Array<{ name: string; description: string }> = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      const parsed = parseLines(entry);
      if (typeof parsed === "string") return parsed;
      items.push(...parsed);
      continue;
    }
    if (!entry || typeof entry !== "object") return "Each project needs a name";
    const record = entry as { name?: unknown; description?: unknown };
    if (typeof record.name !== "string") return "Each project needs a name";
    if (record.description !== undefined && typeof record.description !== "string") {
      return "Project descriptions must be text";
    }
    items.push({
      name: record.name,
      description: typeof record.description === "string" ? record.description : "",
    });
  }
  return items;
}

function uniqueId(name: string, index: number, used: Set<string>): string {
  const base =
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `project-${index + 1}`;

  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}
