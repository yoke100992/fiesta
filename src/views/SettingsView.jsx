import { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableRow,
    IconButton, Snackbar, Alert, Typography, Divider, Stack,
    Chip, LinearProgress, Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon, Add as AddIcon,
    Download as DownloadIcon, Upload as UploadIcon,
    Group as GroupIcon, Inventory as InventoryIcon,
    ShoppingCart as CartIcon, Info as InfoIcon
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
        // Handle simple CSV (tanpa koma di dalam nilai)
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

    // Tambahkan BOM agar Excel membaca UTF-8 dengan benar
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
    // State untuk Manual Input
    const [newNama, setNewNama] = useState('');
    const [newSku, setNewSku] = useState('');
    const [namaList, setNamaList] = useState([]);
    const [skuList, setSkuList] = useState([]);

    // State untuk Bulk Upload
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fileInputRef = useRef(null);
    const [activeUploadType, setActiveUploadType] = useState('');

    // Load Data Awal
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

    // --- Manual Add/Delete ---
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

    // --- Bulk Upload Logic ---
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
                    // Grouping data sellout berdasarkan tanggal+nama+toko
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

    return (
        <Box sx={{ pb: 4 }}>

            {/* ========== BULK IMPORT / EXPORT SECTION ========== */}
            <Paper elevation={0} sx={{
                p: 3, mb: 3, borderRadius: 4,
                border: '1px solid rgba(227, 30, 36, 0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #fff8f8 100%)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 2 }}>
                        <UploadIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                            Bulk Import & Export Data
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Inject data massal via CSV</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Stack spacing={2}>
                    {/* Info Box */}
                    <Box sx={{
                        p: 2, borderRadius: 2, bgcolor: '#e3f2fd',
                        border: '1px solid #90caf9', display: 'flex', gap: 1.5
                    }}>
                        <InfoIcon sx={{ color: '#1976d2', mt: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#0d47a1', fontSize: '0.85rem' }}>
                            <strong>Cara Pakai:</strong> Download template di bawah, isi data di Excel, simpan sebagai CSV, lalu upload kembali.
                            Pastikan tidak ada koma (,) di dalam nama toko atau nama SPG.
                        </Typography>
                    </Box>

                    {/* Grid Buttons */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>

                        {/* Card Nama */}
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography fontWeight="bold" sx={{ mb: 2 }}>Master Nama</Typography>
                            <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={() => downloadTemplate('nama')} sx={{ mb: 1, borderRadius: 2, textTransform: 'none' }}>
                                Download Template
                            </Button>
                            <Button variant="contained" fullWidth startIcon={<UploadIcon />} onClick={() => triggerFileInput('nama')} disabled={uploading} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Upload CSV
                            </Button>
                        </Paper>

                        {/* Card SKU */}
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography fontWeight="bold" sx={{ mb: 2 }}>Master SKU</Typography>
                            <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={() => downloadTemplate('sku')} sx={{ mb: 1, borderRadius: 2, textTransform: 'none' }}>
                                Download Template
                            </Button>
                            <Button variant="contained" fullWidth startIcon={<UploadIcon />} onClick={() => triggerFileInput('sku')} disabled={uploading} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Upload CSV
                            </Button>
                        </Paper>

                        {/* Card Sellout */}
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <CartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography fontWeight="bold" sx={{ mb: 2 }}>Data Penjualan</Typography>
                            <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={() => downloadTemplate('sellout')} sx={{ mb: 1, borderRadius: 2, textTransform: 'none' }}>
                                Download Template
                            </Button>
                            <Button variant="contained" fullWidth startIcon={<UploadIcon />} onClick={() => triggerFileInput('sellout')} disabled={uploading} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Upload CSV
                            </Button>
                        </Paper>

                    </Box>

                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Sedang mengupload data...</Typography>
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 8 }} />
                        </Box>
                    )}
                </Stack>
            </Paper>

            {/* Hidden File Input */}
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />

            {/* ========== MANUAL INPUT NAMA ========== */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ bgcolor: '#ffebee', p: 1, borderRadius: 2 }}>
                        <GroupIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: '1rem' }}>Kelola Nama SPG</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField size="small" fullWidth value={newNama} onChange={(e) => setNewNama(e.target.value)} placeholder="Nama Baru" onKeyDown={(e) => e.key === 'Enter' && handleAddNama()} />
                    <Button variant="contained" onClick={handleAddNama} startIcon={<AddIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>Tambah</Button>
                </Box>

                <TableContainer sx={{ borderRadius: 2, border: '1px solid #f0f0f0', maxHeight: 200 }}>
                    <Table size="small">
                        <TableBody>
                            {namaList.length === 0 ? (
                                <TableRow><TableCell align="center" sx={{ py: 3, color: 'text.secondary' }}>Belum ada data</TableCell></TableRow>
                            ) : namaList.map(n => (
                                <TableRow key={n} hover>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{n}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Hapus"><IconButton color="error" size="small" onClick={() => handleDeleteNama(n)}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ========== MANUAL INPUT SKU ========== */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ bgcolor: '#ffebee', p: 1, borderRadius: 2 }}>
                        <InventoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: '1rem' }}>Kelola Master SKU</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField size="small" fullWidth value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="SKU Baru" onKeyDown={(e) => e.key === 'Enter' && handleAddSku()} />
                    <Button variant="contained" onClick={handleAddSku} startIcon={<AddIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>Tambah</Button>
                </Box>

                <TableContainer sx={{ borderRadius: 2, border: '1px solid #f0f0f0', maxHeight: 200 }}>
                    <Table size="small">
                        <TableBody>
                            {skuList.length === 0 ? (
                                <TableRow><TableCell align="center" sx={{ py: 3, color: 'text.secondary' }}>Belum ada data</TableCell></TableRow>
                            ) : skuList.map(s => (
                                <TableRow key={s} hover>
                                    <TableCell sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{s}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Hapus"><IconButton color="error" size="small" onClick={() => handleDeleteSku(s)}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, fontWeight: 500 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}