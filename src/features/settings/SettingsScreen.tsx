import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import type { MainTabScreenProps } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { AccountCard } from './components/AccountCard';
import { SettingSwitchRow } from './components/SettingSwitchRow';

export function SettingsScreen({ navigation }: MainTabScreenProps<'Settings'>) {
  const { me, showOnline, setShowOnline, logout } = useAuth();
  const { enabled, setEnabled } = useNotifications();

  if (!me) {
    return null;
  }

  const confirmLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: () =>
          logout().catch(() =>
            Alert.alert('Không đăng xuất được', 'Vui lòng thử lại.'),
          ),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Cài đặt" />
        <AccountCard me={me} online={showOnline} />
        {/* Mở màn sửa họ tên và ảnh đại diện. */}
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.editProfile}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="user" size={18} color={colors.primary} />
          <Text style={styles.editProfileText}>Sửa hồ sơ</Text>
        </TouchableOpacity>
        <Text style={styles.sectionLabel}>Tuỳ chọn</Text>
        <View style={styles.card}>
          <SettingSwitchRow
            icon="activity"
            label="Hiển thị trạng thái online"
            description="Bạn bè thấy khi bạn đang hoạt động"
            value={showOnline}
            onValueChange={setShowOnline}
          />
          <View style={styles.separator} />
          <SettingSwitchRow
            icon="bell"
            label="Nhận thông báo"
            description="Hiện số thông báo mới và thông báo hệ thống khi app chạy nền"
            value={enabled}
            onValueChange={setEnabled}
          />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={confirmLogout}
          style={styles.logout}
        >
          <Icon name="logout" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
        <Text style={styles.version}>ChatApp v1.0 · Phạm Đức Anh · PTIT</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  editProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  editProfileText: {
    ...typography.name,
    fontSize: 14,
    color: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.overline,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderBottomRightRadius: radius.tail,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    height: 50,
    borderRadius: radius.pill,
    borderBottomRightRadius: radius.tail,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
