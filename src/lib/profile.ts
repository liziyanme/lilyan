/** 本地资料（头像、昵称），发日记时会快照当前值，后续修改不影响已发日记 */
export const PROFILE_STORAGE_KEY = "lzy-diary-profile";

export type Profile = {
  nickname: string;
  avatar: string | null; // data URL 或 空
};

const defaultProfile: Profile = {
  nickname: "LZY",
  avatar: null,
};

export function getProfile(): Profile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      nickname: typeof parsed.nickname === "string" ? parsed.nickname : defaultProfile.nickname,
      avatar: typeof parsed.avatar === "string" ? parsed.avatar : null,
    };
  } catch {
    return defaultProfile;
  }
}

export function setProfile(p: Partial<Profile>): void {
  if (typeof window === "undefined") return;
  const current = getProfile();
  const next: Profile = {
    nickname: p.nickname ?? current.nickname,
    avatar: p.avatar !== undefined ? p.avatar : current.avatar,
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
}
