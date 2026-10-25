import { useState } from "react";
import { Camera, MapPin, LogIn, LogOut } from "lucide-react";
import { Card } from "../ui";

// Mock preview only. The real server stamps the time and checks the geofence (POST /attendance/check-in).
export default function CheckInWidget() {
  const [at, setAt] = useState(null);
  const [out, setOut] = useState(null);
  const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Card title="Today's attendance">
      <div className="mb-3 grid h-32 place-items-center rounded-md bg-slate-100 text-slate-400">
        <div className="text-center"><Camera className="mx-auto size-8" aria-hidden="true" /><p className="mt-1 text-xs">Camera preview (optional)</p></div>
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="size-4 text-teal-600" aria-hidden="true" />Location check: inside office area (mock)</p>
      {!at && <button onClick={() => setAt(new Date())} className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700"><LogIn className="size-4" />Check in</button>}
      {at && !out && (
        <>
          <p className="mb-2 text-sm text-slate-600">Checked in at {fmt(at)}</p>
          <button onClick={() => setOut(new Date())} className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-900"><LogOut className="size-4" />Check out</button>
        </>
      )}
      {out && <p className="text-sm text-slate-600">In {fmt(at)} · Out {fmt(out)}. See you tomorrow.</p>}
    </Card>
  );
}
