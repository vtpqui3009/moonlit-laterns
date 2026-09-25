# Moonlit Lanterns — Đêm hội trăng rằm

Một "thước phim ngắn" 3D về đêm Tết Trung Thu ở một làng quê Bắc Bộ, dựng bằng
Vite + React + TypeScript + React Three Fiber. Người xem cuộn trang để camera lặng lẽ
đi qua bốn cảnh của đêm rằm tháng Tám:

| # | Cảnh | Nội dung | Nguồn sáng chính |
|---|---|---|---|
| 1 | Hoàng hôn buông | Sân đình, cây đa, lũy tre; trăng cam nhô lên sau mái đình | DirectionalLight cam, góc thấp |
| 2 | Mâm cỗ đoàn viên | Bánh nướng, bánh dẻo, ngũ quả, ấm chén, nến; đèn ông sao & đèn kéo quân | PointLight nến nhấp nháy + đèn lồng |
| 3 | Rước đèn | Đoàn trẻ em cầm đèn ông sao / cá chép / lồng đi vòng sân đình, múa lân | Mỗi đèn là một PointLight di động |
| 4 | Trăng rằm | Toàn cảnh làng, trăng tròn toả sáng, phản chiếu trên ao làng, hoa đăng | DirectionalLight ánh trăng + bloom/halo |

## Chạy

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc + vite build → dist/
npm run build:single   # như trên nhưng nhúng HDRI vào bundle → dist-single/ (cho host chỉ phục vụ file web)
```

Tham số URL hữu ích khi kiểm thử:

- `?q=low` / `?q=high`: ép mức chất lượng.
- `?stats`: hiện bảng FPS (drei `Stats`).

## Deploy (Netlify)
- **Kéo thả (Netlify Drop):** `npm run build`, rồi kéo thư mục `dist/` (hoặc file zip của nó) vào
  https://app.netlify.com/drop.
- **Tự cập nhật từ Git:** Netlify → *Add new site → Import from Git* → chọn repo này.
  `netlify.toml` đã khai báo sẵn lệnh build (`npm run build`), thư mục `dist` và Node 22.

## Kiến trúc

| Thư mục | Nội dung |
|---|---|
| `src/cinema/` | "Đạo diễn": kịch bản 4 cảnh (`director.ts`), `ScrollDirector` (GSAP ScrollTrigger), `CameraRig`, `LightingRig`, `Captions` (drei `Html`), `PostFX` + `SplitToneEffect` |
| `src/world/` | Làng: địa hình, đình làng, nhà ba gian, cây đa, lũy tre, trời, trăng, ao (Reflector), lá rơi, hoa đăng |
| `src/lanterns/` | Đèn ông sao, đèn cá chép, đèn kéo quân, đèn lồng tròn, dây đèn, nến; vật liệu và texture |
| `src/feast/` | Mâm cỗ Trung Thu và texture bánh |
| `src/procession/` | Trẻ em (walk cycle), đoàn rước, múa lân |
| `src/components/` | Canvas (`Experience`), `Loader`, `ModelSlot`, `ChapterNav`, `SafeBoundary` |
| `src/store/` | Zustand: cảnh hiện tại, mức chất lượng, reduced motion |
| `plugins/modelManifest.ts` | Plugin Vite quét `public/models/` → `virtual:model-manifest` |

**Luồng dữ liệu:** thanh cuộn → ScrollTrigger (`scrub: 1.6`) → `cinema.p` (0 → 3, biến thường,
không gây re-render) → mỗi frame: camera bay theo spline Catmull-Rom (có đoạn dừng ở mỗi cảnh,
rung tay nhẹ, parallax theo chuột), ánh sáng/sương/trời nội suy từ hoàng hôn sang đêm, trăng
lên cao, DOF/bloom/grading đổi theo cảnh. Zustand chỉ giữ `stage` (số nguyên) cho UI.

### Model & vật liệu
- Mọi vật thể chính đi qua `<ModelSlot id>`: thả `public/models/<id>.glb` là thay model procedural,
  có sẵn đổ bóng và phát/crossfade animation clip (xem [`public/models/README.md`](public/models/README.md)).
- **Đèn ông sao:** thân hình chóp sao hai mặt đúng cấu tạo thật. Giấy kính dùng
  `MeshPhysicalMaterial` có `transmission` + `emissive` toả từ ngọn nến. Khung tre dựng bằng `TubeGeometry`, có tua rua.
- **Đèn cá chép:** thân tiện `LatheGeometry`, cellophane vẽ vảy, vòng tre, đuôi và vây quẫy.
- **Đèn kéo quân:** vách giấy lục giác, trống bên trong có hình cắt giấy kỵ binh quay theo hơi nóng của nến.
- **Đầu lân:** giấy bồi sơn màu (map + bump), gương, sừng, mắt phát sáng biết chớp, hàm mở đóng,
  bờm và râu instanced, thân lụa gợn sóng.
- **Bánh nướng:** color + roughness + normal map (mặt quét trứng bóng hơn phần vụn). Bánh dẻo dùng sheen.
- **Ao:** `Reflector` của three kèm shader nước tự viết, kéo ánh trăng/đèn thành vệt dọc, gợn sóng và fresnel.

### Ánh sáng & bóng
- `renderer.shadowMap.enabled = true`. Yêu cầu ban đầu là `PCFSoftShadowMap`, nhưng three.js r18x đã **gỡ** kiểu này
  (tự đổi sang `PCFShadowMap` kèm cảnh báo). `PCFShadowMap` hiện lấy mẫu Vogel-disk theo `shadow.radius`,
  nên dự án dùng nó trực tiếp với radius 5–7.
- Nắng và trăng: DirectionalLight có bóng, camera bóng đi theo điểm lấy nét của từng cảnh.
- Nến và đèn: PointLight. Giấy đèn được loại khỏi bóng point light (`customDistanceMaterial`) để ánh nến thoát ra ngoài.
- Point-light shadow chỉ cập nhật khi đèn nằm trong cảnh đang xem (`gateShadow`).
- `ContactShadows` dưới mâm cỗ. Ambient/hemisphere/fog ngả dần từ tím hoàng hôn sang xanh lam đêm.

### Animation
Đung đưa theo gió và nến nhấp nháy dùng Perlin noise. Đoàn rước đi trên `CatmullRomCurve3` khép kín: tốc độ mỗi bé hơi lệch nhưng không trôi dạt, bước chân khớp quãng đường đi, và luôn có hai nhóm để cảnh 3 không bao giờ trống.
Lân nhún theo nhịp, ngó quanh, chớp mắt, đớp; lá khô rơi rồi nằm trên sân; hoa đăng trôi trên ao.

### Hậu kỳ
DepthOfField lấy nét theo cảnh → Bloom (mạnh nhất ở trăng rằm) → ACES tone mapping → split-tone
(bóng tối xanh chàm, vùng sáng vàng cam đèn lồng, đen nâng xanh) → contrast → chromatic aberration rất nhẹ → vignette → film grain rất thấp.

## Âm thanh
Toàn bộ âm thanh được tạo bằng WebAudio, không có file nào (`src/audio/`). Gồm:
- một giai điệu Trung Thu **tự sáng tác** ("Đêm hội", ngũ cung D–E–F#–A–B, 116 bpm, cấu trúc A B A C):
  đàn gảy kiểu đàn tranh, sáo, bass, trống lân ("tùng · cắc tùng tùng · cắc dinh") và chũm chọe;
- tiếng dế và gió ở nền.

Trống to dần khi tới cảnh rước đèn. Tiếng chuông vang lên khi thả đèn ước. Có nút tắt tiếng.
Muốn dùng bài nhạc riêng: đặt `public/audio/nhac-nen.mp3` (xem `public/audio/README.md`).

## Hiệu năng & trợ năng
- Hai mức chất lượng: tự chọn `low` trên thiết bị cảm ứng / màn hẹp. `PerformanceMonitor` tự hạ xuống `low` nếu FPS tụt.
- Mức `low`: DPR ≤ 1.5, không DOF/CA, không MSAA, shadow map 1024, ít trẻ em/đèn/PointLight hơn
  (10 bé / 4 đèn thay vì 16 / 9), ít lá, tre và đom đóm hơn, transmission ở nửa độ phân giải, phản chiếu 512 px.
- Mặt nước chỉ render phản chiếu khi ao có trong khung hình. Shader được biên dịch trước lúc tải để khỏi khựng hình giữa chừng.
- Bundle 3D được lazy-load, nên loader (`useProgress`: "Đang chuẩn bị đêm hội...") hiện ngay.
- `prefers-reduced-motion`: camera cắt thẳng giữa 4 cảnh thay vì bay, scroll không có quán tính. Đoàn rước, lân, lá,
  đèn, đom đóm, mặt nước đứng yên; nến nhấp nháy rất nhẹ. Cảnh vẫn đủ ánh sáng ấm.
- Chú thích từng cảnh gắn vào vị trí 3D bằng drei `Html`, luôn được giữ trong khung hình. Trên điện thoại
  chú thích nằm ở nửa dưới màn hình. Có bản chữ cho trình đọc màn hình và menu chuyển cảnh dùng được bằng bàn phím.

## Nguồn tài nguyên & license

| Tài nguyên | Nguồn | License |
|---|---|---|
| HDRI đêm `public/hdri/night_1k.exr` | "Dikhololo Night" — Poly Haven, lấy qua gói npm `@pmndrs/assets` (preset `night` của drei) | CC0 |
| Toàn bộ model (đình, nhà, cây đa, tre, đèn, mâm cỗ, trẻ em, lân, hoa đăng…) | Dựng procedural trong repo | MIT (theo repo) |
| Texture (giấy kính, tre, ngói, gạch, vôi, gỗ, khăn, chiếu, bánh, vảy cá, hình kéo quân, giấy bồi, trăng…) | Vẽ bằng canvas lúc chạy | — |
| Font Be Vietnam Pro, Playfair Display | Google Fonts | OFL |

Poly Haven, Sketchfab và Quaternius không truy cập được từ môi trường build (bị chính sách mạng chặn), và
các vật thể đặc trưng Việt Nam không có model CC0/CC-BY đáng tin cậy. Vì vậy mọi thứ được dựng procedural,
và bạn có thể thay bằng file .glb bất kỳ lúc nào qua `ModelSlot`.
