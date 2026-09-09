import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Paperclip, X, FileText, Download } from "lucide-react";

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: string;
  body: string;
  created_at: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT =
  "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic", "pdf", "doc", "docx", "txt"];

const prettySize = (n?: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentView = ({ msg }: { msg: ChatMessage }) => {
  const [url, setUrl] = useState<string>("");
  const path = msg.attachment_path;

  useEffect(() => {
    let active = true;
    if (!path) return;
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path) return null;
  const isImage = (msg.attachment_type ?? "").startsWith("image/");

  if (isImage) {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
        <img
          src={url}
          alt={msg.attachment_name ?? "Attachment"}
          className="rounded-xl max-h-56 w-auto object-cover"
          loading="lazy"
        />
      </a>
    ) : (
      <div className="mt-1 h-24 w-40 rounded-xl bg-background/30 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl bg-background/25 px-2 py-2 max-w-[240px]"
    >
      <FileText className="w-5 h-5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-xs font-medium truncate">{msg.attachment_name ?? "File"}</span>
        <span className="block text-[10px] opacity-70">
          {(msg.attachment_name?.split(".").pop() ?? "file").toUpperCase()} · {prettySize(msg.attachment_size)}
        </span>
      </span>
      <Download className="w-4 h-4 shrink-0 opacity-70" />
    </a>
  );
};

const ChatRoom = ({ threadId, asAgent }: { threadId: string; asAgent: boolean }) => {
  const { supabaseUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  const clearFile = () => {
    setFile(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return "";
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickFile = (f: File | null) => {
    setError("");
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("You can send photos, PDF, Word documents or text files.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("That file is larger than 10MB. Please choose a smaller one.");
      return;
    }
    setFile(f);
    setPreviewUrl(f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  };

  const uploadFile = async (f: File): Promise<{ path: string } | { error: string }> => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${threadId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    setProgress(10);
    const tick = setInterval(() => {
      setProgress((p) => (p === null ? p : Math.min(90, p + 10)));
    }, 300);

    const { error } = await supabase.storage
      .from("chat-attachments")
      .upload(path, f, {
        cacheControl: "3600",
        upsert: false,
        contentType: f.type || "application/octet-stream",
      });

    clearInterval(tick);
    if (error) {
      console.error("[chat] upload failed", error);
      return { error: `Upload failed: ${error.message}` };
    }
    setProgress(100);
    return { path };
  };


  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !file) || !supabaseUser) return;
    setSending(true);
    setError("");

    let attachment: {
      attachment_path: string;
      attachment_name: string;
      attachment_type: string;
      attachment_size: number;
    } | null = null;

    if (file) {
      setProgress(0);
      const res = await uploadFile(file);
      setProgress(null);
      if ("error" in res) {
        setError(res.error);
        setSending(false);
        return;
      }
      attachment = {
        attachment_path: res.path,
        attachment_name: file.name,
        attachment_type: file.type || "application/octet-stream",
        attachment_size: file.size,
      };
    }

    const { data, error: err } = await supabase
      .from("support_messages")
      .insert({
        thread_id: threadId,
        sender_user_id: supabaseUser.id,
        sender_role: asAgent ? "agent" : "customer",
        body,
        ...(attachment ?? {}),
      })
      .select()
      .single();
    setSending(false);
    if (err) {
      setError("Message not sent. Please try again.");
      return;
    }
    setText("");
    clearFile();
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
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  <AttachmentView msg={m} />
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

        {file && (
          <div className="flex items-center gap-2 rounded-xl border border-border p-2">
            {previewUrl ? (
              <img src={previewUrl} alt="Selected" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <FileText className="w-8 h-8 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate text-foreground">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{prettySize(file.size)}</p>
              {progress !== null && (
                <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-muted-foreground"
              aria-label="Remove attachment"
              disabled={sending}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            aria-label="Attach a photo or file"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message…"
            aria-label="Message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!text.trim() && !file) || sending}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
