import { useCallback, useEffect, useRef } from 'react';
import { setTyping } from '../services/typingService';

const IDLE_MS = 3000;

// Bật "đang soạn tin" khi gõ, tự tắt sau 3 giây không gõ, khi xoá hết chữ,
// khi gọi stop() (gửi tin) và khi rời màn hình. Chỉ ghi DB khi trạng thái đổi.
export function useTypingSignal(
  convId: string,
  myId: string | undefined,
  active: boolean,
) {
  const typingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    if (typingRef.current && myId) {
      typingRef.current = false;
      setTyping(convId, myId, false).catch(() => {});
    }
  }, [convId, myId]);

  const onTextChange = useCallback(
    (text: string) => {
      if (!myId || !active) {
        return;
      }
      if (text.trim() === '') {
        stop();
        return;
      }
      if (!typingRef.current) {
        typingRef.current = true;
        setTyping(convId, myId, true).catch(() => {});
      }
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(stop, IDLE_MS);
    },
    [convId, myId, active, stop],
  );

  useEffect(() => {
    if (!active) {
      stop();
    }
    return stop;
  }, [active, stop]);

  return { onTextChange, stop };
}
