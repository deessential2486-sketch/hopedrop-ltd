import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, ScanFace, CheckCircle2 } from "lucide-react";
import { verifyFaceFn } from "@/lib/backend.functions";

type Step = { label: string; hint: string };

const STEPS: Step[] = [
  { label: "Look straight at the camera", hint: "Keep your whole face inside the circle." },
  { label: "Blink slowly", hint: "Close your eyes for a moment, then open them." },
  { label: "Turn your head slightly left", hint: "Hold still for a second." },
];

interface Props {
  onVerified: () => void | Promise<void>;
  onCancel: () => void;
}

const FaceScan = ({ onVerified, onCancel }: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<string[]>([]);

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(-1);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch {
        setError(
          "We could not access your camera. Allow camera permission in your browser, then try again.",
        );
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  const capture = (): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      480,
      480,
    );
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runScan = async () => {
    setError("");
    framesRef.current = [];
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        await wait(700);
      }
      setCountdown(0);
      const frame = capture();
      if (!frame) {
        setStep(-1);
        setError("The camera did not return an image. Please try again.");
        return;
      }
      framesRef.current.push(frame);
      await wait(250);
    }

    setStep(-1);
    setBusy(true);
    try {
      const res = await verifyFaceFn({ data: { frames: framesRef.current } }).catch(() => ({
        error: "We could not complete the face scan. Please try again.",
      }));
      framesRef.current = [];
      const message = (res as { error?: string })?.error ?? "";
      if (message) {
        setError(message);
      } else {
        stopCamera();
        await onVerified();
      }
    } finally {
      setBusy(false);
    }
  };

  const scanning = step >= 0;

  return (
    <div className="mt-4 space-y-3">
      <div className="relative mx-auto w-56 h-56 rounded-full overflow-hidden border-4 border-primary bg-secondary">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
          aria-label="Live camera preview for face verification"
        />
        {countdown > 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-primary-foreground drop-shadow">
            {countdown}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
          </span>
        )}
      </div>

      <div aria-live="polite" className="text-center">
        {busy ? (
          <p className="text-sm font-semibold text-foreground">Checking your face…</p>
        ) : scanning ? (
          <>
            <p className="text-sm font-semibold text-foreground">{STEPS[step]!.label}</p>
            <p className="text-xs text-muted-foreground">{STEPS[step]!.hint}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Find a well-lit spot, remove hats and sunglasses, and keep your face in the circle.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 text-destructive text-sm p-3 font-medium">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={runScan} disabled={!ready || scanning || busy} className="flex-1">
          {scanning || busy ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Scanning…
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" aria-hidden="true" /> Start face scan
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          disabled={scanning || busy}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export const FaceScanIcon = ScanFace;
export const FaceDoneIcon = CheckCircle2;
export default FaceScan;
