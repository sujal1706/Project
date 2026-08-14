
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "fir-1f8fe.firebaseapp.com",
  projectId: "fir-1f8fe",
  storageBucket: "fir-1f8fe.firebasestorage.app",
  messagingSenderId: "143971826184",
  appId: "1:143971826184:web:afff173c89f4c8f7632fbd"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth , provider}