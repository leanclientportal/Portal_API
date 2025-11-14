
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDYg1mqCU2SJd-TVWZQE0Sz-1fb600tCS4",
  authDomain: "leanclientportal-fe6d0.firebaseapp.com",
  projectId: "leanclientportal-fe6d0",
  storageBucket: "leanclientportal-fe6d0.firebasestorage.app",
  messagingSenderId: "664632338886",
  appId: "1:664632338886:web:28d110ef7646b6e1416ac7",
  measurementId: "G-VDLQMN90BC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
