import React, { useState } from "react";
import { BattleHistoryItem } from "../types";
import { 
  Trophy, 
  Flame, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  TrendingUp,
  Percent,
  Coins,
  Shield,
  Activity,
  Award
} from "lucide-react";

interface BattleHistoryProps {
  history?: BattleHistoryItem[];
  onNavigateToArena: () => void;
}

export default function BattleHistory({ history = [], onNavigateToArena }: BattleHistoryProps) {
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Process data
  const totalBattles = history.length;
  const wins = history.filter(item => item.outcome === "win").length;
  const losses = history.filter(item => item.outcome === "loss").length;
  const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
  
  const highestPlayerScore = totalBattles > 0 
    ? Math.max(...history.map(h => h.playerScore)) 
    : 0;

  const totalStakesWagered = history.reduce((sum, item) => sum + item.stake, 0);

  // Filter items
  const filteredHistory = history.filter(item => {
    const matchesFilter = 
      filter === "all" ||
      (filter === "win" && item.outcome === "win") ||
      (filter === "loss" && item.outcome === "loss");

    const matchesSearch = item.opponentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div id="battle_history_component" className="bg-[#0C0C0C] border border-neutral-800 rounded-3xl p-6 space-y-6 text-left relative overflow-hidden shadow-xl">
      {/* Dynamic Background Spotlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#10b981]/5 blur-[90px] rounded-full pointer-events-none" />

      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-900 z-10 relative">
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Bodied
          </h2>
          <p className="text-xs text-neutral-400">
            Performance records of your past multi-syllabic street clashes and knockouts
          </p>
        </div>

        {/* Action Controls and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === "all"
                ? "bg-orange-600 text-black shadow-md shadow-orange-500/10"
                : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("win")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === "win"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/35"
                : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-800"
            }`}
          >
            Wins
          </button>
          <button
            onClick={() => setFilter("loss")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === "loss"
                ? "bg-red-900/20 text-red-400 border border-red-500/35"
                : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-800"
            }`}
          >
            Losses
          </button>
        </div>
      </div>

      {/* Mini Stats Banner */}
      {totalBattles > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-950/40 border border-neutral-850 rounded-2xl z-10 relative">
          <div className="space-y-1 border-r border-neutral-900 pr-2">
            <div className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              Outcome Rate
            </div>
            <div className="text-lg font-mono font-bold text-emerald-500">
              {winRate}% <span className="text-[10px] text-neutral-400 font-sans">W/L</span>
            </div>
          </div>

          <div className="space-y-1 md:border-r border-neutral-900 pr-2">
            <div className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              Peak Score
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {highestPlayerScore} <span className="text-[10px] text-orange-400 font-sans">PTS</span>
            </div>
          </div>

          <div className="space-y-1 border-r border-neutral-900 pr-2 pt-2 md:pt-0">
            <div className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-neutral-400" />
              Stakes Pool
            </div>
            <div className="text-lg font-mono font-bold text-orange-500">
              ${totalStakesWagered} <span className="text-[10px] text-neutral-400 font-sans">FLOW</span>
            </div>
          </div>

          <div className="space-y-1 pr-2 pt-2 md:pt-0">
            <div className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#10b981]" />
              Duels Run
            </div>
            <div className="text-lg font-mono font-bold text-neutral-300">
              {totalBattles} <span className="text-[10px] text-neutral-400 font-sans">Fights</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter battles by opponent name..."
          className="w-full bg-neutral-950 text-xs text-white placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-xl border border-neutral-850 focus:outline-none focus:border-orange-500 transition-all font-sans"
        />
      </div>

      {/* Main Table / List Container */}
      <div className="space-y-3 z-10 relative">
        {filteredHistory.length === 0 ? (
          <div className="p-10 border border-dashed border-neutral-850 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600">
              <Award className="w-6 h-6 text-neutral-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-300">No matching Bodied logs found</p>
              <p className="text-[11px] text-neutral-500 max-w-sm">
                {history.length === 0 
                  ? "You haven't fought any battles in the high-stakes arena yet. Gear up and challenge an opponent to body them!"
                  : "Try adjusting your search criteria or filter tabs above to see prior matches."}
              </p>
            </div>
            {history.length === 0 && (
              <button
                onClick={onNavigateToArena}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-black text-[11px] uppercase rounded-lg transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Go to Rap Arena &rarr;
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredHistory.map((match) => {
              const isWin = match.outcome === "win";
              return (
                <div 
                  key={match.id}
                  className="p-3.5 bg-neutral-950/80 border border-neutral-850 hover:border-neutral-800 rounded-xl flex items-center justify-between gap-4 transition-all duration-150 relative"
                >
                  {/* Left Side: Opponent Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 ${
                      isWin 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                      {isWin ? "W" : "L"}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">
                          vs {match.opponentName}
                        </span>
                        
                        {/* Rating/Verdict badges */}
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isWin 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                            : "bg-red-500/10 text-red-400 border border-red-500/15"
                        }`}>
                          {isWin ? "Victory" : "Knockout"}
                        </span>
                      </div>

                      {/* Score metrics & date details */}
                      <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-2 font-mono">
                        <span className="flex items-center gap-1 text-orange-400">
                          Score:
                          <strong className="text-white font-black">{match.playerScore}</strong>
                          vs
                          <strong className="text-neutral-300 font-bold">{match.opponentScore}</strong>
                        </span>
                        <span className="text-neutral-600">|</span>
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          {match.date}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Stakes Reward payout */}
                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                      Wager Stakes
                    </span>
                    <span className={`font-mono font-bold text-xs ${isWin ? "text-emerald-500" : "text-neutral-400"}`}>
                      {isWin ? `+$${match.stake}` : `-$${match.stake}`} FLOW
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Arena redirect micro link */}
      {history.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={onNavigateToArena}
            className="text-[10px] text-orange-500 hover:text-orange-400 font-black tracking-widest uppercase inline-flex items-center gap-1 hover:underline transition-colors cursor-pointer"
          >
            Spit more fire on competitors in the Arena <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
