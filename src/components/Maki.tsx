import { cn } from "../lib/utils";

type MakiExpression = "happy" | "competitive" | "surprised" | "sleepy" | "sad";

interface MakiProps {
  expression?: MakiExpression;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean | number;
  animated?: boolean;
}

const expressionConfig: Record<MakiExpression, { eyes: string; mouth: string; label: string }> = {
  happy: {
    eyes: "◕◕",
    mouth: "ω",
    label: "😊",
  },
  competitive: {
    eyes: "◣◢",
    mouth: "Д",
    label: "😤",
  },
  surprised: {
    eyes: "◉◉",
    mouth: "〇",
    label: "😮",
  },
  sleepy: {
    eyes: "﹏﹏",
    mouth: "з",
    label: "😴",
  },
  sad: {
    eyes: "◕︿◕",
    mouth: "ε",
    label: "😢",
  },
};

const sizeMap = {
  sm: { fontSize: 10, badgeSize: 16, badgeFont: 8 },
  md: { fontSize: 14, badgeSize: 20, badgeFont: 10 },
  lg: { fontSize: 18, badgeSize: 26, badgeFont: 12 },
  xl: { fontSize: 24, badgeSize: 32, badgeFont: 14 },
};

export function Maki({
  expression = "happy",
  size = "lg",
  className,
  showBadge,
  animated = true,
}: MakiProps) {
  const config = expressionConfig[expression];
  const s = sizeMap[size];

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center select-none",
        animated && "transition-transform duration-300 hover:scale-110",
        className,
      )}
    >
      {/* rice body */}
      <div
        className="relative rounded-full bg-gradient-to-b from-white to-stone-100 shadow-md flex items-center justify-center"
        style={{
          width: s.fontSize * 4.5,
          height: s.fontSize * 4.5,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        {/* salmon topping */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: "70%",
            height: "35%",
            background: "linear-gradient(135deg, #FF8C69, #FF6B6B)",
            borderRadius: "50% 50% 40% 40%",
          }}
        >
          {/* salmon lines */}
          <div
            className="absolute inset-x-0 bottom-1 h-[2px] mx-auto rounded-full opacity-40"
            style={{ background: "repeating-linear-gradient(90deg, #fff 0px, #fff 3px, transparent 3px, transparent 6px)", width: "60%", left: "20%" }}
          />
        </div>

        {/* nori belt */}
        <div
          className="absolute bottom-[25%] left-[10%] right-[10%] h-[2px] rounded-full"
          style={{ background: "#2D5A27" }}
        />

        {/* face */}
        <div className="relative z-10 flex flex-col items-center" style={{ marginTop: s.fontSize * 0.5 }}>
          {/* eyes */}
          <div
            className="font-bold tracking-wider text-stone-800"
            style={{ fontSize: s.fontSize * 1.1, lineHeight: 1 }}
          >
            {config.eyes}
          </div>
          {/* mouth */}
          <div
            className="text-stone-700"
            style={{ fontSize: s.fontSize, lineHeight: 1, marginTop: -2 }}
          >
            {config.mouth}
          </div>
        </div>
      </div>

      {/* expression emoji badge */}
      <div
        className="absolute -top-1 -right-1 text-lg"
        style={{ fontSize: s.fontSize * 1.2 }}
      >
        {config.label}
      </div>

      {/* number badge */}
      {showBadge !== false && (
        <div
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-[#FF6B6B] text-white font-bold shadow-md border-2 border-white"
          style={{
            width: s.badgeSize,
            height: s.badgeSize,
            fontSize: s.badgeFont,
          }}
        >
          {typeof showBadge === "number" ? showBadge : "~"}
        </div>
      )}
    </div>
  );
}

// Maki in a cheerleader pose — used on the counter screen
export function MakiCheer({ count, className }: { count: number; className?: string }) {
  const expr = count >= 50 ? "surprised" : count >= 20 ? "happy" : "competitive";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Maki expression={expr} size="sm" showBadge={false} />
      <div className="flex flex-col">
        <Maki expression="happy" size="sm" showBadge={false} />
      </div>
      <Maki expression={expr === "surprised" ? "happy" : "competitive"} size="sm" showBadge={false} />
    </div>
  );
}

// Maki sadness — empty state
export function MakiSad({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Maki expression="sad" size="xl" showBadge={false} animated={false} />
      <p className="text-stone-400 text-sm">No sushi yet... 😢</p>
    </div>
  );
}
