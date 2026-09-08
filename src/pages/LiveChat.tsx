import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ChatRoom from "@/components/ChatRoom";
import { ArrowLeft, MessageCircle, Plus, Loader2 } from "lucide-react";

interface Thread {
  id: string;
  subject: string;
  status: string;
  last_message_at: string;
}

const LiveChat = () => {
  const { user, supabaseUser, loading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!supabaseUser) return;
    setBusy(true);
    const { data } = await supabase
      .from("support_threads")
      .select("id,subject,status,last_message_at")
      .eq("user_id", supabaseUser.id)
      .order("last_message_at", { ascending: false });
    const list = (data ?? []) as Thread[];
    setThreads(list);
    setActive((prev) => prev ?? list[0]?.id ?? null);
    setBusy(false);
  }, [supabaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const startChat = async () => {
    if (!supabaseUser) return;
    setError("");
    const { data, error: err } = await supabase
      .from("support_threads")
      .insert({ user_id: supabaseUser.id, subject: "Support chat" })
      .select("id,subject,status,last_message_at")
      .single();
    if (err || !data) {
      setError("Could not start a new chat. Please try again.");
      return;
    }
    const t = data as Thread;
    setThreads((prev) => [t, ...prev]);
    setActive(t.id);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/support")} className="text-primary-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground">Live Chat</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Chat with a real support agent.</p>
          <Button size="sm" onClick={startChat}>
            <Plus className="w-4 h-4 mr-1" /> New chat
          </Button>
        </div>

        {busy ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading your chats…
          </p>
        ) : threads.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center space-y-3">
            <MessageCircle className="w-10 h-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">You have no chats yet. Start one and an agent will reply here.</p>
            <Button onClick={startChat} className="w-full">Start a chat</Button>
          </div>
        ) : (
          <>
            {threads.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id)}
                    className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border ${
                      active === t.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border"
                    }`}
                  >
                    {new Date(t.last_message_at).toLocaleDateString()} · {t.status}
                  </button>
                ))}
              </div>
            )}
            {active && <ChatRoom threadId={active} asAgent={false} />}
          </>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
};

export default LiveChat;
