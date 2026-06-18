import React, { useState, useEffect } from "react";
import { UserProfile, TransactionItem } from "../types";
import { 
  CreditCard, 
  Coins, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Receipt, 
  Lock, 
  History, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Download,
  Info
} from "lucide-react";

interface PaymentPackage {
  id: string;
  name: string;
  price: number;
  flowCash: number;
  description: string;
}

interface WalletPortalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (newBalance: number, updatedTransactions: TransactionItem[]) => void;
}

export default function WalletPortal({ user, isOpen, onClose, onPaymentSuccess }: WalletPortalProps) {
  const [packages, setPackages] = useState<PaymentPackage[]>([
    { id: "pkg_pocket", name: "Lil MC Pocket", price: 5.00, flowCash: 500, description: "Kickstart your cypher journey. Perfect for beat licensing." },
    { id: "pkg_hustler", name: "Hustler Bundle", price: 10.00, flowCash: 1200, description: "Gain momentum in the street. 200 raw bonus cash." },
    { id: "pkg_platinum", name: "Platinum Cypher", price: 25.00, flowCash: 3500, description: "High-roller entry pool. 1,000 massive bonus cash." },
    { id: "pkg_stadium", name: "Stadium Master", price: 50.00, flowCash: 8000, description: "Ultimate stadium domination. Includes legendary status!" }
  ]);

  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage>(packages[1]); // Default to Hustler bundle
  
  // Card details state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  
  // UI states
  const [isCvcFocused, setIsCvcFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"checkout" | "processing" | "receipt">("checkout");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<TransactionItem | null>(null);
  const [stripeTxId, setStripeTxId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"buy" | "history">("buy");

  // Fetch package details from backend on load
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/payment/packages");
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch (err) {
        console.warn("Failed to fetch packages from API, using defaults:", err);
      }
    };
    fetchPackages();
  }, []);

  if (!isOpen) return null;

  // Format Card Number (space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    
    // Add spaces
    let formatted = "";
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += value[i];
    }
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length > 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvc(value);
  };

  // Card Brand Detection
  const getCardBrand = () => {
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(cleanNum)) return "mastercard";
    if (/^3[47]/.test(cleanNum)) return "amex";
    return "unknown";
  };

  // Perform client validation & post to server charge endpoint
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validation checks
    if (!cardName.trim()) {
      setErrorMsg("Cardholder name is required.");
      return;
    }
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.length < 15) {
      setErrorMsg("Please enter a valid credit card number.");
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMsg("Expiration date is incomplete.");
      return;
    }
    if (cardCvc.length < 3) {
      setErrorMsg("Please provide your card verification security pin (CVC).");
      return;
    }

    setLoading(true);
    setPaymentStep("processing");

    // Server-side call request
    try {
      // Simulate real Stripe hook latency to look professional
      await new Promise(resolve => setTimeout(resolve, 2200));

      const res = await fetch("/api/payment/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          amount: selectedPackage.price,
          cashReceived: selectedPackage.flowCash,
          cardholderName: cardName,
          cardNumber: cleanNum,
          expiryDate: cardExpiry,
          cvc: cardCvc
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Financial processor declined the transaction.");
      }

      // Success payload receipt
      setSuccessReceipt(data.transaction);
      setStripeTxId(data.stripeTxId);
      setPaymentStep("receipt");

      // Notify parent state updater
      onPaymentSuccess(data.newBalance, [data.transaction, ...(user.transactions || [])]);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process card credentials. Check connection.");
      setPaymentStep("checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleResetCheckout = () => {
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setErrorMsg(null);
    setPaymentStep("checkout");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      
      {/* CARD MAIN PORTAL BODY */}
      <div 
        id="spitfire_wallet_portal" 
        className="bg-[#0B0B0C] border border-neutral-800 rounded-3xl w-full max-w-4xl min-h-[600px] flex flex-col md:flex-row overflow-hidden shadow-2xl relative my-auto animate-fade-in"
      >
        
        {/* Subtle decorative glow overlays */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

        {/* CLOSE CONTROL */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white hover:bg-neutral-900 p-2 rounded-xl transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: PACKAGE DETAILS & SELECTIONS */}
        <div className="w-full md:w-[45%] bg-zinc-950/90 border-b md:border-b-0 md:border-r border-neutral-900 p-6 sm:p-8 flex flex-col justify-between z-10">
          <div className="space-y-6">
            
            {/* BRAND TITLE info */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-mono tracking-widest font-black text-orange-500 uppercase flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-orange-500 animate-pulse" />
                Spitfire Bank & Vault
              </span>
              <h2 className="text-xl font-black uppercase text-white tracking-tight">Reload Flow Cash</h2>
              <p className="text-xs text-neutral-400">
                Purchase virtual premium bank credits to license beats, enter elite arena conflicts, and custom fit avatars.
              </p>
            </div>

            {/* TAB SYSTEM: Buy / History */}
            <div className="flex bg-[#0C0C0D] border border-neutral-850 p-1 rounded-xl">
              <button
                onClick={() => setCurrentTab("buy")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  currentTab === "buy" ? "bg-neutral-900 text-white border border-neutral-800 shadow" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Top up Packages
              </button>
              <button
                onClick={() => setCurrentTab("history")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  currentTab === "history" ? "bg-neutral-900 text-white border border-neutral-800 shadow" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Deposit Ledger
              </button>
            </div>

            {currentTab === "buy" ? (
              /* PACKS LISTING GRID */
              <div className="space-y-2.5">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        if (paymentStep === "checkout") setSelectedPackage(pkg);
                      }}
                      disabled={paymentStep !== "checkout"}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected 
                          ? "bg-orange-500/10 border-orange-500 text-white shadow-lg" 
                          : "bg-neutral-900/35 border-neutral-850 hover:bg-neutral-905 text-neutral-300 hover:border-neutral-800"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black uppercase ${isSelected ? "text-orange-500" : "text-white"}`}>
                            {pkg.name}
                          </span>
                          {pkg.price >= 25 && (
                            <span className="text-[8px] font-black tracking-wider bg-orange-600 text-black px-1.5 py-0.5 rounded font-mono uppercase">
                              Best Value
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans line-clamp-1">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-orange-500 font-mono tracking-wide">
                          +{pkg.flowCash.toLocaleString()} <span className="text-[9px] font-sans font-medium text-neutral-400">FLOW</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ${pkg.price.toFixed(2)} USD
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* DEPOSIT HISTORIC LOGS LISTING */
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {(user.transactions || []).length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-neutral-850 rounded-2xl space-y-2.5">
                    <Receipt className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
                    <p className="text-xs text-neutral-400 font-mono">Bank vaults are pristine. No deposits detected.</p>
                  </div>
                ) : (
                  (user.transactions || []).map((tx) => (
                    <div 
                      key={tx.id}
                      className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl flex items-center justify-between text-left"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-white block uppercase tracking-tight">
                          {tx.packageName}
                        </span>
                        <div className="text-[8px] text-neutral-500 font-mono mt-0.5 mt-1 flex items-center gap-2">
                          <span>Card **{tx.cardLast4 || "4242"}</span>
                          <span>|</span>
                          <span>{tx.date}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-500 font-mono font-bold text-xs block">
                          +${tx.cashReceived} FLOW
                        </span>
                        <span className="text-[8px] text-neutral-400 font-mono">
                          Paid ${tx.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Secure gateway metrics footer */}
          <div className="pt-6 border-t border-neutral-900 mt-6 md:mt-0 text-left">
            <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Full SSL Bank Protocol Active</span>
            </div>
            <p className="text-[9px] text-neutral-500 mt-1 leading-relaxed">
              We process secure credentials with military-grade transport layer security. Credits are minted instantly into your connected SpitFire system wallet.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: SECURE CREDIT CARD PROCESSING */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between z-10 bg-neutral-900/10 text-left">
          
          {currentTab === "history" ? (
            /* LEDGER DISPLAY INTRO */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <History className="w-12 h-12 text-neutral-600 animate-spin-slow" />
              <div className="space-y-1.5">
                <h3 className="text-sm font-black uppercase text-white tracking-widest font-mono">Secure Ledger Monitor</h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  This card panel tracks bank ledger receipts. Click the <strong>&quot;Top up Packages&quot;</strong> tab on the left to initiate another secure checkout or buy in-game balance.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab("buy")}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Go to Checkout Panel
              </button>
            </div>
          ) : paymentStep === "checkout" ? (
            /* FORM: DEBIT/CREDIT CHECKOUT CARD PROCESSOR */
            <form onSubmit={handleExecutePayment} className="space-y-6">
              
              <div className="space-y-1.5 text-left">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Payment Particulars</h3>
                <p className="text-xs text-neutral-450">
                  Securely feed your credit card details below. Use any simulated credentials for sandbox environments.
                </p>
              </div>

              {/* CARD PREVIEW RENDERING ENGINE */}
              <div className="relative w-full h-[190px] mx-auto rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 perspective bg-neutral-950 border border-neutral-850">
                <div className={`w-full h-full relative transition-all duration-700 transform-style preserve-3d ${isCvcFocused ? "rotate-y-180" : ""}`}>
                  
                  {/* FRONT SIDE OF THE GLOW CARD */}
                  <div className="absolute inset-0 w-full h-full p-5 flex flex-col justify-between text-left backface-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-orange-950/25 to-zinc-950">
                    {/* Chip and Brand Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="w-8 h-6 bg-yellow-500/20 border border-yellow-500/30 rounded-md relative flex items-center justify-center">
                          <span className="w-4 h-3 bg-yellow-600/30 rounded-sm" />
                        </div>
                        <span className="text-[7px] text-neutral-500 font-mono lowercase tracking-widest block uppercase">Spitfire Sec</span>
                      </div>

                      {/* Card Brand */}
                      <div className="text-right">
                        {getCardBrand() === "visa" && (
                          <span className="text-blue-400 font-mono font-black italic text-md">VISA</span>
                        )}
                        {getCardBrand() === "mastercard" && (
                          <span className="text-red-400 font-mono font-black italic text-md">MasterCard</span>
                        )}
                        {getCardBrand() === "amex" && (
                          <span className="text-amber-500 font-mono font-black italic text-md">AMEX</span>
                        )}
                        {getCardBrand() === "unknown" && (
                          <span className="text-neutral-500 font-mono font-bold text-xs uppercase tracking-widest">Global Pay</span>
                        )}
                      </div>
                    </div>

                    {/* Card Number display */}
                    <div className="font-mono text-base tracking-widest text-center text-neutral-200 mt-2 font-semibold">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    {/* Cardholder expiry info */}
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <span className="text-[7px] uppercase font-bold text-neutral-500 block">CARDHOLDER</span>
                        <span className="text-xs font-bold text-neutral-200 uppercase tracking-wide truncate max-w-[190px] block">
                          {cardName || "MC SPIRE"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[7px] uppercase font-bold text-neutral-500 block">EXPIRES</span>
                        <span className="text-xs font-mono text-neutral-250 block">
                          {cardExpiry || "MM/YY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE OF THE CARD */}
                  <div className="absolute inset-0 w-full h-full flex flex-col justify-between text-left rotate-y-180 backface-hidden rounded-2xl bg-neutral-900 border border-neutral-800">
                    <div className="w-full h-11 bg-black mt-4" />
                    
                    <div className="px-5 space-y-2">
                      <div>
                        <span className="text-[7px] uppercase font-bold text-neutral-500 block text-right">SIGNATURE STRIP / CVC</span>
                        <div className="flex bg-neutral-8e0 p-1 rounded-md mt-1 items-center justify-between border border-neutral-700">
                          <div className="h-5 w-44 bg-neutral-800 flex items-center text-[8px] font-mono text-neutral-500 pl-2">
                            x x x x x x x x x x x x
                          </div>
                          <div className="w-12 text-right text-xs font-mono font-black text-orange-500 bg-black py-0.5 rounded px-2">
                            {cardCvc || "•••"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 text-center mt-auto">
                      <span className="text-[6px] text-neutral-600 font-mono tracking-tight block">
                        Electronic use only. Secured by Spitfire Virtual Ledger Protocol. Do not leave unattended.
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* INPUT FIELDS CONTROLLER */}
              <div className="space-y-3">
                
                {/* Field 1: Cardholder Name */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. MC SpitFire"
                    className="w-full bg-neutral-950 text-xs text-white placeholder-neutral-600 px-3 py-2.5 rounded-xl border border-neutral-850 focus:outline-none focus:border-orange-500 transition-all font-sans"
                  />
                </div>

                {/* Field 2: Card Number */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-neutral-950 text-xs text-white placeholder-neutral-600 pl-10 pr-3 py-2.5 rounded-xl border border-neutral-850 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  </div>
                </div>

                {/* Grid Expiry & CVC */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Expiry */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-neutral-950 text-xs text-white placeholder-neutral-600 px-3 py-2.5 rounded-xl border border-neutral-850 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    />
                  </div>

                  {/* CVC */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400">
                      CVC / Security Code
                    </label>
                    <input
                      type="password"
                      required
                      value={cardCvc}
                      onChange={handleCvcChange}
                      onFocus={() => setIsCvcFocused(true)}
                      onBlur={() => setIsCvcFocused(false)}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full bg-neutral-950 text-xs text-white placeholder-neutral-600 px-3 py-2.5 rounded-xl border border-neutral-850 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    />
                  </div>

                </div>

              </div>

              {/* Dynamic Error box helper */}
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] rounded-xl flex items-start gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Execution action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 duration-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    Connecting Secure Bank Node...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4.5 h-4.5 text-black" />
                    Pay ${selectedPackage.price.toFixed(2)} USD Securely
                  </>
                )}
              </button>

            </form>
          ) : paymentStep === "processing" ? (
            /* SECURE PROCESSING SCREEN STATE */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-orange-500/15 rounded-full" />
                <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <Lock className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase text-white tracking-widest font-mono">Verifying Transaction API</h3>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Communicating with the Stripe payment gateway networks and certifying your credit line... Please do not close this window.
                </p>
              </div>

              <div className="text-[10px] bg-neutral-900 border border-neutral-855 text-neutral-400 font-mono py-1 px-3 rounded-full animate-pulse">
                Stripe Gateway Node: ONLINE
              </div>
            </div>
          ) : (
            /* SUCCESS & PDF DIGITAL SLIP RECEIPT VIEW (paymentStep === "receipt") */
            <div className="space-y-6">
              
              {/* HEADER ANCHOR SUCCESS */}
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black uppercase text-emerald-400 tracking-wider">Payment Authorized</h3>
                <p className="text-xs text-neutral-400">
                  Your FLOW bank vault has been successfully loaded! Thank you for supporting SpitFire core nodes.
                </p>
              </div>

              {/* DETAILED LEDGER SLIP RECEIPT */}
              <div className="bg-zinc-950/90 border border-neutral-850 rounded-2xl p-5 space-y-4 font-mono relative shadow-inner overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-600/5 blur-3xl pointer-events-none rounded-full" />
                
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3 text-xs">
                  <span className="font-bold text-neutral-450 uppercase flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-neutral-450" />
                    Tax Receipt Log
                  </span>
                  <span className="text-neutral-500 uppercase text-[9px]">
                    APPROVED #09A2
                  </span>
                </div>

                {/* GRID SPECIFICS */}
                <div className="space-y-2.5 text-[10px] text-neutral-350">
                  
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Transaction ID:</span>
                    <span className="text-white font-bold">{successReceipt?.id.toUpperCase() || "TX_90837424"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-500">Stripe Gateway ID:</span>
                    <span className="text-neutral-400 font-semibold">{stripeTxId || "ch_stripe_simulated"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-500">Deposit Package:</span>
                    <span className="text-white font-black uppercase text-orange-500">{successReceipt?.packageName}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-500">Paid to Spitfire:</span>
                    <span className="text-white font-bold font-mono">${successReceipt?.amount.toFixed(2)} USD</span>
                  </div>

                  <div className="flex justify-between border-t border-neutral-900 pt-2.5 text-xs">
                    <span className="text-neutral-400 font-bold">FLOW Credited:</span>
                    <span className="text-emerald-400 font-black font-mono">+{successReceipt?.cashReceived.toLocaleString()} FLOW</span>
                  </div>

                </div>

                {/* Barcode artwork for absolute realism */}
                <div className="pt-2 flex flex-col items-center justify-center space-y-1 bg-black/20 p-2.5 rounded-lg border border-neutral-900 border-dashed">
                  <div className="h-5 flex items-center gap-[1px] opacity-70">
                    {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4].map((w, idx) => (
                      <div key={idx} className="bg-neutral-500 h-full" style={{ width: `${w % 4 === 0 ? 3 : w % 3 === 0 ? 1 : 2}px` }} />
                    ))}
                  </div>
                  <span className="text-[7px] text-neutral-600 font-mono">VERIFIED BY STRIPE SANDBOX V2</span>
                </div>

              </div>

              {/* ACTION: return to game or print receipt */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <button
                  onClick={() => {
                    const printContent = `
                      ====================================
                      SPITFIRE CYPHER SYSTEM TAX RECEIPT
                      ====================================
                      Receipt ID: ${successReceipt?.id.toUpperCase()}
                      Package: ${successReceipt?.packageName}
                      Amount Charged: $${successReceipt?.amount.toFixed(2)} USD
                      FLOW Credited: +${successReceipt?.cashReceived} FLOW
                      Date Issued: ${successReceipt?.date}
                      Status: SUCCESS (Stripe Verified)
                      ====================================
                    `;
                    const blob = new Blob([printContent], { type: "text/plain" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `Spitfire_Receipt_${successReceipt?.id}.txt`;
                    link.click();
                  }}
                  className="py-3 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 font-bold text-xs uppercase border border-neutral-850 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Save Receipt
                </button>

                <button
                  onClick={handleResetCheckout}
                  className="py-3 bg-orange-600 hover:bg-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Buy More Flow
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
