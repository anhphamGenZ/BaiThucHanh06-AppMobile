import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { FadeInView } from '../../components/FadeInView';
import { InsetSeparator } from '../../components/InsetSeparator';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { SkeletonList } from '../../components/SkeletonList';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import type { MainTabScreenProps } from '../../navigation/types';
import { directPeerOf, getDirectId } from '../../services/chatService';
import { colors, spacing, typography } from '../../theme';
import type { User } from '../../types/models';
import { INDEX_LETTERS, indexLetter } from '../../utils/names';
import { ContactItem } from './components/ContactItem';
import { ContactSectionHeader } from './components/ContactSectionHeader';

type ContactSection = {
  key: string;
  title: string;
  data: User[];
};

export function ContactsScreen({ navigation }: MainTabScreenProps<'Contacts'>) {
  const { users, usersLoaded, conversations } = useChat();
  const myId = useAuth().me?.id;
  const [keyword, setKeyword] = useState('');

  const onlineCount = users.filter(u => u.isOnline).length;
  const query = keyword.trim().toLowerCase();

  // Số tin chưa đọc theo từng người (chỉ chat 1-1), để hiện badge cạnh tên trong Danh bạ.
  const unreadByPeer = useMemo(() => {
    const map = new Map<string, number>();
    for (const chat of conversations) {
      const peerId = myId ? directPeerOf(chat.convId, myId) : null;
      if (peerId) {
        map.set(peerId, chat.unread);
      }
    }
    return map;
  }, [conversations, myId]);

  // Nhóm theo chữ cái đầu của tên (Đ riêng, ký tự lạ vào '#'), nhóm xếp A→Z.
  const sections = useMemo(() => {
    const groups = new Map<string, User[]>();
    for (const user of users) {
      if (query !== '' && !user.name.toLowerCase().includes(query)) {
        continue;
      }
      const letter = indexLetter(user.name);
      const group = groups.get(letter);
      if (group) {
        group.push(user);
      } else {
        groups.set(letter, [user]);
      }
    }
    return Array.from(INDEX_LETTERS).flatMap((letter): ContactSection[] => {
      const data = groups.get(letter);
      return data
        ? [
            {
              key: letter,
              title: letter,
              data: data.sort((a, b) => a.name.localeCompare(b.name, 'vi')),
            },
          ]
        : [];
    });
  }, [users, query]);

  const matchedCount = sections.reduce((sum, s) => sum + s.data.length, 0);

  // Mở chat 1-1: mã cuộc trò chuyện tính cố định từ hai uid.
  const openChat = useCallback(
    (peerId: string) => {
      if (myId) {
        navigation.navigate('ChatDetail', {
          convId: getDirectId(myId, peerId),
          peerId,
        });
      }
    },
    [navigation, myId],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Danh bạ"
        badge={usersLoaded ? String(users.length) : undefined}
        live={onlineCount > 0}
        subtitle={
          onlineCount > 0
            ? `${onlineCount} người đang hoạt động`
            : 'Chưa ai đang hoạt động'
        }
      />
      <SearchBar
        value={keyword}
        onChangeText={setKeyword}
        placeholder="Tìm theo tên"
      />
      {usersLoaded ? (
        <View style={styles.flex}>
          <SectionList
            sections={sections}
            keyExtractor={u => u.id}
            stickySectionHeadersEnabled
            initialNumToRender={40}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              query !== '' && matchedCount > 0 ? (
                <Text style={styles.resultCount}>
                  {`Tìm thấy ${matchedCount} người khớp “${keyword.trim()}”`}
                </Text>
              ) : undefined
            }
            renderSectionHeader={({ section }) => (
              <ContactSectionHeader
                title={section.title}
                count={section.data.length}
              />
            )}
            renderItem={({ item, index, section }) => (
              <FadeInView index={index}>
                <ContactItem
                  user={item}
                  query={query}
                  unread={unreadByPeer.get(item.id) ?? 0}
                  isFirst={index === 0}
                  isLast={index === section.data.length - 1}
                  onOpen={openChat}
                />
              </FadeInView>
            )}
            ItemSeparatorComponent={InsetSeparator}
            ListEmptyComponent={
              users.length === 0 ? (
                <EmptyState
                  icon="users"
                  title="Chưa có người dùng khác"
                  message="Chưa có tài khoản nào khác đăng ký."
                />
              ) : (
                <EmptyState
                  icon="search"
                  title="Không tìm thấy"
                  message="Không có người dùng nào khớp với từ khoá."
                  action={{
                    label: 'Xoá tìm kiếm',
                    onPress: () => setKeyword(''),
                  }}
                />
              )
            }
          />
        </View>
      ) : (
        <SkeletonList label="Đang tải danh bạ" rows={8} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  resultCount: {
    ...typography.caption,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
});
