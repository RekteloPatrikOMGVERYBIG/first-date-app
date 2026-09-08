export const questions = [
  { field: "name", title: "Як тебе називати?", label: "Ім’я або нікнейм", hint: "", required: true },
  { field: "preferredDate", title: "Коли зустрінемось?", label: "Бажана дата", hint: "", required: true },
  { field: "preferredTime", title: "О котрій тобі зручно?", label: "Бажаний час", hint: "Вкажи зручний для тебе час зустрічі.", required: true },
  { field: "flowers", title: "Які квіти тобі подобаються?", label: "Квіти", hint: "Напиши назви улюблених квітів, наприклад, тюльпани чи півонії. Якщо не хочеш квітів — так і напиши.", required: true },
  { field: "food", title: "Чим би ти хотіла посмакувати?", label: "Їжа", hint: "Розкажи про улюблені страви та побажання до їжі.", required: true },
  { field: "drinks", title: "Що ти любиш пити?", label: "Напої", hint: "Напиши, який напій зробить зустріч приємнішою.", required: true },
  { field: "location", title: "Куди хочеш піти?", label: "Місце побачення", hint: "Напиши конкретний заклад, місце або свою ідею, де провести час.", required: true },
  { field: "mood", title: "Яким ти уявляєш наше побачення?", label: "Настрій побачення", hint: "Опиши атмосферу та що хотіла б робити. Наприклад, спокійно поговорити за кавою або пограти в боулінг.", required: true },
  { field: "dislikes", title: "Чого краще уникати?", label: "Що тобі не подобається", hint: "Напиши про те, що не любиш, харчові алергії або інші важливі обмеження. Можна пропустити.", required: false },
  { field: "notes", title: "Хочеш щось додати?", label: "Додаткові побажання", hint: "Тут є місце для будь-яких думок чи побажань. Можна пропустити.", required: false },
] as const;

export type AnswerField = (typeof questions)[number]["field"];
export type Answers = Record<AnswerField, string>;

export const emptyAnswers: Answers = {
  name: "", preferredDate: "", preferredTime: "", flowers: "", food: "",
  drinks: "", location: "", mood: "", dislikes: "", notes: "",
};

// Use the visitor's local date, without shifting the day through UTC.
export function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
