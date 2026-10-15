"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Project } from "@/lib/projects";
import { GrokBot } from "./GrokBot";

const PLACEHOLDER = `Inbox Triage | Sorts support mail into a daily brief
Standup Bot
Research Desk | Pulls sources before a meeting`;

export function QuizSetup() {
  const [text, setText] = useState("");
  const [token, setToken] = useState("");
  const [current, setCurrent] = useState<Project[] | null>(null);
  const [created, setCreated] = useState<Project[] | null>(null);
  const [clearedVotes, setClearedVotes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/quiz", { cache: "no-store" });
        const data = (await res.json()) as { projects?: Project[] };
        if (res.ok) setCurrent(data.projects ?? []);
      } catch {
        setCurrent([]);
      }
    })();
  }, []);

  const lineCount = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""))
    .filter((line) => line && !line.startsWith("#")).length;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (lineCount === 0) {
      setError("Add at least one project");
      return;
    }
    setConfirming(true);
  }

  async function createQuiz() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projects: text }),
      });
      const data = (await res.json()) as {
        error?: string;
        projects?: Project[];
        clearedVotes?: number;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create the quiz");
      }
      setCreated(data.projects ?? []);
      setClearedVotes(data.clearedVotes ?? 0);
      setCurrent(data.projects ?? []);
      setText("");
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the quiz");
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fafafa] text-[#191919]">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
        <GrokBot id={3} className="mb-6 h-20 w-20 sm:h-24 sm:w-24" />
        <p className="text-sm font-medium uppercase tracking-wide text-[#737373]">Setup</p>
        <h1 className="mt-2 text-3xl font-light sm:text-5xl">Create the quiz</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#737373]">
          Paste one project per line. Add an optional description after a pipe. Any number of
          projects works. Sending a list replaces the quiz and deletes every saved vote.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-10 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-[#191919]">Projects</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={12}
              className="mt-2 w-full resize-y rounded-lg border border-[#e0e0e0] bg-white px-4 py-3 font-mono text-sm leading-6 text-[#191919] outline-none placeholder:text-[#b3b3b3] focus:border-[#191919]"
            />
          </label>

          <label className="block max-w-md">
            <span className="text-sm font-medium text-[#191919]">Admin token</span>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="current-password"
              placeholder="QUIZ_ADMIN_TOKEN"
              className="mt-2 w-full border-b-2 border-[#191919] bg-transparent py-2 text-lg outline-none placeholder:text-[#b3b3b3]"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {confirming ? (
            <div className="rounded-xl border border-[#e0e0e0] bg-white p-5">
              <p className="text-lg">
                {`Replace the quiz with ${lineCount} ${lineCount === 1 ? "project" : "projects"} and delete every saved vote?`}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void createQuiz()}
                  disabled={pending}
                  className="min-h-12 rounded-md bg-[#191919] px-6 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Creating…" : "Replace quiz"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="min-h-12 rounded-md border border-[#e0e0e0] bg-white px-5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={pending || lineCount === 0 || token.trim().length === 0}
              className="min-h-12 rounded-md bg-[#191919] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {`Create quiz${lineCount > 0 ? ` (${lineCount})` : ""}`}
            </button>
          )}
        </form>

        {created && (
          <section className="mt-10 rounded-xl border border-[#e0e0e0] bg-white p-5">
            <h2 className="text-lg font-medium">Quiz ready</h2>
            <p className="mt-2 text-[#737373]">
              {created.length} project{created.length === 1 ? "" : "s"} saved.
              {clearedVotes === 0
                ? " No previous votes were deleted."
                : ` ${clearedVotes} previous vote${clearedVotes === 1 ? "" : "s"} deleted.`}
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              {created.map((project) => (
                <li key={project.id}>
                  <span className="font-medium">{project.name}</span>
                  {project.description && (
                    <span className="text-[#737373]"> — {project.description}</span>
                  )}
                </li>
              ))}
            </ol>
            <a
              href="/"
              className="mt-6 inline-flex rounded-md bg-[#191919] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open the quiz
            </a>
          </section>
        )}

        {current && current.length > 0 && !created && (
          <section className="mt-12">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[#737373]">
              Current quiz
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              {current.map((project) => (
                <li key={project.id}>
                  <span className="font-medium">{project.name}</span>
                  {project.description && (
                    <span className="text-[#737373]"> — {project.description}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}
