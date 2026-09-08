import type { Answers } from "./questionnaire";

export async function submitAnswers(answers: Answers, submissionId: string, token?: string): Promise<void> {
  const response = await fetch(token ? `/api/invites/${encodeURIComponent(token)}/responses` : "/api/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "FirstDatePlanner" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      submission_id: submissionId,
      name: answers.name,
      preferred_date: answers.preferredDate,
      preferred_time: answers.preferredTime,
      flowers: answers.flowers,
      food: answers.food,
      drinks: answers.drinks,
      location: answers.location,
      mood: answers.mood,
      dislikes: answers.dislikes,
      notes: answers.notes,
    }),
  });

  if (!response.ok) {
    if (response.status === 422) throw new Error("Перевір відповіді й дату побачення: сервер не прийняв анкету.");
    if (response.status === 409) throw new Error("Цю анкету вже надіслано. Онови сторінку, щоб заповнити нову.");
    throw new Error("Не вдалося зберегти відповіді. Спробуй ще раз трохи пізніше.");
  }
  const receipt = await response.json();
  if (receipt.id !== submissionId || receipt.status !== "submitted") {
    throw new Error("Сервер не підтвердив збереження. Спробуй ще раз.");
  }
}

// Works on a phone over local HTTP too, where crypto.randomUUID is unavailable.
export function createSubmissionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
