import React, { useState, useEffect, useRef } from "react";
import { AvatarConfig } from "../types";
import { RapperAvatar } from "./AvatarCustomizer";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Flame, 
  Sparkles, 
  Volume2, 
  RefreshCw, 
  Radio, 
  Check, 
  Clock, 
  ShieldCheck 
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: "user" | "bot" | "system";
  avatar?: AvatarConfig;
  text: string;
  timestamp: string;
  rep?: number;
}

interface ChatRoomProps {
  currentUsername: string;
  userRep: number;
  userAvatar: AvatarConfig;
}

export default function ChatRoom({ currentUsername, userRep, userAvatar }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [wsStatus, setWsStatus] = useState<"connected" | "connecting" | "polling">("connecting");
  const [activeChatters, setActiveChatters] = useState(8);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial historic messages loader
  const loadChatHistoryHTTP = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load chat history via HTTP", err);
    }
  };

  // Setup WebSocket connection
  const connectWebSocket = () => {
    try {
      setWsStatus("connecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;
      
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsStatus("connected");
        setError(null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "history") {
            setMessages(payload.data);
          } else if (payload.type === "message") {
            setMessages((prev) => {
              // Idempotency check: prevent duplicate messages
              if (prev.some((m) => m.id === payload.data.id)) return prev;
              return [...prev, payload.data];
            });
          }
        } catch (e) {
          console.error("Failed to parse WS payload:", e);
        }
      };

      socket.onclose = () => {
        console.warn("WebSocket closed. Falling back to HTTP polling.");
        startPolling();
      };

      socket.onerror = (err) => {
        console.error("WebSocket encountered an error:", err);
        socket.close();
      };
    } catch (err) {
      console.error("Error setting up WebSocket:", err);
      startPolling();
    }
  };

  // Fallback Polling engine
  const startPolling = () => {
    setWsStatus("polling");
    
    // Clear any previous poll timer
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    // Initial pre-fetch
    loadChatHistoryHTTP();

    pollingIntervalRef.current = setInterval(async () => {
      await loadChatHistoryHTTP();
      
      // Randomly fluctuate online chatters slightly to make it feel alive
      setActiveChatters((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(4, Math.min(15, prev + change));
      });
    }, 4000);
  };

  useEffect(() => {
    // Initial fetch to load messages instantly
    loadChatHistoryHTTP();
    
    // Begin WebSocket connection attempt
    connectWebSocket();

    // Randomize active counter on start
    setActiveChatters(Math.floor(6 + Math.random() * 5));

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Send a custom chat message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) {
      setInputText("");
    }

    const payload = {
      sender: currentUsername || "Player MC",
      senderType: "user",
      avatar: userAvatar,
      text,
      rep: userRep
    };

    // If WebSocket is actively connected, send over socket
    if (wsStatus === "connected" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        ...payload
      }));
    } else {
      // Direct REST post backup
      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          throw new Error("HTTP POST failed");
        }
        // Force instant fetch on success to sync state
        await loadChatHistoryHTTP();
      } catch (err) {
        console.error("Failed to post message via REST", err);
        setError("Network congested. Message will try again shortly.");
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  // Quick prompt presets
  const presets = [
    { label: "🎤 Spit Fire", text: "Spit some massive flame bars in the booth today MCs! 🔥" },
    { label: "Beat Check 🎧", text: "Which synthwave drum beat are you all using for high jury scores?" },
    { label: "Level Up 🚀", text: "Secured my bag. Just upgraded my street microphone preset!" },
    { label: "Lounge Tip 💡", text: "Tip: Aligning your multi-syllabic schemes doubles your final payout!" }
  ];

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "刚刚";
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true 
      });
    } catch {
      return "Cypher time";
    }
  };

  return (
    <div id="spitfire_chat_room" className="bg-[#0D0D0D] border border-neutral-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px] relative">
      
      {/* GLOW DECORATIVE AMBIENT ACCENTS */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/5 blur-[80px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-600/5 blur-[80px] pointer-events-none rounded-full" />

      {/* HEADER BAR */}
      <div className="p-4 bg-zinc-950/80 border-b border-neutral-900 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-orange-600/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
              <Radio className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            {/* Pulsing visual red dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>

          <div>
            <h3 className="text-sm font-black font-mono tracking-tight text-white uppercase flex items-center gap-1.5">
              Global Cypher Lounge
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/15 uppercase font-black">
                Public
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-neutral-500" />
              <span>{activeChatters} MCs active inside the channel</span>
            </p>
          </div>
        </div>

        {/* WEB SOCKET SYNC STATUS */}
        <div className="flex items-center gap-2">
          {wsStatus === "connected" ? (
            <span className="text-[9px] font-black font-mono tracking-widest text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              Sync Online
            </span>
          ) : wsStatus === "connecting" ? (
            <span className="text-[9px] font-black font-mono tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
              Connecting...
            </span>
          ) : (
            <span className="text-[9px] font-black font-mono tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5" title="Standby polling mode active">
              <Clock className="w-3 h-3 text-amber-500" />
              Standby Feed
            </span>
          )}
        </div>
      </div>

      {/* CHAT CHANNELS LISTINGS */}
      <div className="messages-container flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
            <MessageSquare className="w-8 h-8 text-neutral-600 animate-bounce" />
            <p className="text-xs text-neutral-400 font-mono">Initializing street waves. No audio packages loaded yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderType === "user" && msg.sender === currentUsername;
            const isSystem = msg.senderType === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-orange-400 text-center leading-relaxed font-mono flex items-center justify-center gap-2 shadow-inner">
                  <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-left max-w-[85%] ${
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar config rendering */}
                <div className="w-9 h-9 shrink-0 bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden relative shadow-md">
                  {msg.avatar ? (
                    <RapperAvatar config={msg.avatar} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 font-black text-xs uppercase bg-neutral-900">
                      {msg.sender.slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* Message Bubble section */}
                <div className="space-y-1">
                  <div className={`flex items-baseline gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs font-black text-neutral-200 tracking-tight">
                      {msg.sender}
                    </span>
                    
                    {msg.senderType === "bot" && (
                      <span className="text-[8px] font-black tracking-widest text-neutral-400 uppercase bg-neutral-900 border border-neutral-800 px-1 hover:text-orange-400 transition-colors">
                        LEGEND
                      </span>
                    )}

                    {msg.rep ? (
                      <span className="text-[8px] font-mono text-emerald-500 font-bold">
                        {msg.rep.toLocaleString()} REP
                      </span>
                    ) : null}

                    <span className="text-[8px] text-neutral-500 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed relative ${
                    isMe 
                      ? "bg-orange-600 text-black font-medium rounded-tr-none" 
                      : "bg-[#141416] border border-neutral-850 text-neutral-200 rounded-tl-none font-normal"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK PRESET CHIP BADGES */}
      <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-900 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none z-10 shrink-0">
        <span className="text-[9px] uppercase font-black text-neutral-500 tracking-widest flex items-center gap-1 self-center mr-1">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Tips:
        </span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(preset.text)}
            className="px-3 py-1 bg-neutral-900/40 hover:bg-orange-500/15 border border-neutral-850 hover:border-orange-500/20 text-neutral-200 hover:text-orange-400 text-[10px] rounded-full transition-all cursor-pointer active:scale-95 text-left shrink-0 font-sans"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* INPUT CONTROLS */}
      <div className="p-4 bg-zinc-950/90 border-t border-neutral-900 flex items-center gap-3 z-10 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Spit some tip bars, share highest score..."
          maxLength={150}
          className="flex-1 bg-neutral-900 text-xs text-white placeholder-neutral-500 px-4 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-orange-500 transition-all font-sans"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className="p-3 bg-orange-600 hover:bg-orange-500 text-black rounded-xl transition-all font-black flex items-center justify-center cursor-pointer shadow-md shadow-orange-500/10 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.97]"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Error Notice overlay */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/20 text-red-400 text-[10px] px-4 py-2 rounded-full font-mono shadow-xl flex items-center gap-1.5 z-20 animate-bounce">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

    </div>
  );
}
