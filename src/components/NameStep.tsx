import { useState } from "react";
import type { FormEvent } from "react";
import { getTextAnswerError } from "../answerValidation";

type NameStepProps = {
  name: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
};

function NameStep({ name, onNameChange, onBack, onNext }: NameStepProps) {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = getTextAnswerError(name, true);
    if (validationError) {
      setError(validationError);
      return;
    }

    onNameChange(name.trim());
    setError("");
    onNext();
  }

  return (
    <section className="question-card" aria-labelledby="name-heading">
      <p className="step-label">Крок 1 із 10</p>
      <progress value={1} max={10} aria-label="Прогрес анкети" />
      <h1 id="name-heading">Як тебе називати?</h1>
      <p id="name-hint">Справжнє ім’я чи милий нікнейм — обирай сама ❤️</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Ім’я або нікнейм (обов’язково)</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="given-name"
          autoFocus
          required
          maxLength={80}
          value={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "name-hint name-error" : "name-hint"}
          onChange={(event) => {
            onNameChange(event.target.value);
            setError("");
          }}
        />
        {error && <p id="name-error" className="form-error" role="alert">{error}</p>}
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

export default NameStep;
