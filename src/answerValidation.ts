import rules from "../shared/answer-rules.json" with { type: "json" };

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .replace(/(.)\1+/gu, "$1");
}

// Only reject answers made entirely of vague phrases and filler words.
const vagueWords = [...new Set([...rules.vague, ...rules.fillers].map(normalize))];

function isOnlyVagueWords(value: string): boolean {
  const reachable = new Set([0]);
  for (let index = 0; index < value.length; index++) {
    if (!reachable.has(index)) continue;
    for (const word of vagueWords) {
      if (value.startsWith(word, index)) reachable.add(index + word.length);
    }
  }
  return reachable.has(value.length);
}

export function getTextAnswerError(value: string, required: boolean): string {
  if (!value.trim()) {
    return required ? "Будь ласка, заповни це поле, щоб продовжити." : "";
  }

  const normalized = normalize(value);

  if (!/\p{L}/u.test(normalized) || normalized.length < 2 || isOnlyVagueWords(normalized)) {
    return "Напиши, будь ласка, конкретну відповідь замість «не знаю» чи «байдуже» — так я зможу врахувати твої побажання ❤️";
  }

  return "";
}
