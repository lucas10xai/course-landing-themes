import { useEffect } from 'react';

/**
 * Hiện dần phần tử khi cuộn tới: thêm lớp `cls` cho phần tử có thuộc tính `attr` khi nó vào màn hình.
 * Dùng sự kiện cuộn (gộp theo khung hình) thay cho IntersectionObserver để không bị trễ khi trình duyệt
 * hạn chế callback; tôn trọng "giảm chuyển động" của hệ điều hành (hiện ngay tất cả).
 */
export function useScrollReveal(attr: string, cls: string) {
  useEffect(() => {
    const pending = () => [...document.querySelectorAll<HTMLElement>(`[${attr}]:not(.${cls})`)];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { pending().forEach((e) => e.classList.add(cls)); return; }
    let raf = 0;
    const check = () => {
      raf = 0;
      const h = window.innerHeight;
      pending().forEach((e) => { const r = e.getBoundingClientRect(); if (r.top < h - 40 && r.bottom > 0) e.classList.add(cls); });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    const t = setTimeout(check, 300); // lần nữa sau khi ảnh / phông chữ tải xong
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    // Phần tử xuất hiện sau (đổi tab lịch trình, gửi form…)
    const mo = new MutationObserver(on);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); mo.disconnect(); clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
  }, [attr, cls]);
}
