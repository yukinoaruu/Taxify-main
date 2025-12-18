/**
 * Инициализация Firebase SDK (Auth + Firestore) для фронтенда.
 *
 * ВАЖНО: сюда нужно вставить конфиг вашего проекта Firebase
 * из консоли Firebase (раздел Project Settings → Your apps → Web app).
 */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Замените плейсхолдеры на реальные значения из Firebase Console.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Устанавливаем persistence для работы на разных устройствах
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

export const googleProvider = new GoogleAuthProvider();
// Добавляем дополнительные scopes для получения email и профиля
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const appleProvider = new OAuthProvider("apple.com");
export const db = getFirestore(app);

