import { useRef, useState } from "react";
import NameStep from "./components/NameStep";
import DateStep from "./components/DateStep";
import QuestionStep from "./components/QuestionStep";
import AnswerReview from "./components/AnswerReview";
import Confirmation from "./components/Confirmation";
import Invitation from "./components/Invitation";
import OwnerDashboard from "./components/OwnerDashboard";
import InviteGate from "./components/InviteGate";
import { emptyAnswers, getToday, questions } from "./questionnaire";
import type { AnswerField, Answers } from "./questionnaire";
import { getTextAnswerError } from "./answerValidation";
import { createSubmissionId, submitAnswers } from "./api";
import "./App.css";

function Planner({ token }: { token?: string }) {
  const [screen, setScreen] = useState<"landing" | "questions" | "review" | "complete">("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const submittingRef = useRef(false);

  function updateAnswer(field: AnswerField, value: string) {
    if (answers[field] !== value) setSubmissionId(createSubmissionId());
    setAnswers((previous) => ({ ...previous, [field]: value }));
  }

  function nextStep() {
    if (isEditing || step === questions.length - 1) {
      setScreen("review");
      setIsEditing(false);
    } else {
      setStep(step + 1);
    }
  }

  function previousStep() {
    if (step === 0) setScreen("landing");
    else setStep(step - 1);
  }

  function editStep(index: number) {
    setSubmitError("");
    setStep(index);
    setIsEditing(true);
    setScreen("questions");
  }

  async function completeQuestionnaire() {
    if (submittingRef.current) return;
    if (!token) {
      setSubmitError("Це попередній перегляд. Для надсилання відкрий особисте посилання-запрошення.");
      return;
    }
    // Recheck every required answer, including the date if midnight has passed.
    const invalidStep = questions.findIndex((question) =>
      (question.required && !answers[question.field].trim()) ||
      (question.field !== "preferredDate" && question.field !== "preferredTime" &&
        Boolean(getTextAnswerError(answers[question.field], question.required))) ||
      (question.field === "preferredDate" && answers.preferredDate < getToday())
    );
    if (invalidStep !== -1) {
      editStep(invalidStep);
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await submitAnswers(answers, submissionId, token);
      setScreen("complete");
    } catch (error) {
      setSubmitError(error instanceof Error && error.name === "Error"
        ? error.message
        : "Немає зв’язку із сервером. Відповіді залишилися у формі — спробуй надіслати ще раз.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (screen === "complete") {
    return <main><Confirmation /></main>;
  }

  if (screen === "review") {
    return <main><AnswerReview answers={answers} onEdit={editStep} onSubmit={completeQuestionnaire}
      isSubmitting={isSubmitting} error={submitError} /></main>;
  }

  if (screen === "questions") {
    return (
      <main>
        {step === 0 ? (
          <NameStep name={answers.name} onNameChange={(value) => updateAnswer("name", value)}
            onBack={previousStep} onNext={nextStep} />
        ) : step === 1 ? (
          <DateStep preferredDate={answers.preferredDate} onDateChange={(value) => updateAnswer("preferredDate", value)}
            onBack={previousStep} onNext={nextStep} />
        ) : (
          <QuestionStep key={step} step={step} value={answers[questions[step].field]}
            onChange={(value) => updateAnswer(questions[step].field, value)}
            onBack={previousStep} onNext={nextStep} />
        )}
      </main>
    );
  }

  return (
    <>
    {!token && <p style={{ textAlign: "center", padding: "12px" }}>Попередній перегляд · <a href="/owner">Кабінет власника</a></p>}
    <Invitation onStart={() => {
          setStep(0);
          setIsEditing(false);
          setScreen("questions");
        }} />
    </>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path === "/owner" || path === "/owner/") return <OwnerDashboard />;
  const match = path.match(/^\/invite\/([A-Za-z0-9_-]+)\/?$/);
  if (match) return <InviteGate token={match[1]}><Planner token={match[1]} /></InviteGate>;
  if (path !== "/") return <main><h1>Сторінку не знайдено</h1><a href="/">На головну</a></main>;
  return <Planner />;
}
