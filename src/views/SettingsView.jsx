import { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableRow,
    IconButton, Snackbar, Alert, Typography, Divider, Stack,
    LinearProgress, Tooltip, Avatar, Fade
} from '@mui/material';
import {
    Delete as DeleteIcon, Add as AddIcon,
    Download as DownloadIcon, Upload as UploadIcon,
    Group as GroupIcon, Inventory as InventoryIcon,
    ShoppingCart as CartIcon, Info as InfoIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { ref, push, set, get } from 'firebase/database';
import { db } from '../utils/firebase';

// ==========================================
// FUNGSI BANTU: CSV PARSER SEDERHANA
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
// FUNGSI BANTU: DOWNLOAD TEMPLATE
// ==========================================
const downloadTemplate = (type) => {
    let csvContent = '';
    let filename = '';

    if (type === 'nama') {
        csvContent = 'nama\nBudi Santoso\nSiti Aminah\nAndi Pratama';
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

export default function SettingsView() {
    // --- PASSWORD STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    // --- DATA STATE ---
    const [newNama, setNewNama] = useState('');
    const [newSku, setNewSku] = useState('');
    const [namaList, setNamaList] = useState([]);
    const [skuList, setSkuList] = useState([]);

    // --- UPLOAD STATE ---
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fileInputRef = useRef(null);
    const [activeUploadType, setActiveUploadType] = useState('');

    const loadData = async () => {
        try {
            const namaSnap = await get(ref(db, 'nama'));
            const skuSnap = await get(ref(db, 'sku'));
            const namaData = namaSnap.exists() ? Object.values(namaSnap.val()) : [];
            const skuData = skuSnap.exists() ? Object.values(skuSnap.val()) : [];
            setNamaList(namaData.sort());
            setSkuList(skuData.sort());
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

    // --- MANUAL ADD/DELETE ---
    const handleAddNama = async () => {
        if (!newNama.trim()) return;
        try {
            await push(ref(db, 'nama'), newNama.trim());
            setNewNama('');
            await loadData();
            setSnackbar({ open: true, message: 'Nama berhasil ditambahkan', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal tambah nama', severity: 'error' });
        }
    };

    const handleDeleteNama = async (name) => {
        try {
            const snap = await get(ref(db, 'nama'));
            if (snap.exists()) {
                const entries = Object.entries(snap.val());
                for (const [key, val] of entries) {
                    if (val === name) {
                        await set(ref(db, `nama/${key}`), null);
                        break;
                    }
                }
            }
            await loadData();
            setSnackbar({ open: true, message: 'Nama dihapus', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal hapus nama', severity: 'error' });
        }
    };

    const handleAddSku = async () => {
        if (!newSku.trim()) return;
        try {
            await push(ref(db, 'sku'), newSku.trim());
            setNewSku('');
            await loadData();
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
            await loadData();
            setSnackbar({ open: true, message: 'SKU dihapus', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal hapus SKU', severity: 'error' });
        }
    };

    // --- BULK UPLOAD LOGIC ---
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
                    for (const row of rows) {
                        if (row.nama) await push(ref(db, 'nama'), row.nama);
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
            <Box sx={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                minHeight: '80vh', pb: 8
            }}>
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
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', mb: 1 }}>
                            Akses Terbatas
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                            Masukkan password untuk mengakses halaman pengaturan data.
                        </Typography>

                        <TextField
                            fullWidth
                            type="password"
                            placeholder="Masukkan password..."
                            value={passwordInput}
                            onChange={(e) => {
                                setPasswordInput(e.target.value);
                                setPasswordError(false);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            error={passwordError}
                            helperText={passwordError ? 'Password salah, silakan coba lagi.' : ''}
                            sx={{
                                mb: 2.5,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                    '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                }
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handlePasswordSubmit}
                            sx={{
                                py: 1.8, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '1rem',
                                background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                                '&:hover': { background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' }
                            }}
                        >
                            Buka Pengaturan
                        </Button>
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
            {/* ========== BULK IMPORT / EXPORT SECTION ========== */}
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
                            Bulk Import & Export Data
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Inject data massal dengan cepat via file CSV
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2.5}>
                    {/* Info Box */}
                    <Box sx={{
                        p: 2, borderRadius: 3, bgcolor: '#eff6ff',
                        border: '1px solid #bfdbfe', display: 'flex', gap: 1.5, alignItems: 'flex-start'
                    }}>
                        <InfoIcon sx={{ color: '#1e40af', mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#1e3a8a', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            <strong>Cara Pakai:</strong> Download template di bawah, isi data di Excel, simpan sebagai <strong>CSV UTF-8</strong>, lalu upload kembali.
                            Pastikan tidak ada koma (,) di dalam nama toko atau nama SPG agar tidak terjadi error parsing.
                        </Typography>
                    </Box>

                    {/* Grid Buttons */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                        {['nama', 'sku', 'sellout'].map((type) => {
                            const config = {
                                nama: { icon: <GroupIcon sx={{ fontSize: 40, color: '#1e40af' }} />, title: 'Master Nama SPG', desc: 'Kelola daftar nama' },
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

                                    <Button
                                        variant="outlined" fullWidth startIcon={<DownloadIcon />}
                                        onClick={() => downloadTemplate(type)}
                                        sx={{ mb: 1.5, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af', bgcolor: '#eff6ff' } }}
                                    >
                                        Download Template
                                    </Button>
                                    <Button
                                        variant="contained" fullWidth startIcon={<UploadIcon />}
                                        onClick={() => triggerFileInput(type)} disabled={uploading}
                                        sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', '&:hover': { background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' } }}
                                    >
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

            {/* Hidden File Input */}
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

            {/* ========== MANUAL INPUT NAMA ========== */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)', border: '1px solid rgba(30, 64, 175, 0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', width: 40, height: 40 }}>
                        <GroupIcon sx={{ color: '#1e40af', fontSize: 20 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af' }}>Kelola Nama SPG</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                    <TextField
                        size="small" fullWidth value={newNama} onChange={(e) => setNewNama(e.target.value)}
                        placeholder="Ketik nama baru..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNama()}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, '& fieldset': { borderColor: '#e2e8f0' } } }}
                    />
                    <Button variant="contained" onClick={handleAddNama} startIcon={<AddIcon />} sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, background: '#1e40af', '&:hover': { background: '#1e3a8a' } }}>
                        Tambah
                    </Button>
                </Box>

                <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', maxHeight: 250 }}>
                    <Table size="small">
                        <TableBody>
                            {namaList.length === 0 ? (
                                <TableRow><TableCell align="center" sx={{ py: 4, color: '#94a3b8', fontSize: '0.9rem' }}>Belum ada data nama</TableCell></TableRow>
                            ) : namaList.map(n => (
                                <TableRow key={n} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.9rem', color: '#334155', py: 1.5 }}>{n}</TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Tooltip title="Hapus">
                                            <IconButton color="error" size="small" onClick={() => handleDeleteNama(n)} sx={{ '&:hover': { bgcolor: '#fee2e2' } }}>
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

            {/* ========== MANUAL INPUT SKU ========== */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)', border: '1px solid rgba(30, 64, 175, 0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', width: 40, height: 40 }}>
                        <InventoryIcon sx={{ color: '#1e40af', fontSize: 20 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af' }}>Kelola Master SKU</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                    <TextField
                        size="small" fullWidth value={newSku} onChange={(e) => setNewSku(e.target.value)}
                        placeholder="Ketik SKU baru..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSku()}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, '& fieldset': { borderColor: '#e2e8f0' } } }}
                    />
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

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}