import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db, FIRESTORE_DATABASE_ID } from "../firebase/config";
import { DEFAULT_COUNTRY, DEFAULT_GROUPS } from "./constants";
import type {
  AppStudentProfile,
  ChatMessage,
  ConnectionRequest,
  ConnectGroup,
  ConnectUser,
  Conversation,
  ProjectRequest,
} from "./types";

function millis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function asRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = typeof item === "number" ? item : 0;
  }
  return out;
}

export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join("_");
}

export function blockIdFor(blockedBy: string, blockedUser: string): string {
  return `${blockedBy}_${blockedUser}`;
}

export function mapUser(id: string, data: DocumentData): ConnectUser {
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? data.phoneNumber ?? ""),
    photoURL: String(data.photoURL ?? ""),
    college: String(data.college ?? ""),
    country: String(data.country ?? DEFAULT_COUNTRY),
    state: String(data.state ?? ""),
    city: String(data.city ?? ""),
    branch: String(data.branch ?? ""),
    year: String(data.year ?? ""),
    skills: asStringArray(data.skills),
    interests: asStringArray(data.interests),
    bio: String(data.bio ?? ""),
    goal: String(data.goal ?? ""),
    helpAreas: asStringArray(data.helpAreas),
    isSenior: Boolean(data.isSenior) || String(data.role ?? "") === "senior",
    isVerifiedSenior: Boolean(data.isVerifiedSenior),
    skillLevel:
      data.skillLevel === "intermediate" || data.skillLevel === "advanced"
        ? data.skillLevel
        : "beginner",
    weeklyHours: String(data.weeklyHours ?? "7"),
    timelineMonths: String(data.timelineMonths ?? "6"),
    role: String(data.role ?? "student"),
    online: Boolean(data.online) && Date.now() - (millis(data.lastSeen) ?? 0) < 2 * 60 * 1000,
    lastSeen: millis(data.lastSeen),
    createdAt: millis(data.createdAt),
  };
}

function mapConversation(id: string, data: DocumentData): Conversation {
  return {
    id,
    participants: asStringArray(data.participants),
    userLow: String(data.userLow ?? ""),
    userHigh: String(data.userHigh ?? ""),
    lastMessage: String(data.lastMessage ?? ""),
    lastMessageAt: millis(data.lastMessageAt),
    createdAt: millis(data.createdAt),
    hiddenFor: asStringArray(data.hiddenFor),
    unread: asRecord(data.unread),
  };
}

function mapMessage(id: string, data: DocumentData): ChatMessage {
  return {
    id,
    senderId: String(data.senderId ?? ""),
    text: String(data.text ?? ""),
    createdAt: millis(data.createdAt),
    readBy: asStringArray(data.readBy),
  };
}

function mapGroup(id: string, data: DocumentData): ConnectGroup {
  const rawType = String(data.type ?? "public");
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? ""),
    country: String(data.country ?? DEFAULT_COUNTRY),
    state: String(data.state ?? ""),
    memberCount: typeof data.memberCount === "number" ? data.memberCount : 0,
    type: rawType === "private" ? "private" : "public",
    createdBy: String(data.createdBy ?? "system"),
    admins: asStringArray(data.admins),
    members: asStringArray(data.members),
    createdAt: millis(data.createdAt),
  };
}

/** A senior is anyone flagged as a senior: role == "senior", isSenior, or verified. */
export function isSeniorAccount(user: Pick<ConnectUser, "isSenior" | "isVerifiedSenior" | "role">): boolean {
  return user.isSenior || user.isVerifiedSenior || user.role === "senior";
}

function mapProject(id: string, data: DocumentData): ProjectRequest {
  return {
    id,
    creatorId: String(data.creatorId ?? ""),
    projectName: String(data.projectName ?? ""),
    description: String(data.description ?? ""),
    technologies: asStringArray(data.technologies),
    requiredSkills: asStringArray(data.requiredSkills),
    teamSize: typeof data.teamSize === "number" ? data.teamSize : 1,
    college: String(data.college ?? ""),
    country: String(data.country ?? DEFAULT_COUNTRY),
    state: String(data.state ?? ""),
    deadline: String(data.deadline ?? ""),
    status: String(data.status ?? "open"),
    createdAt: millis(data.createdAt),
  };
}

export function profileFromUser(
  user: ConnectUser,
  goal = "",
): AppStudentProfile {
  return {
    name: user.name,
    branch: user.branch,
    year: user.year,
    interests: user.interests,
    goal: user.goal || goal,
    college: user.college,
    country: user.country || DEFAULT_COUNTRY,
    state: user.state,
    city: user.city,
    skills: user.skills,
    bio: user.bio,
    isSenior: user.isSenior,
    helpAreas: user.helpAreas,
    skillLevel: user.skillLevel,
    weeklyHours: user.weeklyHours,
    timelineMonths: user.timelineMonths,
  };
}

export async function loadUser(userId: string): Promise<ConnectUser | null> {
  if (!userId.trim()) throw new Error("Cannot load a profile without an authenticated Firebase UID.");
  const ref = doc(db, "users", userId);
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    logProfileFirebaseError("load user profile", "getDoc", error, userId, ref.path, {});
    throw error;
  }
  if (!snap.exists()) return null;
  return mapUser(snap.id, snap.data());
}

export async function ensureUserDocument(
  firebaseUser: User,
  extras?: Partial<AppStudentProfile>,
): Promise<ConnectUser> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  const base = {
    name: extras?.name || firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    phone: firebaseUser.phoneNumber || "",
    photoURL: firebaseUser.photoURL || "",
    college: extras?.college || "",
    country: extras?.country || DEFAULT_COUNTRY,
    state: extras?.state || "",
    city: extras?.city || "",
    branch: extras?.branch || "",
    year: extras?.year || "",
    skills: extras?.skills || [],
    interests: extras?.interests || [],
    bio: extras?.bio || "",
    goal: extras?.goal || "",
    skillLevel: extras?.skillLevel || "beginner",
    weeklyHours: extras?.weeklyHours || "7",
    timelineMonths: extras?.timelineMonths || "6",
    helpAreas: extras?.helpAreas || [],
    isSenior: extras?.isSenior || false,
    role: "student",
    online: true,
    lastSeen: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...base,
      isVerifiedSenior: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const existingData = snap.data();
    const updatePayload: Record<string, unknown> = {
      email: base.email || existingData?.email || "",
      phone: base.phone || existingData?.phone || "",
      photoURL: base.photoURL || existingData?.photoURL || "",
      online: true,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (extras?.name?.trim()) {
      updatePayload.name = extras.name.trim();
    } else if (base.name && (!existingData?.name || !String(existingData.name).trim())) {
      updatePayload.name = base.name;
    }
    await updateDoc(ref, updatePayload);
  }

  const next = await getDoc(ref);
  const nextData = next.data() ?? {};
  // Discovery-card sync must never turn a successful profile load into a
  // reported failure; the users/{uid} document is the source of truth.
  try {
    await syncPublicProfile(firebaseUser.uid, nextData);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[Profile] Public discovery-card sync failed (load still succeeds)", error);
    }
  }
  return mapUser(next.id, nextData);
}

/**
 * Records a social (Google/LinkedIn) sign-in on the existing user document:
 * merges the linked provider ids and stamps lastLoginAt. Never overwrites
 * profile fields. Failures are logged by the caller.
 */
export async function recordSocialSignIn(uid: string, providerIds: string[]): Promise<void> {
  if (!uid.trim()) throw new Error("Cannot record a sign-in without an authenticated Firebase UID.");
  const methods = providerIds.filter(Boolean);
  const ref = doc(db, "users", uid);
  // setDoc with merge (not updateDoc) so a first-time social sign-in —
  // where the user document may not exist yet — does not throw not-found.
  await setDoc(
    ref,
    {
      ...(methods.length > 0 ? { providers: arrayUnion(...methods) } : {}),
      lastLoginAt: serverTimestamp(),
      online: true,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function publicProfileData(data: DocumentData) {
  return {
    name: String(data.name ?? ""),
    photoURL: String(data.photoURL ?? ""),
    college: String(data.college ?? ""),
    country: String(data.country ?? DEFAULT_COUNTRY),
    state: String(data.state ?? ""),
    city: String(data.city ?? ""),
    branch: String(data.branch ?? ""),
    year: String(data.year ?? ""),
    skills: asStringArray(data.skills),
    interests: asStringArray(data.interests),
    bio: String(data.bio ?? ""),
    goal: String(data.goal ?? ""),
    helpAreas: asStringArray(data.helpAreas),
    isSenior: Boolean(data.isSenior),
    isVerifiedSenior: Boolean(data.isVerifiedSenior),
    role: String(data.role ?? "student"),
    online: Boolean(data.online),
    lastSeen: data.lastSeen ?? serverTimestamp(),
    createdAt: data.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
async function syncPublicProfile(uid: string, data: DocumentData): Promise<void> {
  const ref = doc(db, "publicProfiles", uid);
  const publicData = publicProfileData(data);
  const method = "setDoc(...)";
  logProfileWrite("write public profile", method, ref.path, uid, publicData);
  try {
    // Replace the discovery document so legacy/private fields are removed.
    // Merge writes preserve any old fields and make the public-profile rules
    // correctly reject the resulting document.
    await setDoc(ref, publicData);
  } catch (error) {
    logProfileFirebaseError("write public profile", method, error, uid, ref.path, publicData);
    throw error;
  }
}

export async function saveConnectProfile(
  uid: string,
  profile: AppStudentProfile,
  photoURL = "",
  email = "",
  phone = "",
): Promise<void> {
  if (!uid.trim()) throw new Error("Cannot save a profile without an authenticated Firebase UID.");
  if (auth.currentUser?.uid !== uid) {
    const error = new Error("The profile UID does not match the currently authenticated Firebase user.") as Error & { code: string };
    error.code = auth.currentUser ? "auth/user-mismatch" : "auth/no-current-user";
    if (import.meta.env.DEV) {
      console.error("[Firebase] Profile save authentication check failed", {
        operation: "verify authenticated profile UID",
        code: error.code,
        message: error.message,
        uid,
        authenticatedUid: auth.currentUser?.uid ?? null,
        documentPath: `users/${uid}`,
      });
    }
    throw error;
  }
  const ref = doc(db, "users", uid);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please log in first (Google or phone), then save your profile.");
  }
  const verifiedPhone = currentUser.phoneNumber || "";
  const typedPhone = phone.trim();
  // The Firestore rules only accept a phone number that is empty or matches
  // the verified number on the Firebase Auth account. Anything else is
  // rejected with permission-denied, so fall back to the stored value
  // instead of failing the entire save. App-level validation warns first.
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    logProfileFirebaseError("read profile before save", "getDoc", error, uid, ref.path, {});
    throw error;
  }
  const existing = snap.exists() ? snap.data() : null;
  const phoneToSave =
    !typedPhone || typedPhone === verifiedPhone
      ? typedPhone
      : String(existing?.phone ?? "");
  if (typedPhone && phoneToSave !== typedPhone && import.meta.env.DEV) {
    console.info(
      "[Profile] Typed phone number is not the verified account number; keeping the stored value so the save succeeds.",
    );
  }
  const payload = {
    name: profile.name.trim(),
    email,
    phone: phoneToSave,
    // Preserve a previously saved provider photo when the current auth
    // profile temporarily has no photo URL (for example, during refresh).
    photoURL: photoURL || String(existing?.photoURL ?? currentUser.photoURL ?? ""),
    college: profile.college.trim(),
    country: profile.country.trim() || DEFAULT_COUNTRY,
    state: profile.state.trim(),
    city: profile.city.trim(),
    branch: profile.branch.trim(),
    year: profile.year,
    skills: profile.skills,
    interests: profile.interests,
    bio: profile.bio.trim(),
    goal: profile.goal.trim(),
    skillLevel: profile.skillLevel,
    weeklyHours: profile.weeklyHours,
    timelineMonths: profile.timelineMonths,
    helpAreas: profile.isSenior ? profile.helpAreas : [],
    isSenior: profile.isSenior,
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Keep this payload limited to Firestore-supported values. This guard also
  // catches regressions where an optional form field becomes undefined.
  for (const [field, value] of Object.entries(payload)) {
    if (value === undefined) {
      const error = new Error(`Profile field "${field}" is undefined.`);
      console.error("[Firebase] Profile payload validation failed", {
        operation: "validate profile payload",
        code: "profile/undefined-field",
        message: error.message,
        uid,
        documentPath: ref.path,
        field,
      });
      throw error;
    }
  }

  if (!snap.exists()) {
    // isVerifiedSenior must be false on create to satisfy the rules.
    const createPayload = {
      ...payload,
      isVerifiedSenior: false,
      online: true,
      createdAt: serverTimestamp(),
    };
    const method = "setDoc(..., { merge: true })";
    logProfileWrite("create user profile", method, ref.path, currentUser.uid, createPayload);
    try {
      await setDoc(ref, createPayload, { merge: true });
    } catch (error) {
      logProfileFirebaseError("create user profile", method, error, uid, ref.path, createPayload);
      throw error;
    }
    await syncPublicProfile(uid, createPayload).catch((syncError) => {
      // The users/{uid} write above already succeeded; a discovery-card
      // failure must not report the whole save as failed.
      if (import.meta.env.DEV) {
        console.warn("[Profile] Public discovery-card sync failed (save still succeeds)", syncError);
      }
    });
    return;
  }

  const method = "setDoc(..., { merge: true })";
  logProfileWrite("update user profile", method, ref.path, currentUser.uid, payload);
  try {
    // Merge update: preserves createdAt/isVerifiedSenior/online and only
    // overwrites the allowlisted profile fields above.
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    logProfileFirebaseError("update user profile", method, error, uid, ref.path, payload);
    throw error;
  }
  await syncPublicProfile(uid, { ...snap.data(), ...payload }).catch((syncError) => {
    // The users/{uid} write above already succeeded; a discovery-card
    // failure must not report the whole save as failed.
    if (import.meta.env.DEV) {
      console.warn("[Profile] Public discovery-card sync failed (save still succeeds)", syncError);
    }
  });
}

function logProfileWrite(
  operation: string,
  method: string,
  documentPath: string,
  uid: string,
  payload: Record<string, unknown>,
) {
  if (!import.meta.env.DEV) return;
  const currentUser = auth.currentUser;
  console.info("[Firebase] Profile write", {
    operation,
    method,
    collection: documentPath.split("/")[0],
    documentId: documentPath.split("/")[1],
    documentPath,
    uid,
    currentUserUid: currentUser?.uid ?? null,
    currentUserIsNull: currentUser === null,
    signInProviders: currentUser?.providerData.map(({ providerId }) => providerId) ?? [],
    projectId: db.app.options.projectId ?? "unknown",
    envProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "missing",
    databaseId: FIRESTORE_DATABASE_ID,
    payloadKeys: Object.keys(payload),
    payloadTypes: Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        value === null ? "null" : Array.isArray(value) ? "array" : typeof value,
      ]),
    ),
  });
}

function logProfileFirebaseError(
  operation: string,
  method: string,
  error: unknown,
  uid: string,
  documentPath: string,
  payload: Record<string, unknown>,
) {
  const firebaseError = error as { code?: unknown; message?: unknown };
  if (!import.meta.env.DEV) return;
  const currentUser = auth.currentUser;
  console.error("[Firebase] Profile operation failed", {
    operation,
    method,
    code: typeof firebaseError?.code === "string" ? firebaseError.code : "unknown",
    message: typeof firebaseError?.message === "string" ? firebaseError.message : String(error),
    uid,
    currentUserUid: currentUser?.uid ?? null,
    currentUserIsNull: currentUser === null,
    signInProviders: currentUser?.providerData.map(({ providerId }) => providerId) ?? [],
    projectId: db.app.options.projectId ?? "unknown",
    envProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "missing",
    databaseId: FIRESTORE_DATABASE_ID,
    collection: documentPath.split("/")[0],
    documentId: documentPath.split("/")[1],
    documentPath,
    payloadKeys: Object.keys(payload),
    payloadTypes: Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        value === null ? "null" : Array.isArray(value) ? "array" : typeof value,
      ]),
    ),
    error,
  });
}

export async function setUserPresence(uid: string, online: boolean): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { online, lastSeen: serverTimestamp() });
  await setDoc(doc(db, "publicProfiles", uid), { online, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Dev-only listener failure reporter. In production the optional caller
 * callback still runs; nothing is shown to the user from here.
 */
function devListenerError(
  source: string,
  collectionPath: string,
  onError: ((error: Error) => void) | undefined,
  error: Error,
) {
  if (import.meta.env.DEV) {
    const code = (error as { code?: unknown }).code;
    console.error(`[Connect] ${source} listener failed`, {
      function: source,
      collectionPath,
      uid: auth.currentUser?.uid ?? null,
      projectId: db.app.options.projectId ?? "unknown",
      databaseId: FIRESTORE_DATABASE_ID,
      code: typeof code === "string" ? code : "unknown",
      message: error.message,
    });
  }
  onError?.(error);
}

export function listenUsers(
  onChange: (users: ConnectUser[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "publicProfiles"),
    (snap) => {
      onChange(snap.docs.map((item) => mapUser(item.id, item.data())));
    },
    (error) => devListenerError("listenUsers", "publicProfiles", onError, error),
  );
}

function mapConnectionRequest(id: string, data: DocumentData): ConnectionRequest {
  const rawStatus = String(data.status ?? "pending");
  return {
    id,
    senderId: String(data.senderId ?? ""),
    recipientId: String(data.recipientId ?? ""),
    status: rawStatus === "accepted" || rawStatus === "declined" ? rawStatus : "pending",
    createdAt: millis(data.createdAt),
    updatedAt: millis(data.updatedAt),
  };
}

/** Listen only to requests sent by or addressed to the signed-in user. */
export function listenConnectionRequests(
  uid: string,
  onChange: (requests: ConnectionRequest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const authUid = auth.currentUser?.uid ?? null;
  if (import.meta.env.DEV) {
    console.info("[Connect] listenConnectionRequests subscribe", {
      function: "listenConnectionRequests",
      collection: "connectionRequests",
      queries: [
        "where(senderId == uid)",
        "where(recipientId == uid)",
      ],
      uid,
      authUid,
      projectId: db.app.options.projectId ?? "unknown",
    });
  }
  if (!uid || authUid !== uid) {
    const error = new Error("Wait for sign-in to finish before loading connection requests.") as Error & { code: string };
    error.code = "auth/no-current-user";
    if (import.meta.env.DEV) {
      console.error("[Connect] listenConnectionRequests rejected before query", {
        function: "listenConnectionRequests",
        collection: "connectionRequests",
        uid,
        authUid,
        code: error.code,
        message: error.message,
      });
    }
    onError?.(error);
    return () => undefined;
  }
  let outgoing: ConnectionRequest[] = [];
  let incoming: ConnectionRequest[] = [];
  let outgoingReady = false;
  let incomingReady = false;
  let failed = false;
  let outgoingUnsubscribe: Unsubscribe = () => undefined;
  let incomingUnsubscribe: Unsubscribe = () => undefined;
  const handleListenerError = (error: Error) => {
    if (failed) return;
    failed = true;
    outgoingUnsubscribe();
    incomingUnsubscribe();
    onError?.(error);
  };
  const publish = () => {
    if (!outgoingReady || !incomingReady) return;
    const combined = new Map<string, ConnectionRequest>();
    [...outgoing, ...incoming].forEach((item) => combined.set(item.id, item));
    onChange([...combined.values()].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
  };
  outgoingUnsubscribe = onSnapshot(
    query(collection(db, "connectionRequests"), where("senderId", "==", uid)),
    (snap) => {
      outgoing = snap.docs.map((item) => mapConnectionRequest(item.id, item.data()));
      outgoingReady = true;
      publish();
    },
    handleListenerError,
  );
  incomingUnsubscribe = onSnapshot(
    query(collection(db, "connectionRequests"), where("recipientId", "==", uid)),
    (snap) => {
      incoming = snap.docs.map((item) => mapConnectionRequest(item.id, item.data()));
      incomingReady = true;
      publish();
    },
    handleListenerError,
  );
  return () => {
    outgoingUnsubscribe();
    incomingUnsubscribe();
  };
}

export async function sendConnectionRequest(senderId: string, recipientId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || senderId !== user.uid) throw new Error("Please sign in to connect with another student.");
  if (!recipientId || recipientId === senderId) throw new Error("You can’t send a connection request to yourself.");
  const ref = doc(db, "connectionRequests", `${senderId}__${recipientId}`);
  await setDoc(ref, {
    senderId,
    recipientId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function respondToConnectionRequest(
  request: Pick<ConnectionRequest, "id" | "status" | "senderId" | "recipientId">,
  uid: string,
  status: "accepted" | "declined",
): Promise<void> {
  if (auth.currentUser?.uid !== uid || request.recipientId !== uid || request.status !== "pending") {
    throw new Error("This request is no longer available to respond to.");
  }
  await updateDoc(doc(db, "connectionRequests", request.id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function listenUser(
  userId: string,
  onChange: (user: ConnectUser | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "publicProfiles", userId),
    (snap) => {
      onChange(snap.exists() ? mapUser(snap.id, snap.data()) : null);
    },
    (error) => devListenerError("listenUser", `publicProfiles/${userId}`, onError, error),
  );
}

export async function listBlockedIds(uid: string): Promise<Set<string>> {
  const [outgoing, incoming] = await Promise.all([
    getDocs(query(collection(db, "blocks"), where("blockedBy", "==", uid))),
    getDocs(query(collection(db, "blocks"), where("blockedUser", "==", uid))),
  ]);
  const ids = new Set<string>();
  outgoing.forEach((item) => ids.add(String(item.data().blockedUser ?? "")));
  incoming.forEach((item) => ids.add(String(item.data().blockedBy ?? "")));
  ids.delete("");
  return ids;
}

export function listenOutgoingBlocks(
  uid: string,
  onChange: (ids: Set<string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "blocks"), where("blockedBy", "==", uid)),
    (snap) => {
      const ids = new Set<string>();
      snap.forEach((item) => ids.add(String(item.data().blockedUser ?? "")));
      ids.delete("");
      onChange(ids);
    },
    (error) => devListenerError("listenOutgoingBlocks", "blocks where(blockedBy == uid)", onError, error),
  );
}

export async function blockUser(blockedBy: string, blockedUser: string): Promise<void> {
  await setDoc(doc(db, "blocks", blockIdFor(blockedBy, blockedUser)), {
    blockedBy,
    blockedUser,
    createdAt: serverTimestamp(),
  });
}

export async function unblockUser(blockedBy: string, blockedUser: string): Promise<void> {
  await deleteDoc(doc(db, "blocks", blockIdFor(blockedBy, blockedUser)));
}

export async function reportUser(input: {
  reportedBy: string;
  reportedUser: string;
  reason: string;
  description: string;
}): Promise<void> {
  await addDoc(collection(db, "reports"), {
    ...input,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export function listenConversations(
  uid: string,
  onChange: (items: Conversation[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "conversations"),
      where("participants", "array-contains", uid),
    ),
    (snap) => {
      const items = snap.docs
        .map((item: QueryDocumentSnapshot<DocumentData>) =>
          mapConversation(item.id, item.data()),
        )
        .filter((item) => !item.hiddenFor.includes(uid))
        .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
      onChange(items);
    },
    (error) => devListenerError("listenConversations", "conversations array-contains(participants == uid)", onError, error),
  );
}

export async function openConversation(me: string, other: string): Promise<string> {
  const id = conversationIdFor(me, other);
  const ref = doc(db, "conversations", id);
  const snap = await getDoc(ref);
  const [userLow, userHigh] = [me, other].sort();
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [me, other],
      userLow,
      userHigh,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      hiddenFor: [],
      unread: { [me]: 0, [other]: 0 },
    });
  } else {
    await updateDoc(ref, { hiddenFor: arrayRemove(me) });
  }
  return id;
}

export async function hideConversation(conversationId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    hiddenFor: arrayUnion(uid),
  });
}

export function listenMessages(
  conversationId: string,
  onChange: (items: ChatMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    ),
    (snap) => {
      onChange(snap.docs.map((item) => mapMessage(item.id, item.data())));
    },
    (error) => devListenerError("listenMessages", `conversations/${conversationId}/messages`, onError, error),
  );
}

export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const [one, two] = await Promise.all([
    getDoc(doc(db, "blocks", blockIdFor(a, b))),
    getDoc(doc(db, "blocks", blockIdFor(b, a))),
  ]);
  return one.exists() || two.exists();
}

export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (await isBlockedEitherWay(senderId, recipientId)) {
    throw new Error("Messaging is unavailable because one of you has blocked the other.");
  }

  const convRef = doc(db, "conversations", conversationId);
  await addDoc(collection(convRef, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });

  const unreadKey = `unread.${recipientId}`;
  await updateDoc(convRef, {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    hiddenFor: [],
    [unreadKey]: increment(1),
    [`unread.${senderId}`]: 0,
  });
}

export async function markConversationRead(
  conversationId: string,
  uid: string,
  messages: ChatMessage[],
): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unread.${uid}`]: 0,
  });
  const unread = messages.filter(
    (item) => item.senderId !== uid && !item.readBy.includes(uid),
  );
  await Promise.all(
    unread.slice(-40).map((item) =>
      updateDoc(doc(db, "conversations", conversationId, "messages", item.id), {
        readBy: arrayUnion(uid),
      }),
    ),
  );
}

let groupsSeeded = false;

export async function ensureDefaultGroups(): Promise<void> {
  if (groupsSeeded) return;
  groupsSeeded = true;
  await Promise.all(DEFAULT_GROUPS.map(async (group) => {
    const ref = doc(db, "groups", group.id);
    if ((await getDoc(ref)).exists()) return;
    await setDoc(ref, {
      name: group.name,
      description: group.description,
      category: group.category,
      country: group.country,
      state: group.state,
      type: "public",
      createdBy: "system",
      admins: [],
      members: [],
      memberCount: 0,
      createdAt: serverTimestamp(),
    });
  }));
}

export function listenGroups(
  onChange: (items: ConnectGroup[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "groups"),
    (snap) => {
      onChange(
        snap.docs
          .map((item) => mapGroup(item.id, item.data()))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
    (error) => devListenerError("listenGroups", "groups", onError, error),
  );
}

export function listenMyGroupIds(
  uid: string,
  onChange: (ids: Set<string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "groupMembers"), where("userId", "==", uid)),
    (snap) => {
      const ids = new Set<string>();
      snap.forEach((item) => ids.add(String(item.data().groupId ?? "")));
      ids.delete("");
      onChange(ids);
    },
    (error) => devListenerError("listenMyGroupIds", "groupMembers where(userId == uid)", onError, error),
  );
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  const memberRef = doc(db, "groups", groupId, "members", uid);
  const existing = await getDoc(memberRef);
  if (existing.exists()) return;
  const batch = writeBatch(db);
  batch.set(memberRef, {
    joinedAt: serverTimestamp(),
    role: "member",
    userId: uid,
    groupId,
  });
  batch.set(doc(db, "groupMembers", `${groupId}_${uid}`), {
    groupId,
    userId: uid,
    joinedAt: serverTimestamp(),
    role: "member",
  });
  batch.update(doc(db, "groups", groupId), {
    memberCount: increment(1),
    members: arrayUnion(uid),
  });
  await batch.commit();
}

export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, "groups", groupId, "members", uid));
  await deleteDoc(doc(db, "groupMembers", `${groupId}_${uid}`));
  const ref = doc(db, "groups", groupId);
  const snap = await getDoc(ref);
  const data = snap.data();
  const admins = Array.isArray(data?.admins)
    ? (data.admins as unknown[]).map(String)
    : [];
  const members = Array.isArray(data?.members)
    ? (data.members as unknown[]).map(String)
    : [];
  const payload: Record<string, unknown> = {
    memberCount: increment(-1),
    members: arrayRemove(uid),
  };
  if (admins.includes(uid)) {
    // Keep at least one admin: promote the longest-standing other member if any.
    const others = members.filter((id) => id !== uid);
    payload.admins = admins.length > 1 ? arrayRemove(uid) : others.length ? others.slice(0, 1) : arrayRemove(uid);
  }
  await updateDoc(ref, payload);
}

/**
 * Create a new teammate group. The creator automatically becomes admin/member.
 * Generates a unique group ID via Firestore.
 */
export async function createGroup(
  creatorId: string,
  input: {
    name: string;
    description: string;
    type: "public" | "private";
    memberIds: string[];
    category?: string;
  },
): Promise<string> {
  const name = input.name.trim();
  if (!creatorId) throw new Error("Please log in before creating a group.");
  if (!name) throw new Error("Give your group a name.");
  if (name.length > 100) throw new Error("Group names must be 100 characters or fewer.");
  const memberIds = [...new Set([creatorId, ...input.memberIds.filter(Boolean)])];
  const ref = doc(collection(db, "groups"));
  const batch = writeBatch(db);
  batch.set(ref, {
    name,
    description: input.description.trim(),
    type: input.type,
    createdBy: creatorId,
    admins: [creatorId],
    members: memberIds,
    memberCount: memberIds.length,
    category: input.category?.trim() || "Custom",
    country: DEFAULT_COUNTRY,
    state: "",
    createdAt: serverTimestamp(),
  });
  memberIds.forEach((uid) => {
      batch.set(doc(db, "groups", ref.id, "members", uid), {
        joinedAt: serverTimestamp(),
        role: uid === creatorId ? "admin" : "member",
        userId: uid,
        groupId: ref.id,
      });
      batch.set(doc(db, "groupMembers", `${ref.id}_${uid}`), {
        groupId: ref.id,
        userId: uid,
        joinedAt: serverTimestamp(),
        role: uid === creatorId ? "admin" : "member",
      });
  });
  await batch.commit();
  return ref.id;
}

/** Admin adds teammates to a group. */
export async function addGroupMembers(
  groupId: string,
  uids: string[],
): Promise<void> {
  const groupRef = doc(db, "groups", groupId);
  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) throw new Error("This group no longer exists.");
  const existingMembers = asStringArray(groupSnapshot.data().members);
  const fresh = [...new Set(uids.filter((uid) => Boolean(uid) && !existingMembers.includes(uid)))];
  if (!fresh.length) return;
  const batch = writeBatch(db);
  fresh.forEach((uid) => {
    batch.set(doc(db, "groups", groupId, "members", uid), {
      joinedAt: serverTimestamp(),
      role: "member",
      userId: uid,
      groupId,
    });
    batch.set(doc(db, "groupMembers", `${groupId}_${uid}`), {
      groupId,
      userId: uid,
      joinedAt: serverTimestamp(),
      role: "member",
    });
  });
  batch.update(groupRef, {
    members: arrayUnion(...fresh),
    memberCount: increment(fresh.length),
  });
  await batch.commit();
}

/** Admin removes a member from a group. */
export async function removeGroupMember(groupId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, "groups", groupId, "members", uid));
  await deleteDoc(doc(db, "groupMembers", `${groupId}_${uid}`));
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayRemove(uid),
    admins: arrayRemove(uid),
    memberCount: increment(-1),
  });
}

export function listenGroupMembers(
  groupId: string,
  onChange: (ids: string[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "groups", groupId, "members"),
    (snap) => {
      onChange(snap.docs.map((item) => item.id));
    },
    (error) => devListenerError("listenGroupMembers", `groups/${groupId}/members`, onError, error),
  );
}

export function listenGroupMessages(
  groupId: string,
  onChange: (items: ChatMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "groups", groupId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    ),
    (snap) => {
      onChange(snap.docs.map((item) => mapMessage(item.id, item.data())));
    },
    (error) => devListenerError("listenGroupMessages", `groups/${groupId}/messages`, onError, error),
  );
}

export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(collection(db, "groups", groupId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });
}

export function listenProjects(
  uid: string,
  onChange: (items: ProjectRequest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!uid || auth.currentUser?.uid !== uid) {
    const error = new Error("Wait for sign-in to finish before loading project requests.") as Error & { code: string };
    error.code = "auth/no-current-user";
    onError?.(error);
    return () => undefined;
  }
  return onSnapshot(
    query(collection(db, "projectRequests"), where("status", "==", "open"), orderBy("createdAt", "desc"), limit(80)),
    (snap) => {
      onChange(snap.docs.map((item) => mapProject(item.id, item.data())));
    },
    (error) => onError?.(error),
  );
}

export async function createProjectRequest(
  creatorId: string,
  input: Omit<ProjectRequest, "id" | "creatorId" | "createdAt" | "status">,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error("Please log in to continue.") as Error & { code: string };
    error.code = "auth/no-current-user";
    throw error;
  }
  if (!creatorId || creatorId !== user.uid) {
    const error = new Error("The project creator UID does not match the signed-in user.") as Error & { code: string };
    error.code = "auth/user-mismatch";
    console.error("[Firebase] Project request authentication check failed", {
      operation: "verify authenticated project creator",
      code: error.code,
      message: error.message,
      suppliedUid: creatorId,
      authenticatedUid: user.uid,
      collectionPath: "projectRequests",
    });
    throw error;
  }
  if (!input.projectName.trim()) throw new Error("Enter a project name.");
  if (!input.description.trim()) throw new Error("Enter a project description.");
  if (!Number.isInteger(input.teamSize) || input.teamSize < 1 || input.teamSize > 100) {
    throw new Error("Team size must be between 1 and 100.");
  }
  const payload = {
    creatorId: user.uid,
    projectName: input.projectName.trim(),
    description: input.description.trim(),
    technologies: Array.isArray(input.technologies) ? input.technologies.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [],
    requiredSkills: Array.isArray(input.requiredSkills) ? input.requiredSkills.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [],
    teamSize: input.teamSize,
    college: input.college.trim(),
    country: input.country.trim() || DEFAULT_COUNTRY,
    state: input.state.trim(),
    deadline: input.deadline.trim(),
    status: "open",
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "projectRequests"), payload);
  } catch (error) {
    const firebaseError = error as { code?: unknown; message?: unknown };
    console.error("[Firebase] Project request create failed", {
      operation: "create document",
      collectionPath: "projectRequests",
      creatorUid: user.uid,
      code: typeof firebaseError?.code === "string" ? firebaseError.code : "unknown",
      message: typeof firebaseError?.message === "string" ? firebaseError.message : String(error),
      error,
    });
    throw error;
  }
}
