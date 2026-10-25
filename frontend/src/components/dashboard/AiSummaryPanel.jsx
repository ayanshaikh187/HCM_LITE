import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card } from "../ui";
import { summarize } from "../../services/dashboardApi";

export default function AiSummaryPanel({ kpis }) {
  const [state, setState] = useState({ loading: false, bullets: null, error: null });

  const run = async () => {
    setState({ loading: true, bullets: null, error: null });
    try {
      const bullets = await summarize(kpis); // expects 3-5 strings
      setState({ loading: false, bullets, error: null });
    } catch {
      setState({ loading: false, bullets: null, error: "The summary isn't available right now. Your dashboard numbers are still correct." });
    }
  };

  return (
    <Card title="AI summary" action={
      <button onClick={run} disabled={state.loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
        {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}Summarize
      </button>}>
      {state.error && <p role="alert" className="text-sm text-slate-600">{state.error}</p>}
      {state.bullets && (
        <>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{state.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          <p className="mt-3 text-xs text-slate-500">AI-generated from the figures on this dashboard.</p>
        </>
      )}
      {!state.error && !state.bullets && <p className="text-sm text-slate-500">Select Summarize to get 3 to 5 insights from the current filters.</p>}
    </Card>
  );
}
