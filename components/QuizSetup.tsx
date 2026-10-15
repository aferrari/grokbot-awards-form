"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Project } from "@/lib/projects";
import { GrokBot } from "./GrokBot";

const PROJECT_PLACEHOLDER = `Inbox Triage | Sorts support mail into a daily brief
Standup Bot
Research Desk | Pulls sources before a meeting`;

const EMAIL_PLACEHOLDER = `judge.one@company.com
judge.two@company.com`;

function countProjectLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""))
    .filter((line) => line && !line.startsWith("#")).length;
}

function countEmailLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""))
    .filter((line) => line && !line.startsWith("#")).length;
}

export function QuizSetup() {
  const [text, setText] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [current, setCurrent] = useState<Project[] | null>(null);
  const [currentEmails, setCurrentEmails] = useState<string[] | null>(null);
  const [created, setCreated] = useState<Project[] | null>(null);
  const [savedEmailCount, setSavedEmailCount] = useState<number | null>(null);
  const [clearedVotes, setClearedVotes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [savingVoters, setSavingVoters] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/quiz", { cache: "no-store" });
        const data = (await res.json()) as { projects?: Project[]; allowedEmails?: string[] };
        if (res.ok) {
          setCurrent(data.projects ?? []);
          const emails = data.allowedEmails ?? [];
          setCurrentEmails(emails);
          setEmailsText(emails.join("\n"));
        }
      } catch {
        setCurrent([]);
        setCurrentEmails([]);
      }
    })();
  }, []);

  const lineCount = countProjectLines(text);
  const emailLineCount = countEmailLines(emailsText);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setSavedEmailCount(null);
    if (lineCount === 0) {
      setError("Add at least one project");
      return;
    }
    setConfirming(true);
  }

  async function saveVoterList() {
    setError(null);
    setSavedEmailCount(null);
    setSavingVoters(true);
    try {
      const res = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedEmails: emailsText }),
      });
      const data = (await res.json()) as {
        error?: string;
        count?: number;
        allowedEmails?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not save the voter list");
      }
      const list = data.allowedEmails ?? [];
      setCurrentEmails(list);
      setEmailsText(list.join("\n"));
      setSavedEmailCount(data.count ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the voter list");
    } finally {
      setSavingVoters(false);
    }
  }

  async function createQuiz() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: text, allowedEmails: emailsText }),
      });
      const data = (await res.json()) as {
        error?: string;
        projects?: Project[];
        clearedVotes?: number;
        allowedEmails?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create the quiz");
      }
      setCreated(data.projects ?? []);
      setClearedVotes(data.clearedVotes ?? 0);
      setCurrent(data.projects ?? []);
      const list = data.allowedEmails ?? [];
      setCurrentEmails(list);
      setEmailsText(list.join("\n"));
      setSavedEmailCount(list.length);
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
          Paste projects and invited voter emails below. Only listed emails can vote, once each.
          Replacing the quiz deletes every saved vote.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-10 space-y-8">
          <label className="block">
            <span className="text-sm font-medium text-[#191919]">Invited voters</span>
            <span className="mt-1 block text-sm text-[#737373]">One email address per line.</span>
            <textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder={EMAIL_PLACEHOLDER}
              rows={8}
              className="mt-2 w-full resize-y rounded-lg border border-[#e0e0e0] bg-white px-4 py-3 font-mono text-sm leading-6 text-[#191919] outline-none placeholder:text-[#b3b3b3] focus:border-[#191919]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void saveVoterList()}
              disabled={savingVoters || pending}
              className="min-h-12 rounded-md border border-[#e0e0e0] bg-white px-5 text-sm font-semibold disabled:opacity-40"
            >
              {savingVoters
                ? "Saving…"
                : `Save voter list${emailLineCount > 0 ? ` (${emailLineCount})` : ""}`}
            </button>
            {savedEmailCount !== null && !created && (
              <p className="text-sm text-[#737373]">
                {savedEmailCount === 0
                  ? "Voter list cleared — nobody can vote until you add emails."
                  : `${savedEmailCount} invited voter${savedEmailCount === 1 ? "" : "s"} saved.`}
              </p>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[#191919]">Projects</span>
            <span className="mt-1 block text-sm text-[#737373]">
              One project per line. Optional description after a pipe.
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PROJECT_PLACEHOLDER}
              rows={12}
              className="mt-2 w-full resize-y rounded-lg border border-[#e0e0e0] bg-white px-4 py-3 font-mono text-sm leading-6 text-[#191919] outline-none placeholder:text-[#b3b3b3] focus:border-[#191919]"
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
                {`Replace the quiz with ${lineCount} ${lineCount === 1 ? "project" : "projects"}, save ${emailLineCount} invited voter${emailLineCount === 1 ? "" : "s"}, and delete every saved vote?`}
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
              disabled={pending || lineCount === 0}
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
              {savedEmailCount !== null && (
                <>
                  {" "}
                  {savedEmailCount === 0
                    ? "No invited voters yet."
                    : `${savedEmailCount} invited voter${savedEmailCount === 1 ? "" : "s"} on the list.`}
                </>
              )}
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
          <section className="mt-12 space-y-8">
            {currentEmails && (
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide text-[#737373]">
                  Invited voters
                </h2>
                <p className="mt-2 text-[#737373]">
                  {currentEmails.length === 0
                    ? "Nobody can vote yet — add emails above and save."
                    : `${currentEmails.length} email${currentEmails.length === 1 ? "" : "s"} can vote.`}
                </p>
              </div>
            )}
            <div>
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
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
