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
 * Очищує рядок від пробілів та замінює кому на крапку для коректного перетворення в число.
 */
const cleanNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Видаляємо всі пробіли (включаючи нерозривні) та замінюємо кому на крапку
  const cleaned = String(val).replace(/[\s\u00A0]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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
      // Ensure amount is a number (cleaning spaces/commas)
      const safeAmount = cleanNumber(data.amount);
      const safeAmountUah = data.amountUah !== undefined ? cleanNumber(data.amountUah) : undefined;

      incomes.push({
        ...data,
        id: data.id,
        amount: safeAmount,
        amountUah: safeAmountUah,
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

    // Firestore не любить undefined — видаляємо всі такі поля з payload.
    const payload: any = {
      id: income.id,
      amount: income.amount,
      currency: income.currency,
      date: income.date,
      description: income.description,
      source: income.source,
      userId: uid,
    };

    // Добавляем только те поля, которые не undefined
    if (income.originalDocumentUrl) {
      payload.originalDocumentUrl = income.originalDocumentUrl;
    }
    if (income.amountUah !== undefined && income.amountUah !== null) {
      payload.amountUah = income.amountUah;
    }
    if (income.attachments && income.attachments.length > 0) {
      payload.attachments = income.attachments;
    }
    if (income.clientOrProject) {
      payload.clientOrProject = income.clientOrProject;
    }
    if (income.comment) {
      payload.comment = income.comment;
    }
    if (income.category) {
      payload.category = income.category;
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

  /**
   * Отримати всі чати поточного користувача.
   */
  getChats: async (): Promise<any[]> => {
    const uid = getCurrentUserId();
    if (!uid) return [];

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("userId", "==", uid));
    const snapshot = await getDocs(q);

    const chats: any[] = [];
    snapshot.forEach((docSnap) => {
      chats.push({ ...docSnap.data() as any, id: docSnap.data().id || docSnap.id });
    });
    // Сортуємо за часом (найновіші зверху)
    return chats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  /**
   * Зберегти/оновити чат у Firestore.
   */
  saveChat: async (chat: any): Promise<void> => {
    const uid = getCurrentUserId();
    if (!uid) return;

    // Шукаємо існуючий документ чату за його внутрішнім id
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("userId", "==", uid), where("id", "==", chat.id));
    const snapshot = await getDocs(q);

    const payload = {
      ...chat,
      userId: uid,
    };

    if (!snapshot.empty) {
      // Оновлюємо існуючий
      const docRef = snapshot.docs[0].ref;
      await setDoc(docRef, payload, { merge: true });
    } else {
      // Створюємо новий
      await addDoc(chatsRef, payload);
    }
  },

  /**
   * Видалити чат з Firestore.
   */
  deleteChat: async (chatId: string): Promise<void> => {
    const uid = getCurrentUserId();
    if (!uid) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("userId", "==", uid), where("id", "==", chatId));
    const snapshot = await getDocs(q);

    const batchDeletes: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      batchDeletes.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(batchDeletes);
  },
};