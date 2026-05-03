import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Plus,
  Minus,
  Share2,
  Users,
  UtensilsCrossed,
  Sparkles,
  Table,
  List,
  History,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "../convex/_generated/api";
import {
  getActiveTableCode,
  getOrCreateClientId,
  getStoredDisplayName,
  setActiveTableCode,
  setStoredDisplayName,
} from "./lib/local";
import { cn, formatDate, formatRelativeTime } from "./lib/utils";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import TableView from "./components/TableView";

type View = "table" | "leaderboard" | "history";

const clientId = getOrCreateClientId();

export default function App() {
  const [displayName, setDisplayName] = useState(getStoredDisplayName());
  const [tableName, setTableName] = useState("");
  const [joinCode, setJoinCode] = useState(getActiveTableCode());
  const [activeCode, setActiveCode] = useState(getActiveTableCode());
  const [caloriesPerPiece, setCaloriesPerPiece] = useState("42");
  const [view, setView] = useState<View>("table");
  const [busy, setBusy] = useState<null | "create" | "join" | "plus" | "minus">(null);

  const createTable = useMutation(api.tables.createTable);
  const joinTable = useMutation(api.tables.joinTable);
  const changeCount = useMutation(api.tables.changeCount);

  const tableState = useQuery(
    api.tables.getTableState,
    activeCode ? { code: activeCode, clientId } : "skip",
  );
  const personalStats = useQuery(api.tables.getPersonalStats, { clientId });

  const currentRank = useMemo(() => {
    if (!tableState?.currentPlayer) return null;
    return tableState.leaderboard.find((player) => player.isCurrentUser)?.rank ?? null;
  }, [tableState]);

  // ── auto-join from URL param ?join=CODE ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("join");
    if (codeFromUrl && !activeCode) {
      setJoinCode(codeFromUrl.toUpperCase());
      // if we already have a display name, auto-join
      const stored = getStoredDisplayName();
      if (stored) {
        setDisplayName(stored);
        // small delay so the component is ready
        const timer = setTimeout(() => {
          const btn = document.getElementById("auto-join-trigger");
          btn?.click();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, []); // only on mount

  async function handleCreateTable() {
    if (!displayName.trim()) {
      toast.error("Pick a name first");
      return;
    }
    if (!tableName.trim()) {
      toast.error("Give the table a name");
      return;
    }

    setBusy("create");
    try {
      const result = await createTable({
        tableName,
        playerName: displayName,
        clientId,
        caloriesPerPiece: Number(caloriesPerPiece) || 42,
      });
      setStoredDisplayName(displayName.trim());
      setActiveTableCode(result.code);
      setActiveCode(result.code);
      setJoinCode(result.code);
      setTableName("");
      toast.success(`Table ${result.code} is ready`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create table");
    } finally {
      setBusy(null);
    }
  }

  async function handleJoinTable() {
    if (!displayName.trim()) {
      toast.error("Pick a name first");
      return;
    }
    if (!joinCode.trim()) {
      toast.error("Enter a table code");
      return;
    }

    setBusy("join");
    try {
      const normalized = joinCode.trim().toUpperCase();
      await joinTable({ code: normalized, playerName: displayName, clientId });
      setStoredDisplayName(displayName.trim());
      setActiveTableCode(normalized);
      setActiveCode(normalized);
      setJoinCode(normalized);
      toast.success(`Joined table ${normalized}`);
      // clean URL — remove ?join= param
      window.history.replaceState({}, "", window.location.pathname);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join table");
    } finally {
      setBusy(null);
    }
  }

  async function handleChange(delta: 1 | -1) {
    if (!activeCode) return;
    setBusy(delta === 1 ? "plus" : "minus");
    try {
      await changeCount({ code: activeCode, clientId, delta });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update count");
    } finally {
      setBusy(null);
    }
  }

  async function shareTable() {
    if (!tableState) return;
    const joinUrl = `${window.location.origin}/?join=${tableState.table.code}`;
    const shareText = `Join my sushi table "${tableState.table.name}" — scan the QR or use code ${tableState.table.code}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sushi Counter",
          text: shareText,
          url: joinUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${joinUrl}`);
        toast.success("Share link copied");
      }
    } catch {
      toast.error("Could not share right now");
    }
  }

  function leaveTable() {
    setActiveCode("");
    setActiveTableCode("");
    setJoinCode("");
    setView("table");
    window.history.replaceState({}, "", window.location.pathname);
  }

  const joinUrl = tableState
    ? `${window.location.origin}/?join=${tableState.table.code}`
    : "";

  // ── render ──
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_35%),linear-gradient(180deg,#120f0f_0%,#191414_45%,#0b0b0b_100%)] text-stone-100">
      <Toaster theme="dark" richColors />

      {/* hidden button to trigger auto-join from URL */}
      {joinCode && !activeCode && (
        <button
          id="auto-join-trigger"
          className="hidden"
          onClick={handleJoinTable}
          type="button"
        />
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-32 pt-4 sm:max-w-2xl sm:px-6">
        {/* ── header ── */}
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-orange-300">
              <UtensilsCrossed className="size-4" />
              <span className="text-sm font-medium">Sushi Counter</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Eat. Tap. Flex.
            </h1>
            <p className="mt-1 text-sm text-stone-400">
              Live table leaderboard for sushi nights.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Lifetime
            </div>
            <div className="text-xl font-semibold text-white">
              {personalStats?.totalPieces ?? 0}
            </div>
            <div className="text-xs text-stone-400">pieces</div>
          </div>
        </header>

        {/* ── landing: create / join ── */}
        {!activeCode && (
          <section className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create a table</CardTitle>
                <CardDescription>
                  Start the sushi war and share the code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={24}
                />
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Table name (e.g. Sushi Date Night)"
                  maxLength={40}
                />
                <Input
                  value={caloriesPerPiece}
                  onChange={(e) =>
                    setCaloriesPerPiece(
                      e.target.value.replace(/[^0-9]/g, ""),
                    )
                  }
                  inputMode="numeric"
                  placeholder="Calories per piece"
                />
                <Button
                  className="w-full"
                  onClick={handleCreateTable}
                  disabled={busy === "create"}
                >
                  <Sparkles className="size-4" />
                  {busy === "create" ? "Creating..." : "Create table"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join a table</CardTitle>
                <CardDescription>
                  Jump in with a short code from your crew.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={24}
                />
                <Input
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase())
                  }
                  placeholder="Table code"
                  maxLength={6}
                  className="uppercase tracking-[0.35em]"
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleJoinTable}
                  disabled={busy === "join"}
                >
                  <Users className="size-4" />
                  {busy === "join" ? "Joining..." : "Join table"}
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── loading ── */}
        {activeCode && !tableState && (
          <Card className="mt-4">
            <CardContent className="pt-5 text-sm text-stone-400">
              Loading table{" "}
              <span className="font-medium text-white">{activeCode}</span>...
            </CardContent>
          </Card>
        )}

        {/* ── inside a table ── */}
        {tableState && (
          <>
            {/* mini header bar */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className="border-amber-600/20 bg-amber-600/15 text-amber-200">
                  Table
                </Badge>
                <span className="text-lg font-semibold tracking-tight text-white">
                  {tableState.table.name}
                </span>
                <span className="text-sm font-mono tracking-widest text-stone-500">
                  {tableState.table.code}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={shareTable}
                >
                  <Share2 className="size-3" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-stone-400"
                  onClick={leaveTable}
                >
                  Leave
                </Button>
              </div>
            </div>

            {/* ── the big table view ── */}
            <TableView
              tableName={tableState.table.name}
              tableCode={tableState.table.code}
              players={tableState.leaderboard.map((p) => ({
                id: p.id,
                name: p.name,
                pieces: p.pieces,
                index: p.rank - 1,
                isCurrentUser: p.isCurrentUser,
              }))}
              joinUrl={joinUrl}
            />

            {/* ── tab bar ── */}
            <div className="mt-4 mb-3 flex gap-1.5">
              {(
                [
                  ["table", "Table", Table],
                  ["leaderboard", "Leaderboard", List],
                  ["history", "History", History],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key as View)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all",
                    view === key
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "bg-white/8 text-stone-400 hover:bg-white/12 hover:text-stone-200",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── leaderboard panel ── */}
            {view === "leaderboard" && (
              <Card className="mt-1">
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription>
                    Who's actually doing damage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tableState.leaderboard.map((player) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3",
                        player.isCurrentUser
                          ? "border-orange-400/30 bg-orange-400/10"
                          : "border-white/10 bg-black/15",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                          #{player.rank}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {player.name}
                          </div>
                          <div className="text-xs text-stone-400">
                            {player.calories} kcal
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-white">
                          {player.pieces}
                        </div>
                        <div className="text-xs text-stone-400">pieces</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── history panel ── */}
            {view === "history" && (
              <div className="mt-1 grid gap-4 sm:grid-cols-[1fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent table action</CardTitle>
                    <CardDescription>
                      Little live event feed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tableState.recentEvents.length === 0 ? (
                      <div className="text-sm text-stone-400">
                        No sushi logged yet.
                      </div>
                    ) : (
                      tableState.recentEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm"
                        >
                          <div>
                            <div className="font-medium text-white">
                              {event.playerName}
                            </div>
                            <div className="text-stone-400">
                              {formatRelativeTime(event.createdAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={cn(
                                "font-semibold",
                                event.delta > 0
                                  ? "text-emerald-300"
                                  : "text-rose-300",
                              )}
                            >
                              {event.delta > 0
                                ? `+${event.delta}`
                                : event.delta}
                            </div>
                            <div className="text-stone-400">
                              now {event.resultingPieces}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your past sessions</CardTitle>
                    <CardDescription>
                      Stored for this browser profile.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {personalStats?.sessions.length ? (
                      personalStats.sessions
                        .slice(0, 8)
                        .map((session) => (
                          <div
                            key={session.id}
                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-white">
                                {session.tableName}
                              </div>
                              <Badge className="border-white/10 bg-white/10 text-stone-200">
                                {session.tableCode}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-stone-400">
                              <span>
                                {formatDate(session.updatedAt)}
                              </span>
                              <span>{session.pieces} pieces</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-sm text-stone-400">
                        No past sessions yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── table panel (counter card) ── */}
            {view === "table" && tableState.currentPlayer && (
              <Card className="mt-1 overflow-hidden">
                <CardHeader>
                  <CardTitle>{tableState.currentPlayer.name}</CardTitle>
                  <CardDescription>
                    Your live sushi count for this table.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* big piece counter */}
                    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 text-center">
                      <div className="text-sm text-stone-400">
                        Current pieces
                      </div>
                      <div className="mt-2 text-6xl font-semibold leading-none text-white">
                        {tableState.currentPlayer.pieces}
                      </div>
                      <div className="mt-3 text-sm text-orange-200">
                        ≈ {tableState.currentPlayer.calories} kcal
                      </div>
                    </div>

                    {/* quick stats */}
                    <div className="flex flex-col justify-center gap-2 text-sm text-stone-300">
                      <InfoRow
                        label="Your rank"
                        value={currentRank ? `#${currentRank}` : "—"}
                      />
                      <InfoRow
                        label="Pieces / sushi"
                        value={`${tableState.table.caloriesPerPiece} kcal`}
                      />
                      <InfoRow
                        label="Players"
                        value={tableState.summary.totalPlayers}
                      />
                      <InfoRow
                        label="Table total"
                        value={tableState.summary.totalPieces}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ── fixed bottom bar (add / remove sushi) ── */}
      {tableState?.currentPlayer && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-md items-center gap-3 sm:max-w-2xl">
            <Button
              size="icon"
              variant="destructive"
              onClick={() => handleChange(-1)}
              disabled={busy === "minus"}
            >
              <Minus className="size-5" />
            </Button>
            <Button
              size="lg"
              className="h-14 flex-1 text-lg"
              onClick={() => handleChange(1)}
              disabled={busy === "plus"}
            >
              <Plus className="size-5" />
              Add sushi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
