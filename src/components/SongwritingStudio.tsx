import React, { useState } from "react";
import { UserProfile, Beat, Song } from "../types";
import { synthBeat } from "../lib/audioService";
import { 
  FileText, Music, Sparkles, BookOpen, Wand2, Play, Square, 
  ChevronRight, Save, Trash2, Check, AlertCircle, FilePlus
} from "lucide-react";

interface Props {
  user: UserProfile;
  beats: Beat[];
  onSaveSong: (songData: Partial<Song>) => void;
  saving?: boolean;
  initialBeatId?: string;
  onClearInitialBeatId?: () => void;
}

export default function SongwritingStudio({ 
  user, 
  beats, 
  onSaveSong, 
  saving = false,
  initialBeatId,
  onClearInitialBeatId
}: Props) {
  // Active document state
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [beatId, setBeatId] = useState<string>("");
  const [genre, setGenre] = useState("Boom Bap");

  // Load beat automatically if routed with selection from Beat Store
  React.useEffect(() => {
    if (initialBeatId) {
      setBeatId(initialBeatId);
      const selectedBeat = beats.find(b => b.id === initialBeatId);
      if (selectedBeat) {
        setGenre(selectedBeat.genre);
      }
      if (onClearInitialBeatId) {
        onClearInitialBeatId();
      }
    }
  }, [initialBeatId, beats, onClearInitialBeatId]);
  
  // Audio playing helper for backing synthesizers
  const [isPlaying, setIsPlaying] = useState(false);

  // Gemini Rhyme Assistant states
  const [rhymeKeyword, setRhymeKeyword] = useState("");
  const [queryType, setQueryType] = useState<"rhymes" | "slang" | "phrases">("rhymes");
  const [rhymeResults, setRhymeResults] = useState<string[]>([]);
  const [loadingRhemes, setLoadingRhymes] = useState(false);

  // Gemini Line improver states
  const [rapperStyle, setRapperStyle] = useState("Eminem-ish (Multi-rhymes)");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState("");

  const ownedBeats = beats.filter(b => user.purchasedBeatIds.includes(b.id));

  // Sync state to loaded document
  const loadSong = (song: Song) => {
    // Stop audio first
    stopBackingBeat();
    
    setActiveSongId(song.id);
    setTitle(song.title);
    setLyrics(song.lyrics);
    setBeatId(song.beatId || "");
    setGenre(song.genre);
  };

  const createNewSong = () => {
    stopBackingBeat();
    setActiveSongId(null);
    setTitle("Untitled Spit Draft");
    setLyrics("Write your master verses here...\nFocus the tempo, map the rhymes.\nFlip these bars, make it gold.\nSpit fire every single time.");
    setBeatId("");
    setGenre("Boom Bap");
  };

  const handleSaveDoc = () => {
    if (!title.trim()) return;
    const bpm = beats.find(b => b.id === beatId)?.bpm || 90;
    onSaveSong({
      id: activeSongId || undefined,
      title,
      lyrics,
      beatId: beatId || undefined,
      genre,
      bpm,
      listedForSale: false,
      isSold: false
    });
  };

  // Web Synth sound toggler 
  const toggleBackingBeat = () => {
    const selectedBeat = beats.find(b => b.id === beatId);
    if (!selectedBeat) return;

    if (isPlaying) {
      stopBackingBeat();
    } else {
      synthBeat.stop();
      synthBeat.setPreset(selectedBeat.synthesisPreset || 'boombap');
      synthBeat.setBpm(selectedBeat.bpm);
      synthBeat.start();
      setIsPlaying(true);
    }
  };

  const stopBackingBeat = () => {
    synthBeat.stop();
    setIsPlaying(false);
  };

  // Queries Server for Gemini-powered Rhyming help files
  const fetchRhymes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rhymeKeyword.trim()) return;
    setLoadingRhymes(true);
    setRhymeResults([]);

    try {
      const res = await fetch("/api/studio/rhymes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: rhymeKeyword, queryType })
      });
      const data = await res.json();
      setRhymeResults(data.result || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRhymes(false);
    }
  };

  // Queries Server for Gemini next line suggestions
  const fetchNextLine = async () => {
    // Collect the last line or the selected line of prompt
    const lines = lyrics.split("\n").filter(l => l.trim());
    const lastLine = lines[lines.length - 1] || "Spitting fiery bars on the grid";
    
    setLoadingSuggestion(true);
    setSuggestionResult("");

    try {
      const res = await fetch("/api/studio/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line: lastLine,
          style: rapperStyle,
          genre
        })
      });
      const data = await res.json();
      setSuggestionResult(data.suggestion || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleInsertSuggestion = () => {
    if (!suggestionResult) return;
    setLyrics(prev => prev + "\n" + suggestionResult);
    setSuggestionResult("");
  };

  // Calculates stats
  const lyricsLinesCount = lyrics.split("\n").filter(l => l.trim()).length;
  const syllableEstimate = lyrics.split(/\s+/).filter(w => w.length > 0).length * 1.35; // simple heuristic

  return (
    <div className="space-y-8 text-white p-4">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-500/10 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase text-orange-500 tracking-wider font-sans">
            Lyricists Songwriting Studio
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Draft, rhyme-check, and layer backing tracks. Use the Gemini AI Lyric Assistant to secure rhymes, synonyms, or suggestions.
          </p>
        </div>
        
        <button
          onClick={createNewSong}
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-xs font-bold uppercase rounded-lg flex items-center gap-2 self-start md:self-center transition-all duration-150 active:scale-95 text-black"
        >
          <FilePlus className="w-4 h-4 text-black" />
          Fresh Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DRAFT HISTORY SELECTOR */}
        <div className="lg:col-span-3 bg-zinc-950 border border-neutral-800 rounded-xl p-4 text-left space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Draft Folder</span>
            <span className="font-mono text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-orange-500">
              {user.songs.length} SAVED
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {user.songs.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No writing sheets created yet.</p>
            ) : (
              user.songs.map((song) => {
                const active = activeSongId === song.id;
                return (
                  <button
                    key={song.id}
                    onClick={() => loadSong(song)}
                    className={`w-full p-2.5 rounded-lg border text-left block transition-all ${
                      active 
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500' 
                        : 'border-neutral-900 bg-zinc-900 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{song.title}</div>
                    <div className="flex justify-between text-[9px] text-neutral-400 mt-1 uppercase font-mono">
                      <span>{song.genre}</span>
                      <span>{song.isSold ? 'Sold' : 'Draft'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: ACTIVE CANVAS EDITOR */}
        <div className="lg:col-span-6 space-y-4 text-left">
          
          <div className="bg-zinc-900 rounded-xl border border-neutral-800 p-5 space-y-4 shadow-xl">
            {/* Title / Beat hookup / Save row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-4 border-b border-neutral-800/80">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="Draft Song Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm font-bold placeholder-neutral-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={beatId}
                  onChange={(e) => {
                    setBeatId(e.target.value);
                    const selBeat = beats.find(b => b.id === e.target.value);
                    if (selBeat) setGenre(selBeat.genre);
                    stopBackingBeat();
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">A Cappella (No beat)</option>
                  {ownedBeats.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.bpm}BPM)</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  onClick={handleSaveDoc}
                  disabled={saving || !title.trim()}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-none text-xs font-bold uppercase rounded text-black flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Backing synthesizer player controls */}
            {beatId && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <Music className="w-4 h-4 text-orange-500" />
                  <span>
                    Audio loop: <strong>{beats.find(b => b.id === beatId)?.title}</strong>
                  </span>
                </div>
                <button
                  onClick={toggleBackingBeat}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border flex items-center gap-1 transition-all ${
                    isPlaying 
                      ? 'bg-orange-500 border-orange-500 text-black animate-pulse' 
                      : 'bg-neutral-900 border-neutral-800 text-orange-500 hover:border-orange-500'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-black" /> Stop Loop
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-orange-500" /> Start Loop
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Canvas Lyrics text box */}
            <div>
              <textarea
                rows={12}
                placeholder="Spaghetti strap flows, coding on the back street..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-orange-500/70"
              />
            </div>

            {/* Syllables / line counts visualizer stats stats */}
            <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-md border border-neutral-850/60">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-neutral-500" /> Lines: <strong className="text-white">{lyricsLinesCount} bars</strong>
              </span>
              <span>
                Est. syllables: <strong className="text-white">{Math.floor(syllableEstimate)}</strong>
              </span>
              <span>
                Style: <strong className="text-orange-500 uppercase">{genre}</strong>
              </span>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: LYRICIST DUAL AI CO-PILOT (RHYMING + NEXT BAR GENERATOR) */}
        <div className="lg:col-span-3 space-y-6 text-left">
          
          {/* PAIR ENGINE A: RHYME CO-PILOT */}
          <div className="bg-zinc-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1.5 pb-2 border-b border-neutral-900">
              <BookOpen className="w-4 h-4" /> Rhyme Copilot
            </h3>
            
            <form onSubmit={fetchRhymes} className="space-y-2.5">
              <input
                type="text"
                placeholder="Search word (e.g. flow)"
                value={rhymeKeyword}
                onChange={(e) => setRhymeKeyword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
              />
              
              <div className="grid grid-cols-3 gap-1">
                {(["rhymes", "slang", "phrases"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setQueryType(type)}
                    className={`py-1 text-[9px] uppercase font-bold tracking-wider rounded border transition-all ${
                      queryType === type 
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loadingRhemes || !rhymeKeyword.trim()}
                className="w-full py-1.5 bg-zinc-900 hover:bg-neutral-800 text-orange-500 disabled:bg-neutral-950 disabled:text-neutral-700 border border-neutral-800 hover:border-orange-500/30 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
              >
                {loadingRhemes ? (
                  <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Query Assist
                  </>
                )}
              </button>
            </form>

            {/* Results Grid */}
            <div className="max-h-[120px] overflow-y-auto pt-1 flex flex-wrap gap-1.5 pr-1">
              {rhymeResults.length === 0 ? (
                <p className="text-[10px] text-neutral-500 italic py-2 text-center w-full">Enter keyword to receive smart suggestions.</p>
              ) : (
                rhymeResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => setLyrics(prev => prev + " " + result)}
                    className="text-[10px] px-2 py-0.5 bg-neutral-900 hover:bg-orange-500/10 hover:text-orange-500 border border-neutral-800 rounded font-mono transition-all duration-100"
                    title="Click to insert to lyric sheet"
                  >
                    {result}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* PAIR ENGINE B: NEXT BAR CO-PILOT */}
          <div className="bg-zinc-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1.5 pb-2 border-b border-neutral-900">
              <Wand2 className="w-4 h-4" /> Next Bar Improver
            </h3>

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block">Select Persona Flow</label>
              <select
                value={rapperStyle}
                onChange={(e) => setRapperStyle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-orange-500"
              >
                <option>Eminem-ish (Multi-syllable rhyming bangers)</option>
                <option>Kendrick-ish (Deep conceptual metaphors)</option>
                <option>Drake-ish (Catchy melodic RnB flow hook)</option>
                <option>Wu-Tang Underground (Rugged dark kungfu lines)</option>
              </select>
            </div>

            <button
              onClick={fetchNextLine}
              disabled={loadingSuggestion || lyricsLinesCount === 0}
              className="w-full py-1.5 bg-zinc-900 hover:bg-neutral-800 text-orange-500 disabled:bg-neutral-950 disabled:text-neutral-700 disabled:border-none border border-neutral-800 hover:border-orange-500/30 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
            >
              {loadingSuggestion ? (
                <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-orange-500" />
                  Improvise Next Bar
                </>
              )}
            </button>

            {suggestionResult && (
              <div className="p-2.5 bg-orange-500/5 border border-orange-500/20 text-neutral-300 rounded-lg text-left space-y-2">
                <p className="font-mono text-xs italic leading-relaxed">
                  "{suggestionResult}"
                </p>
                <button
                  onClick={handleInsertSuggestion}
                  className="w-full py-1 bg-orange-600 hover:bg-orange-500 text-[10px] text-black font-bold uppercase rounded flex items-center justify-center gap-1 transition-all"
                >
                  <ChevronRight className="w-3 h-3" /> Insert Downwards
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
