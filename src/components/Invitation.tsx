import { useRef, useState } from "react";
import "./Invitation.css";

const hidingPlaces = [
  [80, 18], [15, 76], [78, 80], [20, 18], [50, 50],
  [82, 48], [18, 48], [50, 82], [50, 15],
];

export default function Invitation({ onStart }: { onStart: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startRef = useRef<HTMLButtonElement>(null);
  const position = attempts === 0 ? [50, 50] : hidingPlaces[attempts - 1];

  function dodge() {
    setAttempts((previous) => Math.min(previous + 1, 10));
    if (attempts === 9) startRef.current?.focus();
  }

  return (
    <div className="invitation">
      <header className="invitation-header">
        <a className="wordmark" href="./" aria-label="First Date Planner — головна">first date<span>♥</span></a>
        <span className="header-note">маленький початок чогось особливого</span>
      </header>

      <main className="invitation-main">
        <div className="floating-petals" aria-hidden="true">
          <span>♡</span><span>✧</span><span>♡</span><span>✧</span><span>♡</span>
        </div>
        <p className="eyebrow">ОДИН ЛИСТ. ОДНЕ ЗАПРОШЕННЯ. ТІЛЬКИ ТОБІ.</p>
        <h1 className="invitation-title">У мене є дещо<br /><em>для тебе.</em></h1>
        <p className="invitation-description">Трохи цікавості, дрібка романтики<br />і побачення, яке почнеться з твоїх бажань.</p>

        <div className={`envelope-scene ${isOpen ? "is-open" : ""}`}>
          <div className="envelope-back" aria-hidden="true" />
          <div className="envelope-flap" aria-hidden="true" />
          {isOpen && (
            <section className="invitation-letter" aria-labelledby="letter-heading">
              <p className="letter-kicker">особисто для тебе ♡</p>
              <h2 id="letter-heading">Сплануй наше<br /><em>побачення</em> ❤️</h2>
              <p>Розкажи, що тобі подобається,<br />а я підготую щось особливе!</p>
              <button ref={startRef} autoFocus className="start-date-button" type="button" onClick={onStart}>
                Почати <span aria-hidden="true">↗</span>
              </button>
              <div className="dodge-area">
                {attempts < 10 && (
                  <button type="button" className="decline-button"
                    style={{ left: `${position[0]}%`, top: `${position[1]}%` }}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.preventDefault();
                      dodge();
                    }}
                    onClick={(event) => { if (event.detail === 0) dodge(); }}>
                    Не хочу
                  </button>
                )}
              </div>
              <p className="playful-message" role="status" aria-live="polite">
                {attempts === 10
                  ? "Ну все, кнопка втекла назовсім 😌 Тепер твій хід — «Почати» ❤️"
                  : attempts > 0
                    ? `Ой, не впіймала 😉 ${attempts} / 10`
                    : "Здається, одна з кнопок трохи сором’язлива…"}
              </p>
            </section>
          )}
          <div className="envelope-front" aria-hidden="true"><span>з теплом, для тебе</span></div>
          {!isOpen && (
            <button className="envelope-open-button" type="button" onClick={() => setIsOpen(true)} aria-label="Відкрити конверт">
              <span className="wax-seal" aria-hidden="true">♥</span>
              <span className="envelope-caption">Натисни, щоб відкрити</span>
            </button>
          )}
        </div>
        <p className="invitation-footnote">{isOpen ? "Твої маленькі побажання — моє натхнення." : "P.S. Усередині дещо приємне. Обіцяю."}</p>
      </main>
      <footer className="invitation-footer"><span>ЗРОБЛЕНО З ТЕПЛОМ</span><span aria-hidden="true">♡</span><span>ДЛЯ НАШОЇ ІСТОРІЇ</span></footer>
    </div>
  );
}
