// src/pages/Co2.jsx
import React, { useRef, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from "recharts";
import { motion } from "framer-motion";
import { Cloud } from "lucide-react";   
import { co2Zone } from "../utils/co2";

/* =========================
   더미 데이터
========================= */
const lineData = [
  { t: "0:00", v: 400 }, { t: "0:15", v: 500 }, { t: "0:30", v: 700 },
  { t: "0:45", v: 800 }, { t: "1:00", v: 950 }, { t: "1:15", v: 750 }, { t: "1:30", v: 600 },
];

const dayData = [
  { name: "5.25", v: 800 }, { name: "5.26", v: 500 }, { name: "5.27", v: 1200 },
  { name: "5.28", v: 700 }, { name: "5.29", v: 900 }, { name: "5.30", v: 400 }, { name: "5.31", v: 600 },
];

const monthData = [
  { name: "1월", v: 900 }, { name: "2월", v: 500 }, { name: "3월", v: 1300 },
  { name: "4월", v: 800 }, { name: "5월", v: 700 },
];

/* =========================
   스와이프 훅 (모바일/데스크탑)
========================= */
function useSwipe({ onLeft, onRight, threshold = 40 }) {
  const startX = useRef(null);
  const isDown = useRef(false);

  const start = (x) => { startX.current = x; isDown.current = true; };
  const move = (x) => {
    if (!isDown.current || startX.current == null) return;
    const dx = x - startX.current;
    if (Math.abs(dx) > threshold) {
      isDown.current = false;
      dx < 0 ? onLeft?.() : onRight?.();
    }
  };
  const end = () => { startX.current = null; isDown.current = false; };

  return {
    bind: {
      onTouchStart: (e) => start(e.touches[0].clientX),
      onTouchMove: (e) => move(e.touches[0].clientX),
      onTouchEnd: end,
      onMouseDown: (e) => start(e.clientX),
      onMouseMove: (e) => isDown.current && move(e.clientX),
      onMouseUp: end,
      onMouseLeave: end,
    },
  };
}

export default function Co2() {
  const [index, setIndex] = useState(0); // 0: 실시간, 1: 일간, 2: 월간
  const titles = ["실시간 이산화탄소 그래프", "일간 평균 이산화탄소 그래프", "월간 평균 이산화탄소 그래프"];
  const slideCount = titles.length;

  const go = (i) => setIndex(((i % slideCount) + slideCount) % slideCount);
  const { bind } = useSwipe({ onLeft: () => go(index + 1), onRight: () => go(index - 1) });

  const current = 417.9;
  const zone = co2Zone(current);

  // 피그마 톤: 더 작은 축, 흐린 색상, 낮은 대비 보더
  const axisColor = "#6B7280"; // tailwind gray-500
  const tickStyle = { fontSize: 12 }; // text-xs(≈12px)

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* ===== 그래프 캐러셀 카드 ===== */}
      <section className="bg-panel rounded-2xl p-5 border border-white/5 shadow-lg select-none">
        <motion.h2
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-white font-semibold text-base mb-2"
        >
          {titles[index]}
        </motion.h2>

        <div className="overflow-hidden rounded-xl" {...bind}>
          <div
            className="flex w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {/* Slide 0: 실시간 라인차트 */}
            <div className="w-full shrink-0 h-64 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="t" stroke={axisColor} tick={tickStyle} />
                  <YAxis stroke={axisColor} tick={tickStyle} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#5AC8FA" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Slide 1: 일간 바차트 */}
            <div className="w-full shrink-0 h-64 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData}>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} tick={tickStyle} />
                  <YAxis stroke={axisColor} tick={tickStyle} />
                  <Tooltip />
                  <Bar dataKey="v" fill="#5AC8FA" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Slide 2: 월간 바차트 */}
            <div className="w-full shrink-0 h-64 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} tick={tickStyle} />
                  <YAxis stroke={axisColor} tick={tickStyle} />
                  <Tooltip />
                  <Bar dataKey="v" fill="#5AC8FA" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 도트 인디케이터(작고 둥글게) */}
        <div className="mt-2 flex items-center justify-center gap-2">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 w-2.5 rounded-full transition-transform ${
                i === index ? "bg-accent scale-125" : "bg-white/30"
              }`}
              aria-label={`slide-${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ===== 현재 농도 카드 ===== */}
      <section className="flex items-center justify-between bg-panel rounded-2xl p-6 border border-white/5 shadow-lg">
        <div>
          <div className="text-white text-base">현재 CO₂ 농도는</div>
          <div className="text-white text-4xl font-extrabold mt-1">{current} ppm</div>
          <span
            className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: `${zone.color}33`, color: zone.color }}
          >
            {zone.label}
          </span>
        </div>

        {/* 구름 아이콘 */}
        <Cloud
          size={90}                            // ← 글자 크기에 맞게 큼직하게
          strokeWidth={2.5}
          style={{ color: zone.color, fill: zone.color }}   // ← 내부 채움 + 스트로크 색
          aria-label="CO2 상태"
        />
      </section>
    </div>
  );
}
