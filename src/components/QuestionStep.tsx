import { useState } from "react";
import type { FormEvent } from "react";
import { questions } from "../questionnaire";
import { getTextAnswerError } from "../answerValidation";

type QuestionStepProps = {
  step: number;
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function QuestionStep({ step, value, onChange, onBack, onNext }: QuestionStepProps) {
  const [error, setError] = useState("");
  const question = questions[step];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = question.field === "preferredTime"
      ? (!value ? "Будь ласка, вкажи час зустрічі." : "")
      : getTextAnswerError(value, question.required);
    if (validationError) {
      setError(validationError);
      return;
    }
    onChange(value.trim());
    onNext();
  }

  const fieldProps = {
    id: question.field,
    name: question.field,
    value,
    required: question.required,
    autoFocus: true,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? "question-hint question-error" : "question-hint",
  };

  function handleChange(value: string) {
    onChange(value);
    setError("");
  }

  return (
    <section className="question-card" aria-labelledby="question-heading">
      <p className="step-label">Крок {step + 1} із {questions.length}</p>
      <progress value={step + 1} max={questions.length} aria-label="Прогрес анкети" />
      <h1 id="question-heading">{question.title}</h1>
      <p id="question-hint">{question.hint}</p>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={question.field}>
          {question.label} ({question.required ? "обов’язково" : "необов’язково"})
        </label>
        {question.field === "preferredTime" ? (
          <input {...fieldProps} type="time" onChange={(event) => handleChange(event.target.value)} />
        ) : (
          <textarea {...fieldProps} rows={4} maxLength={2000} onChange={(event) => handleChange(event.target.value)} />
        )}
        {error && <p id="question-error" className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onBack}>Назад</button>
          <button type="submit">{step === questions.length - 1 ? "Переглянути відповіді" : "Далі"}</button>
        </div>
      </form>
    </section>
  );
}
