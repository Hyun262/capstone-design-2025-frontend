// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Mic, Search, Cloud } from "lucide-react";
import { co2Zone } from "../utils/co2";

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

  const co2 = 417.9;                // TODO: 센서/API값으로 대체
  const zone = co2Zone(co2);        // { color, label ... }

  return (
    <div className="h-full relative flex items-center justify-center bg-bg text-text">
      <div className="w-full max-w-[980px] px-6 flex flex-col items-center text-center">

        {/* 시계 */}
        <div
          className="font-extrabold leading-none tracking-widest"
          style={{ fontSize: "clamp(48px, 7vw, 80px)" }}
        >
          {hh} : {mm} : {ss}
        </div>

        {/* CO2 정보 + 구름 아이콘 (사이드바와 동일 아이콘) */}
        <div className="mt-8 grid grid-cols-[auto_auto] items-center gap-x-6">
          <div className="text-left">
            <div className="text-[30px] font-extrabold leading-tight">현재 CO2 농도는</div>
            <div className="text-[30px] font-extrabold leading-tight">{co2.toFixed(1)} ppm</div>
          </div>

          {/* Cloud 아이콘 (stroke 색상을 zone.color로) */}
          <Cloud
            size={90}                      // ← 글씨 높이에 맞게 아이콘 키움
            strokeWidth={2.5}
            style={{ color: zone.color, fill: zone.color }}  // ← stroke + 내부 색상
          />
        </div>
      </div>

      {/* 좌하단 마이크 버튼 */}
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
