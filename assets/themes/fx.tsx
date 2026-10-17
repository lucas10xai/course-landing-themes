import { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Hiệu ứng dùng chung cho các giao diện landing riêng (Sales, Wake Up…): con trỏ phát sáng, nút hút theo chuột,
 * thẻ nghiêng 3D có lóa, chữ khổng lồ chạy theo tốc độ cuộn, pháo giấy. Màu truyền vào theo từng giao diện.
 * Tất cả tự tắt khi hệ điều hành bật "giảm chuyển động". Thêm FX_CSS vào <style> của giao diện.
 */

export const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Vòng sáng theo con trỏ (chỉ chuột thật), phóng to trên nút/link. */
export function Cursor({ ring, dot }: { ring: string; dot: string }) {
  const r = useRef<HTMLDivElement>(null);
  const d = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!finePointer() || reduced()) return;
    let tx = -100, ty = -100, x = -100, y = -100, raf = 0, big = false;
    const move = (e: globalThis.MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
      big = !!(e.target as HTMLElement)?.closest?.('a,button,summary,input,select,textarea,label');
      if (d.current) d.current.style.transform = `translate(${tx}px,${ty}px)`;
    };
    const loop = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      if (r.current) r.current.style.transform = `translate(${x}px,${y}px) scale(${big ? 1.9 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move); raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={r} className="fx-ring pointer-events-none fixed left-0 top-0 z-[90] hidden lg:block" style={{ borderColor: ring, boxShadow: `0 0 18px ${ring}` }} />
      <div ref={d} className="fx-cdot pointer-events-none fixed left-0 top-0 z-[90] hidden lg:block" style={{ background: dot }} />
    </>
  );
}

/** Nút "hút" theo con trỏ. */
export function Mag({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const move = (e: MouseEvent<HTMLSpanElement>) => {
    const el = ref.current; const r = el?.getBoundingClientRect(); if (!el || !r || reduced()) return;
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  };
  return <span ref={ref} onMouseMove={move} onMouseLeave={() => { if (ref.current) ref.current.style.transform = ''; }} className="inline-flex transition-transform duration-300 ease-out">{children}</span>;
}

/** Thẻ nghiêng 3D theo chuột + vệt lóa. */
export function Tilt({ children, className = '', max = 12 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current; const r = el?.getBoundingClientRect(); if (!el || !r || reduced()) return;
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * (max + 2)}deg) translateZ(0)`;
    el.style.setProperty('--x', `${px * 100}%`); el.style.setProperty('--y', `${py * 100}%`);
  };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={() => { if (ref.current) ref.current.style.transform = ''; }} className={`fx-tilt relative overflow-hidden transition-transform duration-200 ease-out ${className}`}>
      <span className="fx-glare pointer-events-none absolute inset-0 z-10" />
      {children}
    </div>
  );
}

/** Chữ khổng lồ chạy ngang 2 hàng ngược chiều; cuộn nhanh thì chạy nhanh và nghiêng theo. */
export function BigMarquee({ words, fills, stroke, sep, className = '' }: { words: string[]; fills: string[]; stroke: string; sep: ReactNode; className?: string }) {
  const r0 = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced()) return;
    let pos = 0, vel = 0, last = window.scrollY, raf = 0;
    const loop = () => {
      const y = window.scrollY; vel += (y - last) * 0.06; last = y; vel *= 0.9;
      pos += 0.6 + Math.abs(vel) * 1.4;
      const skew = Math.max(-12, Math.min(12, vel * 1.2));
      [r0.current, r1.current].forEach((el, i) => {
        if (!el) return;
        const half = el.scrollWidth / 2 || 1; const off = pos % half;
        el.style.transform = `translateX(${i ? off - half : -off}px) skewX(${i ? skew : -skew}deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const row = (i: number) => (
    <div ref={i ? r1 : r0} className="flex w-max whitespace-nowrap will-change-transform">
      {[0, 1].map((k) => <span key={k} className="flex items-center">{(i ? [...words].reverse() : words).map((w, j) => (
        <span key={j} className="flex items-center">
          <span className={`px-6 py-2 uppercase leading-[1.2] text-transparent ${(j + i) % 2 ? '' : 'bg-clip-text'} ${className}`}
            style={(j + i) % 2 ? { WebkitTextStroke: `1.5px ${stroke}` } : { backgroundImage: fills[j % fills.length] }}>{w}</span>
          <span className="mx-4">{sep}</span>
        </span>
      ))}</span>)}
    </div>
  );
  return <div aria-hidden className="overflow-hidden">{row(0)}{row(1)}</div>;
}

/** Pháo giấy khi đăng ký thành công. */
export function Confetti({ fire, colors }: { fire: boolean; colors: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; const ctx = cv?.getContext('2d'); if (!fire || !cv || !ctx || reduced()) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 6, r: Math.random() * 6 + 4, c: colors[(Math.random() * colors.length) | 0], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of ps) { p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); }
      if (t - t0 < 3500) raf = requestAnimationFrame(step); else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fire]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[95]" aria-hidden />;
}

/** Tiến độ cuộn qua một phần tử: 0 khi mép trên chạm `start`·cao màn hình, 1 khi mép dưới đi qua `end`·cao màn hình. */
export function useScrollProgress<T extends HTMLElement>(cb: (p: number) => void, start = 0.85, end = 0.35) {
  const ref = useRef<T>(null);
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0; const el = ref.current; if (!el) return;
      if (reduced()) { cb(1); return; }
      const r = el.getBoundingClientRect();
      cb(clamp01((innerHeight * start - r.top) / Math.max(1, r.height + innerHeight * (start - end))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

/** Số đếm chạy khi cuộn tới: "24.995.000đ" / "200.000+" → đếm từ 0, giữ phần chữ trước/sau. */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(/^(\D*)([\d.,]+)(.*)$/);
  const target = m ? Number(m[2].replace(/[.,]/g, '')) : 0;
  const [n, setN] = useState(reduced() || !m ? target : 0);
  useEffect(() => {
    if (!m || reduced()) return;
    let raf = 0, started = false;
    const check = () => {
      const r = ref.current?.getBoundingClientRect(); if (!r || started || r.top > innerHeight - 40 || r.bottom < 0) return;
      started = true; window.removeEventListener('scroll', check); const t0 = performance.now();
      const step = (t: number) => { const p = Math.min(1, (t - t0) / 1800); setN(Math.round(target * (1 - Math.pow(1 - p, 4)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    check(); const t = setTimeout(check, 400); window.addEventListener('scroll', check, { passive: true });
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener('scroll', check); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return <span>{value}</span>;
  return <span ref={ref}>{m[1]}{new Intl.NumberFormat('vi-VN').format(n)}{m[3]}</span>;
}

export const FX_CSS = `
.fx-ring{width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;border:1.5px solid;transition:scale .25s;mix-blend-mode:screen}
.fx-cdot{width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%}
.fx-tilt{transform-style:preserve-3d}
.fx-glare{background:radial-gradient(400px circle at var(--x,50%) var(--y,50%),rgba(255,255,255,.18),transparent 45%);opacity:0;transition:opacity .3s}
.fx-tilt:hover .fx-glare{opacity:1}
@media (prefers-reduced-motion:reduce){.fx-glare{display:none}}
`;
