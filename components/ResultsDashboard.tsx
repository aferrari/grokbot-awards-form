"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ResultsData } from "@/lib/results";

function fmt(n: number | null) {
  if (n === null) return "—";
  return n.toFixed(1);
}

export function ResultsDashboard() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/results");
        const json = (await res.json()) as ResultsData & { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Could not load results");
        }
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load results");
        setData({ aggregates: [], judges: [], submissionCount: 0 });
      }
    })();
  }, []);

  const aggregates = data?.aggregates ?? [];
  const judges = data?.judges ?? [];
  const submissionCount = data?.submissionCount ?? 0;
  const maxOverall = Math.max(...aggregates.map((a) => a.overall ?? 0), 1);

  return (
    <div className="min-h-dvh bg-[#0f0f10] text-[#f5f5f5]">
      <header className="border-b border-white/10 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[#a3a3a3]">
              Live board
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Awards results
            </h1>
            <p className="mt-2 text-[#a3a3a3]">
              {!data && !error
                ? "Loading results…"
                : submissionCount === 0
                  ? "No evaluations yet — share the quiz link to get started."
                  : `${submissionCount} judge${submissionCount === 1 ? "" : "s"} submitted`}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#191919] hover:bg-[#e5e5e5]"
          >
            Take the quiz
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {error && (
          <p className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        <section aria-labelledby="rankings-heading">
          <h2 id="rankings-heading" className="text-lg font-semibold">
            Rankings
          </h2>
          <div className="mt-6 space-y-4">
            {aggregates.map((p, index) => (
              <article
                key={p.projectId}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#737373]">
                      #{index + 1}
                    </p>
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    {p.description && (
                      <p className="mt-1 text-sm text-[#a3a3a3]">{p.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold tabular-nums">{fmt(p.overall)}</p>
                    <p className="text-xs text-[#737373]">
                      overall · {p.judgeCount} vote{p.judgeCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${((p.overall ?? 0) / maxOverall) * 100}%`,
                    }}
                  />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-[#737373]">Creativity</dt>
                    <dd className="font-semibold tabular-nums">{fmt(p.creativity)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#737373]">Usefulness</dt>
                    <dd className="font-semibold tabular-nums">{fmt(p.usefulness)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#737373]">Demo</dt>
                    <dd className="font-semibold tabular-nums">{fmt(p.demo)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {judges.length > 0 && (
          <section className="mt-14" aria-labelledby="judges-heading">
            <h2 id="judges-heading" className="text-lg font-semibold">
              All scores by judge
            </h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-[#a3a3a3]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Judge</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Creativity</th>
                    <th className="px-4 py-3 font-medium">Usefulness</th>
                    <th className="px-4 py-3 font-medium">Demo</th>
                    <th className="px-4 py-3 font-medium">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((row, i) => (
                    <tr
                      key={`${row.judgeName}-${row.projectId}-${i}`}
                      className="border-t border-white/5"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">{row.judgeName}</td>
                      <td className="px-4 py-2.5">{row.projectName}</td>
                      <td className="px-4 py-2.5 tabular-nums">{row.creativity}</td>
                      <td className="px-4 py-2.5 tabular-nums">{row.usefulness}</td>
                      <td className="px-4 py-2.5 tabular-nums">{row.demo}</td>
                      <td className="px-4 py-2.5 font-medium tabular-nums">
                        {row.overall.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
