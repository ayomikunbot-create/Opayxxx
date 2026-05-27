import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "OPay Receipt Generator" },
      { name: "description", content: "Generate OPay receipts with editable amount and names." },
    ],
  }),
});

function randomDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}
function randomAlnum(len: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function formatDateLong(d: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const suffix = (n: number) => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  return `${months[d.getMonth()]} ${day}${suffix(day)}, ${d.getFullYear()}`;
}
function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function formatAmount(v: string) {
  const n = Number(v || 0);
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type TxnData = {
  date: string;
  time: string;
  txnNo: string;
  rrn: string;
  terminal: string;
  sessionId: string;
};

function Index() {
  const [style, setStyle] = useState<"card" | "transfer">("transfer");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [amount, setAmount] = useState("12500");
  const [cardName, setCardName] = useState("JANE DOE");

  // Transfer receipt
  const [recipientName, setRecipientName] = useState("JOHN SMITH");
  const [recipientBank, setRecipientBank] = useState("Access Bank");
  const [recipientAcct, setRecipientAcct] = useState("0123456789");
  const [senderName, setSenderName] = useState("MARY JOHNSON");
  const [senderAcct, setSenderAcct] = useState("801****345");

  const [tick, setTick] = useState(0);
  const [data, setData] = useState<TxnData | null>(null);
  const dark = theme === "dark";

  // Generate IDs/time only on client to avoid SSR hydration mismatch
  useEffect(() => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(2);
    const datePrefix = `${yy}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    setData({
      date: formatDateLong(now),
      time: formatTime(now),
      txnNo: datePrefix + randomDigits(18),
      rrn: randomDigits(9).padStart(12, "0"),
      terminal: "2" + randomAlnum(6),
      sessionId: "100004" + randomDigits(28),
    });
  }, [tick]);

  const narration = useMemo(() => {
    if (!data) return "";
    return `${(cardName || "CUSTOMER").trim().toUpperCase()} ${data.rrn.slice(-6)} ${data.terminal} LANG`;
  }, [cardName, data]);

  const copy = (text: string) => navigator.clipboard?.writeText(text);
  const printReceipt = () => window.print();
  const receiptRef = useRef<HTMLDivElement>(null);
  const saveAsImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { pixelRatio: 3, backgroundColor: dark ? "#0b1220" : "#ffffff", cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `opay-receipt-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error("Save image failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 print:p-0">
        <header className="mb-6 print:hidden">
          <h1 className="text-2xl font-bold text-slate-900">OPay Receipt Generator</h1>
          <p className="text-sm text-slate-600">Pick a style and edit the fields — the receipt regenerates with the current time.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-[1fr_420px] print:block">
          {/* Controls */}
          <div className="rounded-2xl bg-white p-6 shadow-sm print:hidden">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Receipt style</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStyle("transfer")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${style === "transfer" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700"}`}
                  >
                    Transfer Receipt
                  </button>
                  <button
                    onClick={() => setStyle("card")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${style === "card" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700"}`}
                  >
                    Card Payment
                  </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Theme</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${theme === "light" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700"}`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${theme === "dark" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700"}`}
                  >
                    Dark
                  </button>
                </div>
              </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount (₦)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              {style === "transfer" ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Recipient name</label>
                      <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Recipient bank</label>
                      <input value={recipientBank} onChange={(e) => setRecipientBank(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Recipient account</label>
                      <input value={recipientAcct} onChange={(e) => setRecipientAcct(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Sender name</label>
                      <input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Sender OPay (masked)</label>
                      <input value={senderAcct} onChange={(e) => setSenderAcct(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Name (Narration)</label>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => setTick((t) => t + 1)} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                  Regenerate IDs & Time
                </button>
                <button onClick={printReceipt} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Print / Save PDF
                </button>
                <button onClick={saveAsImage} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  Save as Image
                </button>
              </div>
              <p className="pt-2 text-xs text-slate-500">Date/time uses your device's current time. Transaction No., RRN, Terminal ID and Session ID are randomly generated.</p>
            </div>
          </div>

          {/* Receipt */}
          <div className="flex justify-center">
            <div ref={receiptRef} className={dark ? "bg-[#0b1220] p-2 rounded-2xl" : ""}>
            {style === "transfer" ? (
              <TransferReceipt
                amount={amount}
                recipientName={recipientName}
                recipientBank={recipientBank}
                recipientAcct={recipientAcct}
                senderName={senderName}
                senderAcct={senderAcct}
                data={data}
                dark={dark}
              />
            ) : (
              <CardReceipt amount={amount} name={cardName} narration={narration} data={data} onCopy={copy} dark={dark} />
            )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .receipt { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function ScallopEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className="h-3 w-full bg-white"
      style={{
        WebkitMaskImage: "radial-gradient(circle 6px at 6px 50%, transparent 98%, black 100%)",
        WebkitMaskSize: "12px 12px",
        WebkitMaskRepeat: "repeat-x",
        WebkitMaskPosition: position === "top" ? "0 0" : "0 100%",
        maskImage: "radial-gradient(circle 6px at 6px 50%, transparent 98%, black 100%)",
        maskSize: "12px 12px",
        maskRepeat: "repeat-x",
        maskPosition: position === "top" ? "0 0" : "0 100%",
        background: "#f5f6f8",
      }}
    >
      <div className="h-full w-full" style={{
        background: "radial-gradient(circle 5px at 6px 50%, #f5f6f8 99%, white 100%)",
        backgroundSize: "12px 12px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: position === "top" ? "0 0" : "0 100%",
      }} />
    </div>
  );
}

function TransferReceipt({
  amount,
  recipientName,
  recipientBank,
  recipientAcct,
  senderName,
  senderAcct,
  data,
  dark = false,
}: {
  amount: string;
  recipientName: string;
  recipientBank: string;
  recipientAcct: string;
  senderName: string;
  senderAcct: string;
  data: TxnData | null;
  dark?: boolean;
}) {
  const bg = dark ? "#0f172a" : "white";
  return (
    <div className="receipt w-[420px] print:rounded-none print:shadow-none">
      {/* Scalloped top */}
      <div
        className="h-4 w-full"
        style={{
          background:
            `radial-gradient(circle 5px at 6px 0, transparent 98%, ${bg} 100%) repeat-x`,
          backgroundSize: "12px 12px",
        }}
      />
      <div className={`relative overflow-hidden px-6 pt-6 pb-4 shadow-xl ${dark ? "bg-slate-900" : "bg-white"}`}>
        {/* Watermark */}
        <div className={`pointer-events-none absolute inset-0 select-none overflow-hidden ${dark ? "opacity-[0.08]" : "opacity-[0.06]"}`}>
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className={`whitespace-nowrap text-[44px] font-bold leading-[60px] ${dark ? "text-emerald-300" : "text-emerald-700"}`} style={{ transform: "rotate(-18deg)", marginLeft: r % 2 ? "-40px" : "-120px" }}>
              OPay OPay OPay OPay OPay
            </div>
          ))}
        </div>

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <path d="M 6.45 16.5 A 14 14 0 1 1 6.45 23.5" stroke="#1FD1A1" strokeWidth="7" strokeLinecap="butt" fill="none" />
                <rect x="2" y="16.5" width="10" height="7" rx="1.5" fill={dark ? "#A5B4FC" : "#1E1B6B"} />
              </svg>
              <span className="font-extrabold tracking-tight" style={{ fontSize: "26px", fontFamily: "'Nunito', 'Poppins', system-ui, sans-serif", letterSpacing: "-0.5px", color: dark ? "#A5B4FC" : "#1E1B6B" }}>Pay</span>
            </div>
            <span className={`text-[15px] ${dark ? "text-slate-300" : "text-slate-700"}`}>Transaction Receipt</span>
          </div>

          {/* Amount */}
          <div className="mt-6 text-center">
            <p className="text-[26px] font-bold text-emerald-500">₦{formatAmount(amount)}</p>
            <p className={`mt-2 text-[17px] ${dark ? "text-slate-100" : "text-slate-800"}`}>Successful</p>
            <p className={`mt-2 text-[12px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {data ? `${data.date} ${data.time}` : "\u00a0"}
            </p>
          </div>

          <div className={`my-5 border-t border-dashed ${dark ? "border-slate-700" : "border-slate-300"}`} />

          <RowTransfer dark={dark} label="Recipient Details" lines={[recipientName.toUpperCase(), `${recipientBank} | ${recipientAcct}`]} />
          <div className="h-5" />
          <RowTransfer dark={dark} label="Sender Details" lines={[senderName.toUpperCase(), `OPay | ${senderAcct}`]} />
          <div className="h-5" />
          <RowTransfer dark={dark} label="Transaction No." lines={[data?.txnNo ?? "\u00a0"]} />
          <div className="h-5" />
          <RowTransfer dark={dark} label="Session ID" lines={[data?.sessionId ?? "\u00a0"]} />

          <div className={`my-5 border-t border-dashed ${dark ? "border-slate-700" : "border-slate-300"}`} />

          <p className={`text-[12px] leading-[18px] ${dark ? "text-slate-300" : "text-slate-700"}`}>
            Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest On your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.
          </p>
        </div>
      </div>
      {/* Scalloped bottom */}
      <div
        className="h-4 w-full"
        style={{
          background:
            `radial-gradient(circle 5px at 6px 100%, transparent 98%, ${bg} 100%) repeat-x`,
          backgroundSize: "12px 12px",
        }}
      />
    </div>
  );
}

function RowTransfer({
  label,
  lines,
  dark = false,
}: {
  label: string;
  lines: string[];
  dark?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={`shrink-0 text-[14px] ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
      <div className={`text-right text-[14px] break-all ${dark ? "text-slate-100" : "text-slate-900"}`}>
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function CardReceipt({
  amount,
  narration,
  data,
  onCopy,
  dark = false,
}: {
  amount: string;
  name: string;
  narration: string;
  data: TxnData | null;
  onCopy: (s: string) => void;
  dark?: boolean;
}) {
  const surface = dark ? "bg-slate-900" : "bg-white";
  const text = dark ? "text-slate-100" : "text-black";
  const subText = dark ? "text-slate-400" : "text-slate-600";
  const outer = dark ? "bg-slate-950" : "bg-[#f5f6f8]";
  return (
    <div className={`receipt w-[400px] overflow-hidden rounded-[28px] shadow-xl print:rounded-none print:shadow-none ${outer}`}>
      <div className={`flex items-center justify-between px-5 pt-3 pb-1 text-[13px] font-medium ${surface} ${text}`}>
        <span>9:47</span>
        <span className="flex items-center gap-1 text-xs">
          <span>.ıl</span>
          <span className={`rounded-sm px-1 text-[10px] font-bold ${dark ? "bg-slate-100 text-slate-900" : "bg-black text-white"}`}>4G</span>
          <span>.ıl</span>
          <span>73%</span>
        </span>
      </div>
      <div className={`flex items-center justify-between px-4 py-4 ${surface}`}>
        <div className={`flex items-center gap-3 ${text}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <h2 className={`text-[20px] font-semibold ${text}`}>Transaction Details</h2>
        </div>
      </div>
      <div className="px-4 pt-4">
        <div className={`relative rounded-2xl px-6 pt-10 pb-6 text-center ${surface}`}>
          <div className={`absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full ${dark ? "bg-emerald-900/40" : "bg-emerald-50"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <p className={`text-[17px] font-semibold ${text}`}>OPay Card Payment</p>
          <p className={`mt-3 text-[28px] font-bold tracking-tight ${text}`}>₦{formatAmount(amount)}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className={`text-[15px] ${text}`}>Successful</span>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 pb-4">
        <div className={`rounded-2xl p-5 ${surface}`}>
          <h3 className={`mb-4 text-[17px] font-semibold ${text}`}>Transaction Details</h3>
          <div className="space-y-4 text-[14px]">
            <CardRow dark={dark} label="Transaction Type" value="OPay Card Payment - POS" />
            <CardRow dark={dark} label="Transaction No." value={data?.txnNo ?? "\u00a0"} copyable onCopy={() => data && onCopy(data.txnNo)} />
            <CardRow dark={dark} label="Transaction Date" value={data ? `${data.date} ${data.time}` : "\u00a0"} />
            <CardRow dark={dark} label="Card Number" value="507872******0017" />
            <CardRow dark={dark} label="Card Type" value="Verve Debit Card" />
            <CardRow dark={dark} label="RRN" value={data?.rrn ?? "\u00a0"} copyable onCopy={() => data && onCopy(data.rrn)} />
            <CardRow dark={dark} label="Terminal ID" value={data?.terminal ?? "\u00a0"} copyable onCopy={() => data && onCopy(data.terminal)} />
            <CardRow dark={dark} label="Narration" value={narration || "\u00a0"} />
          </div>
        </div>
      </div>
      <div className="px-4 pb-6">
        <button className={`w-full rounded-full py-4 text-[16px] font-semibold ${dark ? "bg-emerald-900/40 text-emerald-200" : "bg-emerald-100 text-black"}`}>Report Issue</button>
      </div>
    </div>
  );
}

function CardRow({ label, value, copyable, onCopy, dark = false }: { label: string; value: string; copyable?: boolean; onCopy?: () => void; dark?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={`shrink-0 ${dark ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
      <span className={`flex items-start gap-1 text-right break-all ${dark ? "text-slate-100" : "text-black"}`}>
        <span>{value}</span>
        {copyable && (
          <button onClick={onCopy} className={`mt-0.5 shrink-0 ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`} aria-label={`Copy ${label}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        )}
      </span>
    </div>
  );
}
