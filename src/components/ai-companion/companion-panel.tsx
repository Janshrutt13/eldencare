"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { askCompanion } from "@/features/ai-companion/actions";
import type { CompanionReply } from "@/lib/ai/intents";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type VoiceWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const suggestions = [
  "What medicines do I have today?",
  "When is my next appointment?",
  "Schedule an appointment.",
  "I want to talk to someone.",
  "Show my nearby communities.",
];

export function CompanionPanel() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<CompanionReply>();
  const [busy, setBusy] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const params = useSearchParams();

  useEffect(
    () => () => {
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  async function send(text: string) {
    if (busy || !text.trim()) return;
    setBusy(true);
    setReply(undefined);
    recognition.current?.abort();
    try {
      const result = await askCompanion({
        message: text,
        elderId: params.get("elder") ?? undefined,
      });
      setReply(result);
      if (speak && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.text));
      }
    } catch {
      setReply({
        text: "Could not reach your companion. Please try again or refresh your session.",
        unavailable: true,
      });
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    if (listening) { recognition.current?.abort(); return; }
    const api =
      (window as VoiceWindow).SpeechRecognition ??
      (window as VoiceWindow).webkitSpeechRecognition;
    if (!api) {
      setVoiceNote("Voice input is not supported by this browser. Please type your message.");
      return;
    }
    const instance = new api();
    recognition.current = instance;
    instance.lang = "en-IN";
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => {
      setMessage(event.results[0][0].transcript);
      setVoiceNote("Review the transcription, then choose Send.");
    };
    instance.onerror = () => {
      setVoiceNote("Microphone unavailable or permission denied. You can still type.");
      setListening(false);
    };
    instance.onend = () => setListening(false);
    try {
      instance.start();
      setListening(true);
      setVoiceNote("Listening…");
    } catch {
      setVoiceNote("Voice input could not start. Please type instead.");
    }
  }

  function close() {
    setOpen(false);
    recognition.current?.abort();
    window.speechSynthesis?.cancel();
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-[calc(100vw-2.5rem)]">
      {open && (
        <section
          role="dialog"
          aria-label="Care companion"
          onKeyDown={(e) => { if (e.key === "Escape") close(); }}
          className="mb-3 w-[400px] max-w-full max-h-[78vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl stack"
          style={{ padding: "1.25rem", boxShadow: "0 8px 32px rgb(0 0 0 / 0.12)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-base">Care companion</h2>
            </div>
            <button className="button !min-h-8 !py-1 !px-3 text-sm" onClick={close}>
              Close
            </button>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Ask about stored records or chat. General conversation uses Google Gemini.
            Healthcare records stay out of AI prompts.
          </p>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((text) => (
              <button
                key={text}
                className="button !min-h-8 !py-1 !px-2.5 !text-xs"
                disabled={busy}
                onClick={() => { setMessage(text); void send(text); }}
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            className="stack"
            style={{ gap: "0.6rem" }}
            onSubmit={(e) => { e.preventDefault(); void send(message); }}
          >
            <label>
              Your message
              <textarea
                ref={input}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={1000}
                rows={3}
                placeholder="Ask about medicines, appointments, or just chat…"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="button primary flex-1" disabled={busy}>
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Thinking…
                  </span>
                ) : "Send"}
              </button>
              <button className="button" type="button" onClick={startVoice}>
                {listening ? (
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Stop
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    Microphone
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Speak toggle */}
          <label className="!flex gap-2 items-center text-sm font-normal">
            <input
              className="!w-5"
              type="checkbox"
              checked={speak}
              onChange={(e) => {
                if (!("speechSynthesis" in window)) {
                  setVoiceNote("Spoken responses are not supported here.");
                  return;
                }
                setSpeak(e.target.checked);
                if (!e.target.checked) window.speechSynthesis.cancel();
              }}
            />
            Read responses aloud
          </label>

          {voiceNote && (
            <p role="status" className="text-xs text-neutral-500">{voiceNote}</p>
          )}

          {/* Reply */}
          <div aria-live="polite">
            {reply && (
              <div className="notice stack" style={{ gap: "0.6rem", background: reply.unavailable ? "#fdf5f0" : "#f5f5f5", borderColor: reply.unavailable ? "#f0cdb8" : "#e0e0e0" }}>
                <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                {reply.href && (
                  <Link className="button w-fit text-sm" href={reply.href} onClick={close}>
                    {reply.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <button
        className="button primary shadow-lg"
        style={{ boxShadow: "0 4px 16px rgb(0 0 0 / 0.2)" }}
        aria-expanded={open}
        onClick={() => {
          if (open) close();
          else {
            setOpen(true);
            requestAnimationFrame(() => input.current?.focus());
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Care companion
      </button>
    </div>
  );
}
