"use client";

import { Star } from "lucide-react";

type StarRatingProps = {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  hint: string;
};

export function StarRating({ value, onChange, label, hint }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-lg font-medium text-[#191919]">{label}</p>
        <p className="text-sm text-[#737373]">{hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`min-h-11 min-w-11 rounded-lg border text-sm font-semibold transition-colors ${
            value === 0
              ? "border-[#191919] bg-[#191919] text-white"
              : "border-[#e0e0e0] bg-white text-[#737373] hover:border-[#191919]"
          }`}
          aria-label={`${label}: score 0`}
        >
          0
        </button>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const filled = value !== null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="min-h-11 min-w-11 rounded-lg p-2 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191919]"
              aria-label={`${label}: score ${n}`}
            >
              <Star
                className={`h-7 w-7 ${
                  filled
                    ? "fill-[#191919] text-[#191919]"
                    : "fill-transparent text-[#d4d4d4]"
                }`}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
        <span className="ml-2 min-w-[2ch] text-sm font-medium text-[#737373]">
          {value === null ? "—" : value}
        </span>
      </div>
    </div>
  );
}
