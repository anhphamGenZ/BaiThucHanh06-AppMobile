// Chuẩn hoá chữ để tìm kiếm không phân biệt dấu và hoa thường ("Xin chào" khớp "xin chao").
// Mỗi ký tự đổi thành đúng một ký tự (bỏ dấu, đ → d), nên chuỗi kết quả DÀI BẰNG chuỗi gốc
// và vị trí tìm thấy dùng được để cắt/tô đậm trên chuỗi gốc.
export function foldText(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const base = ch.normalize('NFD')[0] ?? ch;
    out += base === 'đ' || base === 'Đ' ? 'd' : base.toLowerCase();
  }
  return out;
}

// true nếu `text` chứa `query` sau khi bỏ dấu và hạ chữ thường.
export function matchesFolded(text: string, query: string): boolean {
  const needle = foldText(query.trim());
  return needle !== '' && foldText(text).includes(needle);
}
