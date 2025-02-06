import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDrWpQfZcD5Mc5i4wZ2SnqajsIyxrWxny4",
    authDomain: "ask-your-pdf-4515d.firebaseapp.com",
    projectId: "ask-your-pdf-4515d",
    storageBucket: "ask-your-pdf-4515d.firebasestorage.app",
    messagingSenderId: "994765335106",
    appId: "1:994765335106:web:56e2c6ecb9b245404d9bdb"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

const storage = getStorage(app);


export { db, storage };