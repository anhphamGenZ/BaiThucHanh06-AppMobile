import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { avatarPalette, colors } from '../theme';
import { PulseDot } from './PulseDot';

type AvatarProps = {
  name: string;
  seed: string;
  // Ảnh đại diện; không có thì hiện chữ cái đầu trên nền màu theo seed.
  uri?: string;
  size?: number;
  online?: boolean;
  // Chấm online có hiệu ứng pulse (chỉ dùng vài chỗ, không dùng cho cả danh sách).
  pulse?: boolean;
  // Vòng gradient quanh avatar (dải Đang hoạt động).
  ring?: boolean;
};

const RING_GAP = 4;
const RING_STROKE = 2.5;

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return avatarPalette[hash % avatarPalette.length];
}

// Tên Việt: chữ cái đầu của từ cuối ("Phạm Đức Anh" -> "A").
function initialOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const last = words[words.length - 1] ?? '';
  return last ? Array.from(last)[0].toUpperCase() : '?';
}

export function Avatar({
  name,
  seed,
  uri,
  size = 48,
  online,
  pulse = false,
  ring = false,
}: AvatarProps) {
  const dot = Math.max(10, Math.round(size * 0.26));
  const outer = ring ? size + RING_GAP * 2 : size;
  const half = size / 2;

  return (
    <View style={{ width: outer, height: outer }}>
      {ring && (
        <Svg width={outer} height={outer} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primaryBright} />
              <Stop offset="1" stopColor={colors.online} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={outer / 2}
            cy={outer / 2}
            r={outer / 2 - RING_STROKE / 2}
            stroke="url(#ring)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
        </Svg>
      )}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: half,
            backgroundColor: colorFor(seed),
          },
          ring && styles.ringInset,
        ]}
      >
        {uri ? (
          // Có ảnh đại diện: ảnh phủ kín vòng tròn.
          <Image source={{ uri }} style={{ width: size, height: size }} />
        ) : (
          // Không có ảnh: lớp bóng nhẹ + chữ cái đầu.
          <>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="gloss" x1="0" y1="0" x2="0.8" y2="1">
                  <Stop offset="0" stopColor={colors.white} stopOpacity={0.3} />
                  <Stop offset="0.6" stopColor={colors.white} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Circle cx={half} cy={half} r={half} fill="url(#gloss)" />
            </Svg>
            <Text
              style={[styles.initial, { fontSize: size * 0.42 }]}
              allowFontScaling={false}
            >
              {initialOf(name)}
            </Text>
          </>
        )}
      </View>
      {online !== undefined && (
        <View style={[styles.dotWrap, ring && styles.dotWrapRing]}>
          {online && pulse ? (
            <PulseDot size={dot} borderColor={colors.white} />
          ) : (
            <View
              style={[
                styles.dot,
                {
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  backgroundColor: online ? colors.online : colors.offline,
                },
              ]}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringInset: {
    margin: RING_GAP,
  },
  initial: {
    color: colors.white,
    fontWeight: '700',
  },
  dotWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  dotWrapRing: {
    right: RING_GAP / 2,
    bottom: RING_GAP / 2,
  },
  dot: {
    borderWidth: 2,
    borderColor: colors.white,
  },
});
