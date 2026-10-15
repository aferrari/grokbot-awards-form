type GrokBotProps = {
  id: number;
  className?: string;
  awake?: boolean;
};

export function botSrc(id: number) {
  const n = ((id - 1 + 12) % 12) + 1;
  return `/bots/${String(n).padStart(2, "0")}.png`;
}

export function GrokBot({ id, className = "", awake = true }: GrokBotProps) {
  return (
    // Stickers are decorative; the score button carries the accessible name.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={botSrc(id)}
      alt=""
      draggable={false}
      className={`pointer-events-none select-none object-contain ${
        awake ? "opacity-100" : "opacity-25 grayscale"
      } ${className}`}
    />
  );
}
