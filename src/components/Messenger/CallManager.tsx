import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PhoneOutlined,
  VideoCameraOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraAddOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { message as antMessage } from "antd";
import { useMessenger } from "../../contexts/MessengerContext";
import { getInitial } from "./utils";

// Basic STUN only (no TURN). Suitable for same network / public IPs.
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type ActiveCall = {
  callId: string;
  conversationId: string;
  kind: "audio" | "video";
  peerUserId: string;
  peerName?: string;
  peerAvatar?: string;
  isCaller: boolean;
  startedAt: number;
  connected: boolean;
};

const CallManager: React.FC = () => {
  const { socket, incomingCall, setIncomingCall } = useMessenger();

  const [active, setActive] = useState<ActiveCall | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  // ───── Cleanup ─────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingIceRef.current = [];
    setActive(null);
    setElapsed(0);
    setMicOn(true);
    setCamOn(true);
  }, []);

  // ───── Create peer connection ─────
  const createPeer = useCallback(
    (callId: string, peerUserId: string) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      pc.onicecandidate = (e) => {
        if (e.candidate && socket) {
          socket.emit("call:signal", {
            callId,
            toUserId: peerUserId,
            type: "ice",
            signal: e.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (e) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        e.streams[0]?.getTracks().forEach((t) => {
          remoteStreamRef.current?.addTrack(t);
        });
        // attach
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        if (remoteAudioRef.current)
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setActive((prev) => (prev ? { ...prev, connected: true } : prev));
        }
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          // peer gone
        }
      };

      return pc;
    },
    [socket],
  );

  const getMedia = async (kind: "audio" | "video") => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === "video",
    });
  };

  // ───── Start outgoing call ─────
  useEffect(() => {
    const handler = async (e: any) => {
      if (!socket) return;
      const detail = e.detail as {
        callId: string;
        conversationId: string;
        kind: "audio" | "video";
        targetUserIds: string[];
        peerName?: string;
        peerAvatar?: string;
      };
      if (active) {
        antMessage.warning("Đang có cuộc gọi khác");
        return;
      }
      if (!detail.targetUserIds.length) {
        antMessage.warning("Không có người nhận cuộc gọi");
        return;
      }
      const peerUserId = detail.targetUserIds[0];

      try {
        const stream = await getMedia(detail.kind);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeer(detail.callId, peerUserId);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        // Notify other side
        socket.emit("call:invite", {
          callId: detail.callId,
          conversationId: detail.conversationId,
          kind: detail.kind,
          targetUserIds: detail.targetUserIds,
        });

        setActive({
          callId: detail.callId,
          conversationId: detail.conversationId,
          kind: detail.kind,
          peerUserId,
          peerName: detail.peerName,
          peerAvatar: detail.peerAvatar,
          isCaller: true,
          startedAt: Date.now(),
          connected: false,
        });

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:signal", {
          callId: detail.callId,
          toUserId: peerUserId,
          type: "offer",
          signal: offer,
        });
      } catch (err: any) {
        antMessage.error(
          "Không thể truy cập micro/camera: " + (err?.message || ""),
        );
        cleanup();
      }
    };
    window.addEventListener("messenger:startCall", handler);
    return () => window.removeEventListener("messenger:startCall", handler);
  }, [socket, active, createPeer, cleanup]);

  // ───── Socket signaling handlers ─────
  useEffect(() => {
    if (!socket) return;

    const onSignal = async (data: {
      callId: string;
      fromUserId: string;
      type: "offer" | "answer" | "ice";
      signal: any;
    }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (data.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          // drain pending
          for (const c of pendingIceRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingIceRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("call:signal", {
            callId: data.callId,
            toUserId: data.fromUserId,
            type: "answer",
            signal: answer,
          });
        } else if (data.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          for (const c of pendingIceRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingIceRef.current = [];
        } else if (data.type === "ice") {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal));
          } else {
            pendingIceRef.current.push(data.signal);
          }
        }
      } catch (err) {
        console.error("Signal error:", err);
      }
    };

    const onRejected = () => {
      antMessage.info("Cuộc gọi đã bị từ chối");
      cleanup();
    };
    const onEnded = () => {
      antMessage.info("Cuộc gọi đã kết thúc");
      cleanup();
    };

    socket.on("call:signal", onSignal);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);
    return () => {
      socket.off("call:signal", onSignal);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
    };
  }, [socket, cleanup]);

  // Elapsed timer
  useEffect(() => {
    if (!active?.connected) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - active.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active?.connected, active?.startedAt]);

  // ───── Accept incoming call ─────
  const acceptIncoming = async () => {
    if (!incomingCall || !socket) return;
    try {
      const stream = await getMedia(incomingCall.kind);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = createPeer(incomingCall.callId, incomingCall.fromUserId);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      setActive({
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        kind: incomingCall.kind,
        peerUserId: incomingCall.fromUserId,
        peerName: incomingCall.fromUser?.name,
        peerAvatar: incomingCall.fromUser?.avatar,
        isCaller: false,
        startedAt: Date.now(),
        connected: false,
      });

      socket.emit("call:accept", {
        callId: incomingCall.callId,
        toUserId: incomingCall.fromUserId,
      });
      setIncomingCall(null);
    } catch (err: any) {
      antMessage.error(
        "Không thể truy cập micro/camera: " + (err?.message || ""),
      );
      socket.emit("call:reject", {
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        toUserId: incomingCall.fromUserId,
        kind: incomingCall.kind,
      });
      setIncomingCall(null);
      cleanup();
    }
  };

  const rejectIncoming = () => {
    if (!incomingCall || !socket) return;
    socket.emit("call:reject", {
      callId: incomingCall.callId,
      conversationId: incomingCall.conversationId,
      toUserId: incomingCall.fromUserId,
      kind: incomingCall.kind,
    });
    setIncomingCall(null);
  };

  const endActive = () => {
    if (!active || !socket) return;
    socket.emit("call:end", {
      callId: active.callId,
      conversationId: active.conversationId,
      kind: active.kind,
      durationSec: active.connected
        ? Math.floor((Date.now() - active.startedAt) / 1000)
        : 0,
      targetUserIds: [active.peerUserId],
    });
    cleanup();
  };

  const toggleMic = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  };
  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Incoming call modal */}
      {incomingCall && !active && (
        <div className="call-incoming-modal">
          <div className="ci-avatar">
            {incomingCall.fromUser?.avatar ? (
              <img
                src={incomingCall.fromUser.avatar}
                alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            ) : (
              getInitial(incomingCall.fromUser?.name)
            )}
          </div>
          <div className="ci-name">
            {incomingCall.fromUser?.name || "Người dùng"}
          </div>
          <div className="ci-sub">
            Cuộc gọi {incomingCall.kind === "video" ? "video" : "thoại"} đến...
          </div>
          <div className="ci-actions">
            <button
              className="ci-reject"
              onClick={rejectIncoming}
              title="Từ chối"
            >
              <CloseOutlined />
            </button>
            <button
              className="ci-accept"
              onClick={acceptIncoming}
              title="Chấp nhận"
            >
              {incomingCall.kind === "video" ? (
                <VideoCameraOutlined />
              ) : (
                <PhoneOutlined />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active call overlay */}
      {active && (
        <div className="call-overlay">
          {active.kind === "video" ? (
            <>
              <video
                className="call-remote-video"
                ref={remoteVideoRef}
                autoPlay
                playsInline
              />
              <video
                className="call-local-video"
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
              />
            </>
          ) : (
            <div className="call-audio-info">
              <div className="ci-avatar">
                {active.peerAvatar ? (
                  <img
                    src={active.peerAvatar}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  getInitial(active.peerName)
                )}
              </div>
              <h2>{active.peerName || "Người dùng"}</h2>
              <p>
                {active.connected ? formatDuration(elapsed) : "Đang kết nối..."}
              </p>
              <audio ref={remoteAudioRef} autoPlay />
            </div>
          )}

          {active.kind === "video" && (
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 24,
                color: "#fff",
              }}
            >
              <h3 style={{ margin: 0 }}>{active.peerName || "Người dùng"}</h3>
              <p style={{ margin: 0, color: "#b3b3b3" }}>
                {active.connected ? formatDuration(elapsed) : "Đang kết nối..."}
              </p>
            </div>
          )}

          <div className="call-controls">
            <button
              className={micOn ? "" : "active"}
              onClick={toggleMic}
              title={micOn ? "Tắt mic" : "Bật mic"}
            >
              {micOn ? <AudioOutlined /> : <AudioMutedOutlined />}
            </button>
            {active.kind === "video" && (
              <button
                className={camOn ? "" : "active"}
                onClick={toggleCam}
                title={camOn ? "Tắt camera" : "Bật camera"}
              >
                <VideoCameraAddOutlined />
              </button>
            )}
            <button className="end-call" onClick={endActive} title="Kết thúc">
              <PhoneOutlined rotate={135} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CallManager;
