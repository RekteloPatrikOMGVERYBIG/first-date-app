import { useEffect, useRef } from "react";
import { questions } from "../questionnaire";
import type { Answers } from "../questionnaire";

type AnswerReviewProps = {
  answers: Answers;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string;
};

export default function AnswerReview({ answers, onEdit, onSubmit, isSubmitting, error }: AnswerReviewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <section className="question-card" aria-labelledby="review-heading">
      <h1 id="review-heading" ref={headingRef} tabIndex={-1}>Усе так, як ти хочеш? ❤️</h1>
      <p>Переглянь відповіді. Будь-яку з них можна змінити.</p>
      <dl className="answer-list">
        {questions.map((question, index) => (
          <div className="answer-item" key={question.field}>
            <dt>{question.label}</dt>
            <dd>{answers[question.field] || "Не вказано"}</dd>
            <button type="button" disabled={isSubmitting} className="secondary-button" onClick={() => onEdit(index)}
              aria-label={`Змінити: ${question.label}`}>
              Змінити
            </button>
          </div>
        ))}
      </dl>
      <p className="preview-note">Надішли свої побажання, щоб я міг підготувати наше побачення ❤️</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <p role="status">{isSubmitting ? "Зберігаємо твої побажання…" : ""}</p>
      <div className="form-actions">
        <button type="button" disabled={isSubmitting} className="secondary-button" onClick={() => onEdit(questions.length - 1)}>Назад</button>
        <button type="button" disabled={isSubmitting} onClick={onSubmit}>{isSubmitting ? "Надсилаємо…" : "Надіслати відповіді"}</button>
      </div>
    </section>
  );
}
