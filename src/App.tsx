import React, { useState, useEffect } from "react";
import { UserProfile, Beat, LeaderboardEntry, Song } from "./types";
import AvatarCustomizer, { RapperAvatar } from "./components/AvatarCustomizer";
import BeatMarket from "./components/BeatMarket";
import SongwritingStudio from "./components/SongwritingStudio";
import BattleArena from "./components/BattleArena";
import Leaderboard from "./components/Leaderboard";
import ChatRoom from "./components/ChatRoom";
import BattleHistory from "./components/BattleHistory";
import WalletPortal from "./components/WalletPortal";
import { 
  Users, Flame, Music, Trophy, LayoutGrid, Sliders, Sparkles, 
  Wallet, Award, Zap, AlertCircle, RefreshCw, Star, Info
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'arena' | 'studio' | 'market' | 'leaderboard' | 'avatar'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [err, setErr] = useState("");
  const [selectedBeatId, setSelectedBeatId] = useState<string>("");
  const [dailyRewardAmount, setDailyRewardAmount] = useState<number>(0);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // INITIAL LOAD
  const loadWorkspace = async () => {
    setLoading(true);
    setErr("");
    try {
      const [profileRes, beatsRes, leaderboardRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/beats"),
        fetch("/api/leaderboard")
      ]);

      if (!profileRes.ok || !beatsRes.ok || !leaderboardRes.ok) {
        throw new Error("Unable to contact backend audio servers. Booting up server.ts...");
      }

      const pData = await profileRes.json();
      const bData = await beatsRes.json();
      const lData = await leaderboardRes.json();

      setUser(pData);
      setBeats(bData);
      setLeaderboard(lData);

      if (pData.dailyRewardGranted && pData.dailyRewardGranted > 0) {
        setDailyRewardAmount(pData.dailyRewardGranted);
      }
    } catch (e: any) {
      setErr(e.message || "Failed to boot full-stack client bindings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // API 1: Persist updated profile / Avatar
  const handleUpdateAvatar = async (updatedAvatar: any) => {
    if (!user) return;
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: updatedAvatar })
      });
      const data = await res.json();
      setUser(data);
      // reload standings to sync avatar globally
      const lRes = await fetch("/api/leaderboard");
      const lData = await lRes.json();
      setLeaderboard(lData);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAvatar(false);
    }
  };

  // API 2: Buy Beats from Market
  const handlePurchaseBeat = async (beatId: string) => {
    try {
      const res = await fetch("/api/beats/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setUser(data);
    } catch (e) {
      console.error(e);
    }
  };

  // API 3: Link Custom Off-Site Beats Stems
  const handleImportBeat = async (beatData: any) => {
    try {
      const res = await fetch("/api/beats/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(beatData)
      });
      const data = await res.json();
      setUser(data.user);
      setBeats(data.beats);
    } catch (e) {
      console.error(e);
    }
  };

  // API 4: Save Song Document
  const handleSaveSongDoc = async (songData: Partial<Song>) => {
    try {
      const res = await fetch("/api/songs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(songData)
      });
      const songs = await res.json();
      if (user) {
        setUser({ ...user, songs });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API 5: Sell Commercial Song to Record Label
  const handleSellSong = async (songId: string, sellPrice: number) => {
    try {
      const res = await fetch("/api/songs/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, sellPrice })
      });
      const data = await res.json();
      setUser(data.user);
      // reload standings
      const lRes = await fetch("/api/leaderboard");
      const lData = await lRes.json();
      setLeaderboard(lData);
    } catch (e) {
      console.error(e);
    }
  };

  // API 6: Sync state when battle completes
  const handleBattleConcluded = async (payouts: any) => {
    // update state
    loadWorkspace();
  };

  const handleUpdateUserProfile = (newUser: UserProfile) => {
    setUser(newUser);
  };

  // PRE-CHARGE LOADING GATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6 space-y-6 select-none font-sans">
        {/* Glowing orange circle */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-orange-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <Flame className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-black uppercase tracking-widest text-orange-500 font-sans">
            SpitFire Network Booting
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs font-mono leading-relaxed">
            Spitting server routers, preparing virtual drum synths, and compiling street databases...
          </p>
        </div>
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h3 className="text-md font-bold text-red-400">Database Binding Interrupted</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Express API ports are initializing. Please wait 5 seconds and click Reconnect.
          </p>
        </div>
        <button
          onClick={loadWorkspace}
          className="py-2.5 px-6 bg-zinc-800 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          Reconnect
        </button>
      </div>
    );
  }

  // Calculate user index rank in global standings
  const userStandingIndex = leaderboard.findIndex(e => e.id === user.id) + 1;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100 flex flex-col">
      
      {/* GLOBAL HEADER BAR */}
      <header className="border-b border-orange-500/10 bg-[#0E0E0E] sticky top-0 z-40 px-6 py-4.5 flex items-center justify-between shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-600/10 border border-orange-500/30 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-left font-sans">
            <h1 className="text-base font-black uppercase tracking-wider text-orange-500 leading-none">SpitFire</h1>
            <span className="text-[9px] text-neutral-400 font-mono tracking-widest leading-none">CYPHER MATRIX v1.2</span>
          </div>
        </div>

        {/* User live mini-stats badge */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsWalletOpen(true)}
            className="flex items-center gap-2.5 bg-zinc-900 hover:bg-neutral-900/85 px-3.5 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 shadow-inner transition-all hover:scale-[1.02] cursor-pointer"
            title="Load Flow Balance (Stripe Gateway)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-left">
              <div className="text-[8px] uppercase font-black text-neutral-500 font-sans tracking-wide flex items-center gap-1 leading-none">
                Flow Balance <span className="text-orange-500 font-black">+ ADD</span>
              </div>
              <div className="text-xs font-black font-mono text-orange-500 shrink-0 mt-0.5">${user.cash.toLocaleString()}</div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('avatar')}
            className="w-10 h-10 border border-orange-500/15 hover:border-orange-500 rounded-xl overflow-hidden shadow-md cursor-pointer transition-all active:scale-95"
            title="Edit Customized Avatar"
          >
            <RapperAvatar config={user.avatar} />
          </button>
        </div>
      </header>

      {/* BODY FRAME CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* PERSISTENT SIDEBAR NAVIGATION */}
        <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-orange-500/5 bg-[#0C0C0C] p-4 flex flex-row md:flex-col justify-between gap-2 overflow-x-auto md:overflow-x-visible shrink-0 select-none">
          <div className="flex flex-row md:flex-col gap-1.5 w-full">
            
            {/* Dashboard link */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 md:flex-initial py-3 px-3.5 text-xs font-bold uppercase rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline font-sans tracking-wider">Dashboard</span>
            </button>

            {/* Arena battle link */}
            <button
              onClick={() => setActiveTab('arena')}
              className={`flex-1 md:flex-initial py-3 px-3.5 text-xs font-bold uppercase rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                activeTab === 'arena' 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden md:inline font-sans tracking-wider">Combat Arena</span>
            </button>

            {/* Writing studio link */}
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex-1 md:flex-initial py-3 px-3.5 text-xs font-bold uppercase rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                activeTab === 'studio' 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline font-sans tracking-wider">Lyricist Studio</span>
            </button>

            {/* Beat market link */}
            <button
              onClick={() => setActiveTab('market')}
              className={`flex-1 md:flex-initial py-3 px-3.5 text-xs font-bold uppercase rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                activeTab === 'market' 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="hidden md:inline font-sans tracking-wider">Beat Store</span>
            </button>

            {/* Hall standings link */}
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 md:flex-initial py-3 px-3.5 text-xs font-bold uppercase rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                activeTab === 'leaderboard' 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden md:inline font-sans tracking-wider">Standings</span>
            </button>

            {/* Avatar config link */}
            <button
              onClick={() => setActiveTab('avatar')}
              className={`flex-1 md:flex-initial py-3 px-3.5 text-xs font-bold uppercase rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                activeTab === 'avatar' 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden md:inline font-sans tracking-wider">Identity Panel</span>
            </button>

          </div>

          {/* User profile recap on desktop sidebar */}
          <div className="hidden md:block pt-6 border-t border-orange-500/5 text-left space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">Your Identity</h4>
            
            <div className="bg-zinc-900/60 rounded-xl p-3 border border-neutral-850 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Artist Name:</span>
                <span className="font-bold">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Global Rank:</span>
                <span className="text-orange-500 font-bold font-mono">#{userStandingIndex || "Lobbyist"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rep Index:</span>
                <span className="font-mono text-zinc-300 font-bold">{user.rep} REP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cypher Ratio:</span>
                <span className="font-mono">{user.wins}W / {user.losses}L</span>
              </div>
            </div>
          </div>
        </nav>

        {/* ACTIVE MAIN VIEWS */}
        <main className="flex-1 bg-[#0A0A0A] overflow-y-auto px-4 py-8 md:p-8">
          
          {/* VIEW 1: CENTRAL DASHBOARD CONTAINER */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              
              {/* LANDING WELCOME MAT */}
              <div className="relative rounded-3xl border border-orange-500/10 bg-radial-at-t from-orange-500/10 via-[#0E0E0E] to-[#0A0A0A] p-8 md:p-10 text-left overflow-hidden shadow-2xl">
                {/* Neon halo decor */}
                <div className="absolute right-0 top-0 w-80 h-80 bg-orange-600/5 blur-[100px] pointer-events-none" />

                <div className="max-w-2xl space-y-4">
                  <div className="bg-orange-500/10 text-orange-500 text-[10px] font-black tracking-widest uppercase rounded-full px-3.5 py-1 border border-orange-500/20 inline-block">
                    🤖 AI-INTEGRATED STREET WRITER & ARENA
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight text-white select-text">
                    SPIT METAPHORS.<br />
                    SECURE <span className="text-orange-500">THE REVENUE.</span>
                  </h1>
                  
                  <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-lg">
                    Build multi-syllabic lyrics, attach premium synthesized drum beats or off-site stems, and sell your commercial records. Challenge street legends in interactive battles powered by real-time Gemini AI.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-3.5">
                    <button
                      onClick={() => setActiveTab('arena')}
                      className="py-3 px-6 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all duration-150 active:scale-95 shadow-md shadow-orange-500/10 flex items-center gap-1.5"
                    >
                      <Flame className="w-4 h-4 text-black" /> Enter Rap Battle Arena
                    </button>
                    <button
                      onClick={() => setActiveTab('studio')}
                      className="py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-neutral-800 hover:border-orange-500/20 font-black uppercase tracking-wider text-xs rounded-xl transition-all duration-150 active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> Open Lyricist Studio
                    </button>
                  </div>
                </div>
              </div>

              {/* QUICK METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                
                {/* 1. Wallet Balance Card */}
                <div className="bg-[#0E0E0E] rounded-2xl border border-neutral-850 p-6 flex items-start gap-4 shadow-xl">
                  <div className="w-12 h-12 bg-orange-600/10 border border-orange-500/25 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                    <Wallet className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Liquid Wager Cash</span>
                    <h3 className="text-2xl font-black font-mono mt-1 text-orange-500">${user.cash.toLocaleString()} FLOW</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                      Earned by knocking out opponent cyphers or packaging songs.
                    </p>
                  </div>
                </div>

                {/* 2. Rep Level Card */}
                <div className="bg-[#0E0E0E] rounded-2xl border border-neutral-850 p-6 flex items-start gap-4 shadow-xl">
                  <div className="w-12 h-12 bg-orange-600/10 border border-orange-500/25 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                    <Award className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Worldwide Reputation</span>
                    <h3 className="text-2xl font-black font-mono mt-1 text-emerald-500">{user.rep.toLocaleString()} REP</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                      Your standing rank: <strong className="text-orange-500 font-bold font-sans">#{userStandingIndex || "Lobbyist"}</strong> globally.
                    </p>
                  </div>
                </div>

                {/* 3. Streak Card */}
                <div className="bg-[#0E0E0E] rounded-2xl border border-neutral-850 p-6 flex items-start gap-4 shadow-xl">
                  <div className="w-12 h-12 bg-orange-600/10 border border-orange-500/25 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Win Streaks</span>
                    <h3 className="text-2xl font-black font-mono mt-1 text-white">{user.streak} STREAK</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                      Wins: <span className="font-bold text-white font-mono">{user.wins}</span> | Losses: <span className="font-bold text-white font-mono">{user.losses}</span> match-ups.
                    </p>
                  </div>
                </div>

              </div>

              {/* TWO PANEL SPLIT (INVENTORY QUICK LOOK & INFO CAPTURE) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                
                {/* Left panel details: user songs drafts catalog */}
                <div className="lg:col-span-7 bg-[#0C0C0C] border border-neutral-800 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-900">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Songwriting Catalog</span>
                    <button
                      onClick={() => setActiveTab('studio')}
                      className="text-[10px] uppercase font-bold text-orange-500 hover:underline"
                    >
                      Open Studio Drafts &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {user.songs.length === 0 ? (
                      <div className="p-8 text-neutral-500 text-xs text-center border border-dashed border-neutral-800 rounded-xl">
                        Your Studio drafting books are currently empty. Click &ldquo;Lyricist Studio&rdquo; above to begin coding your first multi-syllabic draft!
                      </div>
                    ) : (
                      user.songs.slice(0, 3).map(song => (
                        <div key={song.id} className="p-3 bg-zinc-900 border border-neutral-850 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-100">{song.title}</div>
                            <div className="text-[10px] text-neutral-400 mt-0.5 uppercase font-mono">{song.genre} / {song.lyrics.split('\n').length} lines</div>
                          </div>
                          <div>
                            {song.isSold ? (
                              <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                Sold: ${song.priceSold}
                              </span>
                            ) : (
                              <button
                                onClick={() => setActiveTab('market')}
                                className="text-[9px] uppercase font-bold text-orange-500 hover:bg-orange-500/10 border border-orange-500/15 px-2.5 py-1 rounded transition-all"
                              >
                                Auction Stems
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right panel details: help instructions banner */}
                <div className="lg:col-span-5 bg-zinc-950 border border-neutral-850 p-6 rounded-2xl space-y-4 text-left">
                  <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase pb-3 border-b border-neutral-900">
                    <Info className="w-4 h-4" /> Game Rules & Flow Guides
                  </div>
                  
                  <ul className="text-xs text-neutral-400 space-y-3 leading-relaxed lists-disc pl-1">
                    <li>
                      🥊 <strong className="text-white">AI Rap battles</strong> can be entered. Choose from bronze stakes to legendary battles. Place wagers and win payout multipliers.
                    </li>
                    <li>
                      🔗 <strong className="text-white">Off-site stems and backbeats</strong> can be hooked under &ldquo;Beat Store&rdquo; using pure MP3 absolute links, giving real-time vocal backups.
                    </li>
                    <li>
                      🤖 <strong className="text-white">Gemini Rhyming Help</strong> and next-line improvements are available inside your Lyricist Drafting sheet to build superior compositions!
                    </li>
                    <li>
                      🔥 <strong className="text-white">Identity Panel</strong> contains live customized vector templates (headsets, hair, clothing, jewelry, neon visual sunglasses) which render globally on the Global standings sheet!
                    </li>
                  </ul>
                </div>

              </div>

              {/* BODIED HISTORICAL OUTCOMES LOG */}
              <div className="grid grid-cols-1 gap-8 mt-4">
                <BattleHistory 
                  history={user.battleHistory || []} 
                  onNavigateToArena={() => setActiveTab('arena')} 
                />
              </div>

              {/* LIVE CHAT CYPHERS SECTION */}
              <div className="grid grid-cols-1 gap-8 mt-4">
                <ChatRoom 
                  currentUsername={user.username} 
                  userRep={user.rep} 
                  userAvatar={user.avatar} 
                />
              </div>

            </div>
          )}

          {/* VIEW 2: CYPHER ARENA (BATTLE RING) */}
          {activeTab === 'arena' && (
            <BattleArena 
              user={user} 
              beats={beats} 
              opponents={leaderboard} 
              onBattleEnd={handleBattleConcluded}
              onUpdateUser={handleUpdateUserProfile}
            />
          )}

          {/* VIEW 3: SONGSTUDIO SHEET */}
          {activeTab === 'studio' && (
            <SongwritingStudio 
              user={user} 
              beats={beats} 
              onSaveSong={handleSaveSongDoc}
              saving={savingAvatar}
              initialBeatId={selectedBeatId}
              onClearInitialBeatId={() => setSelectedBeatId("")}
            />
          )}

          {/* VIEW 4: DIGITAL BEAT SHOP */}
          {activeTab === 'market' && (
            <BeatMarket 
              user={user} 
              beats={beats} 
              onPurchaseBeat={handlePurchaseBeat} 
              onImportBeat={handleImportBeat} 
              onSellSong={handleSellSong}
              onSelectBeatForLyrics={(beatId: string) => {
                setSelectedBeatId(beatId);
                setActiveTab('studio');
              }}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )}

          {/* VIEW 5: STATS LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <Leaderboard 
              leaderboard={leaderboard} 
              userRep={user.rep}
            />
          )}

          {/* VIEW 6: AVATAR CUSTOMIZER STYLE PANEL */}
          {activeTab === 'avatar' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-orange-500/10 pb-6">
                <h2 className="text-3xl font-black uppercase text-orange-500 tracking-wider">
                  Rapper Style Identity
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Draft your customized visual identity. Choose skin color, dreadlocks, golden chains, helmets, flame specs, backwards caps, and customized backdrops.
                </p>
              </div>

              <AvatarCustomizer 
                config={user.avatar} 
                onChange={handleUpdateAvatar} 
              />
            </div>
          )}

        </main>
      </div>

      {/* DAILY LOGIN REWARD CELEB MODAL */}
      {dailyRewardAmount > 0 && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-orange-500 rounded-3xl w-full max-w-md p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient fire glow */}
            <div className="absolute -inset-10 bg-orange-600/10 blur-3xl pointer-events-none rounded-full" />
            
            <div className="relative space-y-5">
              <div className="w-16 h-16 mx-auto bg-orange-500/15 border border-orange-500/30 rounded-2xl flex items-center justify-center text-3xl animate-bounce">
                🎉
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-black font-mono tracking-widest text-neutral-400 uppercase">
                  Daily Reward Secured
                </h3>
                <h2 className="text-4xl font-extrabold font-mono text-orange-500 tracking-tight">
                  +${dailyRewardAmount} FLOW
                </h2>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                Welcome back, MC! Your daily login street wage has been safely deposited into your Flow Balance. Spend it on premium beats or high-stakes battle cyphers!
              </p>

              <button
                onClick={() => setDailyRewardAmount(0)}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 active:scale-[0.98] transition-all text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-orange-500/15"
              >
                Let's Spit Fire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALLET DEPOSIT PORTAL GATEWAY */}
      <WalletPortal 
        user={user} 
        isOpen={isWalletOpen} 
        onClose={() => setIsWalletOpen(false)} 
        onPaymentSuccess={(newBalance, updatedTransactions) => {
          setUser(prev => prev ? { ...prev, cash: newBalance, transactions: updatedTransactions } : null);
        }}
      />

    </div>
  );
}
