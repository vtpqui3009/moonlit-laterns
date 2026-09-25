# Moonlit Lanterns — Đêm hội trăng rằm

Một "thước phim ngắn" 3D về đêm Tết Trung Thu Việt Nam, dựng bằng
Vite + React + TypeScript + React Three Fiber.

> Trạng thái: **Bước 1/5** — scene demo đèn ông sao, ánh sáng hoàng hôn, bóng đổ mềm.

## Chạy

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc + vite build → dist/
```

## Kiến trúc

| Thư mục | Nội dung |
|---|---|
| `src/components/` | `Experience` (Canvas, renderer, camera), `Loader` (useProgress), `ModelSlot` (.glb hoặc procedural) |
| `src/lanterns/` | Đèn ông sao procedural: hình học, vật liệu PBR |
| `src/world/` | Sân gạch, tường vôi, chõng tre, cần tre, bầu trời, HDRI |
| `src/scenes/` | Các cảnh quay (bước 1: `DemoScene`) |
| `src/store/` | Zustand: stage, progress, quality, reduced-motion |
| `src/lib/` | Noise (sway/flicker), texture procedural bằng canvas |
| `plugins/modelManifest.ts` | Plugin Vite quét `public/models/` → `virtual:model-manifest` |

### Đèn ông sao procedural
- Thân: hình **chóp sao hai mặt** (bipyramid) đúng cấu tạo thật — hai ngôi sao tre
  nối ở đỉnh cánh, đẩy xa ở tâm, giấy kính căng từ viền vào tâm → các mặt gấp phẳng bắt sáng.
- Giấy kính: `MeshPhysicalMaterial` với `transmission` + `emissive` (emissiveMap toả tròn từ ngọn nến),
  normal map nếp nhăn cellophane, clearcoat.
- Khung tre: `TubeGeometry` theo 2 ngôi sao năm cánh + dây buộc ở đỉnh cánh, texture sợi tre.
- Tua rua giấy màu: ribbon theo `CatmullRomCurve3`.
- Nến: `PointLight` có đổ bóng, nhấp nháy bằng Perlin noise; giấy được loại khỏi shadow của
  point light (`customDistanceMaterial`) để ánh nến thoát ra ngoài, nhưng vẫn đổ bóng dưới nắng.
- Đung đưa theo gió (noise) quanh điểm treo; tắt khi `prefers-reduced-motion`.

### Bóng đổ
`renderer.shadowMap.enabled = true`. Yêu cầu ban đầu là `PCFSoftShadowMap`, nhưng từ
three.js r18x kiểu này **đã bị gỡ** (three tự đổi sang `PCFShadowMap` kèm cảnh báo).
`PCFShadowMap` hiện dùng lấy mẫu Vogel-disk và tôn trọng `shadow.radius`, nên đây chính là
đường dẫn "soft PCF" — dự án dùng nó trực tiếp với `shadow.radius` 5–6. Thêm `ContactShadows`
của drei dưới chõng.

### Thay model bằng .glb của bạn
Xem [`public/models/README.md`](public/models/README.md).

## Nguồn tài nguyên & license

| Tài nguyên | Nguồn | License |
|---|---|---|
| HDRI đêm `public/hdri/night_1k.exr` | "Dikhololo Night" — Poly Haven (qua gói npm `@pmndrs/assets`, preset `night` của drei) | CC0 |
| Đèn ông sao, sân gạch, tường vôi, chõng, cần tre, chum sành | Tự dựng procedural trong repo | MIT (theo repo) |
| Texture (giấy kính, tre, gạch, vôi, gỗ, khăn) | Sinh bằng canvas lúc chạy | — |
| Font Be Vietnam Pro, Playfair Display | Google Fonts | OFL |

Các vật thể đặc trưng Việt Nam (đèn ông sao, đèn cá chép, đèn kéo quân, đầu lân, bánh nướng/dẻo)
không có model CC0/CC-BY đáng tin cậy, và Sketchfab yêu cầu tài khoản để tải — nên chúng được
dựng procedural, có thể thay bằng .glb bất kỳ lúc nào.

## Lộ trình
1. ✅ Khởi tạo + scene demo đèn ông sao, ánh sáng, bóng đổ
2. 4 cảnh + camera theo scroll (GSAP ScrollTrigger)
3. Animation procedural: đoàn rước đèn, đèn kéo quân, đầu lân
4. Hậu kỳ: Bloom, DOF, Vignette, grading, film grain
5. Tối ưu hiệu năng, responsive, reduced-motion
