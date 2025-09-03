import { useEffect, useState } from "react";
import { Mic, Search } from "lucide-react";
import { co2Zone } from "../utils/co2";

/** Figma 스타일 구름 */
function CloudBadge({ color }) {
  return (
    <div className="relative w-24 h-14">
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
      <div className="absolute -left-4 top-2 w-8 h-8 rounded-full" style={{ background: color }} />
      <div className="absolute right-[-6px] top-1 w-9 h-9 rounded-full" style={{ background: color }} />
    </div>
  );
}

export default function Home() {
  const [now, setNow] = useState(new Date());
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const co2 = 417.9;                // <-- 나중에 센서/API 값으로 대체
  const zone = co2Zone(co2);        // 색/라벨 결정

  return (
    <div className="h-full relative flex items-center justify-center bg-bg text-text">
      <div className="w-full max-w-[980px] px-6 flex flex-col items-center text-center">
        <div className="font-extrabold leading-none tracking-widest" style={{ fontSize: "clamp(48px, 7vw, 80px)" }}>
          {hh} : {mm} : {ss}
        </div>

        <div className="mt-8 grid grid-cols-[auto_auto] items-center gap-x-6">
          <div className="text-left">
            <div className="text-[30px] font-extrabold leading-tight">현재 CO2 농도는</div>
            <div className="text-[30px] font-extrabold leading-tight">{co2.toFixed(1)} ppm</div>
          </div>
          <CloudBadge color={zone.color} />
        </div>
      </div>

      {/* 좌하단 마이크 */}
      <button
        onClick={() => setListening(v => !v)}
        className={`absolute bottom-10 left-10 h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition z-20 ${
          listening ? "bg-good/30" : "bg-panel"
        }`}
        aria-label="Microphone"
      >
        <Mic className={listening ? "text-good" : "text-text"} size={28} />
      </button>

      {/* 음성 인식 바 */}
      {listening && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-panel border border-white/10 text-text shadow-lg flex items-center gap-3 z-20">
          <Mic className="opacity-90" size={18} />
          <span className="opacity-90">궁금한 내용을 질문해주세요!</span>
          <Search size={18} className="opacity-80" />
        </div>
      )}
    </div>
  );
}
