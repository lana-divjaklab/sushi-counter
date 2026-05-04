import { cn } from "../lib/utils";

type MakiExpression = "happy" | "competitive" | "surprised" | "sleepy" | "sad";

interface MakiProps {
  expression?: MakiExpression;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean | number;
  animated?: boolean;
  type?: "logo" | "hero";
}

const sizeMap = {
  sm: { img: 48, badgeSize: 18, badgeFont: 9 },
  md: { img: 64, badgeSize: 22, badgeFont: 10 },
  lg: { img: 96, badgeSize: 26, badgeFont: 12 },
  xl: { img: 140, badgeSize: 32, badgeFont: 14 },
};

const expressionLabel: Record<MakiExpression, string> = {
  happy: "😊",
  competitive: "😤",
  surprised: "😮",
  sleepy: "😴",
  sad: "😢",
};

export function Maki({
  expression = "happy",
  size = "lg",
  className,
  showBadge,
  animated = true,
  type = "logo",
}: MakiProps) {
  const s = sizeMap[size];
  const src = type === "hero" ? "/maki-hero.jpg" : "/maki-logo.jpg";
  // For different expressions, overlay the emoji instead (image is static happy)
  const showExpression = expression !== "happy";

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center select-none",
        animated && "transition-all duration-300 hover:scale-105",
        className,
      )}
    >
      {/* Main image */}
      <img
        src={src}
        alt="Maki the sushi mascot"
        className="rounded-2xl object-cover"
        style={{ width: s.img, height: s.img }}
        draggable={false}
      />

      {/* Expression emoji overlay — only when not happy */}
      {showExpression && (
        <div
          className="absolute -top-1 -right-1 flex items-center justify-center bg-white rounded-full shadow-sm border border-stone-200"
          style={{ width: s.badgeSize + 4, height: s.badgeSize + 4, fontSize: s.badgeFont + 2 }}
        >
          {expressionLabel[expression]}
        </div>
      )}

      {/* Number badge */}
      {showBadge !== false && typeof showBadge === "number" && (
        <div
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-coral text-white font-bold shadow-md border-2 border-white font-fredoka"
          style={{ width: s.badgeSize, height: s.badgeSize, fontSize: s.badgeFont }}
        >
          {showBadge}
        </div>
      )}
    </div>
  );
}

// Maki wrapper — specific sadness state
export function MakiSad({ className, size = "xl" }: { className?: string; size?: MakiProps["size"] }) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <img
          src="/maki-logo.jpg"
          alt="Maki sad"
          className="rounded-2xl object-cover grayscale opacity-60"
          style={{ width: s.img, height: s.img }}
          draggable={false}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">😢</span>
        </div>
      </div>
      <p className="text-stone-400 text-sm">No sushi yet... 😢</p>
    </div>
  );
}
