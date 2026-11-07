import { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Snackbar, Alert, Typography, Divider, Stack,
    LinearProgress, Tooltip, Avatar, Fade, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, Chip,
    Autocomplete, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
    Delete as DeleteIcon, DeleteForever as DeleteForeverIcon,
    Add as AddIcon, Edit as EditIcon,
    Download as DownloadIcon, Upload as UploadIcon,
    Group as GroupIcon, Inventory as InventoryIcon,
    ShoppingCart as CartIcon, Info as InfoIcon,
    Lock as LockIcon, WarningAmberRounded as WarningIcon,
    FileDownload as FileDownloadIcon, CloudDownload as CloudDownloadIcon,
    Save as SaveIcon, Person as PersonIcon,
    LocationOn as LocationIcon, Leaderboard as TeamIcon,
    Store as ChannelIcon
} from '@mui/icons-material';
import { ref, push, set, get, remove } from 'firebase/database';
import { db } from '../utils/firebase';
import {
    getNamaDetailList, addNamaDetail, updateNamaDetail, deleteNamaDetail,
    getTeamleaderList, getAreaList
} from '../utils/storage';

// ==========================================
// FUNGSI BANTU: CSV PARSER
// ==========================================
const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
            const obj = {};
            headers.forEach((h, index) => {
                obj[h] = values[index] ? values[index].trim() : '';
            });
            result.push(obj);
        }
    }
    return result;
};

// ==========================================
// FUNGSI BANTU: DOWNLOAD CSV
// ==========================================
const downloadCSV = (data, headers, filename) => {
    if (!data || data.length === 0) return false;
    const BOM = '\uFEFF';
    const csvContent = [
        headers.join(','),
        ...data.map(item => headers.map(h => {
            const val = String(item[h] || '').replace(/"/g, '""');
            return val.includes(',') || val.includes('"') || val.includes('\n')
                ? `"${val}"`
                : val;
        }).join(','))
    ].join('\n');
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};

// ==========================================
// FUNGSI BANTU: DOWNLOAD TEMPLATE
// ==========================================
const downloadTemplate = (type) => {
    let csvContent = '';
    let filename = '';
    if (type === 'nama') {
        csvContent = 'nama,channel,area,teamleader\nBudi Santoso,GT,Jakarta Pusat,Andi Wijaya\nSiti Aminah,MT,Bandung,Andi Wijaya\nAndi Pratama,GT,Surabaya,Budi Setiawan';
        filename = 'template_nama.csv';
    } else if (type === 'sku') {
        csvContent = 'sku\nFIESTA-RED-001\nFIESTA-BLUE-002\nFIESTA-GREEN-003';
        filename = 'template_sku.csv';
    } else if (type === 'sellout') {
        csvContent = 'tanggal,nama,namaToko,foto,sku,harga,qty\n2026-09-13,Budi Santoso,TOKO ABC,https://res.cloudinary.com/...,SKU-001,50000,2\n2026-09-13,Budi Santoso,TOKO ABC,https://res.cloudinary.com/...,SKU-002,75000,1';
        filename = 'template_sellout.csv';
    }
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ==========================================
// KONFIGURASI CHANNEL
// ==========================================
const CHANNEL_OPTIONS = [
    { value: 'GT', label: 'GT (General Trade)', color: '#059669', bg: '#ecfdf5' },
    { value: 'MT', label: 'MT (Modern Trade)', color: '#7c3aed', bg: '#f5f3ff' }
];

const getChannelConfig = (channel) => {
    return CHANNEL_OPTIONS.find(c => c.value === channel) || { value: channel || '-', label: channel || '-', color: '#64748b', bg: '#f1f5f9' };
};

export default function SettingsView() {
    // --- PASSWORD STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    // --- DATA STATE ---
    const [newNama, setNewNama] = useState('');
    const [newSku, setNewSku] = useState('');
    const [namaDetailList, setNamaDetailList] = useState([]); // ✅ Array of objects
    const [skuList, setSkuList] = useState([]);
    const [teamleaderOptions, setTeamleaderOptions] = useState([]);
    const [areaOptions, setAreaOptions] = useState([]);

    // ✅ STATE: Dialog Add/Edit Nama
    const [namaDialog, setNamaDialog] = useState({
        open: false,
        mode: 'add', // 'add' | 'edit'
        id: null,
        form: { nama: '', channel: 'GT', area: '', teamleader: '' },
        saving: false
    });

    // --- UPLOAD STATE ---
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const fileInputRef = useRef(null);
    const [activeUploadType, setActiveUploadType] = useState('');

    // --- DELETE ALL DIALOG ---
    const [deleteAllDialog, setDeleteAllDialog] = useState({
        open: false,
        type: '',
        confirmText: ''
    });
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // ==========================================
    // LOAD DATA
    // ==========================================
    const loadData = async () => {
        try {
            // Load nama dengan detail
            const namaDetails = await getNamaDetailList();
            setNamaDetailList(namaDetails);

            // Load SKU
            const skuSnap = await get(ref(db, 'sku'));
            const skuData = skuSnap.exists() ? Object.values(skuSnap.val()) : [];
            setSkuList(skuData.sort());

            // Load options untuk autocomplete
            const [tlList, areaList] = await Promise.all([
                getTeamleaderList(),
                getAreaList()
            ]);
            setTeamleaderOptions(tlList);
            setAreaOptions(areaList);
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePasswordSubmit = () => {
        if (passwordInput === 'Yoke1009') {
            setIsAuthenticated(true);
            setPasswordError(false);
        } else {
            setPasswordError(true);
        }
    };

    // ==========================================
    // ✅ FUNGSI BARU: OPEN DIALOG ADD/EDIT NAMA
    // ==========================================
    const openAddNamaDialog = () => {
        setNamaDialog({
            open: true,
            mode: 'add',
            id: null,
            form: { nama: '', channel: 'GT', area: '', teamleader: '' },
            saving: false
        });
    };

    const openEditNamaDialog = (item) => {
        setNamaDialog({
            open: true,
            mode: 'edit',
            id: item.id,
            form: {
                nama: item.nama || '',
                channel: item.channel || 'GT',
                area: item.area || '',
                teamleader: item.teamleader || ''
            },
            saving: false
        });
    };

    const closeNamaDialog = () => {
        if (namaDialog.saving) return;
        setNamaDialog({ open: false, mode: 'add', id: null, form: { nama: '', channel: 'GT', area: '', teamleader: '' }, saving: false });
    };

    const handleSaveNama = async () => {
        if (!namaDialog.form.nama.trim()) {
            setSnackbar({ open: true, message: 'Nama SPG wajib diisi', severity: 'warning' });
            return;
        }

        // Cek duplikat nama (kecuali saat edit dengan nama yang sama)
        const isDuplicate = namaDetailList.some(item =>
            item.nama.toLowerCase() === namaDialog.form.nama.trim().toLowerCase() &&
            item.id !== namaDialog.id
        );
        if (isDuplicate) {
            setSnackbar({ open: true, message: 'Nama SPG sudah ada!', severity: 'error' });
            return;
        }

        setNamaDialog(prev => ({ ...prev, saving: true }));
        try {
            if (namaDialog.mode === 'add') {
                await addNamaDetail(namaDialog.form);
                setSnackbar({ open: true, message: `✅ SPG "${namaDialog.form.nama}" berhasil ditambahkan`, severity: 'success' });
            } else {
                await updateNamaDetail(namaDialog.id, namaDialog.form);
                setSnackbar({ open: true, message: `✅ Data SPG berhasil diupdate`, severity: 'success' });
            }
            closeNamaDialog();
            await loadData();
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal: ' + error.message, severity: 'error' });
            setNamaDialog(prev => ({ ...prev, saving: false }));
        }
    };

    // ==========================================
    // ✅ FUNGSI BARU: DELETE NAMA (dengan detail)
    // ==========================================
    const handleDeleteNama = async (id, nama) => {
        if (!window.confirm(`Yakin hapus SPG "${nama}"?`)) return;
        try {
            await deleteNamaDetail(id);
            setSnackbar({ open: true, message: `SPG "${nama}" berhasil dihapus`, severity: 'success' });
            await loadData();
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal hapus: ' + error.message, severity: 'error' });
        }
    };

    // ==========================================
    // MANUAL ADD SKU
    // ==========================================
    const handleAddSku = async () => {
        if (!newSku.trim()) return;
        try {
            await push(ref(db, 'sku'), newSku.trim());
            setNewSku('');
            const skuSnap = await get(ref(db, 'sku'));
            setSkuList(skuSnap.exists() ? Object.values(skuSnap.val()).sort() : []);
            setSnackbar({ open: true, message: 'SKU berhasil ditambahkan', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal tambah SKU', severity: 'error' });
        }
    };

    const handleDeleteSku = async (sku) => {
        try {
            const snap = await get(ref(db, 'sku'));
            if (snap.exists()) {
                const entries = Object.entries(snap.val());
                for (const [key, val] of entries) {
                    if (val === sku) {
                        await set(ref(db, `sku/${key}`), null);
                        break;
                    }
                }
            }
            const skuSnap = await get(ref(db, 'sku'));
            setSkuList(skuSnap.exists() ? Object.values(skuSnap.val()).sort() : []);
            setSnackbar({ open: true, message: 'SKU dihapus', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal hapus SKU', severity: 'error' });
        }
    };

    // ==========================================
    // DOWNLOAD DATABASE
    // ==========================================
    const handleDownloadDatabase = async (type) => {
        try {
            if (type === 'nama') {
                if (namaDetailList.length === 0) {
                    setSnackbar({ open: true, message: 'Tidak ada data nama untuk didownload', severity: 'warning' });
                    return;
                }
                const data = namaDetailList.map(n => ({
                    nama: n.nama,
                    channel: n.channel || '',
                    area: n.area || '',
                    teamleader: n.teamleader || ''
                }));
                const success = downloadCSV(data, ['nama', 'channel', 'area', 'teamleader'], `database_nama_${new Date().toISOString().split('T')[0]}.csv`);
                if (success) {
                    setSnackbar({ open: true, message: `✅ ${namaDetailList.length} data nama berhasil didownload`, severity: 'success' });
                }
            } else if (type === 'sku') {
                if (skuList.length === 0) {
                    setSnackbar({ open: true, message: 'Tidak ada data SKU untuk didownload', severity: 'warning' });
                    return;
                }
                const data = skuList.map(s => ({ sku: s }));
                const success = downloadCSV(data, ['sku'], `database_sku_${new Date().toISOString().split('T')[0]}.csv`);
                if (success) {
                    setSnackbar({ open: true, message: `✅ ${skuList.length} data SKU berhasil didownload`, severity: 'success' });
                }
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal download: ' + error.message, severity: 'error' });
        }
    };

    // ==========================================
    // DELETE ALL
    // ==========================================
    const handleDeleteAll = async () => {
        if (deleteAllDialog.confirmText !== 'HAPUS SEMUA') return;
        setIsDeletingAll(true);
        try {
            const type = deleteAllDialog.type;
            let count = 0;
            if (type === 'nama') {
                count = namaDetailList.length;
                await remove(ref(db, 'nama'));
            } else if (type === 'sku') {
                count = skuList.length;
                await remove(ref(db, 'sku'));
            } else if (type === 'sellout') {
                const snap = await get(ref(db, 'sellout'));
                count = snap.exists() ? Object.keys(snap.val()).length : 0;
                await remove(ref(db, 'sellout'));
            }
            await loadData();
            setSnackbar({
                open: true,
                message: `✅ ${count} data ${type} berhasil dihapus semua`,
                severity: 'success'
            });
            setDeleteAllDialog({ open: false, type: '', confirmText: '' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal hapus: ' + error.message, severity: 'error' });
        } finally {
            setIsDeletingAll(false);
        }
    };

    const openDeleteAllDialog = (type) => {
        setDeleteAllDialog({ open: true, type, confirmText: '' });
    };

    // ==========================================
    // BULK UPLOAD
    // ==========================================
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(10);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const rows = parseCSV(text);
                setUploadProgress(30);
                if (rows.length === 0) throw new Error('File CSV kosong atau format salah');

                if (activeUploadType === 'nama') {
                    // ✅ Support upload nama dengan detail lengkap
                    for (const row of rows) {
                        if (row.nama) {
                            await push(ref(db, 'nama'), {
                                nama: row.nama,
                                channel: row.channel || '',
                                area: row.area || '',
                                teamleader: row.teamleader || ''
                            });
                        }
                    }
                } else if (activeUploadType === 'sku') {
                    for (const row of rows) {
                        if (row.sku) await push(ref(db, 'sku'), row.sku);
                    }
                } else if (activeUploadType === 'sellout') {
                    const grouped = {};
                    rows.forEach(row => {
                        if (!row.tanggal || !row.nama || !row.sku) return;
                        const key = `${row.tanggal}|${row.nama}|${row.namaToko}`;
                        if (!grouped[key]) {
                            grouped[key] = {
                                tanggal: row.tanggal,
                                nama: row.nama,
                                namaToko: (row.namaToko || '').toUpperCase(),
                                foto: row.foto || '',
                                items: []
                            };
                        }
                        grouped[key].items.push({
                            id: Date.now() + Math.random(),
                            sku: row.sku,
                            harga: parseInt(row.harga) || 0,
                            qty: parseInt(row.qty) || 0
                        });
                    });
                    const groups = Object.values(grouped);
                    for (let i = 0; i < groups.length; i++) {
                        await push(ref(db, 'sellout'), groups[i]);
                        setUploadProgress(30 + Math.floor(((i + 1) / groups.length) * 60));
                    }
                }
                setUploadProgress(100);
                await loadData();
                setSnackbar({ open: true, message: `Berhasil inject ${rows.length} baris data!`, severity: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: 'Gagal upload: ' + error.message, severity: 'error' });
            } finally {
                setTimeout(() => {
                    setUploading(false);
                    setUploadProgress(0);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }, 500);
            }
        };
        reader.readAsText(file);
    };

    const triggerFileInput = (type) => {
        setActiveUploadType(type);
        fileInputRef.current.click();
    };

    // ==========================================
    // RENDER: PASSWORD SCREEN
    // ==========================================
    if (!isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', pb: 8 }}>
                <Fade in timeout={500}>
                    <Paper elevation={0} sx={{
                        p: { xs: 3, md: 4 }, borderRadius: 4, width: '100%', maxWidth: 420,
                        border: '1px solid rgba(30, 64, 175, 0.1)',
                        boxShadow: '0 8px 32px rgba(30, 64, 175, 0.08)',
                        textAlign: 'center', background: 'white'
                    }}>
                        <Avatar sx={{
                            bgcolor: '#eff6ff', color: '#1e40af', width: 72, height: 72,
                            mx: 'auto', mb: 2.5, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.1)'
                        }}>
                            <LockIcon sx={{ fontSize: 36 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', mb: 1 }}>Akses Terbatas</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>Masukkan password untuk mengakses halaman pengaturan data.</Typography>
                        <TextField
                            fullWidth type="password" placeholder="Masukkan password..."
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            error={passwordError}
                            helperText={passwordError ? 'Password salah, silakan coba lagi.' : ''}
                            sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 3, '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#3b82f6' }, '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 } } }}
                        />
                        <Button fullWidth variant="contained" onClick={handlePasswordSubmit} sx={{
                            py: 1.8, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '1rem',
                            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                            '&:hover': { background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' }
                        }}>Buka Pengaturan</Button>
                    </Paper>
                </Fade>
            </Box>
        );
    }

    // ==========================================
    // RENDER: MAIN SETTINGS CONTENT
    // ==========================================
    return (
        <Box sx={{ pb: 8 }}>
            {/* ========== 📥 SECTION: EXPORT DATABASE ========== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4,
                border: '1px solid rgba(16, 185, 129, 0.15)',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                boxShadow: '0 2px 12px rgba(16, 185, 129, 0.06)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#059669', width: 44, height: 44, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                        <CloudDownloadIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#065f46', lineHeight: 1.2 }}>
                            Export Database
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Download data master dalam format CSV
                        </Typography>
                    </Box>
                    <Chip
                        label={`${namaDetailList.length + skuList.length} Data`}
                        size="small"
                        sx={{ bgcolor: '#059669', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                </Box>
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                    <Paper sx={{
                        p: 2.5, borderRadius: 3, border: '1px solid #bbf7d0',
                        background: 'white', textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: '#059669', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)', transform: 'translateY(-2px)' }
                    }}>
                        <GroupIcon sx={{ fontSize: 40, color: '#059669', mb: 1 }} />
                        <Typography fontWeight="bold" sx={{ mb: 0.5, color: '#1e293b' }}>Database Nama SPG</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            {namaDetailList.length} nama tersimpan
                        </Typography>
                        <Button
                            variant="contained" fullWidth startIcon={<FileDownloadIcon />}
                            onClick={() => handleDownloadDatabase('nama')}
                            disabled={namaDetailList.length === 0}
                            sx={{
                                borderRadius: 2.5, textTransform: 'none', fontWeight: 600,
                                background: '#059669',
                                '&:hover': { background: '#047857' },
                                '&:disabled': { background: '#cbd5e1' }
                            }}
                        >
                            Download Nama (CSV)
                        </Button>
                    </Paper>
                    <Paper sx={{
                        p: 2.5, borderRadius: 3, border: '1px solid #bbf7d0',
                        background: 'white', textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: '#059669', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)', transform: 'translateY(-2px)' }
                    }}>
                        <InventoryIcon sx={{ fontSize: 40, color: '#059669', mb: 1 }} />
                        <Typography fontWeight="bold" sx={{ mb: 0.5, color: '#1e293b' }}>Database SKU</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            {skuList.length} SKU tersimpan
                        </Typography>
                        <Button
                            variant="contained" fullWidth startIcon={<FileDownloadIcon />}
                            onClick={() => handleDownloadDatabase('sku')}
                            disabled={skuList.length === 0}
                            sx={{
                                borderRadius: 2.5, textTransform: 'none', fontWeight: 600,
                                background: '#059669',
                                '&:hover': { background: '#047857' },
                                '&:disabled': { background: '#cbd5e1' }
                            }}
                        >
                            Download SKU (CSV)
                        </Button>
                    </Paper>
                </Box>
            </Paper>

            {/* ========== BULK IMPORT SECTION ========== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4,
                border: '1px solid rgba(30, 64, 175, 0.08)',
                background: 'white',
                boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#1e40af', width: 44, height: 44, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }}>
                        <UploadIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#1e40af', lineHeight: 1.2 }}>
                            Bulk Import Data
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Inject data massal dengan cepat via file CSV
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />
                <Stack spacing={2.5}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <InfoIcon sx={{ color: '#1e40af', mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#1e3a8a', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            <strong>Cara Pakai:</strong> Download template di bawah, isi data di Excel, simpan sebagai <strong>CSV UTF-8</strong>, lalu upload kembali.
                            <br />
                            <strong>Template Nama</strong> sekarang mendukung kolom: <code>nama, channel, area, teamleader</code>
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                        {['nama', 'sku', 'sellout'].map((type) => {
                            const config = {
                                nama: { icon: <GroupIcon sx={{ fontSize: 40, color: '#1e40af' }} />, title: 'Master Nama SPG', desc: 'Kelola daftar nama + info' },
                                sku: { icon: <InventoryIcon sx={{ fontSize: 40, color: '#1e40af' }} />, title: 'Master SKU', desc: 'Kelola daftar produk' },
                                sellout: { icon: <CartIcon sx={{ fontSize: 40, color: '#1e40af' }} />, title: 'Data Penjualan', desc: 'Inject data transaksi' }
                            }[type];
                            return (
                                <Paper key={type} sx={{
                                    p: 3, borderRadius: 4, border: '1px solid #e2e8f0', textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    '&:hover': { borderColor: '#1e40af', boxShadow: '0 8px 24px rgba(30, 64, 175, 0.08)', transform: 'translateY(-2px)' }
                                }}>
                                    <Box sx={{ mb: 2 }}>{config.icon}</Box>
                                    <Typography fontWeight="bold" sx={{ mb: 0.5, color: '#1e293b' }}>{config.title}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>{config.desc}</Typography>
                                    <Button variant="outlined" fullWidth startIcon={<DownloadIcon />}
                                        onClick={() => downloadTemplate(type)}
                                        sx={{ mb: 1.5, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af', bgcolor: '#eff6ff' } }}>
                                        Download Template
                                    </Button>
                                    <Button variant="contained" fullWidth startIcon={<UploadIcon />}
                                        onClick={() => triggerFileInput(type)} disabled={uploading}
                                        sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', '&:hover': { background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' } }}>
                                        Upload CSV
                                    </Button>
                                </Paper>
                            );
                        })}
                    </Box>
                    {uploading && (
                        <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Sedang mengupload data...</Typography>
                                <Typography variant="caption" color="#1e40af" fontWeight={700}>{uploadProgress}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 8, bgcolor: '#dbeafe', '& .MuiLinearProgress-bar': { bgcolor: '#1e40af' } }} />
                        </Box>
                    )}
                </Stack>
            </Paper>
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

            {/* ========== ✅ SECTION BARU: KELOLA NAMA SPG (WITH DETAIL) ========== */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)', border: '1px solid rgba(30, 64, 175, 0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', width: 40, height: 40 }}>
                        <GroupIcon sx={{ color: '#1e40af', fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af' }}>
                            Kelola Data SPG
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Tambah, edit, dan hapus data SPG beserta informasi Channel, Area, dan Teamleader
                        </Typography>
                    </Box>
                    <Chip
                        label={`${namaDetailList.length} SPG`}
                        size="small"
                        sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openAddNamaDialog}
                        sx={{
                            borderRadius: 2.5, textTransform: 'none', fontWeight: 600,
                            background: '#1e40af',
                            '&:hover': { background: '#1e3a8a' }
                        }}
                    >
                        Tambah SPG
                    </Button>
                </Box>

                {/* Statistik Channel */}
                {namaDetailList.length > 0 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2.5 }}>
                        <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>Total SPG</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e40af', fontSize: '1.25rem' }}>{namaDetailList.length}</Typography>
                        </Paper>
                        <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#065f46' }}>Channel GT</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#059669', fontSize: '1.25rem' }}>
                                {namaDetailList.filter(n => n.channel === 'GT').length}
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#5b21b6' }}>Channel MT</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#7c3aed', fontSize: '1.25rem' }}>
                                {namaDetailList.filter(n => n.channel === 'MT').length}
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff7ed', border: '1px solid #fed7aa', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9a3412' }}>Area</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#c2410c', fontSize: '1.25rem' }}>
                                {new Set(namaDetailList.map(n => n.area).filter(a => a)).size}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ background: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>No</TableCell>
                                <TableCell sx={{ background: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', minWidth: 150 }}>Nama SPG</TableCell>
                                <TableCell sx={{ background: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', minWidth: 90 }} align="center">Channel</TableCell>
                                <TableCell sx={{ background: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', minWidth: 120 }}>Area</TableCell>
                                <TableCell sx={{ background: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', minWidth: 130 }}>Teamleader</TableCell>
                                <TableCell sx={{ background: '#1e40af', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', minWidth: 90 }} align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {namaDetailList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8', fontSize: '0.9rem' }}>
                                        Belum ada data SPG. Klik "Tambah SPG" untuk memulai.
                                    </TableCell>
                                </TableRow>
                            ) : namaDetailList.map((item, idx) => {
                                const chCfg = getChannelConfig(item.channel);
                                return (
                                    <TableRow key={item.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ bgcolor: '#eff6ff', color: '#1e40af', width: 28, height: 28, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    {(item.nama || '?').charAt(0).toUpperCase()}
                                                </Avatar>
                                                {item.nama}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                            {item.channel ? (
                                                <Chip
                                                    label={chCfg.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: chCfg.bg,
                                                        color: chCfg.color,
                                                        fontWeight: 'bold',
                                                        fontSize: '0.7rem',
                                                        height: 24,
                                                        border: `1px solid ${chCfg.color}30`
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#334155', py: 1.5 }}>
                                            {item.area || <Typography component="span" variant="caption" sx={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</Typography>}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem', color: '#334155', py: 1.5 }}>
                                            {item.teamleader || <Typography component="span" variant="caption" sx={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</Typography>}
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openEditNamaDialog(item)}
                                                        sx={{
                                                            bgcolor: '#eff6ff',
                                                            color: '#1e40af',
                                                            '&:hover': { bgcolor: '#dbeafe' }
                                                        }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Hapus">
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleDeleteNama(item.id, item.nama)}
                                                        sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ========== ✅ DIALOG ADD/EDIT NAMA SPG ========== */}
            <Dialog
                open={namaDialog.open}
                onClose={closeNamaDialog}
                maxWidth="sm"
                fullWidth
                sx={{ '& .MuiDialog-paper': { borderRadius: 3, m: { xs: 2, md: 'auto' } } }}
            >
                <DialogTitle sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, pb: 1,
                    background: namaDialog.mode === 'add'
                        ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                }}>
                    <Avatar sx={{
                        bgcolor: namaDialog.mode === 'add' ? '#1e40af' : '#d97706',
                        width: 40, height: 40
                    }}>
                        {namaDialog.mode === 'add' ? <AddIcon /> : <EditIcon />}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                            {namaDialog.mode === 'add' ? 'Tambah SPG Baru' : 'Edit Data SPG'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {namaDialog.mode === 'add' ? 'Lengkapi informasi SPG di bawah' : 'Perbarui informasi SPG'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5}>
                        {/* Nama SPG */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Nama SPG <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <TextField
                                fullWidth
                                value={namaDialog.form.nama}
                                onChange={(e) => setNamaDialog(prev => ({ ...prev, form: { ...prev.form, nama: e.target.value } }))}
                                placeholder="Contoh: Budi Santoso"
                                disabled={namaDialog.saving}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2.5,
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#1e40af' },
                                        '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                    }
                                }}
                                InputProps={{
                                    startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                }}
                            />
                        </Box>

                        {/* Channel GT/MT */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Channel <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                                {CHANNEL_OPTIONS.map(opt => {
                                    const isSelected = namaDialog.form.channel === opt.value;
                                    return (
                                        <Box
                                            key={opt.value}
                                            onClick={() => !namaDialog.saving && setNamaDialog(prev => ({ ...prev, form: { ...prev.form, channel: opt.value } }))}
                                            sx={{
                                                p: 2, borderRadius: 2, cursor: 'pointer',
                                                border: `2px solid ${isSelected ? opt.color : '#e2e8f0'}`,
                                                bgcolor: isSelected ? opt.bg : 'white',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'center',
                                                '&:hover': { borderColor: opt.color, transform: 'translateY(-1px)' }
                                            }}
                                        >
                                            <ChannelIcon sx={{ fontSize: 28, color: opt.color, mb: 0.5 }} />
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: isSelected ? opt.color : '#475569', fontSize: '0.85rem' }}>
                                                {opt.value}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                                                {opt.value === 'GT' ? 'General Trade' : 'Modern Trade'}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Area */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Area
                            </Typography>
                            <Autocomplete
                                freeSolo
                                options={areaOptions}
                                value={namaDialog.form.area}
                                onChange={(e, v) => setNamaDialog(prev => ({ ...prev, form: { ...prev.form, area: v || '' } }))}
                                onInputChange={(e, v) => setNamaDialog(prev => ({ ...prev, form: { ...prev.form, area: v } }))}
                                disabled={namaDialog.saving}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Contoh: Jakarta Pusat"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2.5,
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#1e40af' },
                                                '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                            }
                                        }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                        }}
                                    />
                                )}
                            />
                            {areaOptions.length > 0 && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', mt: 0.5, ml: 0.5, display: 'block' }}>
                                    💡 Pilih dari list atau ketik area baru
                                </Typography>
                            )}
                        </Box>

                        {/* Teamleader */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Nama Teamleader
                            </Typography>
                            <Autocomplete
                                freeSolo
                                options={teamleaderOptions}
                                value={namaDialog.form.teamleader}
                                onChange={(e, v) => setNamaDialog(prev => ({ ...prev, form: { ...prev.form, teamleader: v || '' } }))}
                                onInputChange={(e, v) => setNamaDialog(prev => ({ ...prev, form: { ...prev.form, teamleader: v } }))}
                                disabled={namaDialog.saving}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Contoh: Andi Wijaya"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2.5,
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#1e40af' },
                                                '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                            }
                                        }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: <TeamIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                        }}
                                    />
                                )}
                            />
                            {teamleaderOptions.length > 0 && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', mt: 0.5, ml: 0.5, display: 'block' }}>
                                    💡 Pilih dari list atau ketik nama teamleader baru
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                    <Button
                        onClick={closeNamaDialog}
                        variant="outlined"
                        disabled={namaDialog.saving}
                        sx={{ borderRadius: 2 }}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSaveNama}
                        variant="contained"
                        disabled={namaDialog.saving || !namaDialog.form.nama.trim()}
                        startIcon={namaDialog.saving ? <LinearProgress color="inherit" sx={{ width: 16 }} /> : <SaveIcon />}
                        sx={{
                            borderRadius: 2,
                            background: namaDialog.mode === 'add' ? '#1e40af' : '#d97706',
                            '&:hover': { background: namaDialog.mode === 'add' ? '#1e3a8a' : '#b45309' },
                            '&:disabled': { background: '#cbd5e1' }
                        }}
                    >
                        {namaDialog.saving ? 'Menyimpan...' : (namaDialog.mode === 'add' ? 'Tambah SPG' : 'Simpan Perubahan')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== KELOLA MASTER SKU ========== */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)', border: '1px solid rgba(30, 64, 175, 0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', width: 40, height: 40 }}>
                        <InventoryIcon sx={{ color: '#1e40af', fontSize: 20 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af' }}>Kelola Master SKU</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                    <TextField size="small" fullWidth value={newSku} onChange={(e) => setNewSku(e.target.value)}
                        placeholder="Ketik SKU baru..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSku()}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, '& fieldset': { borderColor: '#e2e8f0' } } }} />
                    <Button variant="contained" onClick={handleAddSku} startIcon={<AddIcon />} sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, background: '#1e40af', '&:hover': { background: '#1e3a8a' } }}>
                        Tambah
                    </Button>
                </Box>
                <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', maxHeight: 250 }}>
                    <Table size="small">
                        <TableBody>
                            {skuList.length === 0 ? (
                                <TableRow><TableCell align="center" sx={{ py: 4, color: '#94a3b8', fontSize: '0.9rem' }}>Belum ada data SKU</TableCell></TableRow>
                            ) : skuList.map(s => (
                                <TableRow key={s} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#334155', py: 1.5 }}>{s}</TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Tooltip title="Hapus">
                                            <IconButton color="error" size="small" onClick={() => handleDeleteSku(s)} sx={{ '&:hover': { bgcolor: '#fee2e2' } }}>
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ========== 🚨 DANGER ZONE ========== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4,
                border: '2px solid #fecaca',
                background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                boxShadow: '0 2px 12px rgba(239, 68, 68, 0.08)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#ef4444', width: 44, height: 44, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                        <WarningIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#991b1b', lineHeight: 1.2 }}>
                            Danger Zone
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                            ⚠️ Aksi permanen - data tidak dapat dikembalikan
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5, borderColor: '#fecaca' }} />
                <Stack spacing={2}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        p: 2, borderRadius: 3, border: '1px solid #fecaca', bgcolor: 'white',
                        flexWrap: 'wrap', gap: 1.5
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <GroupIcon sx={{ color: '#dc2626', fontSize: 28 }} />
                            <Box>
                                <Typography fontWeight="bold" sx={{ color: '#1e293b', fontSize: '0.95rem' }}>
                                    Hapus Semua Nama SPG
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {namaDetailList.length} nama akan dihapus permanen
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained" color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => openDeleteAllDialog('nama')}
                            disabled={namaDetailList.length === 0}
                            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, background: '#dc2626', '&:hover': { background: '#b91c1c' }, '&:disabled': { background: '#cbd5e1' } }}
                        >
                            Hapus Semua Nama
                        </Button>
                    </Box>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        p: 2, borderRadius: 3, border: '1px solid #fecaca', bgcolor: 'white',
                        flexWrap: 'wrap', gap: 1.5
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <InventoryIcon sx={{ color: '#dc2626', fontSize: 28 }} />
                            <Box>
                                <Typography fontWeight="bold" sx={{ color: '#1e293b', fontSize: '0.95rem' }}>
                                    Hapus Semua SKU
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {skuList.length} SKU akan dihapus permanen
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained" color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => openDeleteAllDialog('sku')}
                            disabled={skuList.length === 0}
                            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, background: '#dc2626', '&:hover': { background: '#b91c1c' }, '&:disabled': { background: '#cbd5e1' } }}
                        >
                            Hapus Semua SKU
                        </Button>
                    </Box>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        p: 2, borderRadius: 3, border: '2px solid #ef4444', bgcolor: '#fff5f5',
                        flexWrap: 'wrap', gap: 1.5
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CartIcon sx={{ color: '#dc2626', fontSize: 28 }} />
                            <Box>
                                <Typography fontWeight="bold" sx={{ color: '#991b1b', fontSize: '0.95rem' }}>
                                    Hapus Semua Data Penjualan
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                                    ⚠️ Semua transaksi sell-out akan dihapus
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained" color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => openDeleteAllDialog('sellout')}
                            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, background: '#dc2626', '&:hover': { background: '#b91c1c' } }}
                        >
                            Hapus Semua Penjualan
                        </Button>
                    </Box>
                </Stack>
            </Paper>

            {/* 🚨 DIALOG KONFIRMASI HAPUS ALL */}
            <Dialog
                open={deleteAllDialog.open}
                onClose={() => !isDeletingAll && setDeleteAllDialog({ open: false, type: '', confirmText: '' })}
                sx={{ '& .MuiDialog-paper': { borderRadius: 3, minWidth: { xs: 300, md: 440 }, m: { xs: 2, md: 'auto' } } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#dc2626', pb: 1, bgcolor: '#fef2f2' }}>
                    <WarningIcon sx={{ fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                            Konfirmasi Hapus Semua Data
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block' }}>
                            Aksi ini tidak dapat dibatalkan!
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <DialogContentText sx={{ mb: 2 }}>
                        Anda akan menghapus <strong>SEMUA</strong> data:
                    </DialogContentText>
                    <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 2, border: '1px solid #fecaca', mb: 2.5 }}>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="#991b1b" fontWeight={600}>Jenis Data:</Typography>
                                <Chip
                                    label={deleteAllDialog.type === 'nama' ? 'Nama SPG' : deleteAllDialog.type === 'sku' ? 'Master SKU' : 'Data Penjualan'}
                                    size="small"
                                    sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 'bold' }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="#991b1b" fontWeight={600}>Jumlah Data:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="#1e293b">
                                    {deleteAllDialog.type === 'nama' ? namaDetailList.length : deleteAllDialog.type === 'sku' ? skuList.length : 'Semua data'} record
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1, color: '#991b1b', fontWeight: 600 }}>
                        Ketik <strong style={{ fontFamily: 'monospace', bgcolor: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>HAPUS SEMUA</strong> untuk konfirmasi:
                    </Typography>
                    <TextField
                        fullWidth
                        value={deleteAllDialog.confirmText}
                        onChange={(e) => setDeleteAllDialog({ ...deleteAllDialog, confirmText: e.target.value })}
                        placeholder="Ketik: HAPUS SEMUA"
                        disabled={isDeletingAll}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2.5,
                                fontFamily: 'monospace',
                                '& fieldset': { borderColor: deleteAllDialog.confirmText === 'HAPUS SEMUA' ? '#dc2626' : '#e2e8f0', borderWidth: 2 },
                                '&:hover fieldset': { borderColor: '#dc2626' },
                                '&.Mui-focused fieldset': { borderColor: '#dc2626' }
                            }
                        }}
                    />
                    <Typography variant="caption" color="#991b1b" sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}>
                        ⚠️ Data yang dihapus tidak dapat dikembalikan. Pastikan sudah backup.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                    <Button onClick={() => setDeleteAllDialog({ open: false, type: '', confirmText: '' })} variant="outlined" disabled={isDeletingAll} sx={{ borderRadius: 2 }}>Batal</Button>
                    <Button
                        onClick={handleDeleteAll}
                        variant="contained"
                        color="error"
                        disabled={isDeletingAll || deleteAllDialog.confirmText !== 'HAPUS SEMUA'}
                        startIcon={isDeletingAll ? <LinearProgress color="inherit" sx={{ width: 16 }} /> : <DeleteForeverIcon />}
                        sx={{ borderRadius: 2, background: '#dc2626', '&:hover': { background: '#b91c1c' }, '&:disabled': { background: '#cbd5e1' } }}
                    >
                        {isDeletingAll ? 'Menghapus...' : 'Ya, Hapus Semua'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
