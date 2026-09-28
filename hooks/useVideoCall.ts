"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Signal = {
  type: "join" | "offer" | "answer" | "ice" | "leave";
  from: string;
  to?: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

export type CallStatus = "starting" | "waiting" | "connected" | "error";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useVideoCall(roomId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CallStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    const myId = crypto.randomUUID();
    let channel: RealtimeChannel | null = null;
    let pc: RTCPeerConnection | null = null;
    let peerId: string | null = null;
    let pendingIce: RTCIceCandidateInit[] = [];

    const send = (msg: Omit<Signal, "from">) =>
      channel?.send({
        type: "broadcast",
        event: "signal",
        payload: { ...msg, from: myId },
      });

    const closePeer = () => {
      pc?.close();
      pc = null;
      peerId = null;
      pendingIce = [];
      setRemoteStream(null);
    };

    const createPeer = (remoteId: string) => {
      closePeer();
      peerId = remoteId;
      const conn = new RTCPeerConnection(RTC_CONFIG);
      localRef.current
        ?.getTracks()
        .forEach((t) => conn.addTrack(t, localRef.current!));
      conn.ontrack = (e) => setRemoteStream(e.streams[0]);
      conn.onicecandidate = (e) => {
        if (e.candidate) send({ type: "ice", to: remoteId, data: e.candidate.toJSON() });
      };
      conn.onconnectionstatechange = () => {
        if (conn.connectionState === "connected") setStatus("connected");
        if (conn.connectionState === "failed") {
          setError("The connection to the other person failed. Ask them to rejoin.");
          setStatus("error");
        }
      };
      pc = conn;
      return conn;
    };

    const flushIce = async () => {
      for (const c of pendingIce) await pc?.addIceCandidate(c);
      pendingIce = [];
    };

    const onSignal = async (s: Signal) => {
      if (s.from === myId || (s.to && s.to !== myId)) return;
      try {
        if (s.type === "join") {
          const conn = createPeer(s.from);
          const offer = await conn.createOffer();
          await conn.setLocalDescription(offer);
          send({ type: "offer", to: s.from, data: offer });
        } else if (s.type === "offer") {
          const conn = createPeer(s.from);
          await conn.setRemoteDescription(s.data as RTCSessionDescriptionInit);
          await flushIce();
          const answer = await conn.createAnswer();
          await conn.setLocalDescription(answer);
          send({ type: "answer", to: s.from, data: answer });
        } else if (s.type === "answer" && pc && s.from === peerId) {
          await pc.setRemoteDescription(s.data as RTCSessionDescriptionInit);
          await flushIce();
        } else if (s.type === "ice" && s.from === peerId) {
          const c = s.data as RTCIceCandidateInit;
          if (pc?.remoteDescription) await pc.addIceCandidate(c);
          else pendingIce.push(c);
        } else if (s.type === "leave" && s.from === peerId) {
          closePeer();
          setStatus("waiting");
        }
      } catch (err) {
        console.error("Signal error", err);
      }
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localRef.current = stream;
        setLocalStream(stream);
      } catch {
        setError("Can't access your camera or microphone. Allow access in your browser and reload.");
        setStatus("error");
        return;
      }

      channel = supabase.channel(`room:${roomId}`);
      channel
        .on("broadcast", { event: "signal" }, ({ payload }) => onSignal(payload as Signal))
        .subscribe((state) => {
          if (cancelled) return;
          if (state === "SUBSCRIBED") {
            setStatus("waiting");
            send({ type: "join" });
          } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
            setError(
              "Can't reach the meeting service. Check your connection and your Supabase URL and key."
            );
            setStatus("error");
          }
        });
    };

    start();

    return () => {
      cancelled = true;
      send({ type: "leave" });
      closePeer();
      if (channel) supabase.removeChannel(channel);
      localRef.current?.getTracks().forEach((t) => t.stop());
      localRef.current = null;
    };
  }, [roomId]);

  const toggleMic = useCallback(() => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const track = localRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, []);

  return { localStream, remoteStream, status, error, micOn, camOn, toggleMic, toggleCam };
}
