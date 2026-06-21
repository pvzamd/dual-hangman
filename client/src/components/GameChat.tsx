import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_CHAT_LENGTH, type ChatBroadcastPayload, type PlayerId } from '@dual-hangman/shared';

/**
 * In-room chat. A sidebar on large screens (see GameBoard layout) and a
 * stacked panel on mobile. Ephemeral — messages live only in client state for
 * as long as this screen is mounted. Presentation only; sending goes through
 * the server, which is the source of truth for what gets broadcast back.
 */
export default function GameChat({
  messages,
  youId,
  onSend,
}: {
  messages: ChatBroadcastPayload[];
  youId: PlayerId;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  }

  return (
    <aside className="flex w-full flex-col rounded-xl bg-slate-800/60 p-3 lg:w-72">
      <h2 className="mb-2 text-center text-sm font-semibold text-slate-400">Chat</h2>

      <div className="flex h-40 flex-col gap-1.5 overflow-y-auto pr-1 lg:h-[28rem]">
        {messages.length === 0 ? (
          <p className="m-auto text-xs text-slate-500">Say hi 👋</p>
        ) : (
          messages.map((msg, i) => {
            const mine = msg.senderId === youId;
            return (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm ${
                  mine
                    ? 'self-end bg-emerald-700/70 text-emerald-50'
                    : 'self-start bg-slate-700 text-slate-100'
                }`}
              >
                {!mine && (
                  <span className="mr-1 text-xs font-semibold text-slate-400">
                    {msg.senderName}
                  </span>
                )}
                <span className="break-words">{msg.text}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_CHAT_LENGTH}
          placeholder="Message…"
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
