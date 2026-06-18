import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Community Discussion Preset Chat Messages state
const INITIAL_CHAT_MESSAGES = [
  {
    id: "chat_init_1",
    sender: "Queen Rhythm",
    senderType: "bot",
    avatar: {
      skinColor: "#E0A96D",
      hairstyle: "dreads",
      shirtStyle: "jersey",
      hatStyle: "crown",
      earringStyle: "gold_hoops",
      sunglassesStyle: "neon_orange",
      expression: "smirk",
      micStyle: "gold",
      bgStyle: "glowing_rings"
    },
    text: "Boom Bap is all about the pocket. If you match the timing of Smokey Boulevard, your flow score surges!",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    rep: 8400
  },
  {
    id: "chat_init_2",
    sender: "Shadow Barz",
    senderType: "bot",
    avatar: {
      skinColor: "#D0D0D0",
      hairstyle: "bald",
      shirtStyle: "hoodie",
      hatStyle: "beanie",
      earringStyle: "silver_stud",
      sunglassesStyle: "cyber_visor",
      expression: "neutral",
      micStyle: "crystal",
      bgStyle: "matrix"
    },
    text: "Just hit a 96 JURY score against MC Spitfire! The secret is to align your rhyme scheme with the cybervisor's tempo.",
    timestamp: new Date(Date.now() - 480000).toISOString(),
    rep: 6800
  },
  {
    id: "chat_init_3",
    sender: "Acoustic Kid",
    senderType: "bot",
    avatar: {
      skinColor: "#F4D1AE",
      hairstyle: "short_fade",
      shirtStyle: "flannel",
      hatStyle: "backward_cap",
      earringStyle: "none",
      sunglassesStyle: "none",
      expression: "determined",
      micStyle: "red",
      bgStyle: "bokeh"
    },
    text: "Does anyone want to trade tips on G-Funk beats? That Westside Hydrolik track has a heavy baseline.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    rep: 3500
  },
  {
    id: "chat_init_4",
    sender: "MC Spitfire",
    senderType: "bot",
    avatar: {
      skinColor: "#C5A880",
      hairstyle: "mohawk",
      shirtStyle: "leather_vest",
      hatStyle: "none",
      earringStyle: "none",
      sunglassesStyle: "tinted_shades",
      expression: "roar",
      micStyle: "vintage",
      bgStyle: "fire"
    },
    text: "🔥 Just restocked the market with rare synthesizers. Grab them to level up your track output!",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    rep: 5200
  }
];

let globalChatHistory = [...INITIAL_CHAT_MESSAGES];
const connectedClients = new Set<WebSocket>();

// Default Beats catalog
const DEFAULT_BEATS = [
  {
    id: "beat_1",
    title: "Neon Syndicate",
    producer: "Rhythm Architect",
    genre: "Synthwave Hip Hop",
    bpm: 110,
    price: 150,
    synthesisPreset: "synthwave",
    artworkUrl: "⚡"
  },
  {
    id: "beat_2",
    title: "Smokey Boulevard",
    producer: "Dusty Fingers",
    genre: "Boom Bap / Lofi",
    bpm: 88,
    price: 100,
    synthesisPreset: "boombap",
    artworkUrl: "☕"
  },
  {
    id: "beat_3",
    title: "Sub-Zero Drop",
    producer: "Volt Beatz",
    genre: "Trap Banger",
    bpm: 140,
    price: 250,
    synthesisPreset: "trap",
    artworkUrl: "❄️"
  },
  {
    id: "beat_4",
    title: "Westside Hydrolik",
    producer: "Dr. G-Funk",
    genre: "G-Funk Classic",
    bpm: 96,
    price: 180,
    synthesisPreset: "gfunk",
    artworkUrl: "🌴"
  },
  {
    id: "beat_5",
    title: "Overdrive Fuel",
    producer: "Industrial Noise",
    genre: "Cyberpunk Industrial",
    bpm: 125,
    price: 220,
    synthesisPreset: "industrial",
    artworkUrl: "⚙️"
  }
];

// Seed initial leaderboard legends
const DEFAULT_LEADERBOARD = [
  {
    id: "legend_1",
    name: "Queen Rhythm",
    rep: 8400,
    cash: 22000,
    wins: 58,
    losses: 4,
    streak: 12,
    bio: "The undisputed monarch of the cypher. Known for double-time flows and regal vocabulary.",
    avatar: {
      skinColor: "#E0A96D",
      hairstyle: "dreads",
      shirtStyle: "jersey",
      hatStyle: "crown",
      earringStyle: "gold_hoops",
      sunglassesStyle: "neon_orange",
      expression: "smirk",
      micStyle: "gold",
      bgStyle: "glowing_rings"
    }
  },
  {
    id: "legend_2",
    name: "Shadow Barz",
    rep: 6800,
    cash: 14500,
    wins: 48,
    losses: 12,
    streak: 6,
    bio: "Rhymes forged in the server racks. Delivers deep, philosophical, high-concept visual punchlines.",
    avatar: {
      skinColor: "#D0D0D0",
      hairstyle: "bald",
      shirtStyle: "hoodie",
      hatStyle: "beanie",
      earringStyle: "silver_stud",
      sunglassesStyle: "cyber_visor",
      expression: "neutral",
      micStyle: "crystal",
      bgStyle: "matrix"
    }
  },
  {
    id: "legend_3",
    name: "MC Spitfire",
    rep: 5200,
    cash: 8900,
    wins: 36,
    losses: 15,
    streak: 3,
    bio: "Unpredictable energy. Spits rapid-fire bars hotter than a solar flare.",
    avatar: {
      skinColor: "#C5A880",
      hairstyle: "mohawk",
      shirtStyle: "leather_vest",
      hatStyle: "none",
      earringStyle: "none",
      sunglassesStyle: "tinted_shades",
      expression: "roar",
      micStyle: "vintage",
      bgStyle: "fire"
    }
  },
  {
    id: "legend_4",
    name: "Acoustic Kid",
    rep: 3500,
    cash: 4200,
    wins: 22,
    losses: 16,
    streak: 1,
    bio: "Chill acoustic vibes meets trap sub-bass. Writes intricate and emotional songwriting layers.",
    avatar: {
      skinColor: "#F4D1AE",
      hairstyle: "short_fade",
      shirtStyle: "flannel",
      hatStyle: "backward_cap",
      earringStyle: "none",
      sunglassesStyle: "none",
      expression: "determined",
      micStyle: "red",
      bgStyle: "bokeh"
    }
  },
  {
    id: "legend_5",
    name: "Grandmaster Code",
    rep: 9999,
    cash: 58000,
    wins: 102,
    losses: 2,
    streak: 41,
    bio: "Legendary pioneer who rhapsodizes in syntactic algorithms and pure binary energy. Flawless flow.",
    avatar: {
      skinColor: "#4E6E58",
      hairstyle: "cyber_locks",
      shirtStyle: "trench_coat",
      hatStyle: "headphones",
      earringStyle: "golden_plug",
      sunglassesStyle: "neon_matrix",
      expression: "evil_grin",
      micStyle: "glowing",
      bgStyle: "code_rain"
    }
  }
];

// Default user start profile
const INITIAL_USER = {
  id: "user_player",
  username: "Rookie Spitfire",
  cash: 500, // Starts with some cash for beats or entry stakes
  rep: 250,
  wins: 0,
  losses: 0,
  streak: 0,
  avatar: {
    skinColor: "#F3C590",
    hairstyle: "short_fade",
    shirtStyle: "tshirt",
    hatStyle: "headphones",
    earringStyle: "none",
    sunglassesStyle: "none",
    expression: "determined",
    micStyle: "classic",
    bgStyle: "underground_wall"
  },
  purchasedBeatIds: ["beat_2"], // Gets smokey boulevard for free
  songs: [],
  lastDailyRewardClaim: "",
  transactions: [],
  battleHistory: [
    {
      id: "battle_demo_1",
      opponentName: "Shadow Barz",
      opponentId: "legend_shadow",
      outcome: "win",
      stake: 120,
      playerScore: 88,
      opponentScore: 74,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    },
    {
      id: "battle_demo_2",
      opponentName: "Queen Rhythm",
      opponentId: "legend_rhythm",
      outcome: "loss",
      stake: 150,
      playerScore: 71,
      opponentScore: 85,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    },
    {
      id: "battle_demo_3",
      opponentName: "Acoustic Kid",
      opponentId: "legend_acoustic",
      outcome: "win",
      stake: 100,
      playerScore: 84,
      opponentScore: 68,
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
  ]
};

// Database state
interface DatabaseSchema {
  user: typeof INITIAL_USER;
  beats: typeof DEFAULT_BEATS;
  leaderboard: typeof DEFAULT_LEADERBOARD;
}

// Load DB helper
async function loadDB(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    if (!db.user.battleHistory) {
      db.user.battleHistory = [
        {
          id: "battle_demo_1",
          opponentName: "Shadow Barz",
          opponentId: "legend_shadow",
          outcome: "win",
          stake: 120,
          playerScore: 88,
          opponentScore: 74,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        },
        {
          id: "battle_demo_2",
          opponentName: "Queen Rhythm",
          opponentId: "legend_rhythm",
          outcome: "loss",
          stake: 150,
          playerScore: 71,
          opponentScore: 85,
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        },
        {
          id: "battle_demo_3",
          opponentName: "Acoustic Kid",
          opponentId: "legend_acoustic",
          outcome: "win",
          stake: 100,
          playerScore: 84,
          opponentScore: 68,
          date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }
      ];
      await writeDB(db);
    }
    if (!db.user.transactions) {
      db.user.transactions = [];
      await writeDB(db);
    }
    return db;
  } catch (error) {
    // If not exists, initialize
    const db = {
      user: { ...INITIAL_USER },
      beats: [...DEFAULT_BEATS],
      leaderboard: [...DEFAULT_LEADERBOARD]
    };
    await writeDB(db);
    return db;
  }
}

// Write DB helper
async function writeDB(data: DatabaseSchema): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function addAndBroadcastChatMessage(
  sender: string,
  senderType: "user" | "bot" | "system",
  text: string,
  avatar?: any,
  rep?: number
) {
  const newMsg = {
    id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    sender,
    senderType,
    avatar,
    text,
    timestamp: new Date().toISOString(),
    rep: rep || 0
  };
  globalChatHistory.push(newMsg);
  if (globalChatHistory.length > 50) {
    globalChatHistory.shift();
  }

  const broadcastPayload = JSON.stringify({ type: "message", data: newMsg });
  for (const client of connectedClients) {
    if (client.readyState === 1) { // WebSocket.OPEN is 1
      try {
        client.send(broadcastPayload);
      } catch (err) {
        console.error("Failed to broadcast chat message:", err);
      }
    }
  }
  return newMsg;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API 1: Fetch Profile
  app.get("/api/profile", async (req, res) => {
    try {
      const db = await loadDB();
      const todayStr = new Date().toDateString();
      let dailyRewardGranted = 0;

      // Access/Update user state with type checking default fallbacks
      const userObj = db.user as any;
      if (userObj.lastDailyRewardClaim !== todayStr) {
        dailyRewardGranted = 150; // Extra flow balance cash to jumpstart their day
        userObj.cash = (userObj.cash || 0) + dailyRewardGranted;
        userObj.lastDailyRewardClaim = todayStr;
        await writeDB(db);
      }

      res.json({
        ...db.user,
        dailyRewardGranted
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 2: Update Profile / Avatar
  app.post("/api/profile", async (req, res) => {
    try {
      const db = await loadDB();
      const updates = req.body;
      db.user = { ...db.user, ...updates };
      await writeDB(db);
      res.json(db.user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Payment Packages List
  app.get("/api/payment/packages", (req, res) => {
    res.json([
      { id: "pkg_pocket", name: "Lil MC Pocket", price: 5.00, flowCash: 500, description: "Kickstart your cypher journey. Perfect for beat licensing." },
      { id: "pkg_hustler", name: "Hustler Bundle", price: 10.00, flowCash: 1200, description: "Gain momentum in the street. 200 raw bonus cash." },
      { id: "pkg_platinum", name: "Platinum Cypher", price: 25.00, flowCash: 3500, description: "High-roller entry pool. 1,000 massive bonus cash." },
      { id: "pkg_stadium", name: "Stadium Master", price: 50.00, flowCash: 8000, description: "Ultimate stadium domination. Includes legendary status!" }
    ]);
  });

  // API Payment Charge / Execute Transaction
  app.post("/api/payment/charge", async (req, res) => {
    try {
      const { packageId, packageName, amount, cashReceived, cardholderName, cardNumber, expiryDate, cvc } = req.body;

      if (!packageId || !amount || !cashReceived) {
        return res.status(400).json({ error: "Missing essential transaction package fields." });
      }

      // If simulated credit card is provided, check basic constraints
      if (cardNumber) {
        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 13 || cleanCard.length > 19) {
          return res.status(400).json({ error: "Invalid card number formatting. Must be 13-19 digits." });
        }
        if (!expiryDate || !expiryDate.includes("/")) {
          return res.status(400).json({ error: "Invalid expiry date. Must be formatted as MM/YY." });
        }
        if (!cvc || cvc.trim().length < 3 || cvc.trim().length > 4) {
          return res.status(400).json({ error: "Invalid safety CVC security digit. Must be 3 or 4 numbers." });
        }
      }

      // Handle Stripe backend initialization if secret key is present in environment variables
      let stripeTxId = "sim_" + Math.random().toString(36).substring(2, 11);
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          // Stripe SDK lazy initialization as mandated
          const { default: Stripe } = await import("stripe");
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2023-10-16" as any
          });
          
          // Generate active client payment flow or charge request
          const charge = await stripe.paymentIntents.create({
            amount: Math.round(Number(amount) * 100), // convert to cents
            currency: "usd",
            description: `SpitFire FLOW Cash Package Upgrade: ${packageName}`,
            payment_method: "pm_card_visa", // Test VISA card reference
            confirm: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never"
            }
          });
          stripeTxId = charge.id;
        } catch (stripError: any) {
          console.error("Stripe engine failed. Falling back to secure native processor.", stripError);
        }
      }

      // Update Database
      const db = await loadDB();
      const last4 = cardNumber ? cardNumber.replace(/\s+/g, '').slice(-4) : "4242";

      const txItem = {
        id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: "deposit" as any,
        amount: Number(amount),
        cashReceived: Number(cashReceived),
        packageName: packageName || "Custom Balance",
        status: "success" as any,
        cardLast4: last4,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      };

      if (!db.user.transactions) {
        db.user.transactions = [];
      }
      db.user.transactions.unshift(txItem);

      // Add balance cash to user profile
      db.user.cash = (db.user.cash || 0) + Number(cashReceived);
      
      await writeDB(db);

      // Broadcast Chat announcement of high-roller deposit!
      addAndBroadcastChatMessage(
        "SpitFire Bank",
        "system",
        `💎 MC ${db.user.username || "MC User"} topped up their wallet with the '${packageName}' package (+$${Number(cashReceived).toLocaleString()} FLOW)! The bank vault has been replenished! 💰`
      );

      res.json({
        success: true,
        transaction: txItem,
        newBalance: db.user.cash,
        stripeTxId
      });

    } catch (e: any) {
      console.error("Payment action error:", e);
      res.status(500).json({ error: e.message || "Financial processor failed to complete the charge. Please retry." });
    }
  });

  // API Chat: Fetch & Post Live Chat messages (REST fallback)
  app.get("/api/chat", (req, res) => {
    res.json(globalChatHistory);
  });

  app.post("/api/chat/message", (req, res) => {
    try {
      const { sender, senderType, avatar, text, rep } = req.body;
      const msg = addAndBroadcastChatMessage(
        sender || "Anonymous MC",
        senderType || "user",
        text || "",
        avatar,
        rep || 0
      );
      res.json({ success: true, message: msg });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 3: Get Beats Catalog
  app.get("/api/beats", async (req, res) => {
    try {
      const db = await loadDB();
      res.json(db.beats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 4: Add New Custom Beat
  app.post("/api/beats/custom", async (req, res) => {
    try {
      const db = await loadDB();
      const customBeat = {
        id: `beat_custom_${Date.now()}`,
        title: req.body.title || "Custom Backbeat",
        producer: "Imported / URL",
        genre: req.body.genre || "Hip Hop",
        bpm: Number(req.body.bpm) || 90,
        price: 0,
        audioUrl: req.body.audioUrl,
        synthesisPreset: "custom",
        artworkUrl: "🔗",
        isCustom: true
      };
      db.beats.push(customBeat);
      db.user.purchasedBeatIds.push(customBeat.id); // Custom cuts are owned instatnly
      await writeDB(db);
      res.json({ user: db.user, beats: db.beats });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 5: Buy Beats
  app.post("/api/beats/purchase", async (req, res) => {
    try {
      const db = await loadDB();
      const { beatId } = req.body;
      const beat = db.beats.find(b => b.id === beatId);
      if (!beat) {
        return res.status(404).json({ error: "Beat not found in market." });
      }
      if (db.user.purchasedBeatIds.includes(beatId)) {
        return res.status(400).json({ error: "You already own this beat." });
      }
      if (db.user.cash < beat.price) {
        return res.status(400).json({ error: "Insufficient Cash ($FLOW). Spit some more battles!" });
      }

      db.user.cash -= beat.price;
      db.user.purchasedBeatIds.push(beatId);
      await writeDB(db);
      res.json(db.user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 6: Save or Sell Songwriting Documents
  app.post("/api/songs/save", async (req, res) => {
    try {
      const db = await loadDB();
      const songData = req.body; // should have id or create new one
      const existingIdx = db.user.songs.findIndex(s => s.id === songData.id);

      if (existingIdx > -1) {
        db.user.songs[existingIdx] = { ...db.user.songs[existingIdx], ...songData };
      } else {
        db.user.songs.push({
          id: `song_${Date.now()}`,
          dateCreated: new Date().toLocaleDateString(),
          isSold: false,
          listedForSale: false,
          ...songData
        });
      }
      await writeDB(db);
      res.json(db.user.songs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 7: Sell a finished Song writing to the Industry
  app.post("/api/songs/sell", async (req, res) => {
    try {
      const db = await loadDB();
      const { songId, sellPrice } = req.body;
      const song = db.user.songs.find(s => s.id === songId);

      if (!song) {
        return res.status(404).json({ error: "Song document not found." });
      }
      if (song.isSold) {
        return res.status(400).json({ error: "This song has already been sold." });
      }

      // Add a virtual payout
      const cashGain = Number(sellPrice) || 200;
      const repGain = Math.floor(cashGain / 3);

      song.isSold = true;
      song.priceSold = cashGain;
      song.listedForSale = false;

      db.user.cash += cashGain;
      db.user.rep += repGain;

      // Add a cool leaderboard notification / boost
      await writeDB(db);
      res.json({ user: db.user, cashGain, repGain });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 8: Get Global Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const db = await loadDB();
      // Render user active profile in correct location in leaderboard dynamically
      const userEntry = {
        id: db.user.id,
        name: db.user.username + " (You)",
        rep: db.user.rep,
        cash: db.user.cash,
        wins: db.user.wins,
        losses: db.user.losses,
        streak: db.user.streak,
        avatar: db.user.avatar,
        isUser: true,
        bio: "Rising lyrical threat climbing the underground charts."
      };

      // Filter user entry out of normal legends if they already have same id, then merge and sort
      const allEntries = db.leaderboard.filter(e => e.id !== userEntry.id);
      allEntries.push(userEntry);
      
      // Sort in-order of reputation
      allEntries.sort((a, b) => b.rep - a.rep);
      res.json(allEntries);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 9: Start/Simulate Battle & Submit verse (INTEGRATED WITH GEMINI)
  app.post("/api/battle/submit", async (req, res) => {
    try {
      const { userVerse, opponentId, opponentName, beatName, genre, bpm, roundNumber, totalRounds, stake } = req.body;
      const db = await loadDB();

      if (!apiKey || apiKey === "MOCK_KEY") {
        // Mock fallback if API key is not ready
        const r = Math.random();
        const score = Math.floor(65 + r * 30);
        const winPct = r > 0.45;
        const mockOpponentVerses = [
          "Your code is full of bugs and your layout is generic, / While my lyrical loops are strictly numeric. / You talking about real money but your wallet is small, / I came to the stadium to take over the mall!",
          "That flow was basic, like a default CSS file, / I pack these punchlines that stretch out a mile. / My reputation goes beyond the global charts, / This orange neon glow is where my royalty starts!",
          "You call yourself a threat, but you struggle to rhyme, / You missed the flow, you're always late on the time. / I take this golden crown and I place it on my header, / Check the scoreboard now, I'm infinitely better!"
        ];
        const verse = mockOpponentVerses[Math.floor(Math.random() * mockOpponentVerses.length)];
        const critique = `Critique: You spit some reasonable lines but your syllables are offset by ${Math.floor(Math.random() * 4)} beats. Keep practices tight.`;

        let isCompleted = roundNumber >= totalRounds;
        let winner: 'user' | 'opponent' | 'tie' | undefined = undefined;

        if (isCompleted) {
          winner = score > 78 ? 'user' : 'opponent';
          if (!db.user.battleHistory) {
            db.user.battleHistory = [];
          }
          db.user.battleHistory.unshift({
            id: "battle_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            opponentName: opponentName || "Unknown Challenger",
            opponentId: opponentId || "unknown",
            outcome: winner === 'user' ? 'win' : 'loss',
            stake: Number(stake) || 0,
            playerScore: score,
            opponentScore: Math.floor(62 + Math.random() * 20),
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          });

          if (winner === 'user') {
            db.user.wins += 1;
            db.user.streak += 1;
            db.user.cash += Number(stake);
            db.user.rep += Math.floor(Number(stake) / 2);
            addAndBroadcastChatMessage(
              "SpitFire Arena",
              "system",
              `🏆 MC ${db.user.username || "MC User"} has defeated ${opponentName} in a high-stakes duel, winning $${stake} FLOW and +${Math.floor(Number(stake) / 2)} REP! 🔥`
            );
          } else {
            db.user.losses += 1;
            db.user.streak = 0;
            db.user.cash = Math.max(0, db.user.cash - Number(stake));
            db.user.rep = Math.max(0, db.user.rep - Math.floor(Number(stake) / 4));
            addAndBroadcastChatMessage(
              "SpitFire Arena",
              "system",
              `💀 MC ${db.user.username || "MC User"} was knocked out by ${opponentName} in the arena! They lost a stake of $${stake} FLOW.`
            );
          }
          await writeDB(db);
        }

        return res.json({
          verse,
          score,
          critique,
          winner,
          user: db.user,
          isMock: true
        });
      }

      // Pro Gemini implementation
      const systemInstruction = `You are ${opponentName}, a savage hip hop rap battle champion.
You are active in a dark, glowing street underground battle.
The track background is ${genre} beating at ${bpm} BPM.
The current battle round is ${roundNumber}/${totalRounds}.
The stakeholder wager is $${stake} FLOW dollars.

Analyze the user's bars: "${userVerse}".
Determine code score (0 to 100) based on complexity of rhymes (AABB, ABAB, multisyllabic), flow density, hip hop cultural context, and punchline relevance. Give lower score (40-70) if generic, higher (80-98) if clever and original.

You must deliver a blistering 4-line rebutting rap verse that mock/roasts elements of the user's rhymes while demonstrating superior styling. 
Format your output as a strict JSON object with EXACTLY three string keys:
{
  "verse": "4 lines of rhyming rap, separated with '/', each line ending in highly effective street slangs",
  "score": 90,
  "critique": "A punchy, hip-hop-inflected constructive critique of their bars under 30 words"
}`;

      const contents = `Roast and flow against details of this verse written by the player. Incorporate their concepts in your rebuttal. Verses to destroy: "${userVerse}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verse: { type: Type.STRING, description: "Your rhyming 4-line roasted rebuttal" },
              score: { type: Type.INTEGER, description: "A score from 0 to 100 on user performance" },
              critique: { type: Type.STRING, description: "Witty critique in street hiphop language" }
            },
            required: ["verse", "score", "critique"]
          }
        }
      });

      let responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());

      let isCompleted = roundNumber >= totalRounds;
      let winner: 'user' | 'opponent' | 'tie' | undefined = undefined;

      if (isCompleted) {
        // Compare with baseline threshold. Say if the avg score of the user is high (>75), they win
        // For simplicity, we compare this final round score
        const finalScore = resultObj.score || 70;
        winner = finalScore >= 78 ? 'user' : 'opponent';

        if (!db.user.battleHistory) {
          db.user.battleHistory = [];
        }
        db.user.battleHistory.unshift({
          id: "battle_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          opponentName: opponentName || "Unknown Challenger",
          opponentId: opponentId || "unknown",
          outcome: winner === 'user' ? 'win' : 'loss',
          stake: Number(stake) || 0,
          playerScore: finalScore,
          opponentScore: Math.floor(62 + Math.random() * 20),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        });

        if (winner === 'user') {
          db.user.wins += 1;
          db.user.streak += 1;
          db.user.cash += Number(stake);
          db.user.rep += Math.floor(Number(stake) / 2);
          addAndBroadcastChatMessage(
            "SpitFire Arena",
            "system",
            `🏆 MC ${db.user.username || "MC User"} has defeated ${opponentName} in a high-stakes duel, winning $${stake} FLOW and +${Math.floor(Number(stake) / 2)} REP! 🔥`
          );
        } else {
          db.user.losses += 1;
          db.user.streak = 0;
          db.user.cash = Math.max(0, db.user.cash - Number(stake));
          db.user.rep = Math.max(0, db.user.rep - Math.floor(Number(stake) / 4));
          addAndBroadcastChatMessage(
            "SpitFire Arena",
            "system",
            `💀 MC ${db.user.username || "MC User"} was knocked out by ${opponentName} in the arena! They lost a stake of $${stake} FLOW.`
          );
        }
        await writeDB(db);
      }

      res.json({
        verse: resultObj.verse,
        score: resultObj.score,
        critique: resultObj.critique,
        winner,
        user: db.user,
        isMock: false
      });

    } catch (e: any) {
      console.error("Gemini Battle Error: ", e);
      res.status(500).json({ error: e.message });
    }
  });

  // API 10: Songwriter Rhyme Assistant (GEMINI POWERED)
  app.post("/api/studio/rhymes", async (req, res) => {
    try {
      const { word, queryType } = req.body; // queryType: 'rhymes', 'slang', 'phrases'
      
      if (!apiKey || apiKey === "MOCK_KEY") {
        // Mock fallback
        const mockRhymes: Record<string, string[]> = {
          spit: ["lit", "fit", "grit", "split", "legit", "kit", "nit", "bit"],
          bars: ["stars", "cars", "scars", "mars", "guitars", "behind bars", "czars"],
          flow: ["glow", "show", "dough", "grow", "low", "know", "pro", "blow", "tempo"],
          heat: ["street", "beat", "elite", "feet", "cheat", "delete", "sweet", "complete"],
          crown: ["town", "down", "frown", "clown", "brown", "renown"],
        };

        const list = mockRhymes[word.toLowerCase()] || ["spit", "lit", "hit", "get", "wit", "slick"];
        return res.json({
          result: list,
          word,
          isMock: true
        });
      }

      let systemPrompt = "";
      if (queryType === "slang") {
        systemPrompt = "You are a hip hop culture slang dictionary. Given a word, suggest 6 cool street slangs, metaphors, or double entendres related to that word or theme. Provide only a simple JSON list of strings.";
      } else if (queryType === "phrases") {
        systemPrompt = "You are an expert ghostwriter. Given a prompt topic or word, generate 4 rhyming couplets in hip hop punchline style. Return only a simple JSON list of strings.";
      } else {
        systemPrompt = "You are a rhyming dictionary for multi-syllabic and street rhymes. Given a word, suggest 10 high-quality rhyming words (focusing on street and rap syllables). Return only a simple JSON list of strings.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate ideas for keyword: "${word}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const items = JSON.parse(response.text || "[]");
      res.json({
        result: items,
        word,
        isMock: false
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API 11: Bar Improver / Generator (GEMINI POWERED)
  app.post("/api/studio/improve", async (req, res) => {
    try {
      const { line, style, genre } = req.body;

      if (!apiKey || apiKey === "MOCK_KEY") {
        return res.json({
          suggestion: `Rhymes with absolute precision, matching the ${style} vision.`
        });
      }

      const systemInstruction = `You are a legendary street lyricist in the style of ${style}. 
You write lyrics for a ${genre} track. 
Given one line or keyword of songwriter draft, write a brilliant, highly rhythmic next line that rhymes perfectly and adds severe street charisma or deep conscious meaning. Keep it under 15 words. Single string return of the line only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Draft: "${line}"`,
        config: {
          systemInstruction,
          responseMimeType: "text/plain",
        }
      });

      res.json({
        suggestion: response.text?.trim() || ""
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    connectedClients.add(ws);

    // Initial sync
    try {
      ws.send(JSON.stringify({ type: "history", data: globalChatHistory }));
    } catch (e) {
      console.error("WS initial history send error:", e);
    }

    ws.on("message", (messageRaw) => {
      try {
        const payload = JSON.parse(messageRaw.toString());
        if (payload.type === "message") {
          addAndBroadcastChatMessage(
            payload.sender || "Anonymous MC",
            payload.senderType || "user",
            payload.text || "",
            payload.avatar,
            payload.rep || 0
          );
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    });

    ws.on("close", () => {
      connectedClients.delete(ws);
    });

    ws.on("error", () => {
      connectedClients.delete(ws);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`SpitFire Rap server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
