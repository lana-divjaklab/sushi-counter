import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Trophy, Flame, Plus, Minus, Share2, Users, UtensilsCrossed, Sparkles } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "../convex/_generated/api";
import { getActiveTableCode, getOrCreateClientId, getStoredDisplayName, setActiveTableCode, setStoredDisplayName } from "./lib/local";
import { cn, formatDate, formatRelativeTime } from "./lib/utils";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";

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
    const shareText = `Join my sushi table "${tableState.table.name}" with code ${tableState.table.code}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sushi Counter",
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} — ${window.location.href}`);
        toast.success("Share text copied");
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
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_35%),linear-gradient(180deg,#120f0f_0%,#191414_45%,#0b0b0b_100%)] text-stone-100">
      <Toaster theme="dark" richColors />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-4 sm:max-w-2xl sm:px-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-orange-300">
              <UtensilsCrossed className="size-4" />
              <span className="text-sm font-medium">Sushi Counter</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Eat. Tap. Flex.</h1>
            <p className="mt-1 text-sm text-stone-400">Live table leaderboard for sushi nights.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Lifetime</div>
            <div className="text-xl font-semibold text-white">{personalStats?.totalPieces ?? 0}</div>
            <div className="text-xs text-stone-400">pieces</div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create a table</CardTitle>
              <CardDescription>Start the sushi war and share the code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" maxLength={24} />
              <Input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder="Table name (e.g. Sushi Date Night)" maxLength={40} />
              <Input
                value={caloriesPerPiece}
                onChange={(event) => setCaloriesPerPiece(event.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="Calories per piece"
              />
              <Button className="w-full" onClick={handleCreateTable} disabled={busy === "create"}>
                <Sparkles className="size-4" />
                {busy === "create" ? "Creating..." : "Create table"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join a table</CardTitle>
              <CardDescription>Jump in with a short code from your crew.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" maxLength={24} />
              <Input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Table code"
                maxLength={6}
                className="uppercase tracking-[0.35em]"
              />
              <Button variant="secondary" className="w-full" onClick={handleJoinTable} disabled={busy === "join"}>
                <Users className="size-4" />
                {busy === "join" ? "Joining..." : "Join table"}
              </Button>
            </CardContent>
          </Card>
        </section>

        {activeCode && !tableState && (
          <Card className="mt-4">
            <CardContent className="pt-5 text-sm text-stone-400">Loading table <span className="font-medium text-white">{activeCode}</span>...</CardContent>
          </Card>
        )}

        {tableState && (
          <>
            <Card className="mt-4 overflow-hidden border-orange-400/15 bg-gradient-to-br from-orange-500/10 via-white/5 to-transparent">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{tableState.table.name}</CardTitle>
                    <CardDescription className="mt-1">Table code below — dead simple to share.</CardDescription>
                  </div>
                  <Badge>{tableState.summary.totalPlayers} players</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-stone-500">Share code</div>
                    <div className="mt-1 text-3xl font-semibold tracking-[0.32em] text-white">{tableState.table.code}</div>
                  </div>
                  <Button variant="secondary" size="icon" onClick={shareTable}>
                    <Share2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatTile icon={Trophy} label="Your rank" value={currentRank ? `#${currentRank}` : "—"} />
                  <StatTile icon={UtensilsCrossed} label="Table total" value={tableState.summary.totalPieces} />
                  <StatTile icon={Flame} label="Calories" value={tableState.summary.totalCalories} />
                </div>

                <div className="flex gap-2">
                  <Button variant={view === "counter" ? "default" : "secondary"} className="flex-1" onClick={() => setView("counter")}>Counter</Button>
                  <Button variant={view === "leaderboard" ? "default" : "secondary"} className="flex-1" onClick={() => setView("leaderboard")}>Leaderboard</Button>
                  <Button variant={view === "history" ? "default" : "secondary"} className="flex-1" onClick={() => setView("history")}>History</Button>
                </div>
              </CardContent>
            </Card>

            {view === "counter" && tableState.currentPlayer && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>{tableState.currentPlayer.name}</CardTitle>
                    <CardDescription>Your live sushi count for this table.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 text-center">
                      <div className="text-sm text-stone-400">Current pieces</div>
                      <div className="mt-2 text-7xl font-semibold leading-none text-white">{tableState.currentPlayer.pieces}</div>
                      <div className="mt-3 text-sm text-orange-200">≈ {tableState.currentPlayer.calories} kcal</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick glance</CardTitle>
                    <CardDescription>Good little ego metrics.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-stone-300">
                    <InfoRow label="Pieces / sushi" value={`${tableState.table.caloriesPerPiece} kcal`} />
                    <InfoRow label="Players at table" value={tableState.summary.totalPlayers} />
                    <InfoRow label="Last updated" value={formatRelativeTime(tableState.table.updatedAt)} />
                  </CardContent>
                </Card>
              </div>
            )}

            {view === "leaderboard" && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription>Who’s actually doing damage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-xs text-stone-400">{player.calories} kcal</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-white">{player.pieces}</div>
                        <div className="text-xs text-stone-400">pieces</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {view === "history" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent table action</CardTitle>
                    <CardDescription>Little live event feed.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tableState.recentEvents.length === 0 ? (
                      <div className="text-sm text-stone-400">No sushi logged yet.</div>
                    ) : (
                      tableState.recentEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm">
                          <div>
                            <div className="font-medium text-white">{event.playerName}</div>
                            <div className="text-stone-400">{formatRelativeTime(event.createdAt)}</div>
                          </div>
                          <div className="text-right">
                            <div className={cn("font-semibold", event.delta > 0 ? "text-emerald-300" : "text-rose-300")}>{event.delta > 0 ? `+${event.delta}` : event.delta}</div>
                            <div className="text-stone-400">now {event.resultingPieces}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your past sessions</CardTitle>
                    <CardDescription>Stored for this browser profile.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {personalStats?.sessions.length ? (
                      personalStats.sessions.slice(0, 8).map((session) => (
                        <div key={session.id} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-white">{session.tableName}</div>
                            <Badge className="border-white/10 bg-white/10 text-stone-200">{session.tableCode}</Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-stone-400">
                            <span>{formatDate(session.updatedAt)}</span>
                            <span>{session.pieces} pieces</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-stone-400">No past sessions yet.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={leaveTable}>Leave table view</Button>
            </div>
          </>
        )}
      </div>

      {tableState?.currentPlayer && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-md items-center gap-3 sm:max-w-2xl">
            <Button size="icon" variant="destructive" onClick={() => handleChange(-1)} disabled={busy === "minus"}>
              <Minus className="size-5" />
            </Button>
            <Button size="lg" className="h-14 flex-1 text-lg" onClick={() => handleChange(1)} disabled={busy === "plus"}>
              <Plus className="size-5" />
              Add sushi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <Icon className="mb-3 size-4 text-orange-300" />
      <div className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
