import { useEffect, useRef, useState } from "react";
import { Send, Mic, Bot, User } from "lucide-react";

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
            <span>{line.replace(/^-\\s*/, "")}</span>
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
    { me: false, text: "무엇을 도와드릴까요?\n예: ‘내일 비 오면 환기 알림 설정해줘’" },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { me: true, text },
      { me: false, text: "예시 응답입니다. (API 연동 전)" },
    ]);
    setInput("");
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
          <button
            onClick={() => setRecording((v) => !v)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
              recording ? "bg-good/30" : "hover:bg-white/10"
            }`}
            title="음성 입력"
            aria-label="음성 입력"
          >
            <Mic size={18} className={recording ? "text-good" : "text-sub"} />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="메시지를 입력하세요"
            className="flex-1 bg-transparent outline-none text-[16px] text-text placeholder:text-sub/70 px-2"
          />

          <button
            onClick={send}
            className="h-10 w-10 rounded-full bg-accent text-black flex items-center justify-center font-semibold hover:opacity-90 transition"
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
