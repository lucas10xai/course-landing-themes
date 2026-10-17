# course-landing-themes

> Skill cho AI agent (Claude Code, Antigravity, Hermes, Codex…) **làm landing page bán hàng riêng cho từng khóa học / cuốn sách**: mỗi trang một giao diện, hiệu ứng "wow", logo và icon tab thật, nội dung trung thực; kiểm thử rồi đưa lên production an toàn.

Đúc kết từ việc làm **14 landing page** tại [mkt.dayso.vn](https://mkt.dayso.vn) cho ASK Training (Wake Up, Sales Mastery, Chuyên Gia Đào Tạo, Trường Kinh Doanh Đột Phá, Trại Lãnh Đạo Cấp Cao, Triệu Phú Sân Khấu, Phượng Hoàng Tái Sinh, Combo Bước Nhảy Vọt, DIGIBIZ, VIKIGAI, Kinh Doanh Hệ Thống A-Z, Nhà Đầu Tư Thông Thái, sách Cẩm Nang Khởi Nghiệp, sách Thức Giấc Ngủ Đông).

Phương pháp dùng được cho mọi landing React + Tailwind. Phần riêng của hệ thống ASK ERP nằm gọn trong `references/ask-erp.md`.

---

## Mục lục

1. [Skill này làm được gì](#1-skill-này-làm-được-gì)
2. [Cài đặt](#2-cài-đặt)
3. [Yêu cầu trên máy](#3-yêu-cầu-trên-máy)
4. [Cách dùng](#4-cách-dùng)
5. [Quy trình agent sẽ làm theo](#5-quy-trình-agent-sẽ-làm-theo)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Script đi kèm](#7-script-đi-kèm)
8. [Quy tắc không được vi phạm](#8-quy-tắc-không-được-vi-phạm)
9. [Áp dụng cho dự án khác ASK](#9-áp-dụng-cho-dự-án-khác-ask)
10. [Bảo trì & cập nhật skill](#10-bảo-trì--cập-nhật-skill)

---

## 1. Skill này làm được gì

| Việc | Kết quả |
|---|---|
| Thiết kế landing riêng cho một khóa | Ý tưởng giao diện rút từ logo + lời hứa của khóa (vd "sân khấu lửa", "sàn giao dịch", "tuyết tan sang xuân"), một hiệu ứng chủ đạo không trùng trang khác + 3–5 hiệu ứng phụ |
| Làm "đủ wow" một trang đang nhạt | Màn mở đầu, cảnh cuộn ghim màn hình, canvas động, chữ khổng lồ chạy theo tốc độ cuộn, con trỏ phát sáng, pháo giấy khi đăng ký… |
| Logo & icon tab đúng khóa | Tách logo nền trong suốt từ banner, tạo favicon 128px |
| Ảnh mờ / vỡ | Làm nét bằng Real-ESRGAN (logo ×4, ảnh chụp ×2–×4) |
| Thêm cảm nhận học viên | Khối testimonial theo phong cách từng trang, căn mặt giữa khung tròn |
| Đưa lên production | Đăng ký theme, deploy chỉ file của mình, áp nội dung vào trang, kiểm tra lại link thật |

---

## 2. Cài đặt

### Claude Code (khuyến nghị)

```bash
git clone https://github.com/lucas10xai/course-landing-themes.git ~/.claude/skills/course-landing-themes
```

Mở phiên Claude Code mới. Skill tự được dùng khi yêu cầu liên quan landing page khóa học (agent đọc mô tả skill để quyết định).

### Agent khác (Antigravity, Hermes, Codex…)

Chép cả thư mục vào thư mục skill mà agent đó dùng, hoặc dặn agent đọc `SKILL.md` ở đầu phiên. Skill chỉ là Markdown + script shell/Python, không phụ thuộc nền tảng.

### Từ file đóng gói

Giải nén `course-landing-themes.skill` (là file zip) vào thư mục skills. 

---

## 3. Yêu cầu trên máy

| Công cụ | Dùng cho | Bắt buộc? |
|---|---|---|
| Node 20+, pnpm | Build / chạy dev ASK ERP | Có (khi làm trên ASK ERP) |
| ImageMagick 7 (`magick`) | Tách logo, favicon, xử lý ảnh | Có |
| Python 3 | `haravan_product.py` | Có |
| [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (repo + venv, mặc định `~/Developer/Real-ESRGAN`) | Làm nét ảnh | Chỉ khi cần làm nét |
| Docker | Database dev của ASK ERP | Khi chạy thử trên dev |
| SSH vào VPS production (`HOST`, `APP_DIR`) | Deploy + áp nội dung production | Chỉ khi deploy |

Đổi vị trí Real-ESRGAN: `export REALESRGAN=/đường/dẫn/Real-ESRGAN`.

---

## 4. Cách dùng

Chỉ cần nói tự nhiên với agent, ví dụ:

- *"Làm landing cho khóa Chuyên Gia Đào Tạo, phong cách riêng, thật wow"*
- *"Trang Wake Up chưa đủ wow, làm lại hiệu ứng"*
- *"Landing khóa nào dùng đúng logo khóa đó, đổi luôn icon trên tab"*
- *"Ảnh và logo trên các landing bị mờ, làm nét lại"*
- *"Thêm phần cảm nhận học viên (ảnh đính kèm) vào trang Triệu Phú Sân Khấu"*

Agent sẽ hỏi lại khi thiếu thông tin quyết định (vd nguồn nội dung mâu thuẫn), và cuối việc báo: link, ý tưởng + hiệu ứng, chỗ số liệu lệch giữa các nguồn, chỗ ghi "minh họa", phần chưa kiểm chứng.

---

## 5. Quy trình agent sẽ làm theo

```
1. Thu thập sự thật ─ bản nội dung đã duyệt · trang bán hàng chính thức · giá/lịch từ ERP · logo/ảnh thật
2. Ghi lại mọi chỗ lệch (số ngày, giá gốc, danh sách khóa…) → báo chủ dự án, không tự chọn
3. Chọn ý tưởng ─ 1 ẩn dụ + bảng màu + font + hiệu ứng chủ đạo (đối chiếu danh mục để không trùng)
4. Chuẩn bị tài nguyên ─ tách logo · favicon · làm nét ảnh
5. Viết component giao diện ─ chép khung assets/themes/NetworkLanding.tsx, dùng chung fx.tsx + reveal.ts
6. Đăng ký theme + viết file nội dung JSON
7. Test trên dev ─ desktop 1200–1280px & mobile 375px · không cuộn ngang · không lỗi console · dấu tiếng Việt không bị cắt
8. Deploy cẩn thận ─ so checksum file trên server trước · chỉ chép file của mình · build · áp nội dung · kiểm tra link thật
9. Báo cáo
```

Chi tiết từng bước nằm trong `SKILL.md` và các file `references/`.

---

## 6. Cấu trúc thư mục

```
course-landing-themes/
├── SKILL.md                      # Hướng dẫn chính cho agent (đọc đầu tiên)
├── README.md                     # File này — dành cho người
├── references/
│   ├── design-playbook.md        # Chọn ý tưởng, danh mục 14 theme, kho hiệu ứng, cấu trúc trang, checklist "đủ wow"
│   ├── assets-pipeline.md        # Nguồn nội dung, tách logo (3 kiểu), favicon, Real-ESRGAN, căn mặt chân dung
│   └── ask-erp.md                # Bản đồ file ASK ERP, đăng ký theme, JSON nội dung, dev, deploy, áp nội dung, sự cố
├── scripts/
│   ├── haravan_product.py        # Lấy dữ liệu sản phẩm ask.com.vn (Haravan)
│   ├── extract_logo.sh           # Tách logo nền trong suốt từ banner
│   ├── favicon.sh                # Icon tab 128×128 bo góc
│   ├── upscale.sh                # Làm nét ảnh bằng Real-ESRGAN
│   └── apply_content.sh          # Gộp nội dung JSON vào landing production (có chế độ chỉ đọc)
└── assets/
    ├── example-content.json      # Một file nội dung landing hoàn chỉnh
    └── themes/
        ├── fx.tsx                # Hiệu ứng dùng chung: Cursor, Mag, Tilt, BigMarquee, Confetti, useScrollProgress, CountUp
        ├── reveal.ts             # Hiện dần khi cuộn
        └── NetworkLanding.tsx    # Một giao diện hoàn chỉnh để chép khung
```

---

## 7. Script đi kèm

Tất cả nằm trong `scripts/`, chạy được độc lập.

### `haravan_product.py` — lấy nội dung sản phẩm chính thức

```bash
python3 scripts/haravan_product.py khoa-hoc-nha-dau-tu-thong-thai
python3 scripts/haravan_product.py thuc-giac-ngu-dong --json
```
In tên, giá (đã chia 100 — Haravan lưu giá ×100), ảnh, mô tả dạng văn bản. Báo lỗi gợi ý thử handle khác nếu 404.

### `extract_logo.sh` — tách logo khỏi banner

```bash
# Chữ sáng / vàng kim trên nền tối hoặc rối
scripts/extract_logo.sh luma    banner.jpg 640x265+40+250 logo.png
# Chữ có viền trắng trên nền màu
scripts/extract_logo.sh outline banner.jpg 640x200+50+160 raw.png
# Dọn vệt nền lọt vào (dùng sau outline)
scripts/extract_logo.sh cleanup raw.png logo.png 5
```
Tham số thứ 3 là vùng cắt `RộngxCao+X+Y` trên banner. Luôn kiểm tra trên cả nền tối và nền sáng.

### `favicon.sh` — icon tab

```bash
scripts/favicon.sh logo.png "#fff6dc" icon.png
```

### `upscale.sh` — làm nét

```bash
scripts/upscale.sh logo  ./logos_in  ./logos_out    # anime_6B ×4, làm sắc mép, tối đa 1400px
scripts/upscale.sh photo ./photos_in ./photos_out   # general-x4v3, tối đa 2200px, JPEG q84
```
Không dùng `--face_enhance` cho ảnh người thật (làm đổi khuôn mặt).

### `apply_content.sh` — áp nội dung lên trang production

```bash
scripts/apply_content.sh nha-dau-tu-thong-thai --show                        # chỉ đọc
scripts/apply_content.sh nha-dau-tu-thong-thai docs/landing/nha-dau-tu-thong-thai.json   # sao lưu DB rồi ghi
```
Bắt buộc đặt biến: `export HOST=root@<vps> APP_DIR=/đường/dẫn/ask-erp`. Ghi dữ liệu production — chỉ chạy cho trang được yêu cầu.

---

## 8. Quy tắc không được vi phạm

| Quy tắc | Vì sao |
|---|---|
| Không bịa cảm nhận, kết quả, cam kết, số liệu, tỷ suất lợi nhuận | Liên quan tiền và người thật; một câu bịa phá hỏng uy tín, có thể vi phạm quy định quảng cáo |
| Hình minh họa phải ghi "minh họa" / "ví dụ" / "giả định" | Khách không nhầm biểu đồ minh họa là số liệu thật |
| Dùng logo thật; không có thì dùng chữ, không tự vẽ logo | Nhận diện thương hiệu |
| Không chỉnh khuôn mặt người thật | Mô hình phục hồi mặt làm đổi nhân dạng |
| Giá / lịch lấy trực tiếp từ hệ thống, không ghi cứng | Tránh trang hiện giá sai |
| Tôn trọng "giảm chuyển động", mobile phải nhẹ | Trải nghiệm và tốc độ |
| **Không bao giờ chép database dev lên production; luôn sao lưu trước khi ghi dữ liệu production** | Hai sự cố thật đã xảy ra (xem `references/ask-erp.md` §7) |

---

## 9. Áp dụng cho dự án khác ASK

Phần dùng lại được nguyên: `SKILL.md`, `references/design-playbook.md`, `references/assets-pipeline.md`, `assets/themes/fx.tsx`, `reveal.ts`, các script xử lý ảnh.

Cần thay bằng tương đương của dự án mới:
- Cách chọn giao diện theo trang (ASK dùng trường `theme` + `extra` trong nội dung trang).
- Nguồn giá / lịch học (ASK lấy từ ERP qua `/api/public/lp/:slug`).
- Quy trình deploy và nơi lưu nội dung (ASK: bảng `MktLandingPage`, VPS `$APP_DIR`).

Ghi những điều này vào một file `references/<du-an>.md` mới theo mẫu `ask-erp.md`.

---

## 10. Bảo trì & cập nhật skill

- **Bản gốc:** repo ERP nội bộ (private), thư mục `docs/skills/course-landing-themes/`. Sửa ở đó trước, rồi đồng bộ bản công khai này (đã lược thông tin hạ tầng).
- **Các bản sao:** repo công khai này, thư mục skills trên từng máy (vd `~/.claude/skills/course-landing-themes`), kho skill dùng chung của nhóm.
- Khi thêm landing mới: bổ sung dòng vào bảng danh mục trong `references/design-playbook.md` và mọi lỗi bố cục mới gặp vào mục "Hard-won layout gotchas" của `SKILL.md`.
- `assets/themes/*.tsx` là bản chụp tại thời điểm đóng gói; mã mới nhất luôn ở `apps/web/src/pages/marketing/themes/` của ASK ERP.

---

Phát hành công khai bởi ASK Training / OPC AIOS. Thông tin hạ tầng (máy chủ, đường dẫn) đã được thay bằng biến môi trường.
