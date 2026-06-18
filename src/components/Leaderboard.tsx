import React, { useState } from "react";
import { LeaderboardEntry } from "../types";
import { RapperAvatar } from "./AvatarCustomizer";
import { Trophy, Award, Search, Sparkles, TrendingUp, X, Flame, Shield, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from "recharts";

interface Props {
  leaderboard: LeaderboardEntry[];
  userRep: number;
}

export default function Leaderboard({ leaderboard, userRep }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<"rep" | "battles">("rep");

  // Filter entry listings
  const filtered = leaderboard.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEntry = leaderboard.find(e => e.id === selectedEntryId);

  // Generate 30-day historical chart data deterministically based on entry stats
  const chartData = React.useMemo(() => {
    if (!selectedEntry) return [];
    
    const data = [];
    const seed = selectedEntry.id;
    
    // Hash function for deterministic pseudo-random variables
    const getHash = (str: string, index: number) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(Math.sin(hash + index));
    };

    const totalDays = 30;
    const currentRep = selectedEntry.rep;
    const currentWins = selectedEntry.wins;
    const currentLosses = selectedEntry.losses;
    
    // Calculate starting base REP
    const startRep = Math.max(100, Math.floor(currentRep * 0.45));
    
    for (let i = 1; i <= totalDays; i++) {
      const t = i / totalDays;
      
      // Steady progress growth
      let dayRep = startRep + (currentRep - startRep) * t;
      
      // Deterministic wavy fluctuations to look realistic
      const noise = getHash(seed, i);
      const fluctuation = (noise - 0.5) * (currentRep * 0.12);
      
      if (i === totalDays) {
        dayRep = currentRep;
      } else {
        dayRep = Math.max(100, Math.floor(dayRep + fluctuation));
      }
      
      // Sequential battle counts
      let dayWins = Math.round(currentWins * t);
      let dayLosses = Math.round(currentLosses * t);
      
      // Introduce plateaus to mimic real player pauses
      if (i < totalDays) {
        const plateauNoise = getHash(seed, i + 80);
        if (plateauNoise > 0.72 && data.length > 0) {
          const prevWins = data[data.length - 1].wins;
          const prevLosses = data[data.length - 1].losses;
          dayWins = prevWins;
          dayLosses = prevLosses;
        }
      }
      
      if (i === totalDays) {
        dayWins = currentWins;
        dayLosses = currentLosses;
      }

      // Generate dates back in time
      const date = new Date();
      date.setDate(date.getDate() - (totalDays - i));
      const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      data.push({
        name: dateString,
        rep: dayRep,
        wins: dayWins,
        losses: dayLosses
      });
    }
    
    return data;
  }, [selectedEntry]);

  return (
    <div className="space-y-8 text-white p-4">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-500/10 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-wider font-sans text-orange-500">
            Global Street Hall of Fame
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Live worldwide standings tracking underground lyricists. Battle in high stakes cyphers or publish songwriting documents to climb global reputation scores!
          </p>
        </div>

        {/* Searching bar */}
        <div className="relative max-w-xs w-full self-start md:self-center">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search Raper Tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-neutral-850 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/70"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEADERBOARD RANKINGS TABLE */}
        <div className="lg:col-span-8 bg-zinc-950 border border-neutral-800 rounded-2xl p-5 overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-900 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Worldwide Rankings
            </span>
            <span className="font-mono text-[10px] text-neutral-500">SORT BY REP POINT</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-neutral-500 text-center py-12">
                No rappers matched search parameters.
              </div>
            ) : (
              filtered.map((entry, index) => {
                const rank = index + 1;
                const active = entry.id === selectedEntryId;
                const isUser = entry.isUser;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      active 
                        ? 'border-orange-500 bg-orange-500/5' 
                        : isUser 
                          ? 'border-orange-500/45 bg-zinc-900/60' 
                          : 'border-neutral-900 bg-zinc-900 hover:border-neutral-800'
                    }`}
                  >
                    {/* Rank / Profile Block */}
                    <div className="flex items-center gap-4">
                      {/* Ranking digits / Podium badge icons */}
                      <div className="w-8 flex items-center justify-center font-mono font-black text-sm">
                        {rank === 1 && <span className="text-xl" title="Crown Pioneer">👑</span>}
                        {rank === 2 && <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 font-bold" title="Silver Mic">2nd</span>}
                        {rank === 3 && <span className="text-xs bg-amber-950/40 text-amber-600 border border-amber-900/20 px-2 py-0.5 rounded font-bold" title="Bronze Vinyl">3rd</span>}
                        {rank > 3 && <span className="text-neutral-500 text-xs">#{rank}</span>}
                      </div>

                      {/* Headshot */}
                      <div className="w-10 h-10 shrink-0">
                        <RapperAvatar config={entry.avatar} />
                      </div>

                      <div className="text-left">
                        <div className="font-extrabold text-xs flex items-center gap-1.5">
                          <span>{entry.name}</span>
                          {isUser && (
                            <span className="text-[8px] bg-orange-500 text-black px-1.5 py-0.2 font-black rounded-full uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1 uppercase font-mono">
                          {entry.wins}W - {entry.losses}L (STREAK: {entry.streak})
                        </div>
                      </div>
                    </div>

                    {/* Score REP Metrics */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-orange-500">{entry.rep.toLocaleString()}</div>
                        <div className="text-[9px] uppercase text-neutral-400 mt-0.5">REP</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono text-neutral-300">${entry.cash.toLocaleString()}</div>
                        <div className="text-[9px] uppercase text-neutral-400 mt-0.5">FLOW</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-600 shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS SPECIFICATION PANEL (BIO & COMPARISON DESKS) */}
        <div className="lg:col-span-4 bg-zinc-950 border border-neutral-800 rounded-2xl p-6 text-left shadow-2xl relative min-h-[450px]">
          {selectedEntry ? (
            <div className="space-y-6">
              
              {/* Header profile details */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                  <RapperAvatar config={selectedEntry.avatar} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-orange-500 uppercase tracking-wide">{selectedEntry.name}</h4>
                  <p className="text-[10px] text-neutral-400 mt-1 font-mono uppercase">Streak Factor: {selectedEntry.streak} battles</p>
                </div>
              </div>

              {/* Bio description text box */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Artist Bio</span>
                <p className="text-xs bg-neutral-900 border border-neutral-850 p-3 rounded-xl text-neutral-300 leading-relaxed font-sans">
                  {selectedEntry.bio || "No biography files drafted yet. This artist maintains silent focus."}
                </p>
              </div>

              {/* Grid battle specs stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-850">
                  <div className="text-[9px] uppercase font-bold text-neutral-400">Wins</div>
                  <div className="text-base font-black font-mono mt-1 text-emerald-500">{selectedEntry.wins}</div>
                </div>
                <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-850">
                  <div className="text-[9px] uppercase font-bold text-neutral-400">Losses</div>
                  <div className="text-base font-black font-mono mt-1 text-red-500">{selectedEntry.losses}</div>
                </div>
                <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-850">
                  <div className="text-[9px] uppercase font-bold text-neutral-400">Total Liquid</div>
                  <div className="text-base font-black font-mono mt-1 text-white">${selectedEntry.cash.toLocaleString()}</div>
                </div>
                <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-850 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-orange-500" /> Win Rate
                  </div>
                  <div className="text-base font-black font-mono text-orange-500">
                    {Math.floor((selectedEntry.wins / (selectedEntry.wins + selectedEntry.losses || 1)) * 100)}%
                  </div>
                </div>
              </div>

              {/* Performance history graphical charts */}
              <div className="border-t border-neutral-950 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                    30-Day Performance History
                  </span>
                  
                  <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-800 shrink-0">
                    <button
                      onClick={() => setChartTab("rep")}
                      className={`px-2 py-0.5 text-[9px] uppercase font-black tracking-wider rounded transition-all cursor-pointer ${
                        chartTab === "rep" 
                          ? "bg-orange-500 text-black" 
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      REP
                    </button>
                    <button
                      onClick={() => setChartTab("battles")}
                      className={`px-2 py-0.5 text-[9px] uppercase font-black tracking-wider rounded transition-all cursor-pointer ${
                        chartTab === "battles" 
                          ? "bg-orange-500 text-black" 
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Record
                    </button>
                  </div>
                </div>

                <div className="h-[150px] w-full bg-neutral-950/40 rounded-xl border border-neutral-900 p-2 relative overflow-hidden flex flex-col justify-center">
                  {chartTab === "rep" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="selectedRapperRepGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1d1d20" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#52525b" 
                          fontSize={8}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#52525b" 
                          fontSize={8} 
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '9px' }}
                          labelClassName="font-mono text-[9px] font-bold text-neutral-400"
                        />
                        <Area type="monotone" dataKey="rep" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#selectedRapperRepGlow)" name="REP Growth" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1d1d20" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#52525b" 
                          fontSize={8}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#52525b" 
                          fontSize={8} 
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '9px' }}
                          labelClassName="font-mono text-[9px] font-bold text-neutral-400"
                        />
                        <Bar dataKey="wins" fill="#10b981" name="Wins Accum." radius={[2, 2, 0, 0]} />
                        <Bar dataKey="losses" fill="#ef4444" name="Losses Accum." radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Dynamic decorative element */}
              <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 text-[10px] text-neutral-400 leading-relaxed">
                Rival verified on SpitFire network. Duel them in the cypher to steal currency or reputation.
              </div>

            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <Trophy className="w-10 h-10 text-neutral-600 mb-3 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Inspect Performers</p>
              <p className="text-[11px] text-neutral-600 mt-1 max-w-[180px] mx-auto">
                Select any tag profile on the global standings to review customized SVG configurations and complete stats.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
