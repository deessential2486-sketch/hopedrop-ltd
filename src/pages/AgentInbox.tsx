import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import ChatRoom from "@/components/ChatRoom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox, Loader2 } from "lucide-react";

interface Thread {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  last_message_at: string;
}

interface Customer {
  full_name: string;
  phone: string;
}

const AgentInbox = () => {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/admin-login");
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const { data } = await supabase
      .from("support_threads")
      .select("id,user_id,subject,status,last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(100);
    const list = (data ?? []) as Thread[];
    setThreads(list);

    const ids = Array.from(new Set(list.map((t) => t.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,full_name,phone")
        .in("user_id", ids);
      const map: Record<string, Customer> = {};
      (profs ?? []).forEach((p: any) => {
        map[p.user_id] = { full_name: p.full_name || "", phone: p.phone || "" };
      });
      setCustomers(map);
    }
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("agent-inbox-threads")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, load]);

  const activeThread = threads.find((t) => t.id === active) ?? null;

  const toggleStatus = async () => {
    if (!activeThread) return;
    const next = activeThread.status === "resolved" ? "open" : "resolved";
    setUpdating(true);
    const { error } = await supabase
      .from("support_threads")
      .update({ status: next })
      .eq("id", activeThread.id);
    setUpdating(false);
    if (!error) {
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, status: next } : t)));
    }
  };

  if (loading || checking) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-4">
        <p className="text-sm text-muted-foreground text-center">
          This page is only available to support agents.
        </p>
        <Button variant="outline" onClick={() => navigate("/admin-login")}>
          Sign in as an agent
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-4 pt-6 pb-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-primary-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Inbox className="w-5 h-5 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground">Agent Inbox</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 grid md:grid-cols-[260px_1fr] gap-4">
        <div className="bg-card rounded-2xl border border-border p-2 max-h-[70vh] overflow-y-auto">
          {busy ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2 p-3">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading chats…
            </p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No customer chats yet.</p>
          ) : (
            threads.map((t) => {
              const c = customers[t.user_id];
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                    active === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <span className="block font-medium truncate">
                    {c?.full_name || t.subject}
                  </span>
                  <span className="block text-[11px] opacity-70">
                    {t.status === "resolved" ? "Resolved" : "Open"} ·{" "}
                    {new Date(t.last_message_at).toLocaleString()}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          {activeThread ? (
            <>
              <div className="bg-card rounded-2xl border border-border p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {customers[activeThread.user_id]?.full_name || "Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customers[activeThread.user_id]?.phone || "No phone on file"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={toggleStatus} disabled={updating}>
                  {activeThread.status === "resolved" ? "Reopen chat" : "Mark as resolved"}
                </Button>
              </div>
              <ChatRoom threadId={activeThread.id} asAgent />
            </>
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
