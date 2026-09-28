"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVideoCall } from "@/hooks/useVideoCall";

function Video({ stream, muted, label }: { stream: MediaStream | null; muted?: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-sm text-white">
        {label}
      </span>
    </div>
  );
}

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { localStream, remoteStream, status, error, micOn, camOn, toggleMic, toggleCam } =
    useVideoCall(id);

  const copyLink = () => navigator.clipboard.writeText(window.location.href);
  const btn = "rounded-lg px-4 py-2 font-medium";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold">Meeting {id}</h1>
        <button onClick={copyLink} className="text-sm text-indigo-600 underline">
          Copy invite link
        </button>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      <section className="grid flex-1 content-start gap-4 md:grid-cols-2">
        <Video stream={localStream} muted label="You" />
        {remoteStream ? (
          <Video stream={remoteStream} label="Guest" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-neutral-300 text-neutral-500">
            {status === "starting" ? "Starting…" : "Waiting for someone to join"}
          </div>
        )}
      </section>

      <footer className="flex justify-center gap-3">
        <button onClick={toggleMic} className={`${btn} ${micOn ? "bg-neutral-200" : "bg-red-600 text-white"}`}>
          {micOn ? "Mute" : "Unmute"}
        </button>
        <button onClick={toggleCam} className={`${btn} ${camOn ? "bg-neutral-200" : "bg-red-600 text-white"}`}>
          {camOn ? "Turn camera off" : "Turn camera on"}
        </button>
        <button onClick={() => router.push("/")} className={`${btn} bg-red-600 text-white`}>
          Leave
        </button>
      </footer>
    </main>
  );
}
