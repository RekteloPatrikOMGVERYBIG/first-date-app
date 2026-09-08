import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { questions } from "../questionnaire";

type Invite = { token: string; label: string; status: "not_opened" | "opened" | "submitted"; response_id: string | null };
type SavedResponse = { id: string; name: string; submitted_at: string } & Record<string, string>;
type Dashboard = { invitations: Invite[]; responses: SavedResponse[] };
const statusLabels = { not_opened: "Ще не відкрито", opened: "Відкрито", submitted: "Заповнено" };
const fields: Record<string, string> = { preferredDate: "preferred_date", preferredTime: "preferred_time" };
class OwnerAuthError extends Error {}

async function request(path: string, body?: object) {
  const response = await fetch(`/api/owner/${path}`, {
    method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Requested-With": "FirstDatePlanner" },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 401) throw new OwnerAuthError("Потрібен вхід або пароль неправильний.");
    if (response.status === 429) throw new Error("Забагато спроб. Зачекай хвилину.");
    throw new Error("Запит не виконано. Спробуй ще раз.");
  }
  return response.json();
}

export default function OwnerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    request("dashboard").then((value) => { if (active) setData(value); })
      .catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); }
    catch (failure) {
      if (failure instanceof OwnerAuthError) setData(null);
      setError(failure instanceof Error ? failure.message : "Немає зв’язку із сервером.");
    }
    finally { setBusy(false); }
  }
  function signIn(event: FormEvent) {
    event.preventDefault();
    void perform(async () => { await request("login", { password }); setPassword(""); setData(await request("dashboard")); });
  }
  function createInvite(event: FormEvent) {
    event.preventDefault();
    void perform(async () => { await request("invitations", { label }); setLabel(""); setData(await request("dashboard")); });
  }

  if (loading) return <main><p role="status">Завантажуємо кабінет…</p></main>;
  return <main><section className="question-card owner-dashboard">
    <p className="eyebrow">FIRST DATE · КАБІНЕТ ВЛАСНИКА</p>
    <h1>{data ? "Наші маленькі історії" : "Тільки для тебе"}</h1>
    {error && <p role="alert" className="form-error">{error}</p>}
    {!data ? <form onSubmit={signIn}>
      <label htmlFor="owner-password">Пароль власника</label>
      <input id="owner-password" type="password" autoComplete="current-password" value={password} required onChange={(e) => setPassword(e.target.value)} />
      <div className="form-actions"><button disabled={busy}>Увійти</button></div>
    </form> : <>
      <div className="form-actions">
        <button disabled={busy} onClick={() => void perform(async () => { setData(await request("dashboard")); })}>Оновити</button>
        <button className="secondary-button" disabled={busy} onClick={() => void perform(async () => { await request("logout", {}); setData(null); })}>Вийти</button>
      </div>
      <form onSubmit={createInvite}>
        <label htmlFor="invite-label">Назва запрошення — лише для тебе</label>
        <input id="invite-label" value={label} required maxLength={100} placeholder="Наприклад, вечір у Будапешті" onChange={(e) => setLabel(e.target.value)} />
        <div className="form-actions"><button disabled={busy}>Створити запрошення</button></div>
      </form>
      <h2>Запрошення · {data.invitations.length}</h2>
      {data.invitations.length === 0 && <p>Створи перше запрошення й надішли посилання.</p>}
      {data.invitations.map((invite) => <article className="answer-item" key={invite.token}>
        <strong>{invite.label}</strong><p>{statusLabels[invite.status]}</p>
        <label htmlFor={invite.token}>Посилання — виділи та скопіюй</label>
        <input id={invite.token} readOnly value={`${window.location.origin}/invite/${invite.token}`} onFocus={(e) => e.target.select()} />
        {invite.response_id && <a href={`#response-${invite.response_id}`}>Переглянути відповіді ↓</a>}
      </article>)}
      <h2>Відповіді · {data.responses.length}</h2>
      {data.responses.length === 0 && <p>Поки немає відповідей.</p>}
      {data.responses.map((answer) => <details className="answer-item" id={`response-${answer.id}`} key={answer.id}>
        <summary>{answer.name} · {answer.preferred_date}</summary>
        <dl>{questions.map((question) => <div key={question.field}>
          <dt>{question.label}</dt><dd>{answer[fields[question.field] || question.field] || "Не вказано"}</dd>
        </div>)}</dl>
      </details>)}
    </>}
  </section></main>;
}
