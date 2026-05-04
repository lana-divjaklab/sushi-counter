import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Plus,
  Minus,
  Share2,
  Users,
  Sparkles,
  Table,
  List,
  History,
  ArrowLeft,
  PartyPopper,
  Trophy,
  Flame,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import TableView from "./components/TableView";
import { Maki, MakiCheer, MakiSad } from "./components/Maki";

type View = "counter" | "leaderboard" | "history";

const clientId = getOrCreateClientId();

export default function App() {
  const [displayName, setDisplayName] = useState(getStoredDisplayName());
  const [tableName, setTableName] = useState("");
  const [joinCode, setJoinCode] = useState(getActiveTableCode());
  const [activeCode, setActiveCode] = useState(getActiveTableCode());
  const [caloriesPerPiece, setCaloriesPerPiece] = useState("42");
  const [view, setView] = useState<View>("counter");
  const [busy, setBusy] = useState<null | "create" | "join" | "plus" | "minus">(null);
  const [joinPrompt, setJoinPrompt] = useState<string | null>(null);
  const [qrName, setQrName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const joinedRef = useRef(false);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

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
    return tableState.leaderboard.find((p) => p.isCurrentUser)?.rank ?? null;
  }, [tableState]);

  // Track count changes for confetti animation
  const prevPieces = tableState?.currentPlayer?.pieces ?? 0;
  useEffect(() => {
    if (prevPieces > lastCount && prevPieces > 0 && (prevPieces % 10 === 0 || prevPieces === 1)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
    setLastCount(prevPieces);
  }, [prevPieces]);

  // QR join flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("join");
    if (!codeFromUrl || activeCode) return;

    const normalized = codeFromUrl.trim().toUpperCase();
    setJoinCode(normalized);

    const stored = getStoredDisplayName();
    if (stored && !joinedRef.current) {
      joinedRef.current = true;
      setDisplayName(stored);
      joinTable({ code: normalized, playerName: stored, clientId })
        .then(() => {
          setStoredDisplayName(stored.trim());
          setActiveTableCode(normalized);
          setActiveCode(normalized);
          window.history.replaceState({}, "", window.location.pathname);
          toast.success(`Joined table ${normalized} 🍣`);
        })
        .catch((error) => {
          joinedRef.current = false;
          toast.error(error instanceof Error ? error.message : "Could not join table");
        });
    } else if (!stored) {
      setJoinPrompt(normalized);
      setQrName("");
    }
  }, []);

  const handleQrJoin = useCallback(async () => {
    if (!joinPrompt || !qrName.trim()) {
      toast.error("Enter your name");
      return;
    }
    setBusy("join");
    try {
      const normalized = joinPrompt;
      await joinTable({ code: normalized, playerName: qrName.trim(), clientId });
      setStoredDisplayName(qrName.trim());
      setDisplayName(qrName.trim());
      setActiveTableCode(normalized);
      setActiveCode(normalized);
      setJoinCode(normalized);
      setJoinPrompt(null);
      window.history.replaceState({}, "", window.location.pathname);
      toast.success(`Joined table ${normalized} 🍣`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join table");
    } finally {
      setBusy(null);
    }
  }, [joinPrompt, qrName, joinTable]);

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
      toast.success(`Table ${result.code} is ready! 🎉`);
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
      toast.success(`Joined table ${normalized} 🍣`);
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
    const shareText = `🍣 Join my sushi table "${tableState.table.name}" — use code ${tableState.table.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Sushi Counter", text: shareText, url: joinUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${joinUrl}`);
        toast.success("Share link copied 📋");
      }
    } catch {
      toast.error("Could not share right now");
    }
  }

  function leaveTable() {
    setActiveCode("");
    setActiveTableCode("");
    setJoinCode("");
    setView("counter");
    window.history.replaceState({}, "", window.location.pathname);
  }

  const joinUrl = tableState ? `${window.location.origin}/?join=${tableState.table.code}` : "";

  // Determine Maki expression based on current count
  const makiExpr = useMemo(() => {
    const pieces = tableState?.currentPlayer?.pieces ?? 0;
    if (pieces === 0) return "sad" as const;
    if (pieces >= 50) return "surprised" as const;
    if (pieces >= 20) return "happy" as const;
    return "competitive" as const;
  }, [tableState?.currentPlayer?.pieces]);

  const makiBadge = tableState?.currentPlayer?.pieces ?? undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rice to-rice-dark">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!rounded-2xl !border !border-stone-200 !shadow-lg !font-poppins",
          duration: 2500,
        }}
      />

      {/* ── Confetti overlay ── */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              {["🍣", "🎉", "✨", "🏆", "🎊", "🌟", "🔥"][i % 7]}
            </div>
          ))}
        </div>
      )}

      {/* ── QR join name prompt ── */}
      {joinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <Maki expression="happy" size="lg" showBadge={false} />
              </div>
              <CardTitle className="text-xl">You're invited! 🍣</CardTitle>
              <CardDescription className="mt-1">
                Join table <span className="font-bold tracking-wider text-coral">{joinPrompt}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <Input
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                placeholder="Enter your name"
                maxLength={24}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQrJoin();
                }}
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setJoinPrompt(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleQrJoin} disabled={busy === "join"}>
                  {busy === "join" ? "Joining..." : "Join now ⚡"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-36 pt-4 sm:max-w-2xl sm:px-6">
        {/* ── Header ── */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Maki expression="happy" size="md" showBadge={false} animated={true} />
            <div>
              <h1 className="text-2xl font-fredoka font-bold text-charcoal leading-tight">
                Sushi Counter
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Track. Compete. Dominate.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-stone-200 px-4 py-2.5 text-right shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Lifetime
            </div>
            <div className="text-xl font-fredoka font-bold text-coral">
              {personalStats?.totalPieces ?? 0}
            </div>
            <div className="text-xs text-stone-400">pieces</div>
          </div>
        </header>

        {/* ── Landing: Create / Join ── */}
        {!activeCode && (
          <>
            <div className="text-center mb-6">
              <Maki expression="competitive" size="xl" showBadge={false} animated={true} />
              <h2 className="mt-3 text-lg font-fredoka font-semibold text-charcoal">
                Ready for sushi night?
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Create a table or join one with a code
              </p>
            </div>
            <section className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>🍣 Create a table</CardTitle>
                  <CardDescription>Start the sushi war and share the code.</CardDescription>
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
                    onChange={(e) => setCaloriesPerPiece(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    placeholder="Calories per piece (default 42)"
                  />
                  <Button className="w-full" onClick={handleCreateTable} disabled={busy === "create"}>
                    <Sparkles className="size-4" />
                    {busy === "create" ? "Creating..." : "Create table"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔗 Join a table</CardTitle>
                  <CardDescription>Jump in with a short code from your crew.</CardDescription>
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
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Table code"
                    maxLength={6}
                    className="uppercase tracking-[0.35em] font-mono"
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
          </>
        )}

        {/* ── Loading ── */}
        {activeCode && !tableState && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Maki expression="sleepy" size="xl" showBadge={false} animated={false} />
            <p className="text-sm text-stone-400 font-poppins">
              Loading table <span className="font-bold text-coral">{activeCode}</span>...
            </p>
          </div>
        )}

        {/* ── Inside a table ── */}
        {tableState && (
          <>
            {/* Mini header bar */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={leaveTable}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-charcoal transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  Exit
                </button>
                <span className="text-stone-300 mx-1">|</span>
                <Badge variant="matcha">
                  <Table className="size-3 mr-1" />
                  {tableState.table.name}
                </Badge>
                <span className="text-sm font-mono tracking-widest text-stone-400">
                  {tableState.table.code}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={shareTable}>
                  <Share2 className="size-3" />
                  Share
                </Button>
              </div>
            </div>

            {/* ── Table View (QR table) ── */}
            <TableView
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

            {/* ── View tabs ── */}
            <div className="mt-4 mb-3 flex gap-1.5">
              {(
                [
                  ["counter", "Counter", Plus],
                  ["leaderboard", "Leaderboard", Trophy],
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
                      ? "bg-coral text-white shadow-md shadow-coral/30"
                      : "bg-white text-stone-500 border border-stone-200 hover:border-coral/30 hover:text-charcoal",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Counter Screen ── */}
            {view === "counter" && tableState.currentPlayer && (
              <Card className="overflow-visible">
                <CardContent className="pt-6">
                  {/* Maki & big count */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Maki expression={makiExpr} size="xl" showBadge={makiBadge} animated />
                    <div className="-mt-1">
                      <div className="text-sm text-stone-500 font-medium">Your sushi count</div>
                      <div
                        className="font-fredoka font-bold text-charcoal leading-none mt-1 select-none"
                        style={{ fontSize: "clamp(3rem, 15vw, 5rem)" }}
                      >
                        {tableState.currentPlayer.pieces}
                      </div>
                      <div className="text-sm text-stone-500 mt-1">
                        ≈ {tableState.currentPlayer.calories} kcal
                      </div>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-gradient-to-br from-coral/10 to-white border border-coral/20 p-3 text-center">
                      <Trophy className="size-4 mx-auto text-tamago-dark mb-1" />
                      <div className="text-lg font-fredoka font-bold text-charcoal">
                        {currentRank ? `#${currentRank}` : "—"}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">Rank</div>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-matcha/10 to-white border border-matcha/20 p-3 text-center">
                      <Users className="size-4 mx-auto text-matcha-dark mb-1" />
                      <div className="text-lg font-fredoka font-bold text-charcoal">
                        {tableState.summary.totalPlayers}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">Players</div>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-tamago/10 to-white border border-tamago/20 p-3 text-center">
                      <Flame className="size-4 mx-auto text-salmon mb-1" />
                      <div className="text-lg font-fredoka font-bold text-charcoal">
                        {tableState.summary.totalPieces}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">Total</div>
                    </div>
                  </div>

                  {/* Milestone celebration */}
                  {prevPieces > 0 && prevPieces % 10 === 0 && (
                    <div className="mt-3 text-center animate-bounce-in">
                      <Badge variant="tamago" className="text-xs">
                        <PartyPopper className="size-3 mr-1" />
                        {prevPieces} pieces! You're on fire! 🔥
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Leaderboard Screen ── */}
            {view === "leaderboard" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trophy className="size-4 inline mr-1.5 text-tamago-dark" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription>Who's actually doing damage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tableState.leaderboard.map((player) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all",
                        player.isCurrentUser
                          ? "border-coral/30 bg-gradient-to-r from-coral/5 to-white"
                          : "border-stone-100 bg-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-2xl font-fredoka font-bold",
                            player.rank === 1
                              ? "bg-gradient-to-br from-tamago to-amber-400 text-white shadow-sm"
                              : player.rank === 2
                              ? "bg-gradient-to-br from-stone-300 to-stone-400 text-white"
                              : player.rank === 3
                              ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                              : "bg-stone-100 text-stone-600",
                          )}
                        >
                          #{player.rank}
                        </div>
                        <div>
                          <div className="font-medium text-charcoal">
                            {player.name}
                            {player.isCurrentUser && (
                              <span className="ml-1.5 text-[10px] text-coral font-medium">(you)</span>
                            )}
                          </div>
                          <div className="text-xs text-stone-400">{player.calories} kcal</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-fredoka font-bold text-charcoal">
                          {player.pieces}
                        </div>
                        <div className="text-xs text-stone-400">
                          <span className="inline-block mr-0.5">🍣</span> pieces
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── History Screen ── */}
            {view === "history" && (
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent action</CardTitle>
                    <CardDescription>Live event feed.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tableState.recentEvents.length === 0 ? (
                      <div className="flex flex-col items-center py-6">
                        <MakiSad />
                      </div>
                    ) : (
                      tableState.recentEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm"
                        >
                          <div>
                            <div className="font-medium text-charcoal">{event.playerName}</div>
                            <div className="text-stone-400 text-xs">{formatRelativeTime(event.createdAt)}</div>
                          </div>
                          <div className="text-right">
                            <div
                              className={cn(
                                "font-fredoka font-bold",
                                event.delta > 0 ? "text-matcha-dark" : "text-rose-400",
                              )}
                            >
                              {event.delta > 0 ? `+${event.delta}` : event.delta}
                            </div>
                            <div className="text-stone-400 text-xs">
                              {event.resultingPieces} total
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
                    <CardDescription>Stored for this browser.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {personalStats?.sessions.length ? (
                      personalStats.sessions.slice(0, 8).map((session) => (
                        <div
                          key={session.id}
                          className="rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-charcoal">{session.tableName}</div>
                            <Badge variant="charcoal" className="text-[10px]">
                              {session.tableCode}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-stone-400 text-xs">
                            <span>{formatDate(session.updatedAt)}</span>
                            <span className="font-fredoka text-charcoal">{session.pieces} 🍣</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center py-6">
                        <MakiSad />
                        <p className="text-sm text-stone-400">No past sessions yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Fixed bottom bar (+ / - sushi) ── */}
      {tableState?.currentPlayer && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/90 px-4 py-4 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex w-full max-w-md items-center gap-3 sm:max-w-2xl">
            <Button
              size="icon"
              variant="destructive"
              onClick={() => handleChange(-1)}
              disabled={busy === "minus" || (tableState.currentPlayer?.pieces ?? 0) === 0}
            >
              <Minus className="size-5" />
            </Button>
            <Button
              ref={plusBtnRef}
              size="lg"
              className="h-14 flex-1 text-lg font-fredoka font-semibold"
              onClick={() => handleChange(1)}
              disabled={busy === "plus"}
            >
              <Plus className="size-5" />
              Eat sushi 🍣
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
