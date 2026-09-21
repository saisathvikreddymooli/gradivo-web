export type ConnectUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  college: string;
  country: string;
  state: string;
  city: string;
  branch: string;
  year: string;
  skills: string[];
  interests: string[];
  bio: string;
  goal: string;
  helpAreas: string[];
  isSenior: boolean;
  isVerifiedSenior: boolean;
  /** Account role. Seniors may have role == "senior". Defaults to "student". */
  role: string;
  online: boolean;
  lastSeen: number | null;
  createdAt: number | null;
};

export type Conversation = {
  id: string;
  participants: string[];
  userLow: string;
  userHigh: string;
  lastMessage: string;
  lastMessageAt: number | null;
  createdAt: number | null;
  hiddenFor: string[];
  unread: Record<string, number>;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number | null;
  readBy: string[];
};

export type GroupType = "public" | "private";

export type ConnectGroup = {
  id: string;
  name: string;
  description: string;
  category: string;
  country: string;
  state: string;
  memberCount: number;
  /** Visibility. Legacy groups without a type are treated as "public". */
  type: GroupType;
  /** UID of the student who created the group ("system" for built-in groups). */
  createdBy: string;
  /** UIDs of group admins. The creator is the first admin. */
  admins: string[];
  /** UIDs of all members (includes admins). */
  members: string[];
  createdAt: number | null;
};

export type ProjectRequest = {
  id: string;
  creatorId: string;
  projectName: string;
  description: string;
  technologies: string[];
  requiredSkills: string[];
  teamSize: number;
  college: string;
  country: string;
  state: string;
  deadline: string;
  status: string;
  createdAt: number | null;
};

export type ConnectTab = "discover" | "seniors" | "groups" | "messages" | "projects";

export type ThemeColors = {
  bg: string;
  card: string;
  card2: string;
  border: string;
  purple: string;
  purple2: string;
  text: string;
  muted: string;
};

export type AppStudentProfile = {
  name: string;
  branch: string;
  year: string;
  interests: string[];
  goal: string;
  college: string;
  country: string;
  state: string;
  city: string;
  skills: string[];
  bio: string;
  isSenior: boolean;
  helpAreas: string[];
};
