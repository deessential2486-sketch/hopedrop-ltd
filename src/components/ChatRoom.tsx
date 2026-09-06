import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

const ChatRoom = ({ threadId, asAgent }: { threadId: string; asAgent: boolean }) => {
  const { supabaseUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scroll = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("support_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setMessages((data ?? []) as ChatMessage[]);
        setLoading(false);
        setTimeout(scroll, 50);
      });

    const channel = supabase
      .channel(`support-thread-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          setTimeout(scroll, 50);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [threadId, scroll]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !supabaseUser) return;
    setSending(true);
    setError("");
    const { data, error: err } = await supabase
      .from("support_messages")
      .insert({
        thread_id: threadId,
        sender_user_id: supabaseUser.id,
        sender_role: asAgent ? "agent" : "customer",
        body,
      })
      .select()
      .single();
    setSending(false);
    if (err) {
      setError("Message not sent. Please try again.");
      return;
    }
    setText("");
    if (data) {
      const msg = data as ChatMessage;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(scroll, 50);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[70vh] bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading messages…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {asAgent ? "No messages yet in this chat." : "Say hello — our support team will reply here."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = asAgent ? m.sender_role === "agent" : m.sender_role === "customer";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  }`}
                >
                  {!mine && (
                    <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                      {m.sender_role === "agent" ? "Support agent" : "Customer"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-border p-3 space-y-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message…"
            aria-label="Message"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Send message">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
