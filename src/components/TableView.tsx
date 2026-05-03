import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../lib/utils";

// ── colour palette for player avatars ──
const AVATAR_COLORS = [
  "#FF6B6B", // coral
  "#4ECDC4", // teal
  "#45B7D1", // sky
  "#F9CA24", // 🟡
  "#A29BFE", // lavender
  "#FD79A8", // pink
  "#00B894", // mint
  "#E17055", // terra
  "#6C5CE7", // purple
  "#FDCB6E", // gold
];

interface PlayerSeat {
  id: string;
  name: string;
  pieces: number;
  index: number;
  isCurrentUser: boolean;
}

interface TableViewProps {
  tableName: string;
  tableCode: string;
  players: PlayerSeat[];
  joinUrl: string;
  className?: string;
}

export default function TableView({
  tableName,
  tableCode,
  players,
  joinUrl,
  className,
}: TableViewProps) {
  const [qrOpen, setQrOpen] = useState(false);

  // distribute players around the table ellipse
  const seats = players.map((p, i) => {
    const n = players.length;
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2; // start at 12 o'clock
    // table is wider than tall (rx > ry)
    const rx = 36; // % of container width
    const ry = 28; // % of container height
    return {
      ...p,
      angle,
      // position on the table surface
      tx: 50 + rx * Math.cos(angle),
      ty: 50 + ry * Math.sin(angle),
      // chair position (further out, past the table edge)
      cx: 50 + (rx + 14) * Math.cos(angle),
      cy: 50 + (ry + 14) * Math.sin(angle),
    };
  });

  return (
    <>
      <div
        className={cn(
          "relative mx-auto aspect-[4/3] w-full max-w-lg select-none",
          "rounded-[32px] border-[3px] border-stone-700/60 bg-stone-800/40",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          className,
        )}
      >
        {/* ── table surface ── */}
        <div
          className={cn(
            "absolute inset-[7%] rounded-[28px] overflow-hidden",
            // warm wood table top
            "bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-800",
            "border-[3px] border-amber-900/70",
            "shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]",
            // subtle wood-grain texture via radial gradient
            "bg-[radial-gradient(circle_at_30%_40%,rgba(255,200,100,0.12)_0%,transparent_60%)]",
          )}
        >
          {/* decorative table edge / rim */}
          <div className="absolute inset-[6px] rounded-[22px] border-2 border-amber-600/20" />

          {/* ── player labels on the table ── */}
          {seats.map((seat) => (
            <div
              key={seat.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${seat.tx}%`, top: `${seat.ty}%` }}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1",
                  "border-2 text-xs font-bold shadow-lg backdrop-blur-sm",
                  "transition-transform duration-200 hover:scale-110",
                  seat.isCurrentUser
                    ? "border-orange-400 bg-orange-500/85 text-white shadow-orange-500/30"
                    : "border-white/30 bg-black/65 text-stone-100",
                )}
              >
                {/* avatar dot */}
                <span
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: AVATAR_COLORS[seat.index % AVATAR_COLORS.length] }}
                >
                  {seat.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate max-w-[64px]">{seat.name}</span>
                <span className="tabular-nums opacity-80">· {seat.pieces}🍣</span>
              </div>
            </div>
          ))}

          {/* ── QR code in the centre ── */}
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "rounded-xl bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
              "border-2 border-amber-800/40",
              "transition-transform duration-200 hover:scale-110 active:scale-95",
              "cursor-pointer",
            )}
          >
            <QRCodeSVG value={joinUrl} size={90} level="M" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-amber-100 drop-shadow">
              {tableCode}
            </div>
          </button>
        </div>

        {/* ── chairs around the table ── */}
        {seats.map((seat) => (
          <div
            key={`chair-${seat.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${seat.cx}%`, top: `${seat.cy}%` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              {/* chair back */}
              <div
                className={cn(
                  "size-4 rounded-sm border-2",
                  seat.isCurrentUser
                    ? "border-orange-400 bg-orange-500/60"
                    : "border-stone-400 bg-stone-500/40",
                )}
              />
              {/* chair seat */}
              <div
                className={cn(
                  "size-5 rounded-full border-2",
                  seat.isCurrentUser
                    ? "border-orange-400 bg-orange-500/50"
                    : "border-stone-400 bg-stone-600/40",
                )}
              />
            </div>
          </div>
        ))}

        {/* ── table name on the bottom-right ── */}
        <div className="absolute bottom-2 right-3 text-[11px] font-medium text-stone-500 tracking-wide">
          {tableName}
        </div>
      </div>

      {/* ── QR modal ── */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG value={joinUrl} size={240} level="M" />
            <p className="mt-3 text-center text-sm font-medium text-stone-700">
              Scan to join <span className="font-bold tracking-wider">{tableCode}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
