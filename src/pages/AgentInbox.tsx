import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import ChatRoom from "@/components/ChatRoom";
import { ArrowLeft, Inbox, Loader2 } from "lucide-react";

interface Thread {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  last_message_at: string;
}

const AgentInbox = () => {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const { data } = await supabase
      .from("support_threads")
      .select("id,user_id,subject,status,last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setThreads((data ?? []) as Thread[]);
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || checking) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground text-center">
          This page is only available to support agents.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Inbox className="w-5 h-5 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground">Agent Inbox</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 -mt-4 grid md:grid-cols-[240px_1fr] gap-4">
        <div className="bg-card rounded-2xl border border-border p-2 max-h-[70vh] overflow-y-auto">
          {busy ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2 p-3">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading chats…
            </p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No customer chats yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                  active === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                }`}
              >
                <span className="block font-medium truncate">{t.subject}</span>
                <span className="block text-[11px] opacity-70">
                  {new Date(t.last_message_at).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>

        <div>
          {active ? (
            <ChatRoom threadId={active} asAgent />
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
              Select a chat to reply.
            </div>
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};

export default AgentInbox;
