import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import type { RootStackScreenProps } from '../../navigation/types';
import { pickImage } from '../../services/imagePickerService';
import { uploadImage } from '../../services/uploadService';
import { updateProfile } from '../../services/userService';
import { colors, radius, shadowGlow, spacing, typography } from '../../theme';

const NAME_MAX = 50;

// Màn sửa hồ sơ (Phần C): đổi họ tên và ảnh đại diện.
// Ảnh được upload lên Cloudinary trước, chỉ lưu URL vào users/{uid}/avatarUrl khi bấm Lưu.
export function EditProfileScreen({
  navigation,
}: RootStackScreenProps<'EditProfile'>) {
  const { me } = useAuth();
  const [name, setName] = useState(me?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    me?.avatarUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!me) {
    return null;
  }

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !uploading && !saving;

  // Chọn ảnh từ thư viện rồi tải lên Cloudinary để có URL xem trước.
  const handlePickAvatar = async () => {
    try {
      const image = await pickImage('library');
      if (!image) {
        return;
      }
      setUploading(true);
      setAvatarUrl(await uploadImage(image));
    } catch {
      Alert.alert('Không tải được ảnh', 'Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  // Lưu tên và ảnh vào users/{uid}; mọi màn hình khác tự cập nhật qua listener.
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(me.id, trimmed, avatarUrl);
      navigation.goBack();
    } catch {
      setSaving(false);
      Alert.alert('Không lưu được hồ sơ', 'Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Thanh tiêu đề. */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          <Icon name="back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          Sửa hồ sơ
        </Text>
      </View>

      <View style={styles.content}>
        {/* Ảnh đại diện + nút đổi/xoá ảnh. */}
        <View style={styles.avatarBox}>
          <Avatar
            name={trimmed || me.name}
            seed={me.id}
            uri={avatarUrl ?? undefined}
            size={104}
          />
          {uploading && (
            <View style={styles.avatarLoading}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}
        </View>
        <View style={styles.avatarActions}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={uploading}
            style={styles.pill}
            onPress={handlePickAvatar}
          >
            <Icon name="camera" size={18} color={colors.primary} />
            <Text style={styles.pillText}>Đổi ảnh</Text>
          </TouchableOpacity>
          {avatarUrl && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={uploading}
              style={styles.pill}
              onPress={() => setAvatarUrl(null)}
            >
              <Text style={[styles.pillText, styles.danger]}>Xoá ảnh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Họ tên. */}
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX}
          accessibilityLabel="Họ và tên"
        />

        {/* Lưu. */}
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!canSave}
          style={[styles.save, canSave ? styles.saveOn : styles.saveOff]}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
    paddingRight: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderWarm,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.name,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: spacing.xl,
  },
  avatarBox: {
    alignSelf: 'center',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  avatarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  pillText: {
    ...typography.name,
    fontSize: 14,
    color: colors.primary,
  },
  danger: {
    color: colors.danger,
  },
  label: {
    ...typography.overline,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.tail,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
  },
  save: {
    minHeight: 52,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.tail,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOn: {
    backgroundColor: colors.primary,
    ...shadowGlow,
  },
  saveOff: {
    backgroundColor: colors.border,
  },
  saveText: {
    ...typography.name,
    color: colors.white,
  },
});
