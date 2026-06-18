import React, { useState, useEffect, useRef } from "react";
import { Beat, Song, UserProfile } from "../types";
import { synthBeat } from "../lib/audioService";
import { Play, Square, ShoppingBag, Music, Flame, Check, HelpCircle, AlertCircle, Plus, Link, Download } from "lucide-react";

interface Props {
  user: UserProfile;
  beats: Beat[];
  onPurchaseBeat: (beatId: string) => void;
  onImportBeat: (beatData: { title: string; genre: string; bpm: number; audioUrl: string }) => void;
  onSellSong: (songId: string, sellPrice: number) => void;
  purchasing?: boolean;
  onSelectBeatForLyrics?: (beatId: string) => void;
  onOpenWallet?: () => void;
}

export default function BeatMarket({ 
  user, 
  beats, 
  onPurchaseBeat, 
  onImportBeat, 
  onSellSong, 
  purchasing = false,
  onSelectBeatForLyrics,
  onOpenWallet
}: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Custom Beat importer state
  const [customTitle, setCustomTitle] = useState("");
  const [customGenre, setCustomGenre] = useState("Boom Bap");
  const [customBpm, setCustomBpm] = useState(90);
  const [customUrl, setCustomUrl] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  // Selling modal/state
  const [sellingSongId, setSellingSongId] = useState<string | null>(null);
  const [targetPrice, setTargetPrice] = useState(250);

  // Snippet preview handlers
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const snippetTimerRef = useRef<any>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(0);

  const stopAllAudio = () => {
    try {
      synthBeat.stop();
    } catch (e) {
      console.error(e);
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        console.error(e);
      }
      audioRef.current = null;
    }

    if (snippetTimerRef.current) {
      clearInterval(snippetTimerRef.current);
      snippetTimerRef.current = null;
    }

    setPlayingId(null);
    setPreviewSecondsLeft(0);
  };

  const startPreview = (beat: Beat) => {
    stopAllAudio();
    const maxDuration = 12; // 12 seconds short demo snippet
    
    setPlayingId(beat.id);
    setPreviewSecondsLeft(maxDuration);

    if (beat.audioUrl) {
      try {
        const audio = new Audio(beat.audioUrl);
        audio.volume = 0.55;
        audioRef.current = audio;

        audio.onended = () => {
          stopAllAudio();
        };

        audio.play().catch(err => {
          console.warn("Audio element blocked. Falling back to live synthesizer.", err);
          synthBeat.stop();
          synthBeat.setPreset(beat.synthesisPreset || "boombap");
          synthBeat.setBpm(beat.bpm);
          synthBeat.start();
        });
      } catch (e) {
        console.warn("Audio start error, falling back to synth", e);
        synthBeat.stop();
        synthBeat.setPreset(beat.synthesisPreset || "boombap");
        synthBeat.setBpm(beat.bpm);
        synthBeat.start();
      }
    } else {
      try {
        synthBeat.stop();
        synthBeat.setPreset(beat.synthesisPreset || "boombap");
        synthBeat.setBpm(beat.bpm);
        synthBeat.start();
      } catch (e) {
        console.error(e);
      }
    }

    let timeLeft = maxDuration;
    snippetTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      setPreviewSecondsLeft(timeLeft);
      if (timeLeft <= 0) {
        stopAllAudio();
      }
    }, 1000);
  };

  const togglePreview = (beat: Beat) => {
    if (playingId === beat.id) {
      stopAllAudio();
    } else {
      startPreview(beat);
    }
  };

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleCustomImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError("");
    setImportSuccess(false);

    if (!customTitle.trim()) {
      setImportError("Please specify a valid title.");
      return;
    }
    if (!customUrl.trim() || !customUrl.startsWith("http")) {
      setImportError("Please input an absolute audio URL starting with http/https.");
      return;
    }

    onImportBeat({
      title: customTitle,
      genre: customGenre,
      bpm: Number(customBpm) || 90,
      audioUrl: customUrl
    });

    setImportSuccess(true);
    setCustomTitle("");
    setCustomUrl("");
  };

  const executeSale = () => {
    if (!sellingSongId) return;
    onSellSong(sellingSongId, targetPrice);
    setSellingSongId(null);
  };

  const targetSong = user.songs.find(s => s.id === sellingSongId);
  const ownedBeats = beats.filter(b => user.purchasedBeatIds.includes(b.id));

  return (
    <div className="space-y-10 text-white p-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-500/10 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-wider font-sans text-orange-500">
            Digital Beat Market
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Upgrade your baseline. Purchase premium instrumental tracks, link external off-site MP3 audio stems, or package completed lyrics to auction.
          </p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-6 self-start md:self-center">
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Available Liquid</div>
            <div className="text-xl font-black text-orange-500">${user.cash.toLocaleString()} FLOW</div>
            {onOpenWallet && (
              <button 
                onClick={onOpenWallet}
                className="text-[9px] font-black tracking-wider uppercase text-orange-400 hover:text-white mt-1.5 flex items-center gap-1 transition-all cursor-pointer hover:no-underline underline block"
              >
                + Top Up Wallet (Stripe)
              </button>
            )}
          </div>
          <ShoppingBag className="w-8 h-8 text-orange-500 opacity-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* MARKET SAMPLES CATALOG */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* OWNED & IMPORTED PRODUCTION VAULT */}
          {ownedBeats.length > 0 && (
            <div className="bg-zinc-950/60 border border-orange-500/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider uppercase font-sans text-orange-500 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  Your Studio Vault ({ownedBeats.length})
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">Ready to spit lyrics over</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ownedBeats.map(beat => {
                  const previewing = playingId === beat.id;
                  return (
                    <div 
                      key={beat.id}
                      className={`bg-zinc-900/95 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                        previewing ? 'border-orange-500 bg-zinc-900 shadow-md shadow-orange-500/5' : 'border-neutral-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center text-lg text-orange-500 font-bold">
                            {beat.isCustom ? "🔗" : (beat.artworkUrl || "🎵")}
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-xs tracking-wide truncate max-w-[145px] text-zinc-100">{beat.title}</h4>
                            <div className="text-[10px] text-neutral-400 truncate max-w-[145px]">
                              {beat.isCustom ? "Custom Stem" : `By ${beat.producer}`}
                            </div>
                          </div>
                        </div>

                        {/* PREVIEW BUTTON */}
                        <button
                          onClick={() => togglePreview(beat)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                            previewing 
                              ? 'bg-orange-500 text-black border-orange-500 animate-pulse font-extrabold' 
                              : 'bg-neutral-950 text-orange-500 border-neutral-800 hover:border-orange-400'
                          }`}
                          title="Preview Beat Snippet"
                        >
                          {previewing ? <Square className="w-3 h-3 fill-black shrink-0" /> : <Play className="w-3 h-3 fill-orange-500 shrink-0" />}
                          <span>Preview</span>
                        </button>
                      </div>

                      {/* ACTIVE SNIPPET TIMED PROGRESS BAR */}
                      {previewing && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-neutral-400 font-mono">
                            <span>Playing 12s demo excerpt...</span>
                            <span className="text-orange-500 font-bold">{previewSecondsLeft}s</span>
                          </div>
                          <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden">
                            <div 
                              className="bg-orange-500 h-full transition-all duration-1000 ease-linear" 
                              style={{ width: `${(previewSecondsLeft / 12) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                        <div className="flex gap-2 items-center font-mono text-[9px] text-neutral-400">
                          <span className="bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-300 font-semibold">{beat.bpm} BPM</span>
                          <span className="text-[10px] uppercase">{beat.genre}</span>
                        </div>

                        {/* SELECT FOR LYRICS */}
                        {onSelectBeatForLyrics && (
                          <button
                            onClick={() => {
                              stopAllAudio();
                              onSelectBeatForLyrics(beat.id);
                            }}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-black border border-orange-600 hover:border-orange-500 rounded text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Flame className="w-3 h-3 text-black shrink-0 animate-pulse" />
                            <span>Select for Lyrics</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h3 className="text-lg font-bold tracking-wider uppercase font-sans border-l-2 border-orange-500 pl-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Premium Backbeats
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beats.map(beat => {
              const owned = user.purchasedBeatIds.includes(beat.id);
              const previewing = playingId === beat.id;

              return (
                <div 
                  key={beat.id}
                  className={`bg-zinc-900 border transition-all rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/30 ${
                    previewing ? 'border-orange-500 shadow-lg shadow-orange-500/5' : 'border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center text-xl shadow-inner text-orange-500 font-bold">
                        {beat.artworkUrl || "🎵"}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm tracking-wide truncate max-w-[150px]">{beat.title}</h4>
                        <div className="text-[11px] text-neutral-400 truncate max-w-[150px]">By {beat.producer}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => togglePreview(beat)}
                      className={`p-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        previewing 
                          ? 'bg-orange-500 text-black border-orange-500 animate-pulse' 
                          : 'bg-neutral-950 text-orange-500 border-neutral-800 hover:border-orange-500'
                      }`}
                      title={previewing ? "Stop Preview" : "Preview Beat Rhythm"}
                    >
                      {previewing ? <Square className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-orange-500" />}
                    </button>
                  </div>

                  {/* ACTIVE SNIPPET TIMED PROGRESS BAR */}
                  {previewing && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-neutral-400 font-mono">
                        <span>Playing 12s demo excerpt...</span>
                        <span className="text-orange-500 font-bold">{previewSecondsLeft}s</span>
                      </div>
                      <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full transition-all duration-1000 ease-linear" 
                          style={{ width: `${(previewSecondsLeft / 12) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex gap-2.5 items-center">
                      <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-mono text-[10px]">{beat.bpm} BPM</span>
                      <span className="text-[11px] text-neutral-300">{beat.genre}</span>
                    </div>

                    <div className="text-right">
                      {owned ? (
                        <div className="flex items-center gap-1.5">
                          {onSelectBeatForLyrics && (
                            <button
                              onClick={() => {
                                stopAllAudio();
                                onSelectBeatForLyrics(beat.id);
                              }}
                              className="px-2.5 py-1 bg-orange-650 hover:bg-orange-500 border border-orange-600 rounded text-[10px] font-bold uppercase text-black font-sans transition-all active:scale-95 cursor-pointer"
                              title="Select for Lyric Studio drafting"
                            >
                              Lyrics
                            </button>
                          )}
                          <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Owned
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onPurchaseBeat(beat.id)}
                          disabled={purchasing || user.cash < beat.price}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-transparent text-xs font-bold uppercase rounded text-black font-sans tracking-wide border border-orange-600 hover:border-orange-500 transition-all active:scale-95 flex items-center gap-1"
                        >
                          Buy for ${beat.price}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDE ACTIONS: CUSTOM BEAT IMPORT & SONG BROKER */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* IMPORT OFF-SITE AUDIO MP3S */}
          <div className="bg-zinc-950 border border-neutral-800 rounded-xl p-5 text-left space-y-4">
            <h3 className="text-md font-bold tracking-wider uppercase font-sans text-orange-500 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Off-Site Stem Import
            </h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Have beats hosted offsite? Paste an direct MP3 reference link to deploy your backing vocals directly into active studio drafts!
            </p>

            <form onSubmit={handleCustomImport} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Beat File Title</label>
                <input
                  type="text"
                  placeholder="e.g. Skyline Cypher Drop"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded py-2 px-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Genre</label>
                  <select
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded py-2 px-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option>Boom Bap</option>
                    <option>Trap</option>
                    <option>G-Funk</option>
                    <option>East Coast</option>
                    <option>Grimy Drill</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    value={customBpm}
                    onChange={(e) => setCustomBpm(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded py-2 px-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">HTTP MP3 Audio Link</label>
                <input
                  type="text"
                  placeholder="e.g. https://example.com/beat.mp3"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded py-2 px-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {importError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Stem linked successfully! Your custom beat is ready in your assets.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 border border-neutral-700"
              >
                <Plus className="w-4 h-4" />
                Bundle & Mount Stem
              </button>
            </form>
          </div>

          {/* SELL SONGS SECTION (Virtual Economy Brokerage) */}
          <div className="bg-zinc-950 border border-neutral-800 rounded-xl p-5 text-left space-y-4">
            <h3 className="text-md font-bold tracking-wider uppercase font-sans text-orange-500 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Commercial Music Licensing
            </h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Ready to cash out? Sell your songwriting portfolios and completed tracks to the street record labels. The more rhymes, BPM coordination, and premium beats attached, the higher payout value you command globally.
            </p>

            {/* List draft songs for sale */}
            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {user.songs.filter(s => !s.isSold).length === 0 ? (
                <div className="text-xs text-neutral-500 text-center py-6 border border-dashed border-neutral-800 rounded-lg">
                  No unsold draft folders available in Studio.
                </div>
              ) : (
                user.songs.filter(s => !s.isSold).map(song => (
                  <div key={song.id} className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold truncate max-w-[120px]">{song.title}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{song.genre} ({song.lyrics.split('\n').length} lines)</div>
                    </div>
                    <button
                      onClick={() => {
                        setSellingSongId(song.id);
                        // Calculate a smart default target price depending on lines written
                        const linesCount = song.lyrics.split('\n').filter(l => l.trim()).length;
                        const baseline = Math.min(600, 150 + linesCount * 15 + (song.beatId ? 100 : 0));
                        setTargetPrice(baseline);
                      }}
                      className="px-2 py-1.5 bg-orange-500/10 hover:bg-orange-600 hover:text-black border border-orange-500/30 rounded text-[10px] uppercase font-bold text-orange-500 tracking-wide transition-all"
                    >
                      Auction
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* AUCTION SELLING DIALOG POPUP */}
      {sellingSongId && targetSong && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-left space-y-5 shadow-2xl">
            <h4 className="text-lg font-black uppercase text-orange-500 tracking-wide flex items-center gap-2">
              <Music className="w-5 h-5" />
              Music Licensing Portal
            </h4>
            
            <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Track Item:</span>
                <span className="font-bold text-white">{targetSong.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Lines:</span>
                <span className="font-mono">{targetSong.lyrics.split('\n').filter(l => l.trim()).length} bars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Genre Alignment:</span>
                <span className="text-orange-500 font-bold">{targetSong.genre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Beat License Hooked:</span>
                <span>{targetSong.beatId ? "Yes (Premium Boost)" : "None (Acappella)"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase font-bold tracking-wider text-neutral-400">Asking Price ($FLOW)</label>
                <span className="font-mono text-orange-500 font-bold">${targetPrice} FLOW</span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="25"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 accent-orange-500 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>$50 FLOW</span>
                <span>$800 FLOW</span>
              </div>
            </div>

            <div className="bg-orange-500/5 p-3 rounded-lg border border-orange-500/10 text-[11px] text-neutral-400 leading-relaxed">
              Selling this track licenses your lyrics permanently. You will harvest <strong className="text-white">${targetPrice} $FLOW</strong> virtual dollars and earn <strong className="text-white">{Math.floor(targetPrice / 3)} REP</strong> globally to climb top rankings.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSellingSongId(null)}
                className="flex-1 py-2.5 border border-neutral-700 hover:bg-neutral-800 text-xs font-bold uppercase rounded-lg transition-all"
              >
                Retract
              </button>
              <button
                onClick={executeSale}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-xs text-black font-bold uppercase rounded-lg transition-all"
              >
                Auction Master Stems
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
