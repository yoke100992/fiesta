// File: cleanup.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, remove } from 'firebase/database';

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
const db = getDatabase(app);

const cleanup = async () => {
    try {
        await remove(ref(db, 'sellout'));
        console.log('? Collection sellout dihapus');

        console.log('?? Semua data berhasil dihapus!');
        process.exit(0);
    } catch (error) {
        console.error('? Error:', error);
        process.exit(1);
    }
};

cleanup();