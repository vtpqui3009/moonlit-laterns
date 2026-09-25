# Thả model .glb của bạn vào đây

Mỗi vật thể chính được render qua `<ModelSlot id="...">`. Nếu thư mục này có file
`<id>.glb` (hoặc `<id>.gltf`), scene tự load file đó thay cho model procedural —
không cần sửa code. Dev server tự reload khi thêm/xoá file.

| id           | Vật thể                         | Có từ bước |
|--------------|---------------------------------|------------|
| `ong-sao`    | Đèn ông sao                     | 1          |
| `den-ca-chep`| Đèn cá chép                     | 3          |
| `keo-quan`   | Đèn kéo quân                    | 3          |
| `dau-lan`    | Đầu lân                         | 3          |
| `mam-co`     | Mâm cỗ Trung Thu                | 2          |
| `cay-da`     | Cây đa                          | 2          |
| `mai-dinh`   | Mái đình / mái nhà ngói         | 2          |

Quy ước:
- Đơn vị mét, trục Y hướng lên. Với đèn treo, gốc toạ độ (0,0,0) là điểm treo dây.
- Mọi mesh tự bật `castShadow`/`receiveShadow`; vật liệu phát sáng trong suốt
  (giấy đèn) tự tắt castShadow để ánh nến không bị "nhốt" bên trong.
- Nếu file có animation clip, clip đầu tiên tự phát; đổi clip sẽ crossfade 0.6s.
- Nếu file lỗi, scene log cảnh báo và quay về model procedural.
