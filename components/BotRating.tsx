"use client";

import { GrokBot } from "./GrokBot";

type BotRatingProps = {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  hint: string;
};

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function BotRating({ value, onChange, label, hint }: BotRatingProps) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 flex w-full items-end justify-between gap-3">
        <span>
          <span className="block text-base font-medium text-[#191919] sm:text-lg">{label}</span>
          <span className="block text-sm text-[#737373]">{hint}</span>
        </span>
        <span className="text-2xl font-semibold tabular-nums leading-none text-[#191919]">
          {value === null ? "–" : value}
        </span>
      </legend>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11 sm:gap-2">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`flex aspect-square items-center justify-center rounded-2xl border text-sm font-semibold transition active:scale-95 ${
            value === 0
              ? "border-[#191919] bg-[#191919] text-white"
              : "border-[#e4e4e4] bg-white text-[#737373]"
          }`}
          aria-label={`${label}: score 0`}
          aria-pressed={value === 0}
        >
          0
        </button>
        {SCORES.map((n) => {
          const filled = value !== null && n <= value && value > 0;
          const chosen = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`relative flex aspect-square items-center justify-center rounded-2xl transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191919] ${
                chosen ? "bg-[#191919]/10 ring-2 ring-[#191919]" : "bg-transparent"
              }`}
              aria-label={`${label}: score ${n}`}
              aria-pressed={chosen}
            >
              <GrokBot
                id={n}
                awake={filled}
                className={`h-[72%] w-[72%] ${chosen ? "scale-110" : ""}`}
              />
              <span
                className={`absolute right-0.5 bottom-0.5 text-[10px] font-semibold leading-none ${
                  chosen ? "text-[#191919]" : "text-[#a3a3a3]"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
