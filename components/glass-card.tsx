import { cn } from "@/lib/cn";

type Variant = "default" | "strong" | "subtle";

const variantClass: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass-subtle",
};

export function GlassCard({
  variant = "default",
  hoverable,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  hoverable?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        variantClass[variant],
        hoverable && "glass-hoverable cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
