"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CRITERIA, type ProjectScores } from "@/lib/criteria";
import { PROJECTS } from "@/lib/projects";
import { BotRating } from "./BotRating";
import { GrokBot } from "./GrokBot";

type Phase = "quiz" | "submitting" | "done";

function emptyScores(): ProjectScores {
  return { creativity: null, usefulness: null, demo: null };
}

function isComplete(scores: ProjectScores) {
  return CRITERIA.every((c) => scores[c.key] !== null);
}

export function QuizFlow() {
  const totalSteps = 1 + PROJECTS.length;
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("quiz");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [judgeName, setJudgeName] = useState("");
  const [byProject, setByProject] = useState<Record<string, ProjectScores>>(() =>
    Object.fromEntries(PROJECTS.map((p) => [p.id, emptyScores()])),
  );
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const progress = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

  const onProject = step >= 1 && step <= PROJECTS.length;
  const project = onProject ? PROJECTS[step - 1] : null;
  const projectScores = project ? byProject[project.id] : null;

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return judgeName.trim().length >= 2;
    }
    if (project && projectScores) {
      return isComplete(projectScores);
    }
    return false;
  }, [step, judgeName, project, projectScores]);

  const goForward = useCallback(async () => {
    if (!canAdvance || phase !== "quiz") return;
    setError(null);

    if (step < totalSteps - 1) {
      setDirection("forward");
      setStep((s) => s + 1);
      setAnimKey((k) => k + 1);
      return;
    }

    setPhase("submitting");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeName: judgeName.trim(),
          scores: byProject,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not submit your evaluation");
      }
      setPhase("done");
      setAnimKey((k) => k + 1);
    } catch (e) {
      setPhase("quiz");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [canAdvance, phase, step, totalSteps, judgeName, byProject]);

  const goBack = useCallback(() => {
    if (step === 0 || phase !== "quiz") return;
    setDirection("back");
    setStep((s) => s - 1);
    setAnimKey((k) => k + 1);
    setError(null);
  }, [step, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        e.preventDefault();
        void goForward();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goForward]);

  const updateScore = (projectId: string, key: keyof ProjectScores, value: number) => {
    setByProject((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], [key]: value },
    }));
  };

  if (phase === "done") {
    return (
      <div className="flex min-h-dvh flex-col bg-[#fafafa]">
        <div className="h-1 w-full bg-[#e8e8e8]">
          <div className="h-full w-full bg-[#191919] transition-all duration-500" />
        </div>
        <main
          key={animKey}
          className="quiz-enter flex flex-1 flex-col justify-center px-4 py-10 sm:px-12 md:px-24"
        >
          <GrokBot id={6} className="mb-6 h-24 w-24 sm:h-32 sm:w-32" />
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[#737373]">
            All done
          </p>
          <h1 className="max-w-2xl text-3xl font-light leading-tight text-[#191919] sm:text-4xl md:text-5xl">
            Thanks, {judgeName.trim()}!
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#737373]">
            Your scores for all {PROJECTS.length} projects were saved.
          </p>
          <Link
            href="/results"
            className="mt-10 inline-flex w-fit items-center rounded-md bg-[#191919] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            View live results
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#fafafa]">
      <div className="h-1 w-full bg-[#e8e8e8]">
        <div
          className="h-full bg-[#191919] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main
        key={animKey}
        className={`flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:justify-center sm:px-12 sm:py-12 md:px-24 ${
          direction === "forward" ? "quiz-enter-forward" : "quiz-enter-back"
        }`}
      >
        {step === 0 && (
          <>
            <GrokBot id={12} className="mb-5 h-20 w-20 sm:h-28 sm:w-28" />
            <p className="mb-3 text-sm font-medium text-[#737373]">
              1 → {totalSteps}
            </p>
            <h1 className="max-w-3xl text-3xl font-light leading-tight text-[#191919] sm:text-4xl md:text-5xl">
              What&apos;s your name?
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[#737373]">
              We&apos;ll show it on the public results board with your scores.
            </p>
            <input
              type="text"
              autoFocus
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              placeholder="Type your answer here…"
              className="mt-10 max-w-xl border-b-2 border-[#191919] bg-transparent py-3 text-2xl text-[#191919] outline-none placeholder:text-[#b3b3b3] sm:text-3xl"
            />
          </>
        )}

        {project && projectScores && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <GrokBot id={step} className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#737373]">
                  {step + 1} → {totalSteps}
                </p>
                <h1 className="text-2xl font-light leading-tight text-[#191919] sm:text-4xl md:text-5xl">
                  {project.name}
                </h1>
              </div>
            </div>
            {project.description && (
              <p className="max-w-2xl text-base text-[#737373] sm:text-lg">{project.description}</p>
            )}
            <div className="mt-6 max-w-3xl space-y-6 sm:mt-10 sm:space-y-8">
              {CRITERIA.map((c) => (
                <BotRating
                  key={c.key}
                  label={c.label}
                  hint={c.hint}
                  value={projectScores[c.key]}
                  onChange={(v) => updateScore(project.id, c.key, v)}
                />
              ))}
            </div>
          </>
        )}

        {error && (
          <p className="mt-6 max-w-xl text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-[#ececec] bg-[#fafafa]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-12 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={phase === "submitting"}
              className="min-h-12 rounded-md border border-[#e0e0e0] bg-white px-5 text-sm font-semibold text-[#191919] disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => void goForward()}
            disabled={!canAdvance || phase === "submitting"}
            className="min-h-12 flex-1 rounded-md bg-[#191919] px-8 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            {phase === "submitting"
              ? "Submitting…"
              : step === totalSteps - 1
                ? "Submit"
                : "OK"}
          </button>
          <span className="hidden text-sm text-[#737373] sm:inline">
            press <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">Enter ↵</kbd>
          </span>
        </div>
      </main>

      <footer className="px-4 pb-4 text-center text-xs text-[#b3b3b3] sm:px-6 sm:pb-6 sm:text-left">
        <Link href="/results" className="underline-offset-2 hover:underline">
          Results dashboard
        </Link>
      </footer>
    </div>
  );
}
