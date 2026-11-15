export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export function Initials({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 font-semibold text-neutral-800"
    >
      {initials(name)}
    </span>
  );
}
