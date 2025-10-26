import React, { useState, useEffect, useRef } from "react"

function SoftType({ text, color = "text-slate-900", delay = 80 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let frame = 0, stopped = false;
    const chars = Array.from(text || "");
    const advance = () => {
      if (stopped) return;
      setI((prev) => Math.min(prev + 1, chars.length));
      const c = chars[Math.min(i, chars.length - 1)] || "";
      const isPause = /[，。！？,.、;：]/.test(c);
      const pauseDelay = isPause ? delay * 4 : delay;
      frame = window.setTimeout(advance, pauseDelay);
    };
    setI(0);
    frame = window.setTimeout(advance, 300);
    return () => { stopped = true; window.clearTimeout(frame); };
  }, [text, delay]);
  const chars = Array.from(text || "");
  return (
    <span className={`${color} inline-block`} aria-live="polite">
      {chars.map((ch, idx) => (
        <span key={idx} style={{ opacity: idx < i ? 1 : 0, transition: "opacity 500ms ease" }}>{ch}</span>
      ))}
    </span>
  );
}

function Background() {
  const sources = useRef([
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=2400&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=80"
  ]);
  const [idx, setIdx] = useState(0);
  const onError = () => setIdx((i) => Math.min(i + 1, sources.current.length - 1));
  const url = sources.current[idx];
  return (
    <>
      <img src={url} onError={onError} alt="sunrise beach background" className="absolute inset-0 w-full h-full object-cover brightness-[1.08] contrast-[1.1] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 sm:from-white/70 via-white/40 to-transparent -z-5" />
    </>
  );
}

const TEXTS = {
  en: {
    title: "Sedona",
    questions: [
      { key: "state", title: "What is your NOW feeling?", type: "multi", options: ["Wanting Approval", "Wanting Control", "Wanting Security", "Apathy", "Grief", "Fear", "Lust", "Anger", "Pride", "Courage", "Acceptance", "Peace"] },
      { key: "welcome", title: "Could you welcome that feeling?", type: "choice", options: ["Yes", "Not yet", "Not sure"] },
      { key: "could", title: "Could you let it go?", type: "choice", options: ["Yes", "Not yet", "Not sure"] },
      { key: "would", title: "Would you let it go?", type: "choice", options: ["Yes", "Not yet", "Not sure"] },
      { key: "when", title: "When?", type: "choice", options: ["Now", "Later", "When I'm ready"] }
    ],
    feedbackFor(key, value) {
      if (Array.isArray(value) && value.length) {
        if (key === 'state') return `I feel ${value.join(', ')}`;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        if (key === 'state') return `I feel ${value}`;
        if (key === 'welcome') return value === 'Yes' ? 'I welcome that feeling' : value === 'Not yet' ? 'I am not ready to welcome it yet' : 'I am not sure if I can welcome it';
        if (key === 'could') return value === 'Yes' ? 'I can let it go' : value === 'Not yet' ? 'I am not ready to let it go yet' : 'I am not sure if I can let it go';
        if (key === 'would') return value === 'Yes' ? 'I am willing to let it go' : value === 'Not yet' ? 'I am not willing to let it go yet' : 'I am not sure if I am willing to let it go';
        if (key === 'when') return value === 'Now' ? 'I let it go now' : value === 'Later' ? 'I will let it go later' : 'I will let it go when I am ready';
      }
      return '';
    },
    final: { lighter: '🌿 I feel lighter, happier, freer', cont: '🌿 Continue releasing' },
    ui: { back: 'Back', next: 'Continue', reset: 'Start again', hint: 'Please choose an option', thinking: 'I am with what is.' }
  }
};

function estimateFeedbackDuration(text, delay) {
  const s = String(text || "");
  const chars = Array.from(s).length;
  const punct = (s.match(/[，。！？,.、;：]/g) || []).length;
  return 300 + chars * delay + punct * (3 * delay) + 600;
}

function Step({ q, value, onChange }) {
  const isMulti = q.type === "multi";
  const selected = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    if (!isMulti) return;
    const exists = selected.includes(opt);
    const next = exists ? selected.filter((o) => o !== opt) : [...selected, opt];
    onChange(next);
  };
  const gridClass = q.options.length === 2
    ? "grid grid-cols-2 gap-3 justify-items-center"
    : "grid gap-3 grid-cols-2 sm:grid-cols-3";
  return (
    <div className="rounded-3xl border border-slate-300/40 bg-white/80 p-4 sm:p-6 shadow-md backdrop-blur-sm">
      <h2 className="mt-1 text-lg sm:text-xl font-semibold text-center"><SoftType text={q.title} color="text-slate-900" /></h2>
      <div className={`mt-4 ${gridClass}`}>
        {q.options.map((opt) => (
          <label key={opt} className={`cursor-pointer rounded-2xl border px-3.5 py-3 text-center w-full min-h-[44px] select-none transition ${
            (isMulti ? selected.includes(opt) : value === opt)
              ? "border-emerald-500 bg-emerald-100 text-emerald-800"
              : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}
          >
            <input type={isMulti ? "checkbox" : "radio"} name={q.key} value={opt} checked={isMulti ? selected.includes(opt) : value === opt} onChange={() => (isMulti ? toggle(opt) : onChange(opt))} className="sr-only" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SedonaIAm() {
  const t = TEXTS.en;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [finalText, setFinalText] = useState(t.final.lighter);
  const currentValueRef = useRef(null);
  const q = t.questions[index];
  const FEEDBACK_LETTER_DELAY = 80;

  const setAnswer = (v) => {
    currentValueRef.current = v;
    setAnswers((a) => ({ ...a, [q.key]: v }));
    if (hint) setHint(null);
  };

  const showFeedback = (text, cb) => {
    const content = text && String(text).trim() ? text : t.ui.thinking;
    setFeedback(content);
    const ms = estimateFeedbackDuration(content, FEEDBACK_LETTER_DELAY);
    window.setTimeout(() => { setFeedback(null); cb(); }, ms);
  };

  const next = () => {
    const key = q.key;
    const v = currentValueRef.current ?? answers[key];
    const empty = (Array.isArray(v) ? v.length === 0 : !v);
    if (empty) return setHint(t.ui.hint);

    const text = t.feedbackFor(key, v);
    showFeedback(text, () => {
      if (key === 'when') {
        setFinalText(v === 'Now' ? t.final.lighter : t.final.cont);
      }
      if (index < t.questions.length - 1) setIndex((i) => i + 1); else setDone(true);
    });
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const reset = () => {
    setIndex(0); setAnswers({}); setDone(false); setFeedback(null); setHint(null); setFinalText(t.final.lighter); currentValueRef.current = null;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      <div className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <header className="text-center mb-4 sm:mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 drop-shadow-md">{t.title}</h1>
        </header>
        <main className="w-full max-w-3xl mx-auto">
          {feedback && (
            <div className="text-center text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 animate-fadeIn">
              <SoftType text={feedback} color="text-emerald-700" delay={FEEDBACK_LETTER_DELAY} />
            </div>
          )}
          {!done ? (
            <>
              <Step q={q} value={answers[q.key]} onChange={setAnswer} />
              {hint && <div className="mt-2 text-center text-sm text-rose-600">{hint}</div>}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center w-full">
                {index > 0 && <button onClick={prev} className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-slate-800 hover:border-emerald-300 w-full sm:w-auto min-h-[44px]">{t.ui.back}</button>}
                <button onClick={next} disabled={!!feedback} className="rounded-2xl bg-emerald-500 px-4 py-3 text-white hover:bg-emerald-600 transition disabled:opacity-60 w-full sm:w-auto min-h-[44px]">{t.ui.next}</button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-300 bg-white/80 p-4 sm:p-6 text-center shadow-lg backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-semibold text-slate-900">{finalText}</div>
              <div className="mt-4 flex justify-center">
                <button onClick={reset} className="rounded-2xl bg-emerald-500 px-5 py-3 text-white hover:bg-emerald-600 w-full sm:w-auto min-h-[44px]">{t.ui.reset}</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}



