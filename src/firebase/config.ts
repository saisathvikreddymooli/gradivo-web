import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQWKxP5sYd5Rke1EdwB5qUTd4CLDB8850",
  authDomain: "gradivo-web.firebaseapp.com",
  projectId: "gradivo-web",
  storageBucket: "gradivo-web.firebasestorage.app",
  messagingSenderId: "1005068642083",
  appId: "1:1005068642083:web:89b7de2b012a1c16800e96",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);