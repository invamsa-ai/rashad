// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// كود التكوين الخاص بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyDUMTx2dzA0ztgO4y-akvRr_CZvYee46ss",
  authDomain: "fath-5d572.firebaseapp.com",
  projectId: "fath-5d572",
  storageBucket: "fath-5d572.firebasestorage.app",
  messagingSenderId: "436842717690",
  appId: "1:436842717690:web:22225f8942b70cf87b4443"
};

// تهيئة الفايربيس
const app = initializeApp(firebaseConfig);

// تهيئة واستيراد قاعدة البيانات Firestore
export const db = getFirestore(app);
