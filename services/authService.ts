import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, appleProvider, db } from "../firebaseConfig";
import { UserProfile, FopGroup, TaxRate } from "../types";

/**
 * Преобразует Firebase User + данные профиля из БД в доменную модель UserProfile.
 */
const buildUserProfile = (user: User, data?: Partial<UserProfile>): UserProfile => {
  return {
    name: data?.name || user.displayName || "Entrepreneur",
    email: user.email || undefined,
    photoUrl: user.photoURL || undefined,
    group: data?.group ?? FopGroup.GROUP_3,
    taxRate: data?.taxRate ?? TaxRate.PERCENT_5,
    hasEmployees: data?.hasEmployees ?? false,
    isOnboarded: data?.isOnboarded ?? false,
  };
};

/**
 * Получает или создаёт документ профиля в Firestore для указанного пользователя.
 */
const getOrCreateUserProfile = async (user: User): Promise<UserProfile> => {
  const ref = doc(db, "profiles", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = buildUserProfile(user);
    await setDoc(ref, profile);
    return profile;
  }

  const data = snap.data() as UserProfile;
  return buildUserProfile(user, data);
};

export const authService = {
  /**
   * Логин через Google OAuth (Firebase Auth).
   */
  loginWithGoogle: async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return getOrCreateUserProfile(user);
  },

  /**
   * Логин через Apple ID (Firebase Auth).
   */
  loginWithApple: async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;
    return getOrCreateUserProfile(user);
  },

  /**
   * Регистрация по email и паролю.
   */
  registerWithEmail: async (email: string, password: string): Promise<UserProfile> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    return getOrCreateUserProfile(user);
  },

  /**
   * Логин по email и паролю.
   */
  loginWithEmail: async (email: string, password: string): Promise<UserProfile> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    return getOrCreateUserProfile(user);
  },

  /**
   * Подписка на изменение состояния аутентификации.
   */
  onAuthChange: (callback: (profile: UserProfile | null) => void): (() => void) => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }
      const profile = await getOrCreateUserProfile(user);
      callback(profile);
    });
  },

  /**
   * Выход из аккаунта.
   */
  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  /**
   * Проверка, авторизован ли пользователь.
   */
  isAuthenticated: (): boolean => {
    return !!auth.currentUser;
  }
};