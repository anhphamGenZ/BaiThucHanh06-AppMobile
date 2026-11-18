import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../theme';
import { foldText } from '../utils/textSearch';

type HighlightTextProps = {
  text: string;
  query: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

// Tô đậm đoạn khớp từ khoá, không phân biệt hoa thường và dấu tiếng Việt.
export function HighlightText({
  text,
  query,
  style,
  numberOfLines,
}: HighlightTextProps) {
  // foldText giữ nguyên độ dài chuỗi nên vị trí khớp dùng được để cắt chuỗi gốc.
  const needle = foldText(query.trim());
  const start = needle ? foldText(text).indexOf(needle) : -1;

  if (start < 0) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const end = start + needle.length;
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {text.slice(0, start)}
      <Text style={styles.match}>{text.slice(start, end)}</Text>
      {text.slice(end)}
    </Text>
  );
}

const styles = StyleSheet.create({
  match: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    fontWeight: '800',
  },
});
