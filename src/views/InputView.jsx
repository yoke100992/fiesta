import { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, TextField, Button, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Snackbar, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Typography, Divider, Chip, Tooltip, Stack, Autocomplete,
    Avatar, LinearProgress, Fade, Collapse
} from '@mui/material';
import {
    Delete as DeleteIcon, WarningAmberRounded as WarningIcon,
    CheckCircleOutlineRounded as CheckIcon, CalendarMonth as CalendarIcon,
    Person as PersonIcon, Store as StoreIcon, Image as ImageIcon,
    AccountBalanceWallet as WalletIcon, AddCircle as AddIcon,
    CloudUpload as UploadIcon, ShoppingCart as CartIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { uploadImage } from '../utils/cloudinary';
import { getNamaList, getSkuList, addSellout } from '../utils/storage';

const formatDateLocal = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID').format(number);
};

export default function InputView() {
    const [date, setDate] = useState(new Date());
    const [nama, setNama] = useState(null);
    const [namaToko, setNamaToko] = useState('');
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState('');
    const [sku, setSku] = useState(null);
    const [harga, setHarga] = useState('');
    const [qty, setQty] = useState('');
    const [queue, setQueue] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showQueue, setShowQueue] = useState(false);

    const [errors, setErrors] = useState({ nama: false, namaToko: false, foto: false, queue: false });

    const [namaList, setNamaList] = useState([]);
    const [skuList, setSkuList] = useState([]);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [dialogDelete, setDialogDelete] = useState({ open: false, itemId: null, sku: '' });
    const [dialogSubmit, setDialogSubmit] = useState({ open: false });

    const queueRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            const nama = await getNamaList();
            const sku = await getSkuList();
            setNamaList(nama);
            setSkuList(sku);
        };
        loadData();
    }, []);

    const handleHargaChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setHarga(value ? new Intl.NumberFormat('id-ID').format(value) : '');
    };

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFoto(file);
            setFotoPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, foto: false }));
            setSnackbar({ open: true, message: 'Foto berhasil dipilih', severity: 'success' });
        }
    };

    const handleAddToQueue = () => {
        if (!sku || !harga || !qty) {
            setSnackbar({ open: true, message: 'Lengkapi SKU, Harga, dan Qty!', severity: 'warning' });
            return;
        }
        const rawHarga = parseInt(harga.replace(/\./g, ''), 10);
        const rawQty = parseInt(qty, 10);
        if (rawQty <= 0) {
            setSnackbar({ open: true, message: 'Qty harus lebih dari 0!', severity: 'warning' });
            return;
        }

        const newQueue = [...queue, { id: Date.now(), sku: sku.label || sku, harga: rawHarga, qty: rawQty }];
        setQueue(newQueue);
        setSku(null); setHarga(''); setQty('');
        setShowQueue(true);
        setErrors(prev => ({ ...prev, queue: false }));
        setSnackbar({ open: true, message: 'Item ditambahkan ke queue', severity: 'success' });

        setTimeout(() => {
            queueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleOpenDeleteDialog = (id, skuName) => {
        setDialogDelete({ open: true, itemId: id, sku: skuName });
    };

    const handleConfirmDelete = () => {
        const newQueue = queue.filter(item => item.id !== dialogDelete.itemId);
        setQueue(newQueue);
        if (newQueue.length === 0) setShowQueue(false);
        setDialogDelete({ open: false, itemId: null, sku: '' });
        setSnackbar({ open: true, message: 'Item dihapus dari queue', severity: 'info' });
    };

    const handleOpenSubmitDialog = () => {
        const newErrors = {
            nama: !nama,
            namaToko: !namaToko,
            foto: !foto,
            queue: queue.length === 0
        };
        setErrors(newErrors);

        if (newErrors.nama || newErrors.namaToko || newErrors.foto || newErrors.queue) {
            setSnackbar({ open: true, message: 'Mohon lengkapi semua data yang wajib diisi!', severity: 'error' });
            return;
        }
        setDialogSubmit({ open: true });
    };

    const handleConfirmSubmit = async () => {
        setDialogSubmit({ open: false });
        setIsSubmitting(true);
        setUploadProgress(10);

        try {
            setUploadProgress(40);
            const fotoUrl = await uploadImage(foto);
            if (!fotoUrl) throw new Error('Upload foto gagal');

            setUploadProgress(80);

            const newData = {
                tanggal: formatDateLocal(date),
                nama: nama.label || nama,
                namaToko: namaToko.toUpperCase(),
                foto: fotoUrl,
                items: queue,
                grandTotal: queue.reduce((sum, item) => sum + (item.harga * item.qty), 0),
                createdAt: new Date().toISOString()
            };

            await addSellout(newData);
            setUploadProgress(100);

            setSnackbar({ open: true, message: 'Data berhasil disimpan!', severity: 'success' });

            setNama(null); setNamaToko(''); setFoto(null); setFotoPreview('');
            setQueue([]); setShowQueue(false); setDate(new Date());
            setErrors({ nama: false, namaToko: false, foto: false, queue: false });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal menyimpan: ' + error.message, severity: 'error' });
        } finally {
            setTimeout(() => {
                setIsSubmitting(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const grandTotal = queue.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const totalItems = queue.reduce((sum, item) => sum + item.qty, 0);

    const namaOptions = namaList.map(n => ({ label: n, value: n }));
    const skuOptions = skuList.map(s => ({ label: s, value: s }));

    return (
        <Box sx={{ pb: 8 }}>

            {/* ========== STEP 1: INFORMASI DASAR ========== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 2, borderRadius: 4,
                border: errors.nama || errors.namaToko ? '2px solid #ef4444' : '1px solid rgba(30, 64, 175, 0.08)',
                background: 'white',
                boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)',
                transition: 'border-color 0.3s ease'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#1e40af', width: 40, height: 40, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }}>
                        <PersonIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af', lineHeight: 1.2 }}>
                            Step 1: Informasi Dasar
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Data SPG & Toko
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                            Tanggal
                        </Typography>
                        <DatePicker
                            value={date}
                            onChange={setDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem',
                                            '& fieldset': { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                        }
                                    }
                                }
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                            Nama SPG <span style={{ color: '#ef4444' }}>*</span>
                        </Typography>
                        <Autocomplete
                            options={namaOptions}
                            value={nama}
                            onChange={(e, newValue) => { setNama(newValue); setErrors(prev => ({ ...prev, nama: false })); }}
                            getOptionLabel={(option) => option.label || ''}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Pilih nama SPG..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem',
                                            '& fieldset': { borderColor: errors.nama ? '#ef4444' : '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                        }
                                    }}
                                />
                            )}
                            noOptionsText="Tidak ada nama ditemukan"
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                            Nama Toko <span style={{ color: '#ef4444' }}>*</span>
                        </Typography>
                        <TextField
                            fullWidth
                            value={namaToko}
                            onChange={(e) => { setNamaToko(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, namaToko: false })); }}
                            placeholder="Masukkan nama toko..."
                            InputProps={{
                                startAdornment: <StoreIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem',
                                    '& fieldset': { borderColor: errors.namaToko ? '#ef4444' : '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                    '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                }
                            }}
                            helperText="Otomatis menjadi HURUF KAPITAL"
                        />
                    </Box>
                </Stack>
            </Paper>

            {/* ========== STEP 2: DETAIL PENJUALAN ========== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 2, borderRadius: 4,
                border: errors.foto || errors.queue ? '2px solid #ef4444' : '1px solid rgba(30, 64, 175, 0.08)',
                background: 'white',
                boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)',
                transition: 'border-color 0.3s ease'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#1e40af', width: 40, height: 40, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }}>
                        <ImageIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af', lineHeight: 1.2 }}>
                            Step 2: Upload Foto
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Foto Activity Wajib di Grid
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{
                        mb: 2.5, py: 3, borderRadius: 3, textTransform: 'none',
                        borderStyle: foto ? 'solid' : 'dashed', borderWidth: 2,
                        borderColor: errors.foto ? '#ef4444' : (foto ? '#1e40af' : '#cbd5e1'),
                        backgroundColor: foto ? '#eff6ff' : '#f8fafc',
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: '#1e40af', backgroundColor: '#eff6ff' }
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <UploadIcon sx={{ fontSize: 36, color: foto ? '#1e40af' : '#94a3b8', mb: 0.5 }} />
                        <Typography variant="body1" fontWeight="bold" color={foto ? '#1e40af' : '#475569'}>
                            {foto ? 'Foto Berhasil Diupload - Klik untuk Ganti' : 'Upload Foto Grid (Wajib)'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Format: JPG, PNG (Maks. 5MB)
                        </Typography>
                    </Box>
                    <input type="file" hidden accept="image/*" onChange={handleFotoChange} />
                </Button>

                {fotoPreview && (
                    <Fade in timeout={500}>
                        <Box component="img" src={fotoPreview} sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 3, mb: 2.5, border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    </Fade>
                )}

                <Stack spacing={2.5} sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>Pilih SKU</Typography>
                        <Autocomplete
                            options={skuOptions}
                            value={sku}
                            onChange={(e, newValue) => setSku(newValue)}
                            getOptionLabel={(option) => option.label || ''}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            renderInput={(params) => (
                                <TextField {...params} placeholder="Cari atau pilih SKU..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#3b82f6' }, '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 } } }} />
                            )}
                            noOptionsText="Tidak ada SKU ditemukan"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>Harga Satuan</Typography>
                            <TextField
                                fullWidth value={harga} onChange={handleHargaChange} placeholder="0"
                                InputProps={{ endAdornment: <Typography sx={{ mr: 1, color: '#64748b', fontWeight: 600 }}>Rp</Typography> }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#3b82f6' }, '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 } } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>Qty</Typography>
                            <TextField
                                fullWidth type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0"
                                InputProps={{ inputProps: { min: 1 } }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#3b82f6' }, '&.Mui-focused fieldset': { borderColor: '#1e40af', borderWidth: 2 } } }}
                            />
                        </Box>
                    </Box>

                    <Button
                        variant="contained" fullWidth onClick={handleAddToQueue} startIcon={<AddIcon />}
                        sx={{
                            py: 1.8, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '1rem',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                            '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)' }
                        }}
                    >
                        Tambah ke Daftar Penjualan
                    </Button>
                </Stack>

                <Box ref={queueRef}>
                    {!showQueue && queue.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                            <CartIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                            <Typography variant="body2" color="#64748b" fontWeight={500}>Belum ada item ditambahkan</Typography>
                            <Typography variant="caption" color="#94a3b8">Pilih SKU, isi harga & qty, lalu klik tombol di atas</Typography>
                        </Box>
                    ) : (
                        <Collapse in={showQueue} timeout={400}>
                            <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, mt: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem' }}>ITEM</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem' }}>HARGA</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem' }}>QTY</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem' }}>TOTAL</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem' }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {queue.map((row, index) => (
                                            <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={index + 1} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 'bold' }} />
                                                        {row.sku}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.85rem', color: '#334155' }}>
                                                    {formatRupiah(row.harga)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip label={row.qty} size="small" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#334155' }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e40af' }}>
                                                    {formatRupiah(row.harga * row.qty)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Hapus Item">
                                                        <IconButton color="error" size="small" onClick={() => handleOpenDeleteDialog(row.id, row.sku)} sx={{ '&:hover': { bgcolor: '#fee2e2' } }}>
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Paper elevation={0} sx={{
                                p: 2.5, borderRadius: 3,
                                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                border: '1px solid rgba(30, 64, 175, 0.15)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#1e40af', width: 44, height: 44, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)' }}>
                                            <WalletIcon sx={{ fontSize: 24 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" color="#1e40af" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Grand Total
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem', color: '#334155' }}>
                                                {queue.length} Item • {totalItems} Pcs
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold" color="#1e40af" sx={{
                                        fontSize: '1.25rem', fontFamily: 'monospace',
                                        backgroundColor: 'white', px: 2.5, py: 1, borderRadius: 2,
                                        boxShadow: '0 2px 8px rgba(30, 64, 175, 0.1)',
                                        border: '1px solid #bfdbfe'
                                    }}>
                                        Rp {formatRupiah(grandTotal)}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Collapse>
                    )}
                </Box>
            </Paper>

            {/* ========== SUBMIT BUTTON ========== */}
            <Button
                variant="contained" size="large" fullWidth disabled={isSubmitting} onClick={handleOpenSubmitDialog}
                sx={{
                    py: 2.2, borderRadius: 4, fontSize: '1.1rem', fontWeight: 'bold',
                    boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(5, 150, 105, 0.3)',
                    textTransform: 'none', 
                    background: isSubmitting ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        background: isSubmitting ? '#cbd5e1' : 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                        boxShadow: '0 12px 32px rgba(5, 150, 105, 0.4)'
                    }
                }}
            >
                {isSubmitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={22} color="inherit" />
                        <Typography>Menyimpan Data...</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon />
                        <Typography>SUBMIT DATA PENJUALAN</Typography>
                    </Box>
                )}
            </Button>

            {isSubmitting && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1.5, borderRadius: 2, height: 6, bgcolor: '#d1fae5', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }} />}

            {/* ========== DIALOG DELETE ========== */}
            <Dialog open={dialogDelete.open} onClose={() => setDialogDelete({ open: false, itemId: null, sku: '' })} sx={{ '& .MuiDialog-paper': { borderRadius: 3, minWidth: 300 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}><WarningIcon /> Konfirmasi Hapus</DialogTitle>
                <DialogContent><DialogContentText>Hapus item <strong>{dialogDelete.sku}</strong> dari daftar penjualan?</DialogContentText></DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogDelete({ open: false, itemId: null, sku: '' })} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Ya, Hapus</Button>
                </DialogActions>
            </Dialog>

            {/* ========== DIALOG SUBMIT ========== */}
            <Dialog open={dialogSubmit.open} onClose={() => setDialogSubmit({ open: false })} sx={{ '& .MuiDialog-paper': { borderRadius: 3, minWidth: 320 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1e40af' }}><CheckIcon /> Konfirmasi Final</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Pastikan data berikut sudah benar sebelum disimpan:</DialogContentText>
                    <Box sx={{ backgroundColor: '#eff6ff', p: 2.5, borderRadius: 3, border: '1px solid #bfdbfe' }}>
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><CalendarIcon sx={{ fontSize: 20, color: '#1e40af' }} /><Typography variant="body2"><strong>Tanggal:</strong> {formatDateLocal(date)}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><PersonIcon sx={{ fontSize: 20, color: '#1e40af' }} /><Typography variant="body2"><strong>SPG:</strong> {nama?.label || nama}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><StoreIcon sx={{ fontSize: 20, color: '#1e40af' }} /><Typography variant="body2"><strong>Toko:</strong> {namaToko.toUpperCase()}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><ImageIcon sx={{ fontSize: 20, color: '#1e40af' }} /><Typography variant="body2"><strong>Foto:</strong> {foto ? 'Sudah Terupload' : 'Belum ada'}</Typography></Box>
                            <Divider sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                                <Typography variant="body2" fontWeight="bold" color="#334155">Total ({queue.length} item)</Typography>
                                <Typography variant="h6" fontWeight="bold" color="#1e40af" sx={{ fontFamily: 'monospace' }}>Rp {formatRupiah(grandTotal)}</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogSubmit({ open: false })} variant="outlined" sx={{ borderRadius: 2 }}>Periksa Lagi</Button>
                    <Button onClick={handleConfirmSubmit} variant="contained" sx={{ background: '#1e40af', borderRadius: 2 }}>Ya, Simpan Data</Button>
                </DialogActions>
            </Dialog>

            {/* ========== SNACKBAR ========== */}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}