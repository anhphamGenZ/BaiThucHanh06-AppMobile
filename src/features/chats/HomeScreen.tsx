import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { FadeInView } from '../../components/FadeInView';
import { Icon } from '../../components/Icon';
import { InsetSeparator } from '../../components/InsetSeparator';
import { SearchBar } from '../../components/SearchBar';
import { SkeletonList } from '../../components/SkeletonList';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { MainTabScreenProps } from '../../navigation/types';
import { directPeerOf, getDirectId } from '../../services/chatService';
import { colors, radius, spacing, typography } from '../../theme';
import type { UserChat } from '../../types/models';
import { givenName } from '../../utils/names';
import { ConversationItem } from './components/ConversationItem';
import { FilterChips, type FilterOption } from './components/FilterChips';
import { GreetingHeader } from './components/GreetingHeader';
import { InboxPulseCard } from './components/InboxPulseCard';
import { OnlineStrip } from './components/OnlineStrip';

// Một dòng ở Home, đã ghép sẵn thông tin hiển thị cho cả chat 1-1 và nhóm.
type ConversationRow = {
  conversation: UserChat;
  title: string;
  avatarSeed: string;
  avatarUri?: string;
  online: boolean;
  isGroup: boolean;
  // Chỉ có với chat 1-1: uid người kia, dùng khi mở chat.
  peerId?: string;
  // Tên ngắn của các thành viên khác trong nhóm, để tìm kiếm theo tên.
  memberNames: string;
};

type Filter = 'all' | 'unread' | 'online';

export function HomeScreen({ navigation }: MainTabScreenProps<'Chats'>) {
  const {
    conversations,
    totalUnread,
    getUser,
    groups,
    users,
    usersLoaded,
    chatsLoaded,
  } = useChat();
  const { me, showOnline } = useAuth();
  const myId = me?.id;
  const reduced = useReducedMotion();
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Ghép userChats với hồ sơ người kia (1-1) hoặc thông tin nhóm. Bỏ qua dòng chưa đủ dữ liệu.
  const allRows = useMemo(
    () =>
      conversations.flatMap((conversation): ConversationRow[] => {
        if (!myId) {
          return [];
        }
        // Chat 1-1.
        const peerId = directPeerOf(conversation.convId, myId);
        if (peerId) {
          const peer = getUser(peerId);
          return peer
            ? [
                {
                  conversation,
                  title: peer.name,
                  avatarSeed: peer.id,
                  avatarUri: peer.avatarUrl,
                  online: peer.isOnline,
                  isGroup: false,
                  peerId,
                  memberNames: peer.name,
                },
              ]
            : [];
        }
        // Nhóm: chờ conversations/{id} tải xong mới hiện.
        const group = groups[conversation.convId];
        if (!group) {
          return [];
        }
        const others = group.members.filter(uid => uid !== myId);
        return [
          {
            conversation,
            title: group.name ?? 'Nhóm',
            avatarSeed: group.id,
            online: others.some(uid => getUser(uid)?.isOnline),
            isGroup: true,
            memberNames: others.map(uid => getUser(uid)?.name ?? '').join(' '),
          },
        ];
      }),
    [conversations, getUser, groups, myId],
  );

  // Tìm theo tên cuộc trò chuyện, tên thành viên hoặc nội dung tin cuối.
  const searchedRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return allRows.filter(
      row =>
        !needle ||
        row.title.toLowerCase().includes(needle) ||
        row.memberNames.toLowerCase().includes(needle) ||
        row.conversation.lastMessage.toLowerCase().includes(needle),
    );
  }, [allRows, keyword]);

  // Áp dụng chip lọc Tất cả / Chưa đọc / Online.
  const unreadRows = searchedRows.filter(row => row.conversation.unread > 0);
  const onlineRows = searchedRows.filter(row => row.online);
  const rows =
    filter === 'unread'
      ? unreadRows
      : filter === 'online'
      ? onlineRows
      : searchedRows;

  // Người đang online: ưu tiên người vừa nhắn gần đây (chat 1-1), sau đó theo tên.
  const onlineUsers = useMemo(() => {
    const recency = new Map(
      allRows.flatMap((row, i) => (row.peerId ? [[row.peerId, i]] : [])) as [
        string,
        number,
      ][],
    );
    return users
      .filter(user => user.isOnline)
      .sort(
        (a, b) =>
          (recency.get(a.id) ?? Infinity) - (recency.get(b.id) ?? Infinity) ||
          a.name.localeCompare(b.name, 'vi'),
      );
  }, [users, allRows]);

  // Mở chat 1-1 với một người (từ dải Đang hoạt động).
  const openDirectChat = useCallback(
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

  // Mở một dòng ở danh sách: chat 1-1 truyền thêm peerId, nhóm chỉ cần convId.
  const openRow = (row: ConversationRow) =>
    navigation.navigate('ChatDetail', {
      convId: row.conversation.convId,
      peerId: row.peerId,
    });

  // Tiền tố trước tin cuối: "Bạn: " nếu mình gửi, tên người gửi nếu là nhóm.
  const senderPrefixOf = (row: ConversationRow) => {
    const sender = row.conversation.lastSenderId;
    if (sender === myId) {
      return 'Bạn: ';
    }
    if (row.isGroup) {
      const name = getUser(sender)?.name;
      return name ? givenName(name) + ': ' : '';
    }
    return '';
  };

  const changeFilter = (next: Filter) => {
    if (!reduced) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setFilter(next);
  };

  const latestUnread = allRows.find(row => row.conversation.unread > 0);
  const searching = keyword.trim() !== '';

  const filterOptions: FilterOption<Filter>[] = [
    { key: 'all', label: 'Tất cả', count: searchedRows.length },
    { key: 'unread', label: 'Chưa đọc', count: unreadRows.length },
    { key: 'online', label: 'Online', count: onlineRows.length },
  ];

  // Phần đầu danh sách: thẻ hộp thư, dải đang hoạt động, nút tạo nhóm, chip lọc.
  const listHeader = (
    <View>
      {!searching && (
        <InboxPulseCard
          totalUnread={totalUnread}
          unreadChats={
            allRows.filter(row => row.conversation.unread > 0).length
          }
          onlineCount={onlineUsers.length}
          onOpenLatestUnread={
            latestUnread ? () => openRow(latestUnread) : undefined
          }
        />
      )}
      {!searching && onlineUsers.length > 0 && (
        <OnlineStrip users={onlineUsers} onOpen={openDirectChat} />
      )}
      {!searching && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.createGroup}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Icon name="plus" size={18} color={colors.primary} />
          <Text style={styles.createGroupText}>Tạo nhóm</Text>
        </TouchableOpacity>
      )}
      {allRows.length > 0 && (
        <FilterChips
          options={filterOptions}
          value={filter}
          onChange={changeFilter}
        />
      )}
      {searching && rows.length > 0 && (
        <Text style={styles.resultCount}>
          {`${rows.length} cuộc trò chuyện khớp “${keyword.trim()}”`}
        </Text>
      )}
    </View>
  );

  // Trạng thái rỗng theo từng tình huống.
  const emptyState =
    allRows.length === 0 ? (
      <EmptyState
        icon="chat"
        title="Chưa có cuộc trò chuyện"
        message="Chọn một người trong Danh bạ hoặc tạo nhóm để bắt đầu nhắn tin."
        action={{
          label: 'Mở Danh bạ',
          onPress: () => navigation.navigate('Contacts'),
        }}
      />
    ) : searching && searchedRows.length === 0 ? (
      <EmptyState
        icon="search"
        title="Không tìm thấy"
        message="Không có cuộc trò chuyện nào khớp với từ khoá."
      />
    ) : filter === 'unread' ? (
      <EmptyState
        icon="check"
        title="Không còn tin chưa đọc"
        message="Bạn đã đọc hết tin nhắn."
        action={{ label: 'Xem tất cả', onPress: () => changeFilter('all') }}
      />
    ) : (
      <EmptyState
        icon="users"
        title="Chưa ai đang online"
        message="Cuộc trò chuyện có người đang hoạt động sẽ hiện ở đây."
        action={{ label: 'Xem tất cả', onPress: () => changeFilter('all') }}
      />
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {me ? (
        <GreetingHeader
          me={me}
          online={showOnline}
          onPressProfile={() => navigation.navigate('Settings')}
        />
      ) : null}
      <SearchBar
        value={keyword}
        onChangeText={setKeyword}
        placeholder="Tìm người, nhóm hoặc nội dung tin nhắn"
      />
      {chatsLoaded && usersLoaded ? (
        <FlatList
          data={rows}
          keyExtractor={row => row.conversation.convId}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={InsetSeparator}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          renderItem={({ item: row, index }) => (
            <FadeInView index={index}>
              <ConversationItem
                title={row.title}
                avatarSeed={row.avatarSeed}
                avatarUri={row.avatarUri}
                online={row.online}
                isGroup={row.isGroup}
                conversation={row.conversation}
                senderPrefix={senderPrefixOf(row)}
                query={keyword}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
                onPress={() => openRow(row)}
              />
            </FadeInView>
          )}
          ListEmptyComponent={emptyState}
        />
      ) : (
        <SkeletonList label="Đang tải cuộc trò chuyện" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  resultCount: {
    ...typography.caption,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  createGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: 44,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  createGroupText: {
    ...typography.name,
    fontSize: 14,
    color: colors.primary,
  },
});
