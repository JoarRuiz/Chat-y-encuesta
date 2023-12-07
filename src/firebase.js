// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBON97ckkhUBxccZE3I28r5-OyznXILiKk",
  authDomain: "votacionescolar-7ae55.firebaseapp.com",
  projectId: "votacionescolar-7ae55",
  storageBucket: "votacionescolar-7ae55.appspot.com",
  messagingSenderId: "1053230896275",
  appId: "1:1053230896275:web:a746d39fa226738b216966",
  measurementId: "G-NCHP28KVFZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export {auth, db};