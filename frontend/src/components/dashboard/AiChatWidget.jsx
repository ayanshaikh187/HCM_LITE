import { useState } from "react";
import { Send } from "lucide-react";
import { Card } from "../ui";
import { askAssistant } from "../../services/dashboardApi";

export default function AiChatWidget() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setText(""); setBusy(true);
    try {
      const a = await askAssistant(q);
      setMsgs((m) => [...m, { role: "ai", text: a }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "I can't answer right now. Please try again in a moment." }]);
    } finally { setBusy(false); }
  };

  return (
    <Card title="Ask my assistant">
      <div className="mb-3 max-h-56 min-h-24 space-y-2 overflow-y-auto text-sm" aria-live="polite">
        {msgs.length === 0 && <p className="text-slate-500">Try: “How many sick leaves do I have left?”</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <p className={`inline-block rounded-lg px-3 py-2 ${m.role === "user" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>{m.text}</p>
            {m.role === "ai" && <p className="mt-0.5 text-xs text-slate-500">AI-generated</p>}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Message"
          placeholder="Type a question" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button disabled={busy} aria-label="Send" className="rounded-md bg-teal-600 px-3 text-white hover:bg-teal-700 disabled:opacity-60"><Send className="size-4" /></button>
      </form>
    </Card>
  );
}
