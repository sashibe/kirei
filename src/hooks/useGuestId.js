/**
 * useGuestId — ログイン不要の匿名ゲストID管理
 * localStorageにUUIDv4を保存し、次回以降も同じIDを使用する
 */
export function useGuestId() {
  const getOrCreateGuestId = () => {
    let id = localStorage.getItem('kirei_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('kirei_guest_id', id);
    }
    return id;
  };

  return { guestId: getOrCreateGuestId() };
}
