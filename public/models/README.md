# Thả model .glb của bạn vào đây

Mỗi vật thể chính được render qua `<ModelSlot id="...">`. Nếu thư mục này có file
`<id>.glb` (hoặc `<id>.gltf`), scene tự load file đó thay cho model procedural —
không cần sửa code. Dev server tự reload khi thêm/xoá file.

| id            | Vật thể                         | Gốc toạ độ của file .glb            |
|---------------|---------------------------------|-------------------------------------|
| `ong-sao`     | Đèn ông sao (treo & rước)       | điểm treo dây, đèn nằm bên dưới     |
| `den-ca-chep` | Đèn cá chép                     | tâm thân cá, đầu hướng +X           |
| `keo-quan`    | Đèn kéo quân                    | tâm đèn                             |
| `dau-lan`     | Múa lân (đầu + thân)            | mặt đất dưới chân người múa trước, đầu hướng +Z |
| `mam-co`      | Mâm cỗ Trung Thu                | đáy mâm, đặt trên mặt chõng         |
| `cay-da`      | Cây đa                          | gốc cây trên mặt đất                |
| `dinh-lang`   | Đình làng                       | tâm nền đình, mặt tiền hướng +Z     |

Quy ước:
- Đơn vị mét, trục Y hướng lên. Với đèn treo, gốc toạ độ (0,0,0) là điểm treo dây.
- Mọi mesh tự bật `castShadow`/`receiveShadow`; vật liệu phát sáng trong suốt
  (giấy đèn) tự tắt castShadow để ánh nến không bị "nhốt" bên trong.
- Nếu file có animation clip, clip đầu tiên tự phát; đổi clip sẽ crossfade 0.6s.
- Nếu file lỗi, scene log cảnh báo và quay về model procedural.
