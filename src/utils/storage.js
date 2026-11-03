import { ref, get, set, push, remove, update, query, orderByChild, startAt, endAt } from 'firebase/database';
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

// ===== PERMIT =====
export const getPermitData = async () => {
    try {
        const snapshot = await get(ref(db, 'permit'));
        if (!snapshot.exists()) return [];
        const data = snapshot.val();
        return Object.entries(data).map(([id, value]) => ({ id, ...value }));
    } catch (err) {
        console.error('Error get permit:', err);
        return [];
    }
};

export const addPermit = async (data) => {
    const newRef = push(ref(db, 'permit'));
    await set(newRef, data);
};

export const deletePermit = async (id) => {
    await remove(ref(db, `permit/${id}`));
};

// ==========================================
// ? PERBAIKAN: QUERY BY DATE RANGE (FIREBASE V9)
// ==========================================
export const getSelloutDataByDateRange = async (startDate, endDate) => {
    try {
        const dbRef = ref(db, 'sellout');
        let constraints = [orderByChild('tanggal')];

        if (startDate) {
            const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            constraints.push(startAt(startStr));
        }

        if (endDate) {
            const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            constraints.push(endAt(endStr));
        }

        const q = query(dbRef, ...constraints);
        const snapshot = await get(q);

        if (!snapshot.exists()) return [];

        return Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }));
    } catch (err) {
        console.error('Error query by date:', err);
        return [];
    }
};

// ==========================================
// ? ANALYTICS: Hitung statistik dari data
// ==========================================
export const calculateAnalytics = (data) => {
    if (!data || data.length === 0) {
        return { totalRevenue: 0, totalTransactions: 0, averagePerTransaction: 0, activeSPG: 0, uniqueToko: 0, topSPG: [], topSKU: [], topToko: [], dailySales: [] };
    }

    let totalRevenue = 0;
    const spgMap = {}, skuMap = {}, tokoMap = {}, dailyMap = {};
    const uniqueToko = new Set();

    data.forEach(record => {
        const recordTotal = record.items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
        totalRevenue += recordTotal;

        if (!spgMap[record.nama]) spgMap[record.nama] = 0;
        spgMap[record.nama] += recordTotal;

        const toko = record.namaToko || record.toko || 'Tidak Diketahui';
        uniqueToko.add(toko);
        if (!tokoMap[toko]) tokoMap[toko] = 0;
        tokoMap[toko] += recordTotal;

        record.items.forEach(item => {
            if (!skuMap[item.sku]) skuMap[item.sku] = { qty: 0, revenue: 0 };
            skuMap[item.sku].qty += item.qty || 0;
            skuMap[item.sku].revenue += (item.harga || 0) * (item.qty || 0);
        });

        if (!dailyMap[record.tanggal]) dailyMap[record.tanggal] = 0;
        dailyMap[record.tanggal] += recordTotal;
    });

    const topSPG = Object.entries(spgMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nama, total]) => ({ nama, total }));
    const topSKU = Object.entries(skuMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([sku, data]) => ({ sku, ...data }));
    const topToko = Object.entries(tokoMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([toko, total]) => ({ toko, total }));
    const dailySales = Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0])).map(([tanggal, total]) => ({ tanggal, total }));

    return {
        totalRevenue,
        totalTransactions: data.length,
        averagePerTransaction: data.length > 0 ? totalRevenue / data.length : 0,
        activeSPG: Object.keys(spgMap).length,
        uniqueToko: uniqueToko.size,
        topSPG, topSKU, topToko, dailySales
    };
};