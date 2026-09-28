"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const start = () => router.push(`/room/${crypto.randomUUID().slice(0, 8)}`);
  const join = () => {
    const id = code.trim();
    if (id) router.push(`/room/${encodeURIComponent(id)}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Video call</h1>
      <p className="text-neutral-600">
        Start a meeting and share the link, or enter a meeting code to join.
      </p>
      <button
        onClick={start}
        className="rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700"
      >
        Start a meeting
      </button>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="Meeting code"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2"
        />
        <button
          onClick={join}
          disabled={!code.trim()}
          className="rounded-lg border border-neutral-300 px-4 py-2 font-medium disabled:opacity-50"
        >
          Join
        </button>
      </div>
    </main>
  );
}
