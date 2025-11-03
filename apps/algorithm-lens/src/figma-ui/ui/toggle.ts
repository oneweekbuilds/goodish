type Variant = "default" | "outline";

type Size = "sm" | "default" | "lg";

export function toggleVariants(opts?: { variant?: Variant; size?: Size }) {
  const v = opts?.variant ?? "default";
  const s = opts?.size ?? "default";

  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium " +
    "transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50";

  const byVariant: Record<Variant, string> = {
    default: "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
    outline: "bg-transparent text-gray-900 border-gray-200 hover:bg-gray-50",
  };

  const bySize: Record<Size, string> = {
    sm: "h-8 px-2",
    default: "h-9 px-3",
    lg: "h-10 px-4",
  };

  return [base, byVariant[v], bySize[s]].join(" ");
}

