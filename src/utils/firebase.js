import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// ?? GANTI DENGAN CONFIG PUNYA ANDA
const firebaseConfig = {
    apiKey: "AIzaSyAf0fioxEYOhfFB01wS3VkKBDD3NS_JK5g",
    authDomain: "sell-out-83e61.firebaseapp.com",
    databaseURL: "https://sell-out-83e61-default-rtdb.firebaseio.com",
    projectId: "sell-out-83e61",
    storageBucket: "sell-out-83e61.firebasestorage.app",
    messagingSenderId: "1008883293375",
    appId: "1:1008883293375:web:4ff8de6020401d4a4cba0a"
};

const app = initializeApp(firebaseConfig);

// Export Realtime Database dan Storage
export const db = getDatabase(app);
export const storage = getStorage(app);