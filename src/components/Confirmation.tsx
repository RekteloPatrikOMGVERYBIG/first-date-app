import { useEffect, useRef } from "react";

export default function Confirmation() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <section className="question-card confirmation" aria-labelledby="confirmation-heading">
      <span className="confirmation-heart" aria-hidden="true">❤️</span>
      <h1 id="confirmation-heading" ref={headingRef} tabIndex={-1}>Дякую ❤️</h1>
      <p>Тепер я знаю, як зробити наше побачення особливим.</p>
      <p className="preview-note">Твої відповіді успішно збережені. Можеш закрити цю сторінку ❤️</p>
    </section>
  );
}
