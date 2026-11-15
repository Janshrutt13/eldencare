"use client";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendMessage } from "./actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { formatDateTime } from "@/lib/dates";
import type { SocialMessage } from "@/types/social";
import type { FormState } from "@/types/forms";
export function ChatMessages({
  messages,
  userId,
  groupId,
  hasCursor,
}: {
  messages: SocialMessage[];
  userId: string;
  groupId: string;
  hasCursor: boolean;
}) {
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [state, action, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await sendMessage(previous, form);
      if (result.success) setText("");
      return result;
    },
    {},
  );
  const newest = messages[0]?.id;
  useEffect(() => {
    if (!hasCursor && scroller.current)
      scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [newest, hasCursor]);
  useEffect(() => {
    if (hasCursor) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && !refreshing && !pending)
        startRefresh(() => router.refresh());
    }, 15000);
    return () => window.clearInterval(interval);
  }, [router, hasCursor, refreshing, pending]);
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <div
        ref={scroller}
        className="h-80 overflow-y-auto p-4 stack content-start"
        role="log"
        aria-label="Group messages"
        aria-live="polite"
        tabIndex={0}
      >
        {!messages.length && (
          <p className="muted py-10 text-center">
            No messages yet. Say hello to your group.
          </p>
        )}
        {[...messages].reverse().map((message) => {
          const own = message.sender_id === userId;
          return (
            <article
              key={message.id}
              className={`rounded-xl border p-3 max-w-[90%] ${own ? "ml-auto border-neutral-900 bg-neutral-900 text-white" : "mr-auto border-neutral-200 bg-neutral-50"}`}
            >
              <p className="font-semibold">
                {own ? "You" : message.sender_name}
              </p>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p
                className={`text-xs mt-1 ${own ? "text-neutral-300" : "text-neutral-500"}`}
              >
                {formatDateTime(message.created_at)}
                {message.demo_key ? " · Seeded demo message" : ""}
              </p>
            </article>
          );
        })}
      </div>
      <form
        action={action}
        className="border-t border-neutral-200 bg-white p-4 stack"
      >
        <input type="hidden" name="group" value={groupId} />
        <label>
          Your message
          <textarea
            name="body"
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            maxLength={2000}
            rows={2}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="muted text-sm">
            {text.length}/2000 ·{" "}
            {hasCursor
              ? "Viewing older messages"
              : "Refreshes every 15 seconds while visible"}
          </span>
          <button className="button primary" disabled={pending || !text.trim()}>
            <Send size={18} aria-hidden="true" />
            {pending ? "Sending…" : "Send message"}
          </button>
        </div>
        <FormFeedback state={state} />
      </form>
    </div>
  );
}
