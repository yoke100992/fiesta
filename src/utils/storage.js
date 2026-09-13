import { ref, get, set, push, remove, update } from 'firebase/database';
import { db } from './firebase';

// ===== NAMA =====
export const getNamaList = async () => {
    try {
        const snapshot = await get(ref(db, 'nama'));
        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        return Object.values(data).sort();
    } catch (err) {
        console.error('Error get nama:', err);
        return [];
    }
};

export const addNama = async (nama) => {
    const newRef = push(ref(db, 'nama'));
    await set(newRef, nama);
};

export const deleteNama = async (nama) => {
    const snapshot = await get(ref(db, 'nama'));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    for (const [key, value] of Object.entries(data)) {
        if (value === nama) {
            await remove(ref(db, `nama/${key}`));
            break;
        }
    }
};

// ===== SKU =====
export const getSkuList = async () => {
    try {
        const snapshot = await get(ref(db, 'sku'));
        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        return Object.values(data).sort();
    } catch (err) {
        console.error('Error get sku:', err);
        return [];
    }
};

export const addSku = async (sku) => {
    const newRef = push(ref(db, 'sku'));
    await set(newRef, sku);
};

export const deleteSku = async (sku) => {
    const snapshot = await get(ref(db, 'sku'));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    for (const [key, value] of Object.entries(data)) {
        if (value === sku) {
            await remove(ref(db, `sku/${key}`));
            break;
        }
    }
};

// ===== SELLOUT =====
export const getSelloutData = async () => {
    try {
        const snapshot = await get(ref(db, 'sellout'));
        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        return Object.entries(data).map(([id, value]) => ({ id, ...value }));
    } catch (err) {
        console.error('Error get sellout:', err);
        return [];
    }
};

export const addSellout = async (data) => {
    const newRef = push(ref(db, 'sellout'));
    await set(newRef, data);
};

export const updateSellout = async (id, data) => {
    await update(ref(db, `sellout/${id}`), data);
};

export const deleteSellout = async (id) => {
    await remove(ref(db, `sellout/${id}`));
};