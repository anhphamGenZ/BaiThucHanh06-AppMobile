// Bảng màu và token giao diện; quy tắc dùng xem DESIGN.md.
export const colors = {
  primary: '#0B7A7C',
  primaryDeep: '#064E50',
  primaryBright: '#2BB5B0',
  primarySoft: '#E3F4F4',
  primaryMist: '#F0F9F8',
  background: '#F6F4EF',
  surfaceMuted: '#ECE8DF',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: '#CDEBEB',
  glassOnPrimary: 'rgba(255,255,255,0.14)',
  border: '#E5E7EB',
  borderWarm: '#E4DFD3',
  online: '#22C55E',
  onlineText: '#15803D',
  offline: '#9CA3AF',
  warm: '#F2994A',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  bubbleMine: '#0B7A7C',
  bubbleMineText: '#FFFFFF',
  bubbleMineMeta: '#CDEBEB',
  bubbleOther: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  // Lớp phủ mờ sau menu, ảnh đang tải.
  overlay: 'rgba(17,24,39,0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Bo góc; `tail` là góc nhỏ dùng cho thẻ, nút chính, ô nhập.
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  tail: 6,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  appTitle: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.4,
  },
  name: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodyMuted: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  numeric: {
    fontVariant: ['tabular-nums' as const],
  },
};

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  stagger: 35,
  maxStaggerItems: 8,
  pulse: 1600,
  pressScale: 0.97,
};

export const shadowCard = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

export const shadowGlow = {
  shadowColor: '#0B7A7C',
  shadowOpacity: 0.28,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
};

export const avatarPalette = [
  '#0B7A7C',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#475569',
];
