import firebase, { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAooeCIvvo4nQErfB13jwUVjEHWci3Dluk",
  authDomain: "tutter-19d25.firebaseapp.com",
  projectId: "tutter-19d25",
  storageBucket: "tutter-19d25.appspot.com",
  messagingSenderId: "959546339096",
  appId: "1:959546339096:web:819241628f0d72d449f86d",
};


export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);

