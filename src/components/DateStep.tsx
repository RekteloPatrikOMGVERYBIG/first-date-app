import { useState } from "react";
import type { FormEvent } from "react";
import { getToday } from "../questionnaire";

type DateStepProps = {
  preferredDate: string;
  onDateChange: (date: string) => void;
  onBack: () => void;
  onNext: () => void;
};

function DateStep({ preferredDate, onDateChange, onBack, onNext }: DateStepProps) {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preferredDate) {
      setError("Будь ласка, обери дату побачення.");
      return;
    }

    if (preferredDate < getToday()) {
      setError("Обери сьогоднішню або майбутню дату.");
      return;
    }

    setError("");
    onNext();
  }

  return (
    <section className="question-card" aria-labelledby="date-heading">
      <p className="step-label">Крок 2 із 10</p>
      <progress value={2} max={10} aria-label="Прогрес анкети" />
      <h1 id="date-heading">Коли зустрінемось?</h1>
      <p id="date-hint">Обери день, коли тобі буде зручно ❤️</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="preferred-date">Бажана дата (обов’язково)</label>
        <input
          id="preferred-date"
          name="preferred_date"
          type="date"
          min={getToday()}
          required
          autoFocus
          value={preferredDate}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "date-hint date-error" : "date-hint"}
          onChange={(event) => {
            onDateChange(event.target.value);
            setError("");
          }}
        />
        {error && (
          <p id="date-error" className="form-error" role="alert">{error}</p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            Назад
          </button>
          <button type="submit">Далі</button>
        </div>
      </form>
    </section>
  );
}

export default DateStep;
