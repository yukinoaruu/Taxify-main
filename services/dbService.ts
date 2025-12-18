import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { Income, UserProfile, Alert, FopGroup, TaxRate } from "../types";

const DEFAULT_PROFILE: UserProfile = {
  name: "Entrepreneur",
  group: FopGroup.GROUP_3,
  taxRate: TaxRate.PERCENT_5,
  hasEmployees: false,
  isOnboarded: false,
};

/**
 * Возвращает UID текущего пользователя или null.
 */
const getCurrentUserId = (): string | null => {
  return auth.currentUser ? auth.currentUser.uid : null;
};

/**
 * Сервис доступа к данным пользователя в Firestore (профиль, доходы, алерты).
 */
export const dbService = {
  /**
   * Получить профиль текущего пользователя из Firestore.
   */
  getProfile: async (): Promise<UserProfile> => {
    const uid = getCurrentUserId();
    if (!uid) {
      return DEFAULT_PROFILE;
    }

    const ref = doc(db, "profiles", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile = DEFAULT_PROFILE;
      await setDoc(ref, profile);
      return profile;
    }

    return snap.data() as UserProfile;
  },

  /**
   * Сохранить профиль текущего пользователя в Firestore.
   */
  saveProfile: async (profile: UserProfile): Promise<void> => {
    const uid = getCurrentUserId();
    if (!uid) {
      throw new Error("User is not authenticated");
    }
    const ref = doc(db, "profiles", uid);
    await setDoc(ref, profile, { merge: true });
  },

  /**
   * Получить список доходов текущего пользователя.
   */
  getIncomes: async (): Promise<Income[]> => {
    const uid = getCurrentUserId();
    if (!uid) {
      return [];
    }

    const incomesRef = collection(db, "incomes");
    const q = query(incomesRef, where("userId", "==", uid));
    const snapshot = await getDocs(q);

    const incomes: Income[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Income & { userId: string };
      incomes.push({
        ...data,
        id: data.id,
      });
    });

    return incomes;
  },

  /**
   * Добавить доход для текущего пользователя.
   */
  addIncome: async (income: Income): Promise<void> => {
    const uid = getCurrentUserId();
    if (!uid) {
      throw new Error("User is not authenticated");
    }

    const incomesRef = collection(db, "incomes");

    // Firestore не любить undefined — видаляємо такі поля з payload.
    const { originalDocumentUrl, amountUah, attachments, ...rest } = income;
    const payload: any = {
      ...rest,
      userId: uid,
    };
    if (originalDocumentUrl) {
      payload.originalDocumentUrl = originalDocumentUrl;
    }
    if (amountUah !== undefined && amountUah !== null) {
      payload.amountUah = amountUah;
    }
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    await addDoc(incomesRef, payload);
  },

  /**
   * Удалить доход по ID для текущего пользователя.
   */
  deleteIncome: async (id: string): Promise<void> => {
    const uid = getCurrentUserId();
    if (!uid) {
      throw new Error("User is not authenticated");
    }

    const incomesRef = collection(db, "incomes");
    const q = query(incomesRef, where("userId", "==", uid), where("id", "==", id));
    const snapshot = await getDocs(q);

    const batchDeletes: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      batchDeletes.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(batchDeletes);
  },

  /**
   * Получить алерты текущего пользователя.
   */
  getAlerts: async (): Promise<Alert[]> => {
    const uid = getCurrentUserId();
    if (!uid) {
      return [];
    }

    const alertsRef = collection(db, "alerts");
    const q = query(alertsRef, where("userId", "==", uid));
    const snapshot = await getDocs(q);

    const alerts: Alert[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Alert & { userId: string };
      alerts.push({
        ...data,
        id: data.id,
      });
    });

    return alerts;
  },
};
