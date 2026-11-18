import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import type { RootStackScreenProps } from '../../navigation/types';
import {
  addMembers,
  leaveGroup,
  removeMember,
  renameGroup,
} from '../../services/groupService';
import { colors, radius, shadowCard, spacing, typography } from '../../theme';
import { SelectableContactItem } from './components/SelectableContactItem';

// Màn thông tin nhóm (Phần C - quản trị nhóm):
//  - mọi thành viên: đổi tên nhóm, rời nhóm;
//  - người tạo nhóm: thêm thành viên, xoá thành viên.
// Mỗi thao tác ghi kèm tin hệ thống ("A đã rời nhóm") để mọi người cùng thấy.
export function GroupInfoScreen({
  route,
  navigation,
}: RootStackScreenProps<'GroupInfo'>) {
  const { convId } = route.params;
  const { me } = useAuth();
  const { groups, users, getUser } = useChat();
  // ChatContext đã lắng nghe conversations/{id} của mọi nhóm nên thông tin luôn mới nhất.
  const group = groups[convId];

  const [name, setName] = useState(group?.name ?? '');
  const [adding, setAdding] = useState(false); // đang mở danh sách thêm người
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false); // đang chạy một thao tác

  // Người chưa có trong nhóm, để chọn thêm vào.
  const candidates = useMemo(
    () =>
      group
        ? users
            .filter(u => !group.members.includes(u.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        : [],
    [users, group],
  );

  const togglePick = useCallback((id: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Nhóm không còn (bị xoá khỏi nhóm hoặc đã rời) thì báo và cho quay lại.
  if (!me || !group) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="info"
          title="Không còn trong nhóm"
          message="Bạn không còn là thành viên của nhóm này."
        />
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={styles.link}>Về trang chủ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOwner = group.createdBy === me.id;
  const nameOf = (uid: string) =>
    uid === me.id ? me.name : getUser(uid)?.name ?? 'Thành viên';
  const trimmed = name.trim();
  const nameChanged = trimmed.length > 0 && trimmed !== group.name;

  // Chạy một thao tác: khoá nút trong lúc chạy, lỗi thì báo.
  const run = async (action: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await action();
      return true;
    } catch {
      Alert.alert(failTitle, 'Vui lòng thử lại.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Đổi tên nhóm.
  const handleRename = () =>
    run(
      () => renameGroup(convId, me, group.members, trimmed),
      'Không đổi được tên nhóm',
    );

  // Thêm những người đã chọn.
  const handleAdd = async () => {
    const newMembers = [...picked].map(id => ({ id, name: nameOf(id) }));
    const ok = await run(
      () => addMembers(convId, me, group.members, group.name ?? '', newMembers),
      'Không thêm được thành viên',
    );
    if (ok) {
      setPicked(new Set());
      setAdding(false);
    }
  };

  // Xoá một thành viên (có xác nhận).
  const handleRemove = (uid: string) =>
    Alert.alert('Xoá thành viên?', `Xoá ${nameOf(uid)} khỏi nhóm?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () =>
          run(
            () =>
              removeMember(convId, me, group.members, {
                id: uid,
                name: nameOf(uid),
              }),
            'Không xoá được thành viên',
          ),
      },
    ]);

  // Rời nhóm (có xác nhận), xong thì về trang chủ.
  const handleLeave = () =>
    Alert.alert('Rời nhóm?', 'Bạn sẽ không còn xem được tin nhắn của nhóm.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Rời nhóm',
        style: 'destructive',
        onPress: async () => {
          const ok = await run(
            () => leaveGroup(convId, me, group.members),
            'Không rời được nhóm',
          );
          if (ok) {
            navigation.popToTop();
          }
        },
      },
    ]);

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
          Thông tin nhóm
        </Text>
        {busy && <ActivityIndicator color={colors.primary} />}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Đổi tên nhóm. */}
        <Text style={styles.label}>Tên nhóm</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={50}
            accessibilityLabel="Tên nhóm"
          />
          <TouchableOpacity
            accessibilityRole="button"
            disabled={!nameChanged || busy}
            style={[styles.smallButton, !nameChanged && styles.disabled]}
            onPress={handleRename}
          >
            <Text style={styles.smallButtonText}>Lưu tên</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách thành viên; người tạo nhóm có nút Xoá cạnh từng người. */}
        <Text style={styles.label}>
          {`Thành viên (${group.members.length})`}
        </Text>
        <View style={styles.card}>
          {group.members.map(uid => (
            <View key={uid} style={styles.memberRow}>
              <Avatar
                name={nameOf(uid)}
                seed={uid}
                uri={uid === me.id ? me.avatarUrl : getUser(uid)?.avatarUrl}
                size={40}
                online={uid === me.id ? undefined : getUser(uid)?.isOnline}
              />
              <View style={styles.memberText}>
                <Text style={typography.name} numberOfLines={1}>
                  {uid === me.id ? `${me.name} (bạn)` : nameOf(uid)}
                </Text>
                {uid === group.createdBy && (
                  <Text style={styles.owner}>Trưởng nhóm</Text>
                )}
              </View>
              {isOwner && uid !== me.id && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Xoá ${nameOf(uid)} khỏi nhóm`}
                  disabled={busy}
                  style={styles.remove}
                  onPress={() => handleRemove(uid)}
                >
                  <Text style={styles.removeText}>Xoá</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Thêm thành viên (chỉ người tạo nhóm). */}
        {isOwner && (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.addToggle}
              onPress={() => setAdding(v => !v)}
            >
              <Icon
                name={adding ? 'close' : 'userPlus'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.addToggleText}>
                {adding ? 'Đóng' : 'Thêm thành viên'}
              </Text>
            </TouchableOpacity>
            {adding && (
              <View style={styles.card}>
                {candidates.length === 0 ? (
                  <Text style={styles.empty}>
                    Mọi người đều đã ở trong nhóm.
                  </Text>
                ) : (
                  candidates.map(user => (
                    <SelectableContactItem
                      key={user.id}
                      user={user}
                      selected={picked.has(user.id)}
                      onToggle={togglePick}
                    />
                  ))
                )}
                {picked.size > 0 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={busy}
                    style={styles.primary}
                    onPress={handleAdd}
                  >
                    <Text style={styles.primaryText}>
                      {`Thêm ${picked.size} người`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* Rời nhóm. */}
        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          style={styles.leave}
          onPress={handleLeave}
        >
          <Icon name="logout" size={20} color={colors.danger} />
          <Text style={styles.leaveText}>Rời nhóm</Text>
        </TouchableOpacity>
      </ScrollView>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.overline,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadowCard,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderWarm,
  },
  smallButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    ...typography.name,
    color: colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  memberText: {
    flex: 1,
  },
  owner: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  remove: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  removeText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  addToggleText: {
    ...typography.name,
    color: colors.primary,
  },
  empty: {
    ...typography.bodyMuted,
    padding: spacing.lg,
  },
  primary: {
    minHeight: 48,
    margin: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.name,
    color: colors.white,
  },
  leave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
  },
  leaveText: {
    ...typography.name,
    color: colors.danger,
  },
  link: {
    ...typography.name,
    color: colors.primary,
    textAlign: 'center',
  },
});
