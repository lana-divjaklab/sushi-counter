import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../lib/utils";

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#F9CA24",
  "#A29BFE", "#FD79A8", "#00B894", "#E17055",
  "#6C5CE7", "#FDCB6E",
];

interface PlayerSeat {
  id: string;
  name: string;
  pieces: number;
  index: number;
  isCurrentUser: boolean;
}

interface TableViewProps {
  tableCode: string;
  players: PlayerSeat[];
  joinUrl: string;
  className?: string;
}

export default function TableView({
  tableCode,
  players,
  joinUrl,
  className,
}: TableViewProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const isMobile = window.innerWidth < 480;
    setMobile(isMobile);
  }, []);

  const qrSize = mobile ? 60 : 90;

  // position players around the container rim (outside table surface)
  const seats = players.map((p, i) => {
    const n = players.length;
    // start at top centre, spread clockwise
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;

    // Player labels sit in the "rim" — the dark area around the table.
    // Table surface is inset 7% from container.
    // Players' labels go just outside or straddling that edge.
    const rimRx = 42;
    const rimRy = 36;

    // chairs sit a bit further out
    const chairRx = rimRx + 12;
    const chairRy = rimRy + 12;

    return {
      ...p,
      angle,
      // label position in the rim
      lx: 50 + rimRx * Math.cos(angle),
      ly: 50 + rimRy * Math.sin(angle),
      // chair position
      cx: 50 + chairRx * Math.cos(angle),
      cy: 50 + chairRy * Math.sin(angle),
    };
  });

  return (
    <>
      {/* ── wrapper ── */}
      <div
        ref={ref}
        className={cn(
          "relative mx-auto aspect-[4/3] w-full max-w-lg select-none",
          "rounded-[32px] border-[3px] border-stone-700/60 bg-stone-800/40",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          className,
        )}
      >
        {/* ── chairs ── */}
        {seats.map((seat) => (
          <div
            key={`chair-${seat.id}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${seat.cx}%`, top: `${seat.cy}%` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              {/* chair back */}
              <div
                className={cn(
                  "size-[10px] rounded-sm border",
                  seat.isCurrentUser
                    ? "border-orange-400 bg-orange-500/50"
                    : "border-stone-500 bg-stone-600/40",
                )}
              />
              {/* chair seat */}
              <div
                className={cn(
                  "size-[14px] rounded-full border",
                  seat.isCurrentUser
                    ? "border-orange-400 bg-orange-500/40"
                    : "border-stone-500 bg-stone-700/40",
                )}
              />
            </div>
          </div>
        ))}

        {/* ── player labels — straddle the table edge ── */}
        {seats.map((seat) => {
          const shortName = seat.name.length > 8
            ? seat.name.slice(0, 7) + "…"
            : seat.name;

          return (
            <div
              key={`label-${seat.id}`}
              className={cn(
                "absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none",
              )}
              style={{ left: `${seat.lx}%`, top: `${seat.ly}%` }}
            >
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full",
                  "border text-[10px] font-bold shadow-lg backdrop-blur-sm",
                  "leading-none",
                  seat.isCurrentUser
                    ? "border-orange-400 bg-orange-500/85 text-white shadow-orange-500/30"
                    : "border-white/20 bg-black/60 text-white",
                )}
              >
                {/* avatar dot */}
                <span
                  className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: AVATAR_COLORS[seat.index % AVATAR_COLORS.length],
                  }}
                >
                  {seat.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate max-w-12 px-0.5">{shortName}</span>
                <span className="tabular-nums pr-1.5 opacity-85">{seat.pieces}🍣</span>
              </div>
            </div>
          );
        })}

        {/* ── table surface ── */}
        <div
          className="absolute inset-[7%] rounded-[28px] overflow-hidden
            bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-800
            border-[3px] border-amber-900/70
            shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]
            bg-[radial-gradient(circle_at_30%_40%,rgba(255,200,100,0.12)_0%,transparent_60%)]"
        >
          {/* rim decoration */}
          <div className="absolute inset-[6px] rounded-[22px] border-2 border-amber-600/20" />

          {/* ── QR code ── */}
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
            {mounted && <QRCodeSVG value={joinUrl} size={qrSize} level="M" />}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 text-[9px] font-semibold text-amber-100 drop-shadow whitespace-nowrap",
                mobile ? "-bottom-4" : "-bottom-5",
              )}
            >
              {tableCode}
            </div>
          </button>
        </div>

        {/* ── table name ── */}
        <div className="absolute bottom-2 left-3 text-[10px] font-medium text-stone-500 tracking-wide">
          {players.length} at table
        </div>
      </div>

      {/* ── QR modal ── */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="rounded-2xl bg-white p-5 shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG value={joinUrl} size={220} level="M" />
            <p className="mt-3 text-center text-sm font-medium text-stone-700">
              Scan to join <span className="font-bold tracking-wider">{tableCode}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
