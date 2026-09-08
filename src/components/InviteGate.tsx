import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export default function InviteGate({ token, children }: { token: string; children: ReactNode }) {
  const [status, setStatus] = useState("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/invites/${encodeURIComponent(token)}/open`, { method: "POST", signal: AbortSignal.timeout(15000) })
      .then(async (response) => {
        if (response.status === 404) return "missing";
        if (!response.ok) throw new Error();
        return (await response.json()).status;
      }).then((value) => { if (active) setStatus(value); })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [token, retry]);
  if (status === "opened") return children;
  return <main><section className="question-card">
    <h1>{status === "loading" ? "Відкриваємо запрошення…" : status === "submitted" ? "Твої побажання вже збережені ❤️" : status === "missing" ? "Такого запрошення немає" : "Не вдалося відкрити запрошення"}</h1>
    {status === "error" && <button onClick={() => { setStatus("loading"); setRetry(retry + 1); }}>Спробувати ще раз</button>}
  </section></main>;
}
