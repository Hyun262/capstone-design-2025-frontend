import { useEffect, useRef, useState } from "react";
import { Send, Mic, Bot, User } from "lucide-react";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const DEFAULT_CAR_MODEL = "아반떼";
const API_BASE = "";

/** 짧은 문장은 알약(Pill) 형태로 렌더링 */
const isShort = (t) => t.length <= 12 && !t.includes("\n");

/** 일반 말풍선 */
function Bubble({ me, children }) {
  return (
    <div className={`w-full flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[76%] rounded-2xl leading-relaxed shadow-sm border border-white/10",
          "px-4 py-3 text-[18px]",
          me ? "bg-accent/20 text-text" : "bg-white/10 text-text",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

/** 프로필 + 말풍선. 짧은 문장은 알약(Pill) */
function Row({ me, text }) {
  const content = isShort(text) ? (
    <div
      className={[
        "px-5 py-2.5 rounded-full text-[18px] font-medium",
        me ? "bg-accent/30 text-text" : "bg-white/10 text-text",
      ].join(" ")}
    >
      {text}
    </div>
  ) : (
    <Bubble me={me}>
      {text.split("\n").map((line, i) => {
        const bullet = line.trim().startsWith("- ");
        return bullet ? (
          <div key={i} className="flex gap-2">
            <span className="mt-[9px] h-[6px] w-[6px] rounded-full bg-sub/80" />
            <span>{line.replace(/^-\\s*/, "").replace(/^-\s*/, "")}</span>
          </div>
        ) : (
          <p key={i} className="whitespace-pre-wrap">{line}</p>
        );
      })}
    </Bubble>
  );

  return (
    <div className={`w-full flex items-center gap-3 ${me ? "justify-end" : ""}`}>
      {!me && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-panel border border-white/10 flex items-center justify-center mt-[2px]">
          <Bot size={16} className="text-sub" />
        </div>
      )}
      {content}
      {me && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center mt-[2px]">
          <User size={16} className="text-text" />
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { me: false, text: "무엇을 도와드릴까요?\n예: ‘엔진 경고등이 켜졌어요’" },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false); // 텍스트 전송 중
  const endRef = useRef(null);

  // ====== 음성 자동 종료 설정 ======
  const SILENCE_THRESHOLD = 0.015; // 0~1
  const SILENCE_MS = 1200;         // 무음 지속 시 자동 정지
  const MAX_RECORD_MS = 15000;     // 최대 녹음 길이

  // 녹음/무음감지 레퍼런스
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(0);
  const lastNonSilentRef = useRef(0);
  const autoStopTimerRef = useRef(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, recording]);

  // ----- 공통: 백엔드 호출 -----
  async function callAsk(question, carModel) {
    // const res = await fetch(`${API_URL}/api/ask`, {
    const res = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, carModel }),
    });
    if (!res.ok) throw new Error(`ASK HTTP ${res.status}`);
    const data = await res.json();
    return data.answer ?? "(응답이 비어 있습니다)";
  }

  // ----- 텍스트 전송 (자리표시 “생각 중…” 교체) -----
  const send = async () => {
    const text = input.trim();
    if (!text || sending || recording) return;

    // 사용자 메시지 + 자리표시
    setMessages((prev) => [...prev, { me: true, text }, { me: false, text: "생각 중…" }]);
    setInput("");
    setSending(true);

    try {
      const answer = await callAsk(text, DEFAULT_CAR_MODEL);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { me: false, text: answer }; // 자리표시 교체
        return next;
      });
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          me: false,
          text:
            "서버 연결에 실패했습니다. 백엔드 실행과 VITE_API_URL 설정을 확인해주세요.",
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  // ===== 음성 입력 =====
  const pickMime = () => {
    if (window.MediaRecorder?.isTypeSupported("audio/ogg;codecs=opus"))
      return "audio/ogg;codecs=opus";
    if (window.MediaRecorder?.isTypeSupported("audio/webm;codecs=opus"))
      return "audio/webm;codecs=opus";
    return "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const prefer = pickMime();
      const mr = new MediaRecorder(stream, prefer ? { mimeType: prefer } : undefined);

      chunksRef.current = [];
      isStoppingRef.current = false;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // 정리
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
        if (audioCtxRef.current) {
          try { await audioCtxRef.current.close(); } catch {}
          audioCtxRef.current = null;
        }
        analyserRef.current = null;

        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });

        // 사용자 음성 전송 표시
        setMessages((prev) => [...prev, { me: true, text: "🎤 (음성 메시지 전송)" }, { me:false, text:"생각 중…" }]);

        const ext = type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
        const fd = new FormData();
        fd.append("file", blob, `voice.${ext}`);
        fd.append("file", blob, "input.webm"); // 추가한거

        try {
          // const res = await fetch(`${API_URL}/api/voice`, {
          const res = await fetch(`${API_BASE}/api/voice`, {   
            method: "POST", body: fd 
          });
          if (!res.ok) throw new Error(`VOICE HTTP ${res.status}`);
          const data = await res.json();

          // 자리표시 교체: 인식 결과 + 답변
          setMessages((prev) => {
            const next = [...prev];
            // 마지막(자리표시) 교체
            next[next.length - 1] = { me: false, text: `📝 인식: ${data.text ?? ""}` };
            // 답변 추가
            next.push({ me: false, text: data.answer || "(응답 없음)" });
            return next;
          });
        } catch (err) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { me: false, text: "음성 전송 실패: " + String(err) };
            return next;
          });
        }
      };

      // data 유실 방지용 timeslice
      mr.start(250);
      mediaRecRef.current = mr;
      setRecording(true);

      // 무음 감지
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      lastNonSilentRef.current = performance.now();

      const detect = () => {
        const a = analyserRef.current;
        if (!a) return;
        const n = a.fftSize;
        const data = new Uint8Array(n);
        a.getByteTimeDomainData(data);

        // RMS(0~1)
        let sum = 0;
        for (let i = 0; i < n; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / n);

        const now = performance.now();
        if (rms > SILENCE_THRESHOLD) lastNonSilentRef.current = now;
        if (now - lastNonSilentRef.current > SILENCE_MS) {
          stopRecording(true);
          return;
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);

      // 최대 녹음 길이 하드캡
      autoStopTimerRef.current = setTimeout(() => stopRecording(true), MAX_RECORD_MS);
    } catch (err) {
      setMessages((prev) => [...prev, { me: false, text: "마이크 권한을 허용해 주세요." }]);
      console.error(err);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecRef.current;
    if (!mr || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      try { mr.requestData && mr.requestData(); } catch {}
      if (mr.state !== "inactive") mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    } finally {
      mediaRecRef.current = null;
      setRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 상단 헤더 */}
      <header className="px-6 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-panel border border-white/10 flex items-center justify-center">
          <Bot size={16} className="text-sub" />
        </div>
        <div className="font-semibold">차량용 AI 어시스턴트</div>
        <div className="text-sub text-sm">채팅</div>
      </header>

      {/* 대화 영역 */}
      <section className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {messages.map((m, i) => (
          <Row key={i} me={m.me} text={m.text} />
        ))}
        <div ref={endRef} />
      </section>

      {/* 하단 입력 바 */}
      <footer className="px-6 pb-6">
        <div className="bg-panel border border-white/10 rounded-full h-14 px-3 flex items-center gap-1">
          {/* 마이크 버튼 */}
          <button
            type="button"
            onClick={recording ? () => stopRecording() : startRecording}
            aria-pressed={recording}
            title={recording ? "녹음 중지" : "음성 입력"}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
              recording ? "bg-good/30" : "hover:bg-white/10"
            }`}
          >
            <Mic size={18} className={recording ? "text-good" : "text-sub"} />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              recording ? "녹음 중..." : sending ? "응답 대기 중..." : "메시지를 입력하세요"
            }
            disabled={sending || recording}
            className="flex-1 bg-transparent outline-none text-[16px] text-text placeholder:text-sub/70 px-2"
          />

          <button
            onClick={send}
            disabled={sending || recording}
            className={`h-10 w-10 rounded-full ${
              sending ? "bg-accent/50" : "bg-accent hover:opacity-90"
            } text-black flex items-center justify-center font-semibold transition`}
            title="전송"
            aria-label="전송"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 text-sub text-xs">
          엔터키로 전송 • 줄바꿈은 <span className="text-text">Shift+Enter</span>
        </div>
      </footer>
    </div>
  );
}
