export type PronounOption =
  | 'He/Him'
  | 'He/His'
  | 'She/Her'
  | 'She/Hers'
  | 'They/Them'
  | 'They/Theirs'
  | 'Custom'
  | '';

export type AccountPrivacyOption = 'Public' | 'Private';

export interface ProfileData {
  username: string;
  displayName: string;
  profilePic: string;
  posts: string | number;
  followers: string;
  following: string;
  bio: string;
  followedBy: string;
  isVerified: boolean;
  pronounType: PronounOption;
  customPronoun: string;
  accountPrivacy: AccountPrivacyOption;
}

export interface LocalPost {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  createdAt: number;
}

export type FollowButtonState = 'Follow' | 'Following' | 'User not found';

export interface SnackbarInfo {
  id: number;
  message: string;
  variant?: 'default' | 'green';
}
