import { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Snackbar, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Typography, Divider, Chip, Tooltip, Stack, Autocomplete,
    Fade, Avatar, LinearProgress
} from '@mui/material';
import {
    Delete as DeleteIcon, WarningAmberRounded as WarningIcon,
    CheckCircleOutlineRounded as CheckIcon, CalendarMonth as CalendarIcon,
    Person as PersonIcon, Store as StoreIcon, Image as ImageIcon,
    AccountBalanceWallet as WalletIcon, AddCircle as AddIcon,
    CloudUpload as UploadIcon
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

    const [namaList, setNamaList] = useState([]);
    const [skuList, setSkuList] = useState([]);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [dialogDelete, setDialogDelete] = useState({ open: false, itemId: null, sku: '' });
    const [dialogSubmit, setDialogSubmit] = useState({ open: false });

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
        setQueue([...queue, { id: Date.now(), sku: sku.label || sku, harga: rawHarga, qty: rawQty }]);
        setSku(null); setHarga(''); setQty('');
        setSnackbar({ open: true, message: 'Item ditambahkan ke queue', severity: 'success' });
    };

    const handleOpenDeleteDialog = (id, skuName) => {
        setDialogDelete({ open: true, itemId: id, sku: skuName });
    };

    const handleConfirmDelete = () => {
        setQueue(queue.filter(item => item.id !== dialogDelete.itemId));
        setDialogDelete({ open: false, itemId: null, sku: '' });
        setSnackbar({ open: true, message: 'Item dihapus dari queue', severity: 'info' });
    };

    const handleOpenSubmitDialog = () => {
        if (!nama || !namaToko || !foto || queue.length === 0) {
            setSnackbar({ open: true, message: 'Lengkapi semua data dan pastikan ada item di queue!', severity: 'error' });
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
            setNama(null); setNamaToko(''); setFoto(null); setFotoPreview(''); setQueue([]);
            setDate(new Date());
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
        <Box component="form" noValidate autoComplete="off" sx={{ pb: 4 }}>
            <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 4, border: '1px solid rgba(227, 30, 36, 0.1)', background: 'linear-gradient(135deg, #ffffff 0%, #fff8f8 100%)', boxShadow: '0 2px 16px rgba(227, 30, 36, 0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}><PersonIcon sx={{ fontSize: 20 }} /></Avatar>
                    <Box>
                        <Typography variant="body1" fontWeight="bold" color="primary" sx={{ fontSize: '0.95rem', lineHeight: 1.2 }}>Step 1: Informasi Dasar</Typography>
                        <Typography variant="caption" color="text.secondary">Data SPG & Toko</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                    <DatePicker label="Tanggal" value={date} onChange={setDate} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.9rem', '& fieldset': { borderColor: '#e8e8e8' } } }} />
                    <Autocomplete
                        options={namaOptions} value={nama} onChange={(e, newValue) => setNama(newValue)}
                        getOptionLabel={(option) => option.label || ''} isOptionEqualToValue={(option, value) => option.value === value.value}
                        renderInput={(params) => <TextField {...params} label="Nama SPG" placeholder="Ketik untuk mencari..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.9rem', '& fieldset': { borderColor: '#e8e8e8' } } }} />}
                        renderOption={(props, option) => (<Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}><Avatar sx={{ bgcolor: '#ffebee', width: 28, height: 28 }}><PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} /></Avatar><Typography sx={{ fontSize: '0.9rem' }}>{option.label}</Typography></Box>)}
                        noOptionsText="Tidak ada nama ditemukan"
                    />
                    <TextField fullWidth label="Nama Toko" value={namaToko} onChange={(e) => setNamaToko(e.target.value.toUpperCase())} placeholder="Masukkan nama toko..." InputProps={{ startAdornment: <StoreIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} /> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.9rem', '& fieldset': { borderColor: '#e8e8e8' } } }} helperText="Otomatis menjadi HURUF KAPITAL" />
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 4, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}><ImageIcon sx={{ fontSize: 20 }} /></Avatar>
                    <Box>
                        <Typography variant="body1" fontWeight="bold" color="primary" sx={{ fontSize: '0.95rem', lineHeight: 1.2 }}>Step 2: Detail Penjualan</Typography>
                        <Typography variant="caption" color="text.secondary">Foto & Item Terjual</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2, py: 2, borderRadius: 3, textTransform: 'none', borderStyle: 'dashed', borderWidth: 2, borderColor: foto ? 'primary.main' : '#e0e0e0', backgroundColor: foto ? '#fff5f5' : 'white', transition: 'all 0.3s' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <UploadIcon sx={{ fontSize: 32, color: foto ? 'primary.main' : 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="bold" color={foto ? 'primary.main' : 'text.secondary'}>{foto ? 'Foto Terpilih - Klik untuk Ganti' : 'Upload Foto (Wajib)'}</Typography>
                        <Typography variant="caption" color="text.secondary">Klik untuk memilih foto dari galeri</Typography>
                    </Box>
                    <input type="file" hidden accept="image/*" onChange={handleFotoChange} />
                </Button>
                {fotoPreview && (<Fade in timeout={500}><Box component="img" src={fotoPreview} sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 3, mb: 2, border: '2px solid #f5f5f5', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} /></Fade>)}

                <Stack spacing={2} sx={{ mb: 2 }}>
                    <Autocomplete
                        options={skuOptions} value={sku} onChange={(e, newValue) => setSku(newValue)}
                        getOptionLabel={(option) => option.label || ''} isOptionEqualToValue={(option, value) => option.value === value.value}
                        renderInput={(params) => <TextField {...params} label="Pilih SKU" placeholder="Ketik untuk mencari SKU..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.9rem', '& fieldset': { borderColor: '#e8e8e8' } } }} />}
                        renderOption={(props, option) => (<Box component="li" {...props} sx={{ py: 1 }}><Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{option.label}</Typography></Box>)}
                        noOptionsText="Tidak ada SKU ditemukan"
                    />
                    <TextField fullWidth label="Harga" value={harga} onChange={handleHargaChange} placeholder="0" InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 'bold' }}>Rp</Typography> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.9rem', '& fieldset': { borderColor: '#e8e8e8' } } }} helperText="Format otomatis: Rp 1.000" />
                    <TextField fullWidth label="Qty" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" InputProps={{ inputProps: { min: 1 } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.9rem', '& fieldset': { borderColor: '#e8e8e8' } } }} />
                    <Button variant="contained" color="secondary" fullWidth onClick={handleAddToQueue} startIcon={<AddIcon />} sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(183, 28, 28, 0.2)' }}>Tambah ke Queue</Button>
                </Stack>

                {queue.length > 0 && (
                    <Fade in timeout={500}>
                        <Box>
                            <TableContainer sx={{ borderRadius: 3, border: '1px solid #f0f0f0', mb: 2, overflow: 'hidden' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1.5 }}>SKU</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1.5 }}>HARGA</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1.5 }}>QTY</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1.5 }}>TOTAL</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1.5 }}>AKSI</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {queue.map((row, index) => (
                                            <TableRow key={row.id} hover sx={{ transition: 'all 0.2s', '&:hover': { backgroundColor: '#fff8f8' } }}>
                                                <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label={index + 1} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#ffebee', color: 'primary.main' }} />
                                                        {row.sku}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.8rem', py: 1.5 }}>{formatRupiah(row.harga)}</TableCell>
                                                <TableCell align="center" sx={{ py: 1.5 }}><Chip label={row.qty} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 'bold' }} /></TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, color: 'primary.main' }}>{formatRupiah(row.harga * row.qty)}</TableCell>
                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                    <Tooltip title="Hapus"><IconButton color="error" size="small" onClick={() => handleOpenDeleteDialog(row.id, row.sku)} sx={{ transition: 'all 0.2s', '&:hover': { transform: 'scale(1.1)', backgroundColor: '#ffebee' } }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)', border: '1px solid rgba(227, 30, 36, 0.15)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><WalletIcon sx={{ fontSize: 22 }} /></Avatar>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>GRAND TOTAL</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>{queue.length} Item • {totalItems} Pcs</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold" color="primary" sx={{ fontSize: '1.1rem', fontFamily: 'monospace', backgroundColor: 'white', px: 2, py: 1, borderRadius: 2, boxShadow: '0 2px 8px rgba(227, 30, 36, 0.15)' }}>
                                        Rp {formatRupiah(grandTotal)}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Fade>
                )}
            </Paper>

            <Button variant="contained" size="large" fullWidth disabled={isSubmitting} onClick={handleOpenSubmitDialog} sx={{ py: 2, borderRadius: 3, fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 4px 16px rgba(227,30,36,0.3)', textTransform: 'none', background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #E31E24 0%, #B71C1C 100%)', transition: 'all 0.3s' }}>
                {isSubmitting ? (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}><CircularProgress size={22} color="inherit" /><Typography>Menyimpan...</Typography></Box>) : (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckIcon /><Typography>SUBMIT DATA</Typography></Box>)}
            </Button>
            {isSubmitting && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1, borderRadius: 2, height: 6 }} />}

            <Dialog open={dialogDelete.open} onClose={() => setDialogDelete({ open: false, itemId: null, sku: '' })} sx={{ '& .MuiDialog-paper': { borderRadius: 4, minWidth: 300 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontSize: '1.05rem' }}><WarningIcon /> Konfirmasi Hapus</DialogTitle>
                <DialogContent><DialogContentText sx={{ fontSize: '0.9rem' }}>Hapus item <strong>{dialogDelete.sku}</strong> dari queue?</DialogContentText></DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogDelete({ open: false, itemId: null, sku: '' })} variant="outlined" color="inherit" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Batal</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Ya, Hapus</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogSubmit.open} onClose={() => setDialogSubmit({ open: false })} sx={{ '& .MuiDialog-paper': { borderRadius: 4, minWidth: 320 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontSize: '1.05rem' }}><CheckIcon /> Konfirmasi Submit</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2, fontSize: '0.9rem' }}>Pastikan data berikut sudah benar:</DialogContentText>
                    <Box sx={{ backgroundColor: '#fff5f5', p: 2, borderRadius: 3 }}>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CalendarIcon sx={{ fontSize: 18, color: 'primary.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}><strong>Tanggal:</strong> {formatDateLocal(date)}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}><strong>SPG:</strong> {nama?.label || nama}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><StoreIcon sx={{ fontSize: 18, color: 'primary.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}><strong>Toko:</strong> {namaToko.toUpperCase()}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ImageIcon sx={{ fontSize: 18, color: 'primary.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}><strong>Foto:</strong> {foto ? 'Terupload' : 'Belum ada'}</Typography></Box>
                            <Divider sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '2px dashed rgba(227, 30, 36, 0.2)' }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>Total ({queue.length} item)</Typography>
                                <Typography variant="body1" fontWeight="bold" color="primary" sx={{ fontSize: '1rem', fontFamily: 'monospace' }}>Rp {formatRupiah(grandTotal)}</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogSubmit({ open: false })} variant="outlined" color="inherit" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Batal</Button>
                    <Button onClick={handleConfirmSubmit} variant="contained" color="primary" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Ya, Simpan</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontSize: '0.85rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}