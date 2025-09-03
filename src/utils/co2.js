// CO2 구간/색상 유틸 (Figma 팔레트)
export const CO2_COLORS = {
  good:   "#5E9F5C", // 400~700
  warn:   "#C9B458", // 701~1000
  mid:    "#D9822B", // 1001~1500
  danger: "#C14949", // 1501+
};

export function co2Zone(ppm) {
  if (ppm <= 700)  return { key: "good",   label: "좋음",      color: CO2_COLORS.good };
  if (ppm <= 1000) return { key: "warn",   label: "보통",      color: CO2_COLORS.warn };
  if (ppm <= 1500) return { key: "mid",    label: "나쁨",      color: CO2_COLORS.mid };
  return              { key: "danger", label: "매우 나쁨", color: CO2_COLORS.danger };
}
