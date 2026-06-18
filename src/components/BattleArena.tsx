import React, { useState } from "react";
import { UserProfile, Beat, LeaderboardEntry, BattleRound } from "../types";
import { synthBeat } from "../lib/audioService";
import { RapperAvatar } from "./AvatarCustomizer";
import { 
  PlusCircle, ShieldCheck, Flame, Play, Square, Award, ArrowUpRight, 
  Send, AlertTriangle, Disc, Volume2, Trophy, ArrowRight, Skull,
  Trash2, History, Eye, X, Mic, MicOff
} from "lucide-react";

interface Props {
  user: UserProfile;
  beats: Beat[];
  opponents: LeaderboardEntry[];
  onBattleEnd: (stats: { wins: number; losses: number; cash: number; rep: number; streak: number }) => void;
  onUpdateUser: (newUser: UserProfile) => void;
}

export default function BattleArena({ user, beats, opponents, onBattleEnd, onUpdateUser }: Props) {
  // GAMEPLAY FLOW STATES
  // 'lobby' -> choose opponent, beat, stake.
  // 'fighting' -> round calculations.
  // 'concluded' -> payout screen
  const [stage, setStage] = useState<'lobby' | 'fighting' | 'concluded'>('lobby');

  // BATTLE REPLAYS VAULT STATE
  const [replays, setReplays] = useState<any[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<any | null>(null);

  React.useEffect(() => {
    if (stage === 'lobby') {
      try {
        const existingReplaysRaw = localStorage.getItem("rap_battle_replays");
        if (existingReplaysRaw) {
          setReplays(JSON.parse(existingReplaysRaw));
        } else {
          setReplays([]);
        }
      } catch (err) {
        console.error("Failed to load replays from localStorage:", err);
      }
    }
  }, [stage]);

  const handleDeleteReplay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const existingReplaysRaw = localStorage.getItem("rap_battle_replays");
      if (existingReplaysRaw) {
        const parsed = JSON.parse(existingReplaysRaw);
        const filtered = parsed.filter((r: any) => r.id !== id);
        localStorage.setItem("rap_battle_replays", JSON.stringify(filtered));
        setReplays(filtered);
      }
    } catch (err) {
      console.error("Failed to delete replay:", err);
    }
  };

  // LOBBY SETUP SELECTION STATE
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(opponents[1]?.id || "");
  const [selectedBeatId, setSelectedBeatId] = useState<string>(beats[0]?.id || "");
  const [stake, setStake] = useState<number>(100);
  const [lobbyError, setLobbyError] = useState("");

  // FIGHTING SESSION STATE
  const [roundNumber, setRoundNumber] = useState(1);
  const totalRounds = 3;
  const [userVerse, setUserVerse] = useState("");
  const [battleLog, setBattleLog] = useState<{ speaker: 'user' | 'opponent' | 'system'; text: string; score?: number; critique?: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [userScores, setUserScores] = useState<number[]>([]);
  const [currentBpm, setCurrentBpm] = useState(90);

  // CONCLUDE OUTCOME
  const [winner, setWinner] = useState<'user' | 'opponent' | 'tie'>('tie');
  const [winPayout, setWinPayout] = useState(0);
  const [repPayout, setRepPayout] = useState(0);

  // MICROPHONE SPEECH RECOGNITION (WEB SPEECH API)
  const [isListening, setIsListening] = useState(false);
  const [listenError, setListenError] = useState("");
  const recognitionRef = React.useRef<any>(null);

  const startListening = () => {
    setListenError("");
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setListenError("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setUserVerse((prev) => {
            const next = (prev + " " + finalTranscript).trim();
            return next.slice(0, 250);
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        if (event.error === "not-allowed") {
          setListenError("Microphone access denied. Check your browser settings/permissions.");
        } else {
          setListenError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setListenError("Failed to initialize microphone recognition.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Stop listening when changing stages or unmounting
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [stage]);

  const activeOpponent = opponents.find(o => o.id === selectedOpponentId) || opponents[0];
  const activeBeat = beats.find(b => b.id === selectedBeatId) || beats[0];

  // STEP 1: LOBBY ARENA LAUNCHER
  const handleLaunchBattle = () => {
    setLobbyError("");
    if (user.cash < stake) {
      setLobbyError("Insufficient Cash ($FLOW) to cover this high-stakes wager! Select a lower bet or sell some tracks.");
      return;
    }

    // Set backing loop
    synthBeat.stop();
    synthBeat.setPreset(activeBeat.synthesisPreset || 'boombap');
    synthBeat.setBpm(activeBeat.bpm);
    synthBeat.start();
    setCurrentBpm(activeBeat.bpm);

    // Initialize battle logs
    setBattleLog([
      { 
        speaker: 'system', 
        text: `🔊 HOST: Welcome to the Underground Cypher! Step into the orange spotlight! Today's match-up: ${user.username} VS ${activeOpponent.name} on the beat "${activeBeat.title}". Let the beat drop!` 
      },
      { 
        speaker: 'opponent', 
        text: `👋 ${activeOpponent.name}: Yo. You think you got bars? I hear your rhymes are compiled by weak script scrapers. Let's see you write something that actually flows. Go ahead, lay down Round 1 verse, punk! I challenge you.` 
      }
    ]);

    setRoundNumber(1);
    setUserVerse("");
    setUserScores([]);
    setStage('fighting');
  };

  // STEP 2: STAGE INTERACTIVE VERSE SUBMISSION
  const handleSpitVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userVerse.trim() || chatLoading) return;

    if (isListening) {
      stopListening();
    }

    const trimmedVerse = userVerse.replace(/\n/g, " ");

    // Append user bars to Chat Logs
    const updatedLogs = [
      ...battleLog,
      { speaker: 'user' as const, text: userVerse }
    ];
    setBattleLog(updatedLogs);
    setChatLoading(true);
    setUserVerse("");

    try {
      const response = await fetch("/api/battle/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userVerse: trimmedVerse,
          opponentId: activeOpponent.id,
          opponentName: activeOpponent.name,
          beatName: activeBeat.title,
          genre: activeBeat.genre,
          bpm: activeBeat.bpm,
          roundNumber,
          totalRounds,
          stake
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Add opponent's rebuttal verse and metrics
      const newLogs = [
        ...updatedLogs,
        { 
          speaker: 'opponent' as const, 
          text: data.verse.replace(/\//g, "\n"), 
          score: data.score, 
          critique: data.critique 
        }
      ];

      setBattleLog(newLogs);
      
      const newScores = [...userScores, data.score];
      setUserScores(newScores);

      // Check for round increment
      if (roundNumber < totalRounds) {
        setRoundNumber(prev => prev + 1);
        setBattleLog(prev => [
          ...prev,
          { speaker: 'system', text: `🎤 HOST: Fire round! Submitting for Round ${roundNumber + 1}. Lay down your lyrics, ${user.username}!` }
        ]);
      } else {
        // Conclude Battle
        synthBeat.stop();
        // Calculate average score of user
        const avgScore = newScores.reduce((a, b) => a + b, 0) / newScores.length;
        const bWinner = avgScore >= 78 ? 'user' : 'opponent';
        setWinner(bWinner);

        if (bWinner === 'user') {
          setWinPayout(stake);
          setRepPayout(Math.floor(stake / 2));
        } else {
          setWinPayout(-stake);
          setRepPayout(-Math.floor(stake / 4));
        }

        // Sync local updated profile
        if (data.user) {
          onUpdateUser(data.user);
        }

        // Save Completed Battle Replay
        try {
          const replayId = "replay_" + Date.now();
          const newReplay = {
            id: replayId,
            date: new Date().toLocaleString(),
            timestamp: Date.now(),
            userUsername: user.username,
            userAvatar: user.avatar,
            opponentName: activeOpponent.name,
            opponentAvatar: activeOpponent.avatar,
            beatTitle: activeBeat.title,
            beatBpm: activeBeat.bpm,
            beatGenre: activeBeat.genre,
            stake: stake,
            winner: bWinner,
            winPayout: bWinner === 'user' ? stake : -stake,
            repPayout: bWinner === 'user' ? Math.floor(stake / 2) : -Math.floor(stake / 4),
            logs: newLogs
          };
          const existingReplaysRaw = localStorage.getItem("rap_battle_replays");
          const existing = existingReplaysRaw ? JSON.parse(existingReplaysRaw) : [];
          localStorage.setItem("rap_battle_replays", JSON.stringify([newReplay, ...existing]));
        } catch (e) {
          console.error("Failed to save battle transcript replay:", e);
        }

        setStage('concluded');
      }

    } catch (err: any) {
      console.error(err);
      // Fallback logs in case API malfunctions
      setBattleLog(prev => [
        ...prev,
        { speaker: 'system', text: `🚨 SYS ERROR: Network congestion on street speakers. Retrying setup...` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleForfeit = () => {
    synthBeat.stop();
    setStage('lobby');
  };

  return (
    <div className="space-y-8 text-white p-4">
      
      {/* LOBBY PRE-STAGE SELECTION LAYER */}
      {stage === 'lobby' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-500/10 pb-6 gap-4">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-wider font-sans text-orange-500">
                SpitFire Cypher Cage
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Wager virtual currency, spit lyrics against AI legends, and win payouts. Higher level opponents demand heavier stakes and crown reputation!
              </p>
            </div>

            <div className="flex gap-4">
              <div className="bg-zinc-900 border border-neutral-800 rounded-xl px-4 py-2 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-zinc-500" />
                <div className="text-left">
                  <div className="text-[9px] uppercase font-bold text-neutral-400">Wins/Losses</div>
                  <div className="text-xs font-black text-white">{user.wins}W - {user.losses}L</div>
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
                <Award className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <div className="text-[9px] uppercase font-bold text-orange-500">Rep Score</div>
                  <div className="text-xs font-black text-white">{user.rep} REP</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* OPPONENT COLUMN CARD */}
            <div className="lg:col-span-5 bg-zinc-950 border border-neutral-800 rounded-2xl p-6 text-left space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 mb-3">
                  Select Rap Opponent
                </h3>
                
                {/* Scroll selector lists */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {opponents.filter(o => !o.isUser).map(o => {
                    const sel = o.id === selectedOpponentId;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setSelectedOpponentId(o.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center gap-4 transition-all ${
                          sel 
                            ? 'border-orange-500 bg-orange-500/5' 
                            : 'border-neutral-900 bg-zinc-900 hover:border-neutral-700'
                        }`}
                      >
                        <div className="w-12 h-12 shrink-0">
                          <RapperAvatar config={o.avatar} />
                        </div>
                        <div className="flex-1 truncate">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{o.name}</span>
                            <span className="text-[10px] bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 rounded font-mono text-orange-500">
                              {o.rep} REP
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-1 truncate">{o.bio}</div>
                          <div className="text-[9px] font-mono text-neutral-500 mt-0.5">Wins: {o.wins} | Streak: {o.streak}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TRACKS & STAKES COLUMN CARDS */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* STAGE BEAT SELECTOR */}
              <div className="bg-zinc-900 border border-neutral-800 rounded-2xl p-6 text-left space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-orange-500">
                  Select Arena Backing Track
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {beats.map(beat => {
                    const owned = user.purchasedBeatIds.includes(beat.id);
                    const sel = beat.id === selectedBeatId;

                    return (
                      <button
                        key={beat.id}
                        disabled={!owned}
                        onClick={() => setSelectedBeatId(beat.id)}
                        className={`p-3 border rounded-xl text-left flex items-center justify-between gap-4 transition-all ${
                          sel 
                            ? 'border-orange-500 bg-orange-500/5' 
                            : owned 
                              ? 'border-neutral-800 bg-neutral-950 hover:border-neutral-700' 
                              : 'bg-neutral-950 border-neutral-950 text-neutral-600 cursor-not-allowed opacity-40'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{beat.title}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{beat.genre}</div>
                        </div>
                        <span className="font-mono text-[9px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                          {beat.bpm} BPM
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CURRENCY COIN WAGER */}
              <div className="bg-zinc-900 border border-neutral-800 rounded-2xl p-6 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-orange-500">
                    virtual entry stake
                  </h3>
                  <span className="font-mono text-xs text-neutral-400">Available: ${user.cash} FLOW</span>
                </div>

                <div className="flex gap-2.5">
                  {[25, 50, 100, 250, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setStake(amt)}
                      className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                        stake === amt 
                          ? 'bg-orange-500 hover:bg-orange-600 text-black border-orange-500' 
                          : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                {lobbyError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{lobbyError}</span>
                  </div>
                )}

                <button
                  onClick={handleLaunchBattle}
                  className="w-full py-4.5 bg-orange-600 hover:bg-orange-500 text-sm tracking-widest font-black uppercase rounded-xl flex items-center justify-center gap-2 text-black active:scale-[0.98] transition-all"
                >
                  <Flame className="w-5 h-5 text-black" />
                  STEP INTO ARENA & WAGER ${stake}
                </button>
              </div>

            </div>

          </div>

          {/* Battle Replay Vault */}
          <div className="bg-zinc-950/60 border border-neutral-850 rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              Battle Replay Vault ({replays.length})
            </h3>
            
            {replays.length === 0 ? (
              <div className="p-8 border border-dashed border-neutral-800 rounded-xl text-center text-neutral-500 text-xs py-10">
                No recorded rap battle replays are available yet. Complete a battle in the Spitfire Cypher Arena to save its transcript and AI judge critiques!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                {replays.map((rep) => {
                  const won = rep.winner === 'user';
                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReplay(rep)}
                      className="bg-zinc-900/40 hover:bg-zinc-900/80 border border-neutral-800/80 hover:border-orange-500/50 rounded-xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-950 rounded-lg overflow-hidden shrink-0">
                            <RapperAvatar config={rep.opponentAvatar} />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">VS {rep.opponentName}</div>
                            <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">{rep.date}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            won 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {won ? 'WON' : 'DEFEATED'}
                          </span>
                          <button
                            onClick={(e) => handleDeleteReplay(rep.id, e)}
                            className="p-1 px-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 rounded transition-colors"
                            title="Delete Replay"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 border-t border-neutral-800/50 pt-2">
                        <div className="truncate max-w-[180px]">
                          Beat: <strong className="text-neutral-300 font-sans">{rep.beatTitle}</strong>
                        </div>
                        <div className="font-mono text-xs text-orange-500 font-black">
                          {won ? `+$${rep.winPayout}` : `-$${Math.abs(rep.winPayout)}`} FLOW
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ACTIVE COMBAT SHIELD (HEAD TO HEAD MATCHUP) */}
      {stage === 'fighting' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-zinc-950 border border-neutral-800 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <span className="text-xs uppercase font-bold tracking-widest">
                CYPHER ARENA LIVE ({activeBeat.title} - {currentBpm} BPM)
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="text-neutral-400">ROUND: <strong className="text-orange-500 font-mono text-sm">{roundNumber}/{totalRounds}</strong></span>
              <span className="text-neutral-400">STAKE: <strong className="text-white">${stake} FLOW</strong></span>
              <button
                onClick={handleForfeit}
                className="text-[10px] uppercase font-bold text-red-400 hover:text-red-500 border border-red-500/20 px-2 py-1 rounded"
              >
                Forfeit
              </button>
            </div>
          </div>

          {/* ACTIVE RAPPER HEADSHOT CONTAINER */}
          <div className="grid grid-cols-2 md:grid-cols-12 gap-4 items-center justify-center bg-zinc-900 border border-neutral-800 rounded-2xl p-6 shadow-inner relative overflow-hidden">
            
            {/* Visual animated orange grid lines */}
            <div className="absolute inset-0 bg-radial-at-c from-neutral-900/30 to-black/90 pointer-events-none z-0" />
            
            {/* USER RAPPER */}
            <div className="col-span-1 md:col-span-4 flex flex-col items-center gap-3 z-10 text-center">
              <div className="w-28 h-28 md:w-36 md:h-36">
                <RapperAvatar config={user.avatar} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm md:text-base">{user.username}</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">Your Flow Status</p>
              </div>
            </div>

            {/* NEON CROWD BOBBING VISUALIZER ACCENTS */}
            <div className="hidden md:col-span-4 md:flex flex-col items-center justify-center gap-4 z-10">
              <div className="text-center font-black italic text-orange-500 text-lg uppercase tracking-wider select-none animate-pulse">
                DECIBEL SHOWDOWN
              </div>
              
              {/* Dynamic waveform rods representing crown excitement */}
              <div className="flex gap-1.5 items-end h-[50px] overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-orange-500/80 rounded-full animate-bounce" 
                    style={{ 
                      height: `${10 + Math.random() * 40}px`,
                      animationDuration: `${0.4 + Math.random() * 0.6}s`,
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* OPPONENT AI */}
            <div className="col-span-1 md:col-span-4 flex flex-col items-center gap-3 z-10 text-center">
              <div className="w-28 h-28 md:w-36 md:h-36">
                <RapperAvatar config={activeOpponent.avatar} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm md:text-base text-red-400">{activeOpponent.name}</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">{activeOpponent.bio?.slice(0, 24)}...</p>
              </div>
            </div>

          </div>

          {/* CHAT CHRONICLES */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* CONVERSATION TRANSCRIPT CLOGS */}
            <div className="md:col-span-8 bg-zinc-950 border border-neutral-800 rounded-2xl p-4 h-[350px] overflow-y-auto flex flex-col gap-4 text-left">
              {battleLog.map((log, i) => {
                const system = log.speaker === 'system';
                const me = log.speaker === 'user';

                return (
                  <div 
                    key={i} 
                    className={`p-3.5 rounded-xl border flex flex-col gap-2.5 max-w-[90%] ${
                      system 
                        ? 'bg-orange-950/20 text-orange-500 border-orange-500/10 text-xs self-center text-center max-w-full'
                        : me
                          ? 'bg-zinc-900 text-neutral-200 border-neutral-800 self-start'
                          : 'bg-red-950/15 text-red-200 border-red-500/10 self-end'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        {system ? "BROADCAST" : me ? user.username : activeOpponent.name}
                      </span>
                      
                      {/* Show round scores if opponent submitted */}
                      {log.score && (
                        <div className="text-right">
                          <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded font-mono font-bold text-[10px] px-1.5 py-0.5">
                            YOUR BAR SCORE: <strong className="text-white text-xs">{log.score}</strong>/100
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="font-mono text-xs whitespace-pre-line leading-relaxed tracking-wide">
                      {log.text}
                    </p>

                    {log.critique && (
                      <div className="bg-black/40 border border-neutral-800 p-2.5 rounded text-[10px] text-neutral-400 tracking-wide font-sans italic leading-relaxed">
                        🔍 CRITIQUE: {log.critique}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Chat typing ticker */}
              {chatLoading && (
                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 text-neutral-400 text-xs flex gap-3 self-end animate-pulse max-w-[80%]">
                  <Flame className="w-5 h-5 text-orange-500 animate-spin" />
                  <div className="text-left">
                    <div className="font-bold text-[10px] text-neutral-400 uppercase tracking-widest">{activeOpponent.name} is roasting back...</div>
                    <p className="text-[11px] italic mt-0.5">Recompiling syllables and evaluating bar structures...</p>
                  </div>
                </div>
              )}
            </div>

            {/* SPEED VERSE WRITER CONTROL */}
            <div className="md:col-span-4 bg-zinc-900 border border-neutral-800 rounded-2xl p-4.5 text-left h-full flex flex-col justify-between">
              <form onSubmit={handleSpitVerse} className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-bold tracking-widest text-neutral-400">Spit Your Bar Draft</label>
                  <span className="text-[10px] font-mono text-neutral-500">{userVerse.length}/250 chars</span>
                </div>

                {/* Web Speech API Microphone Recording Controls */}
                <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={chatLoading}
                      className={`p-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        isListening
                          ? 'bg-red-500 text-white border-red-500 animate-pulse font-extrabold'
                          : 'bg-zinc-900 text-orange-500 border-neutral-800 hover:border-orange-500/50'
                      }`}
                      title={isListening ? "Stop voice recognition" : "Record verse with microphone"}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4 text-white" />
                      ) : (
                        <Mic className="w-4 h-4 text-orange-500" />
                      )}
                    </button>
                    <div className="text-left">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        {isListening ? "Listening..." : "Mic Transcribe"}
                      </div>
                      <div className="text-[9px] text-neutral-500 font-sans leading-none">
                        {isListening ? "Speak/rap clearly now" : "Use Web Speech transcription"}
                      </div>
                    </div>
                  </div>

                  {isListening && (
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[9px] font-mono uppercase text-red-550 font-black">REC</span>
                    </div>
                  )}
                </div>

                {listenError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-2 rounded-lg leading-snug font-mono flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                    <span>{listenError}</span>
                  </div>
                )}
                
                <textarea
                  rows={4}
                  maxLength={250}
                  disabled={chatLoading}
                  placeholder="e.g. 
I pull up with code that burns the screen, 
Spitting orange fires that you've never seen.
You mock my reputation but I hold the crown,
My algorithmic rhymes are taking over the town!"
                  value={userVerse}
                  onChange={(e) => setUserVerse(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs leading-relaxed text-white focus:outline-none focus:border-orange-500/60"
                />

                <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                  Tip: Use the songwriting assistant in Studio to build great rhymes first, then paste them here to secure maximum voting crowd percentage!
                </p>

                <button
                  type="submit"
                  disabled={chatLoading || !userVerse.trim()}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed uppercase font-black tracking-widest text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-black active:scale-[0.98]"
                >
                  <Send className="w-4 h-4 text-black" />
                  SPIT LYRICS INTO CYPHER
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* CONCLUDED SUMMARY PANEL */}
      {stage === 'concluded' && (
        <div className="relative max-w-2xl mx-auto rounded-3xl border border-neutral-800 bg-neutral-950 p-8 text-center space-y-6 shadow-2xl overflow-hidden">
          
          {/* Cosmic visual halo backdrop */}
          <div className="absolute inset-x-0 -top-40 h-80 bg-orange-600/10 blur-[100px] pointer-events-none" />

          {winner === 'user' ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto text-orange-500">
                <Trophy className="w-8 h-8 text-orange-500 animate-bounce" />
              </div>
              <h3 className="text-3xl font-black uppercase text-orange-500 tracking-wide">
                CYPHER COMPLETED: YOU WON!
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                The AI crowd was blown away by your structures. Your multi-syllabic codes dominated the cypher grid. You knocked out <strong>{activeOpponent.name}</strong>!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                <Skull className="w-8 h-8 text-red-500 animate-shake" />
              </div>
              <h3 className="text-3xl font-black uppercase text-red-500 tracking-wide">
                DEFEATED IN THE ARENA
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Your bars lacked flow consistency in this match. <strong>{activeOpponent.name}</strong> destroyed your syllables with a flawless counter-roast. Keep practicing!
              </p>
            </div>
          )}

          {/* Money and Payout calculations details */}
          <div className="max-w-md mx-auto grid grid-cols-2 gap-4 bg-zinc-900 border border-neutral-850 p-5 rounded-2xl text-left">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Virtual Wager Payout</div>
              <div className={`text-xl font-black font-mono mt-1 ${winner === 'user' ? 'text-emerald-500' : 'text-red-500'}`}>
                {winner === 'user' ? `+$${winPayout}` : `-$${Math.abs(winPayout)}`} FLOW
              </div>
            </div>
            
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Global Reputation Factor</div>
              <div className={`text-xl font-black font-mono mt-1 ${winner === 'user' ? 'text-orange-500' : 'text-red-400'}`}>
                {winner === 'user' ? `+${repPayout}` : `-${Math.abs(repPayout)}`} REP
              </div>
            </div>
          </div>

          <div className="pt-4 max-w-sm mx-auto">
            <button
              onClick={() => {
                // Return stats to top level handler to sync with full interface state
                onBattleEnd({
                  wins: winner === 'user' ? 1 : 0,
                  losses: winner === 'user' ? 0 : 1,
                  cash: winPayout,
                  rep: repPayout,
                  streak: winner === 'user' ? 1 : 0,
                });
                setStage('lobby');
              }}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-xs text-black font-black uppercase rounded-xl tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              COLLECT PAYOUTS & RE-ENTRY LOBBY
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>

        </div>
      )}

      {/* REPLAY MODE TRANSCRIPT VIEW (MODAL OVERLAY) */}
      {selectedReplay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* Header / Banner */}
            <div className="p-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-500 animate-pulse">
                  <History className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-sans font-black uppercase text-sm tracking-widest text-orange-500">
                    CYPHER BATTLE REPLAY VAULT
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Match Date: {selectedReplay.date} | Stake wagered: ${selectedReplay.stake} FLOW
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReplay(null)}
                className="p-1 px-2.5 rounded-lg border border-neutral-800 hover:border-orange-500 bg-neutral-950 hover:text-orange-500 transition-all text-xs font-bold uppercase flex items-center gap-1 cursor-pointer text-white"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Close</span>
              </button>
            </div>

            {/* Duelists Cards header */}
            <div className="bg-zinc-900 border-b border-neutral-800 p-4 grid grid-cols-3 items-center text-center">
              <div className="flex flex-col items-center gap-1 overflow-hidden">
                <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-full overflow-hidden shrink-0">
                  <RapperAvatar config={selectedReplay.userAvatar} />
                </div>
                <div className="font-bold text-xs text-white max-w-[120px] truncate">
                  {selectedReplay.userUsername}
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10 shrink-0">Player</span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 min-w-0">
                <div className="text-xs uppercase font-extrabold text-neutral-500 font-mono tracking-widest">RESULT</div>
                <div className={`text-sm font-black uppercase tracking-wider ${
                  selectedReplay.winner === 'user' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {selectedReplay.winner === 'user' ? 'VICTORY' : 'DEFEATED'}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono text-center truncate w-full">
                  Payout: {selectedReplay.winner === 'user' ? `+$${selectedReplay.winPayout}` : `${selectedReplay.winPayout}`} FLOW / {selectedReplay.winner === 'user' ? `+${selectedReplay.repPayout}` : `${selectedReplay.repPayout}`} REP
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 overflow-hidden">
                <div className="w-12 h-12 bg-neutral-950 border border-neutral-850 rounded-full overflow-hidden shrink-0">
                  <RapperAvatar config={selectedReplay.opponentAvatar} />
                </div>
                <div className="font-bold text-xs text-white max-w-[120px] truncate">
                  {selectedReplay.opponentName}
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 shrink-0">Arena Elite</span>
              </div>
            </div>

            {/* Battle Beats metadata track details */}
            <div className="bg-zinc-950 px-5 py-2 border-b border-neutral-900/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span className="truncate max-w-[50%] text-left">Track: <strong className="text-white">{selectedReplay.beatTitle}</strong> - {selectedReplay.beatGenre}</span>
              <span>Tempo: <strong className="text-orange-500">{selectedReplay.beatBpm} BPM</strong></span>
            </div>

            {/* Scrollable logs */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-950">
              {selectedReplay.logs.map((log: any, idx: number) => {
                const system = log.speaker === 'system';
                const me = log.speaker === 'user';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex gap-3.5 max-w-[85%] transition-all ${
                      system
                        ? 'bg-orange-950/20 text-orange-500 border-orange-500/10 text-xs mx-auto text-center max-w-full'
                        : me
                          ? 'bg-zinc-900 text-neutral-200 border-neutral-800 mr-auto flex-row align-top text-left'
                          : 'bg-red-950/15 text-red-200 border-red-500/10 ml-auto flex-row-reverse align-top text-right'
                    }`}
                  >
                    {!system && (
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-neutral-950 border border-neutral-800">
                        <RapperAvatar config={me ? selectedReplay.userAvatar : selectedReplay.opponentAvatar} />
                      </div>
                    )}
                    
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          {system ? "HOST CYPHER BROADCAST" : me ? selectedReplay.userUsername : selectedReplay.opponentName}
                        </span>
                        {log.score && (
                          <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded font-mono font-bold text-[9px] px-1.5 py-0.5 shrink-0">
                            JUDGE BARS SCORE: <strong className="text-white font-extrabold text-xs">{log.score}</strong>/100
                          </span>
                        )}
                      </div>

                      <p className="font-mono text-xs whitespace-pre-line leading-relaxed tracking-wide text-left">
                        {log.text}
                      </p>

                      {log.critique && (
                        <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-[10px] text-neutral-400 tracking-wide font-sans italic leading-relaxed text-left">
                          📢 AI JUDGE DEEP CRITIQUE: "{log.critique}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick action triggers footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/40 flex justify-end gap-3.5">
              <button
                onClick={() => setSelectedReplay(null)}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-black border border-orange-600 hover:border-orange-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                Close Replay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
