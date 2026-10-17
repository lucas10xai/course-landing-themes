import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronDown, Link2, Link2Off, MapPin, Network, Phone, Users } from 'lucide-react';
import { CSSProperties, FormEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { PageContent, PublicCourse } from '../../../lib/marketing';
import type { LeadForm } from '../LandingView';
import { BigMarquee, clamp01, Confetti, CountUp, Cursor, FX_CSS, Mag, reduced, Tilt, useScrollProgress } from './fx';
import { useScrollReveal } from './reveal';

/**
 * Giao diện riêng cho landing KINH DOANH HỆ THỐNG TỪ A-Z — "Hệ thống nhân bản":
 * xanh navy + vàng kim theo logo của khóa, chữ Montserrat.
 * Hiệu ứng riêng: màn mở đầu bảng lật chữ A → Z, mạng lưới nút sinh ra và nối dây quanh logo,
 * cây nhân bản 1 → 3 → 9 → 27 mọc theo cuộn (minh họa), chuỗi mắt xích đứt rồi nối lại theo cuộn,
 * lộ trình A → Z có xe chạy theo cuộn, bảng giờ khởi hành lật chữ cho học phí.
 * Nội dung lấy từ content.extra (sửa trong trình soạn, mục "Dữ liệu giao diện").
 */

type Item = { t: string; d?: string };
interface Extra {
  kicker?: string; tagline?: string; story?: string; audience?: Item[]; facts?: [string, string][];
  speaker?: { name?: string; title?: string; photo?: string; credentials?: string[] };
  stats?: [string, string][]; bigWords?: string[]; closing?: string; contact?: { hotline?: string; email?: string };
}

const C = { night: '#060d24', navy: '#0b1638', blue: '#1e3a8a', sky: '#60a5fa', gold: '#f5c04a', gold2: '#ffe08a', bronze: '#c8901e' };
const GOLD = `linear-gradient(100deg, ${C.gold2} 0%, ${C.gold} 50%, ${C.bronze} 100%)`;
const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)}đ`;
const dmy = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const okImg = (u?: string) => !!u && (/^https:\/\//.test(u) || u.startsWith('/'));
const LOGO = '/landing/az/logo.webp';
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Một ô lật chữ (split-flap): lật qua các ký tự rồi dừng ở ký tự đích. */
function Flap({ to, delay = 0, run }: { to: string; delay?: number; run: boolean }) {
  const [ch, setCh] = useState(run && !reduced() ? 'A' : to);
  useEffect(() => {
    if (!run || reduced()) { setCh(to); return; }
    let i = 0, t = 0; const target = ABC.indexOf(to.toUpperCase());
    const steps = target >= 0 ? target : 8;
    const tick = () => { i++; if (i >= steps) { setCh(to); return; } setCh(ABC[i % 26]); t = window.setTimeout(tick, 45); };
    t = window.setTimeout(tick, delay);
    return () => clearTimeout(t);
  }, [run, to, delay]);
  return <span key={ch} className="nw-flap inline-flex h-[1.35em] w-[0.95em] items-center justify-center rounded-md bg-[#0b1638] text-[#ffe08a] shadow-[inset_0_-2px_0_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.08)]">{ch === ' ' ? ' ' : ch}</span>;
}

/** Màn mở đầu: bảng lật chữ A → Z rồi trượt lên (mỗi phiên 1 lần). */
function FlapIntro({ logo }: { logo: string }) {
  const [phase, setPhase] = useState<'run' | 'up' | 'gone'>(() => {
    try { if (reduced() || sessionStorage.getItem('nw-intro')) return 'gone'; } catch { /* bỏ qua */ }
    return 'run';
  });
  useEffect(() => {
    if (phase === 'gone') return;
    try { sessionStorage.setItem('nw-intro', '1'); } catch { /* bỏ qua */ }
    const a = setTimeout(() => setPhase('up'), 2000);
    const b = setTimeout(() => setPhase('gone'), 2700);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === 'gone') return null;
  return (
    <div className={`nw-intro fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060d24] ${phase === 'up' ? 'nw-intro-up' : ''}`} aria-hidden>
      <div className="flex items-center gap-3 font-display text-6xl font-black sm:text-8xl"><Flap to="A" run /><span className="text-[#f5c04a]">→</span><Flap to="Z" run delay={150} /></div>
      <img src={logo} alt="" className="nw-intro-logo mt-10 w-[min(70vw,380px)]" />
    </div>
  );
}

/** Mạng lưới nút sinh ra quanh tâm và nối dây với nhau (canvas). */
function Web() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; const ctx = cv?.getContext('2d'); if (!cv || !ctx || reduced()) return;
    let w = 0, h = 0, raf = 0; const dpr = Math.min(2, devicePixelRatio || 1);
    type N = { x: number; y: number; vx: number; vy: number; born: number; p: number };
    let ns: N[] = [];
    const size = () => { w = cv.offsetWidth; h = cv.offsetHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ns = []; };
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const max = w < 640 ? 45 : 90;
      if (ns.length < max && Math.random() < 0.2) {
        const parent = ns.length ? ns[(Math.random() * ns.length) | 0] : { x: w / 2, y: h / 2 } as N;
        const a = Math.random() * 6.28, d = 40 + Math.random() * 70;
        ns.push({ x: parent.x, y: parent.y, vx: Math.cos(a) * d / 60, vy: Math.sin(a) * d / 60, born: t, p: ns.indexOf(parent) });
      }
      ctx.clearRect(0, 0, w, h);
      for (const n of ns) { if (t - n.born < 1000) { n.x += n.vx; n.y += n.vy; } n.x = Math.max(10, Math.min(w - 10, n.x)); n.y = Math.max(10, Math.min(h - 10, n.y)); }
      ctx.lineWidth = 1;
      ns.forEach((n) => { const p = ns[n.p]; if (!p) return; ctx.strokeStyle = 'rgba(245,192,74,.35)'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke(); });
      ns.forEach((n) => { const age = Math.min(1, (t - n.born) / 600); ctx.fillStyle = `rgba(255,224,138,${0.4 + age * 0.6})`; ctx.beginPath(); ctx.arc(n.x, n.y, 2.5 + age * 1.5, 0, 6.29); ctx.fill(); });
      if (ns.length >= max && Math.random() < 0.01) ns.splice(1, 1);
    };
    size(); raf = requestAnimationFrame(draw); addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-70" aria-hidden />;
}

/** Cây nhân bản: 1 → 3 → 9 → 27 (minh họa) mọc lên theo cuộn. */
function Tree() {
  const [p, setP] = useState(0);
  const ref = useScrollProgress<HTMLDivElement>(setP, 0.85, 0.3);
  const levels = 4;
  const nodes = useMemo(() => {
    const out: { x: number; y: number; lv: number; px: number; py: number }[] = [{ x: 400, y: 40, lv: 0, px: 400, py: 40 }];
    let prev = [out[0]];
    for (let lv = 1; lv < levels; lv++) {
      const cur: typeof out = []; const n = Math.pow(3, lv); const gap = 760 / n;
      for (let i = 0; i < n; i++) { const par = prev[Math.floor(i / 3)]; const node = { x: 20 + gap * (i + 0.5), y: 40 + lv * 110, lv, px: par.x, py: par.y }; cur.push(node); out.push(node); }
      prev = cur;
    }
    return out;
  }, []);
  const shown = clamp01(p / 0.8) * levels;
  const count = Math.pow(3, Math.min(levels - 1, Math.floor(shown)));
  return (
    <div ref={ref} className="relative mx-auto max-w-4xl">
      <svg viewBox="0 0 800 400" className="w-full" aria-hidden>
        {nodes.map((n, i) => n.lv > 0 && <line key={`l${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke="rgba(245,192,74,.5)" strokeWidth={2.2 - n.lv * 0.4} strokeDasharray="1000" strokeDashoffset={shown > n.lv - 0.5 ? 0 : 1000} style={{ transition: 'stroke-dashoffset .8s ease-out' }} />)}
        {nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={14 - n.lv * 3} fill={n.lv === 0 ? C.gold : C.sky} stroke="#060d24" strokeWidth="2" style={{ transform: `scale(${shown > n.lv - 0.2 ? 1 : 0})`, transformOrigin: `${n.x}px ${n.y}px`, transition: 'transform .5s cubic-bezier(.3,1.6,.5,1)', filter: n.lv === 0 ? 'drop-shadow(0 0 10px #f5c04a)' : 'none' }} />)}
      </svg>
      <p className="mt-4 text-center font-display text-2xl font-black text-white sm:text-4xl">Thế hệ {Math.min(levels, Math.floor(shown) + 1)}: <span className="bg-clip-text text-transparent" style={{ backgroundImage: GOLD }}>{count}</span> <span className="text-base font-semibold text-white/50 sm:text-xl">thành viên (minh họa)</span></p>
    </div>
  );
}

/** Chuỗi mắt xích: các vấn đề làm đứt chuỗi; cuộn qua thì từng mắt xích nối lại. */
function Chain({ items }: { items: string[] }) {
  const [p, setP] = useState(0);
  const ref = useScrollProgress<HTMLDivElement>(setP, 0.85, 0.3);
  return (
    <div ref={ref} className="mx-auto max-w-3xl space-y-3">
      {items.map((t, i) => {
        const ok = p > (i + 1) / (items.length + 1);
        return (
          <div key={t} className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-700 sm:p-5 ${ok ? 'border-[#f5c04a]/50 bg-[#f5c04a]/10' : 'border-red-400/30 bg-red-500/5'}`} style={{ transform: ok ? 'none' : `translateX(${i % 2 ? 18 : -18}px) rotate(${i % 2 ? 1 : -1}deg)` }}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-700 ${ok ? 'bg-[#f5c04a] text-[#060d24]' : 'bg-red-500/20 text-red-300'}`}>{ok ? <Link2 className="h-5 w-5" /> : <Link2Off className="h-5 w-5" />}</span>
            <span className={`text-[15px] font-semibold transition-colors duration-700 sm:text-[16px] ${ok ? 'text-white' : 'text-white/70'}`}>{t}</span>
            <span className={`ml-auto shrink-0 text-xs font-bold uppercase tracking-wider transition-opacity duration-700 ${ok ? 'text-[#ffe08a] opacity-100' : 'opacity-0'}`}>Nối lại</span>
          </div>
        );
      })}
    </div>
  );
}

/** Lộ trình A → Z: xe chạy theo cuộn qua từng cột mốc. */
function Road({ stops }: { stops: string[] }) {
  const [p, setP] = useState(0);
  const ref = useScrollProgress<HTMLDivElement>(setP, 0.8, 0.4);
  return (
    <div ref={ref} className="relative mx-auto max-w-5xl py-10">
      <div className="absolute left-[4%] right-[4%] top-1/2 h-3 -translate-y-1/2 rounded-full bg-[#0b1638]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 18px, rgba(255,224,138,.5) 18px 34px)', backgroundSize: '100% 2px', backgroundRepeat: 'repeat-x', backgroundPosition: 'center' }} />
      <div className="absolute left-[4%] top-1/2 h-3 -translate-y-1/2 rounded-full" style={{ width: `${p * 92}%`, background: GOLD, boxShadow: '0 0 20px rgba(245,192,74,.6)' }} />
      <div className="relative flex items-center justify-between px-[1%]">
        {['A', ...stops.map((_, i) => String(i + 1)), 'Z'].map((s, i, arr) => {
          const on = p >= i / (arr.length - 1) - 0.01;
          return <span key={i} className={`flex h-14 w-14 items-center justify-center rounded-full border-4 font-display text-xl font-black transition-all duration-500 ${on ? 'scale-110 border-[#ffe08a] bg-[#f5c04a] text-[#060d24]' : 'border-[#1e3a8a] bg-[#060d24] text-white/40'}`}>{s}</span>;
        })}
      </div>
      <div className="mt-6 grid gap-3 text-center text-[13px] text-white/70 sm:text-[14px]" style={{ gridTemplateColumns: `repeat(${stops.length + 2}, minmax(0, 1fr))` }}>
        <span>Bắt đầu</span>{stops.map((s) => <span key={s}>{s}</span>)}<span>Thành công</span>
      </div>
    </div>
  );
}

/** Tiêu đề Montserrat: từng chữ lật vào như bảng tin; phần b vàng kim. */
function NTitle({ a, b, className = '' }: { a: string; b?: string; className?: string }) {
  let k = 0;
  const words = (s: string, hot?: boolean) => s.split(' ').filter(Boolean).map((w) => {
    const d = k++ * 55;
    return <Fragment key={k}><span className="nw-wi" style={{ transitionDelay: `${d}ms`, ...(hot ? { backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {}) } as CSSProperties}>{w}</span>{' '}</Fragment>;
  });
  return <h2 data-nw className={`nw-split font-display text-[30px] font-black leading-[1.25] tracking-tight text-white sm:text-[46px] ${className}`}>{words(a)}{b && words(b, true)}</h2>;
}

export function NetworkLanding({ content: c, course, org, onSubmit, submitting, done, error, preview }: {
  content: PageContent; course?: PublicCourse | null; org?: { name?: string; phone?: string | null; email?: string | null } | null;
  onSubmit?: (f: LeadForm, honeypot: string) => void; submitting?: boolean; done?: boolean; error?: string | null; preview?: boolean;
}) {
  const x = (c.extra ?? {}) as Extra;
  const logo = c.logoUrl && c.logoUrl.endsWith('.webp') ? c.logoUrl : LOGO;
  const [f, setF] = useState<LeadForm>({ fullName: '', phone: '', email: '', city: '', notes: '', consent: true, classCode: '' });
  const [hp, setHp] = useState('');
  const [progress, setProgress] = useState(0);
  const [board, setBoard] = useState(false);
  const boardRef = useScrollProgress<HTMLDivElement>((v) => { if (v > 0.05) setBoard(true); }, 0.9, 0.5);
  useScrollReveal('data-nw', 'nw-in');
  useEffect(() => {
    if (preview) return;
    const on = () => { const h = document.documentElement; setProgress(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)); };
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, [preview]);

  const classes = course?.classes ?? [];
  const next = classes.find((k) => k.seatsLeft > 0) ?? classes[0];
  const price = course?.price ?? 0;
  const listPrice = course?.listPrice && course.listPrice > price ? course.listPrice : null;
  const save = listPrice ? Math.round((1 - price / listPrice) * 100) : 0;
  const lms = (course?.sections ?? []).filter((s) => s.lessons.length);
  const mods = lms.length ? lms : (c.curriculum ?? []);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pickClass = (code: string) => { setF((v) => ({ ...v, classCode: code })); go('dang-ky'); };
  function submit(e: FormEvent) { e.preventDefault(); if (!preview) onSubmit?.(f, hp); }
  const hotline = x.contact?.hotline ?? org?.phone ?? undefined;
  const cta = c.ctaLabel || 'Đăng ký tư vấn';
  const goldBtn = 'nw-btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-[15px] font-black uppercase tracking-wide text-[#060d24] shadow-[0_16px_44px_-10px_rgba(245,192,74,.7)] transition hover:-translate-y-0.5';
  const input = 'w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-white/40 focus:border-[#f5c04a] focus:bg-white/[0.09] focus:ring-4 focus:ring-[#f5c04a]/15';
  const priceText = price > 0 ? new Intl.NumberFormat('vi-VN').format(price) : 'LIÊN HỆ';

  return (
    <div className="nw min-h-screen bg-[#060d24] font-sans text-white antialiased" style={{ overflowX: 'clip' }}>
      <style>{CSS + FX_CSS}</style>
      {!preview && <FlapIntro logo={logo} />}
      {!preview && <Cursor ring="rgba(245,192,74,.85)" dot={C.sky} />}
      <Confetti fire={!!done && !preview} colors={[C.gold, C.gold2, C.sky, '#ffffff', C.blue]} />
      {!preview && <div className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left" style={{ background: GOLD, transform: `scaleX(${progress})` }} />}

      {/* ── Thanh trên ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060d24]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-5">
          <span className="flex items-center gap-2.5"><img src={logo} alt="Kinh Doanh Hệ Thống Từ A-Z" className="h-10 w-auto" /><img src="/logo-mark.png" alt="ASK" className="hidden h-5 w-auto border-l border-white/15 pl-2.5 opacity-80 sm:block" /></span>
          <nav className="ml-auto hidden items-center gap-6 whitespace-nowrap text-sm text-white/65 lg:flex">
            {[['nhan-ban', 'Nhân bản'], ['lo-trinh', 'Lộ trình'], ['hoc-phi', 'Học phí'], ['dien-gia', 'Diễn giả'], ['hoi-dap', 'Hỏi đáp']].map(([id, l]) => <button key={id} type="button" onClick={() => go(id)} className="transition hover:text-white">{l}</button>)}
          </nav>
          {hotline && <a href={`tel:${hotline}`} className="hidden items-center gap-1.5 text-sm font-semibold text-[#ffe08a] lg:flex"><Phone className="h-4 w-4" />{hotline}</a>}
          <button type="button" onClick={() => go('dang-ky')} className="ml-auto whitespace-nowrap rounded-lg px-5 py-2 text-sm font-black uppercase text-[#060d24] lg:ml-0" style={{ background: GOLD }}>Đăng ký</button>
        </div>
      </header>

      {/* ── Hero: mạng lưới mọc quanh logo ── */}
      <section className="relative min-h-[88vh] overflow-hidden" style={{ background: `radial-gradient(70% 60% at 50% 45%, ${C.blue} 0%, ${C.navy} 45%, ${C.night} 80%)` }}>
        <Web />
        <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-14 text-center sm:pt-20">
          {x.kicker && <p data-nw className="nw-up mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-[#f5c04a]/40 bg-[#060d24]/60 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffe08a] sm:text-xs"><Network className="h-3.5 w-3.5" />{x.kicker}</p>}
          <img data-nw src={logo} alt="Kinh Doanh Hệ Thống Từ A-Z Thành Công" className="nw-zoom mx-auto w-[min(88vw,560px)] drop-shadow-[0_10px_40px_rgba(0,0,0,.6)]" />
          <h1 data-nw className="nw-up mx-auto mt-8 max-w-3xl font-display text-[24px] font-black leading-[1.35] sm:text-[32px]" style={{ transitionDelay: '150ms' }}>{c.headline}</h1>
          {(x.tagline || c.subheadline) && <p data-nw className="nw-up mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/70" style={{ transitionDelay: '250ms' }}>{x.tagline || c.subheadline}</p>}
          <div data-nw className="nw-up mt-8 flex flex-wrap items-center justify-center gap-4" style={{ transitionDelay: '350ms' }}>
            <Mag><button type="button" onClick={() => go('dang-ky')} className={goldBtn} style={{ background: GOLD }}>{cta}<ArrowRight className="h-5 w-5" /></button></Mag>
            {price > 0 && <span className="rounded-xl border border-white/15 bg-[#060d24]/60 px-5 py-3 text-sm backdrop-blur"><b className="text-lg">{vnd(price)}</b>{listPrice && <span className="ml-2 text-white/40 line-through">{vnd(listPrice)}</span>}</span>}
          </div>
          {next && <p data-nw className="nw-up mt-5 flex flex-wrap items-center justify-center gap-x-4 text-sm text-white/60"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-[#f5c04a]" />{dmy(next.startDate)}</span>{next.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#f5c04a]" />{next.city}</span>}</p>}
        </div>
      </section>

      {/* ── Mắt xích đứt → nối lại ── */}
      {!!c.painPoints?.length && (
        <section className="py-24" style={{ background: C.navy }}>
          <div className="mx-auto max-w-5xl px-5">
            <NTitle className="text-center" a="Hệ thống của bạn" b="đang đứt mắt xích nào?" />
            <div className="mt-12"><Chain items={c.painPoints} /></div>
          </div>
        </section>
      )}

      {/* ── Cây nhân bản ── */}
      <section id="nhan-ban" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <NTitle className="text-center" a="Một người giỏi chưa đủ." b="Hãy nhân bản đội ngũ." />
          {x.story && <p data-nw className="nw-up mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-white/70">{x.story}</p>}
          <div className="mt-12"><Tree /></div>
        </div>
      </section>

      {/* ── 4 công thức ── */}
      {!!c.bullets?.length && (
        <section className="py-20" style={{ background: C.navy }}>
          <div className="mx-auto max-w-6xl px-5">
            <NTitle className="text-center" a="Bạn sẽ mang về" b="bộ công thức vận hành" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {c.bullets.map((b, i) => (
                <div key={i} data-nw className="nw-up h-full" style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
                  <Tilt className="h-full rounded-3xl border border-[#f5c04a]/20 bg-[#060d24]/70 p-7">
                    <span className="font-display text-5xl font-black text-transparent" style={{ WebkitTextStroke: `1.5px ${C.gold}` }}>{String.fromCharCode(65 + i)}</span>
                    <p className="mt-3 text-[17px] font-bold leading-snug">{b}</p>
                  </Tilt>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Lộ trình A → Z ── */}
      {!!mods.length && (
        <section id="lo-trinh" className="scroll-mt-16 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <NTitle className="text-center" a="Lộ trình" b="từ A đến Z" />
            <Road stops={mods.map((m) => m.title.replace(/^Module \d+:\s*/, ''))} />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {mods.map((m, i) => (
                <div key={i} data-nw className="nw-up rounded-2xl border border-white/10 bg-white/[0.04] p-6" style={{ transitionDelay: `${i * 100}ms` }}>
                  <p className="font-display text-xs font-black uppercase tracking-[0.25em] text-[#f5c04a]">Chặng {i + 1}</p>
                  <p className="mt-2 font-display text-xl font-black">{m.title.replace(/^Module \d+:\s*/, '')}</p>
                  <ul className="mt-3 space-y-1.5">{m.lessons.map((l, j) => <li key={j} className="flex items-start gap-2 text-[14px] text-white/70"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f5c04a]" />{l}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Chữ khổng lồ ── */}
      <section className="overflow-hidden py-14" style={{ background: C.navy }}>
        <BigMarquee words={x.bigWords?.length ? x.bigWords : ['Tuyển dụng', 'Đào tạo', 'Nhân bản', 'Giữ lửa']} fills={[GOLD, 'linear-gradient(100deg,#fff,#bfdbfe)']} stroke="rgba(245,192,74,.45)"
          sep={<Network className="h-10 w-10 text-[#f5c04a] sm:h-14 sm:w-14" />} className="font-display text-[60px] font-black tracking-tight sm:text-[112px]" />
      </section>

      {/* ── Dành cho ai ── */}
      {!!x.audience?.length && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-5">
            <NTitle className="text-center" a="Dành cho" b="ai?" />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {x.audience.map((a, i) => (
                <div key={i} data-nw className="nw-up rounded-2xl border border-white/10 bg-white/[0.04] p-6" style={{ transitionDelay: `${i * 90}ms` }}>
                  <Users className="h-7 w-7 text-[#f5c04a]" /><p className="mt-3 font-display text-lg font-black">{a.t}</p>{a.d && <p className="mt-2 text-[15px] leading-relaxed text-white/65">{a.d}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Học phí: bảng giờ khởi hành ── */}
      <section id="hoc-phi" className="relative scroll-mt-16 overflow-hidden py-24" style={{ background: `radial-gradient(60% 50% at 30% 30%, ${C.blue}, ${C.night} 70%)` }}>
        <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-5 lg:grid-cols-[1.1fr_1fr]">
          <div ref={boardRef} data-nw className="nw-left rounded-3xl border-4 border-[#1e2a4f] bg-[#03081a] p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] sm:p-8">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-[#f5c04a]"><span>Khởi hành</span><span>Học phí (VNĐ)</span></div>
            <div className="mt-4 flex flex-wrap items-center gap-[3px] font-display text-[26px] font-black sm:text-[38px]">
              {[...priceText].map((ch, i) => /\d/.test(ch) ? <FlapDigit key={i} to={ch} run={board} delay={i * 90} /> : <span key={i} className="px-0.5 text-[#ffe08a]">{ch}</span>)}
            </div>
            {listPrice && <p className="mt-3 text-sm text-white/45">Giá gốc <span className="line-through">{vnd(listPrice)}</span>{save > 0 && <b className="ml-2 text-[#ffe08a]">Tiết kiệm {save}%</b>}</p>}
            <div className="mt-6 space-y-2 border-t border-dashed border-white/15 pt-5">{(x.facts ?? []).map(([a, b]) => <div key={a} className="flex items-start gap-2.5 text-[15px]"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c04a]" /><span><b>{a}</b> <span className="text-white/60">{b}</span></span></div>)}</div>
            {c.guarantee && <p className="mt-4 text-sm text-white/65">{c.guarantee}</p>}
            <button type="button" onClick={() => go('dang-ky')} className={`${goldBtn} mt-7 w-full`} style={{ background: GOLD }}>{cta}<ArrowRight className="h-5 w-5" /></button>
          </div>
          <div>
            <h3 data-nw className="nw-up font-display text-2xl font-black">Lịch học sắp tới</h3>
            {classes.length ? (
              <div className="mt-6 space-y-3">
                {classes.map((k, i) => (
                  <div key={k.code} data-nw className="nw-up flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5" style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className="w-14 shrink-0 overflow-hidden rounded-xl text-center text-[#060d24]" style={{ background: GOLD }}>
                      <p className="bg-black/10 py-0.5 text-[10px] font-black uppercase">Th {new Date(k.startDate).getMonth() + 1}</p>
                      <p className="py-1 font-display text-2xl font-black">{new Date(k.startDate).getDate()}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{dmy(k.startDate)}{dmy(k.endDate) !== dmy(k.startDate) ? ` – ${dmy(k.endDate)}` : ''}</p>
                      {(k.venue || k.city) && <p className="mt-0.5 flex items-start gap-1.5 text-sm text-white/60"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{[k.venue, k.city].filter(Boolean).join(', ')}</p>}
                    </div>
                    <button type="button" disabled={k.seatsLeft === 0} onClick={() => pickClass(k.code)} className="rounded-lg px-5 py-2.5 text-sm font-black text-[#060d24] transition hover:brightness-110 disabled:opacity-40" style={{ background: GOLD }}>Giữ chỗ</button>
                  </div>
                ))}
              </div>
            ) : <p data-nw className="nw-up mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-6 text-white/65">Lịch học mới sẽ được công bố sớm — để lại thông tin để được báo đầu tiên.</p>}
          </div>
        </div>
      </section>

      {/* ── Diễn giả ── */}
      {x.speaker && (
        <section id="dien-gia" className="scroll-mt-16 py-24" style={{ background: C.navy }}>
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div data-nw className="nw-left relative">
              <div className="absolute -inset-5 rounded-[36px] border-2 border-[#f5c04a]/30" />
              {okImg(x.speaker.photo) && <img src={x.speaker.photo} alt={x.speaker.name} loading="lazy" className="relative aspect-square w-full rounded-[28px] object-cover" />}
              {!!x.stats?.length && (
                <div className="relative -mt-10 mx-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#f5c04a]/30 bg-[#060d24]/95 p-4 backdrop-blur">
                  {x.stats.map(([n, l]) => <div key={l} className="text-center"><p className="font-display text-2xl font-black text-[#ffe08a]"><CountUp value={n} /></p><p className="text-[11px] text-white/55">{l}</p></div>)}
                </div>
              )}
            </div>
            <div data-nw className="nw-right">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#f5c04a]">Người dẫn dắt</p>
              <h2 className="mt-3 font-display text-[32px] font-black leading-[1.25] sm:text-[44px]">{x.speaker.name}</h2>
              {x.speaker.title && <p className="mt-2 text-lg text-white/60">{x.speaker.title}</p>}
              <ul className="mt-8 space-y-3.5">{(x.speaker.credentials ?? []).map((cr) => <li key={cr} className="flex items-start gap-3 text-[15px] leading-relaxed text-white/85"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c04a]" />{cr}</li>)}</ul>
            </div>
          </div>
        </section>
      )}

      {/* ── Đăng ký ── */}
      <section id="dang-ky" className="relative scroll-mt-16 overflow-hidden py-24" style={{ background: `radial-gradient(70% 70% at 80% 20%, rgba(245,192,74,.16), transparent 60%), ${C.night}` }}>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1.05fr]">
          <div data-nw className="nw-left">
            <img src={logo} alt="" className="w-[min(80vw,380px)]" />
            <p className="mt-8 font-display text-[28px] font-black leading-[1.3] sm:text-[38px]">{x.closing ?? 'Xây hệ thống tự vận hành — nhân bản thành công.'}</p>
            {hotline && <a href={`tel:${hotline}`} className="mt-8 inline-flex items-center gap-2 text-[#ffe08a] hover:text-white"><Phone className="h-5 w-5" />{hotline}</a>}
          </div>
          <div data-nw className="nw-right nw-border rounded-[28px] p-[2px]">
            <div className="rounded-[26px] bg-[#0b1638]/95 p-7 backdrop-blur sm:p-9">
              {done ? (
                <div className="py-12 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[#060d24]" style={{ background: GOLD }}><Check className="h-8 w-8" /></span><p className="mt-5 text-xl font-extrabold">{c.thankYou}</p></div>
              ) : (
                <form onSubmit={submit} className="space-y-3.5">
                  <h3 className="font-display text-2xl font-black">Đăng ký nhận tư vấn</h3>
                  <p className="pb-1 text-sm text-white/55">Chỉ mất 30 giây — tư vấn viên ASK sẽ liên hệ lại với bạn.</p>
                  <input className={input} required minLength={2} placeholder="Họ và tên *" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
                  <input className={input} required type="tel" inputMode="tel" placeholder="Số điện thoại *" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                  {c.showEmail && <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}
                  {classes.length > 0 && (
                    <select className={`${input} [&>option]:text-black`} value={f.classCode} onChange={(e) => setF({ ...f, classCode: e.target.value })}>
                      <option value="">Chọn lớp (không bắt buộc)</option>
                      {classes.map((k) => <option key={k.code} value={k.code} disabled={k.seatsLeft === 0}>{dmy(k.startDate)}{k.city ? ` · ${k.city}` : ''}</option>)}
                    </select>
                  )}
                  {c.showCity && <input className={input} placeholder="Tỉnh / thành phố" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />}
                  <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" value={hp} onChange={(e) => setHp(e.target.value)} />
                  {c.consentText && <label className="flex items-start gap-2.5 text-xs leading-relaxed text-white/50"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#f5c04a]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />{c.consentText}</label>}
                  {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                  <button type="submit" disabled={submitting} className={`${goldBtn} w-full disabled:opacity-60`} style={{ background: GOLD }}>{submitting ? 'Đang gửi…' : cta}{!submitting && <ArrowRight className="h-5 w-5" />}</button>
                  {preview && <p className="text-center text-xs text-white/40">Xem trước — form không gửi dữ liệu</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Hỏi đáp ── */}
      {!!c.faq?.length && (
        <section id="hoi-dap" className="scroll-mt-16 py-24" style={{ background: C.navy }}>
          <div className="mx-auto max-w-3xl px-5">
            <NTitle className="text-center" a="Câu hỏi" b="thường gặp" />
            <div className="mt-12 space-y-3">
              {c.faq.map((q, i) => (
                <details key={i} data-nw className="nw-up group rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 open:border-[#f5c04a]/40 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold">{q.q}<ChevronDown className="h-5 w-5 shrink-0 text-[#f5c04a] transition group-open:rotate-180" /></summary>
                  <p className="mt-3 leading-relaxed text-white/65">{q.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className={`border-t border-white/10 px-5 pt-10 text-center text-xs text-white/40 ${preview ? 'pb-10' : 'pb-28 lg:pb-10'}`}>
        © {new Date().getFullYear()} {org?.name ?? 'ASK Training'}{hotline ? ` · ${hotline}` : ''}{(x.contact?.email ?? org?.email) ? ` · ${x.contact?.email ?? org?.email}` : ''}
      </footer>

      {!preview && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#060d24]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1"><p className="truncate text-xs text-white/55">Kinh Doanh Hệ Thống A-Z</p>{price > 0 && <p className="font-display text-lg font-black">{vnd(price)}</p>}</div>
            <button type="button" onClick={() => go('dang-ky')} className="shrink-0 rounded-lg px-5 py-3 text-sm font-black uppercase text-[#060d24]" style={{ background: GOLD }}>Đăng ký</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ô số lật kiểu bảng giờ: chạy qua 0–9 rồi dừng ở chữ số đích. */
function FlapDigit({ to, run, delay }: { to: string; run: boolean; delay: number }) {
  const [d, setD] = useState(run ? to : '0');
  const started = useRef(false);
  useEffect(() => {
    if (!run || started.current) return;
    started.current = true;
    if (reduced()) { setD(to); return; }
    let i = 0, t = 0; const total = 10 + Number(to);
    const tick = () => { i++; setD(String(i % 10)); if (i < total) t = window.setTimeout(tick, 55); else setD(to); };
    t = window.setTimeout(tick, delay);
    return () => clearTimeout(t);
  }, [run, to, delay]);
  return <span key={d} className="nw-flap inline-flex h-[1.4em] w-[0.85em] items-center justify-center rounded-md bg-[#0b1638] text-[#ffe08a] shadow-[inset_0_-2px_0_rgba(0,0,0,.5)]">{d}</span>;
}

const CSS = `
.nw .font-display{font-family:Montserrat,'Be Vietnam Pro',sans-serif}
.nw [data-nw]{transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.nw .nw-up{opacity:0;transform:translateY(26px)}
.nw .nw-left{opacity:0;transform:translateX(-40px)}
.nw .nw-right{opacity:0;transform:translateX(40px)}
.nw .nw-zoom{opacity:0;transform:scale(.9)}
.nw .nw-in{opacity:1!important;transform:none!important}
.nw-wi{display:inline-block;opacity:0;transform:perspective(400px) rotateX(-90deg);transform-origin:50% 0;transition:transform .6s cubic-bezier(.2,1.3,.4,1),opacity .3s}
.nw-split.nw-in .nw-wi{opacity:1;transform:none}
.nw-flap{animation:nw-flip .12s ease-out}
.nw-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);animation:nw-shine 3s ease-in-out infinite}
.nw-intro-up{transform:translateY(-100%);transition:transform .7s cubic-bezier(.7,0,.2,1)}
.nw-intro-logo{opacity:0;animation:nw-fade .6s 1.2s forwards}
.nw-border{background:conic-gradient(from var(--na,0deg),#ffe08a,#f5c04a,#60a5fa,#1e3a8a,#ffe08a);animation:nw-rot 5s linear infinite}
@property --na{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes nw-rot{to{--na:360deg}}
@keyframes nw-flip{from{transform:perspective(200px) rotateX(-70deg)}to{transform:none}}
@keyframes nw-fade{to{opacity:1}}
@keyframes nw-shine{0%,60%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@media (prefers-reduced-motion:reduce){.nw *{animation:none!important;transition:none!important}.nw-wi{opacity:1;transform:none}}
`;
