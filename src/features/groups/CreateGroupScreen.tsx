import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { InsetSeparator } from '../../components/InsetSeparator';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import type { RootStackScreenProps } from '../../navigation/types';
import { createGroup, MIN_GROUP_PICK } from '../../services/groupService';
import { colors, radius, shadowGlow, spacing, typography } from '../../theme';
import { SelectableContactItem } from './components/SelectableContactItem';

const NAME_MAX = 50;

// Màn Tạo nhóm: nhập tên nhóm, chọn ít nhất 2 người từ Danh bạ, rồi tạo và mở luôn nhóm.
export function CreateGroupScreen({
  navigation,
}: RootStackScreenProps<'CreateGroup'>) {
  const { me } = useAuth();
  const { users } = useChat();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Danh bạ xếp theo tên (A→Z, theo tiếng Việt).
  const contacts = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [users],
  );

  // Chọn hoặc bỏ chọn một người.
  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Điều kiện tạo nhóm: có tên và đủ số người tối thiểu.
  const trimmed = name.trim();
  const canCreate =
    !!me && trimmed.length > 0 && selected.size >= MIN_GROUP_PICK && !creating;

  // Tạo nhóm rồi thay màn hiện tại bằng màn chat của nhóm (nút Back về Home).
  const handleCreate = async () => {
    if (!me || !canCreate) {
      return;
    }
    setCreating(true);
    try {
      const convId = await createGroup(me, trimmed, [...selected]);
      navigation.replace('ChatDetail', { convId });
    } catch {
      setCreating(false);
      Alert.alert('Không tạo được nhóm', 'Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Thanh tiêu đề với nút quay lại. */}
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
          Tạo nhóm
        </Text>
      </View>

      {/* Ô tên nhóm và dòng đếm số người đã chọn. */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX}
          placeholder="Tên nhóm"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Tên nhóm"
        />
        <Text style={styles.hint}>
          {`Chọn ít nhất ${MIN_GROUP_PICK} người · đã chọn ${selected.size}`}
        </Text>
      </View>

      {/* Danh sách người dùng có checkbox. */}
      <FlatList
        style={styles.list}
        data={contacts}
        keyExtractor={u => u.id}
        extraData={selected}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={InsetSeparator}
        renderItem={({ item }) => (
          <SelectableContactItem
            user={item}
            selected={selected.has(item.id)}
            onToggle={toggle}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title="Chưa có người dùng khác"
            message="Cần ít nhất 2 tài khoản khác để tạo nhóm."
          />
        }
      />

      {/* Nút tạo nhóm, chỉ bật khi đủ điều kiện. */}
      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCreate }}
          disabled={!canCreate}
          style={[
            styles.create,
            canCreate ? styles.createOn : styles.createOff,
          ]}
          onPress={handleCreate}
        >
          {creating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.createText}>Tạo nhóm</Text>
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
  form: {
    padding: spacing.lg,
    gap: spacing.sm,
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
  hint: {
    ...typography.caption,
  },
  list: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
  },
  create: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.tail,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOn: {
    backgroundColor: colors.primary,
    ...shadowGlow,
  },
  createOff: {
    backgroundColor: colors.border,
  },
  createText: {
    ...typography.name,
    color: colors.white,
  },
});
