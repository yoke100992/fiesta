import { useState, useEffect } from 'react';
import {
    Box, Paper, Select, MenuItem, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Snackbar, Alert, CircularProgress, Typography,
    Chip, Stack, Divider, Avatar, Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon,
    Cancel as CancelIcon, Search as SearchIcon, CalendarMonth as CalendarIcon,
    Person as PersonIcon, Store as StoreIcon, Image as ImageIcon,
    AccountBalanceWallet as WalletIcon, PlaylistAdd as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getSelloutData, getNamaList, getSkuList, updateSellout, deleteSellout } from '../utils/storage';

// ? FUNGSI BANTU: Format tanggal ke YYYY-MM-DD sesuai waktu LOKAL
const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ? FUNGSI BANTU: Format Rupiah
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID').format(number);
};

export default function EditView() {
    const [filterNama, setFilterNama] = useState('');
    const [filterDate, setFilterDate] = useState(null);
    const [results, setResults] = useState([]);
    const [namaList, setNamaList] = useState([]);
    const [skuList, setSkuList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ sku: '', harga: '', qty: '' });

    useEffect(() => {
        const load = async () => {
            const nama = await getNamaList();
            const sku = await getSkuList();
            setNamaList(nama);
            setSkuList(sku);
        };
        load();
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        const data = await getSelloutData();

        const filtered = data.filter(d => {
            const matchNama = filterNama ? d.nama === filterNama : true;
            const matchDate = filterDate ? d.tanggal === formatDateLocal(filterDate) : true;
            return matchNama && matchDate;
        });

        setResults(filtered);
        setLoading(false);
    };

    const startEdit = (recordId, item) => {
        setEditingItem({ recordId, itemId: item.id });
        setEditForm({
            sku: item.sku,
            harga: new Intl.NumberFormat('id-ID').format(item.harga),
            qty: item.qty.toString()
        });
    };

    const handleAddItem = (recordId) => {
        setEditingItem({ recordId, itemId: 'new' });
        setEditForm({ sku: '', harga: '', qty: '' });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditForm({ sku: '', harga: '', qty: '' });
    };

    const handleEditHargaChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setEditForm({
            ...editForm,
            harga: value ? new Intl.NumberFormat('id-ID').format(value) : ''
        });
    };

    const saveEdit = async (recordId) => {
        if (!editForm.sku || !editForm.harga || !editForm.qty) {
            setSnackbar({ open: true, message: 'Lengkapi SKU, Harga, dan Qty!', severity: 'warning' });
            return;
        }

        const rawHarga = parseInt(editForm.harga.replace(/\./g, ''), 10);
        const rawQty = parseInt(editForm.qty, 10);

        const record = results.find(r => r.id === recordId);
        if (!record) return;

        let updatedItems;

        if (editingItem.itemId === 'new') {
            const newItem = { id: Date.now(), sku: editForm.sku, harga: rawHarga, qty: rawQty };
            updatedItems = [...record.items, newItem];
        } else {
            updatedItems = record.items.map(item =>
                item.id === editingItem.itemId
                    ? { ...item, sku: editForm.sku, harga: rawHarga, qty: rawQty }
                    : item
            );
        }

        try {
            await updateSellout(recordId, { items: updatedItems });
            setSnackbar({ open: true, message: editingItem.itemId === 'new' ? 'Item baru ditambahkan!' : 'Data diupdate!', severity: 'success' });
            cancelEdit();
            handleSearch();
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal: ' + error.message, severity: 'error' });
        }
    };

    const handleDeleteItem = async (recordId, itemId) => {
        const record = results.find(r => r.id === recordId);
        if (!record) return;

        const updatedItems = record.items.filter(item => item.id !== itemId);

        if (updatedItems.length === 0) {
            await deleteSellout(recordId);
            setSnackbar({ open: true, message: 'Record dihapus', severity: 'success' });
        } else {
            await updateSellout(recordId, { items: updatedItems });
            setSnackbar({ open: true, message: 'Item dihapus', severity: 'success' });
        }
        handleSearch();
    };

    return (
        <Box sx={{ pb: 4 }}>
            {/* ========== FILTER CARD ========== */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5, mb: 2, borderRadius: 3,
                    border: '1px solid rgba(227, 30, 36, 0.1)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff8f8 100%)'
                }}
            >
                <Typography variant="body1" fontWeight="bold" color="primary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                    <SearchIcon sx={{ fontSize: 20 }} /> Cari Data Sell Out
                </Typography>

                <Stack spacing={1.5}>
                    <Select
                        fullWidth
                        displayEmpty
                        value={filterNama}
                        onChange={(e) => setFilterNama(e.target.value)}
                        startAdornment={<PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />}
                        sx={{ borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem' }}
                    >
                        <MenuItem value="" disabled>Pilih Nama SPG</MenuItem>
                        <MenuItem value="">Semua Nama</MenuItem>
                        {namaList.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '0.85rem' }}>{n}</MenuItem>)}
                    </Select>

                    <DatePicker
                        label="Filter Tanggal"
                        value={filterDate}
                        onChange={setFilterDate}
                        sx={{
                            width: '100%',
                            '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem' }
                        }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSearch}
                        startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
                        sx={{ py: 1.2, borderRadius: 2, fontWeight: 'bold', textTransform: 'none', fontSize: '0.85rem' }}
                    >
                        Tampilkan Data
                    </Button>
                </Stack>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                    <CircularProgress size={30} sx={{ color: 'primary.main' }} />
                    <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.8rem' }}>Memuat data...</Typography>
                </Box>
            )}

            {!loading && results.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #e0e0e0' }}>
                    <SearchIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>Tidak ada data ditemukan</Typography>
                </Paper>
            )}

            {/* ========== RESULTS LIST ========== */}
            {results.map(record => {
                const grandTotal = record.items.reduce((sum, item) => sum + (item.harga * item.qty), 0);
                const isAddingNew = editingItem?.recordId === record.id && editingItem?.itemId === 'new';

                return (
                    <Paper
                        key={record.id}
                        elevation={0}
                        sx={{
                            p: 2, mb: 2, borderRadius: 3,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                            border: '1px solid #f0f0f0'
                        }}
                    >
                        {/* Card Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontWeight: 'bold', fontSize: '1rem' }}>
                                {record.nama.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>{record.nama}</Typography>
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<StoreIcon sx={{ fontSize: '14px !important' }} />}
                                        label={record.namaToko}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                    />
                                    <Chip
                                        icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />}
                                        label={record.tanggal}
                                        size="small"
                                        color="primary"
                                        variant="tonal"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                    />
                                </Stack>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>

                            {/* Image Section */}
                            <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box
                                    component="img"
                                    src={record.foto}
                                    alt="Foto Toko"
                                    sx={{
                                        width: { xs: '100%', md: 110 },
                                        height: { xs: 130, md: 110 },
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                        border: '1px solid #f5f5f5',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(record.foto, '_blank')}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem' }}>
                                    <ImageIcon sx={{ fontSize: 12 }} /> Perbesar
                                </Typography>
                            </Box>

                            {/* Table Section */}
                            <Box sx={{ flexGrow: 1, overflowX: 'auto' }}>
                                <TableContainer sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1, width: '30%' }}>SKU</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1, width: '25%' }}>HARGA</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1, width: '15%' }}>QTY</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1, width: '20%' }}>TOTAL</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem', py: 1, width: '10%' }}>AKSI</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {record.items.map(item => {
                                                const isEditing = editingItem?.itemId === item.id;
                                                const editHargaNum = parseInt(editForm.harga.replace(/\./g, ''), 10) || 0;
                                                const editQtyNum = parseInt(editForm.qty, 10) || 0;
                                                const currentRowTotal = isEditing ? (editHargaNum * editQtyNum) : (item.harga * item.qty);

                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        hover
                                                        sx={{
                                                            backgroundColor: isEditing ? '#fff8f8' : 'transparent',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        {isEditing ? (
                                                            <>
                                                                {/* ? CELL SKU: Select diperbesar pad-nya */}
                                                                <TableCell sx={{ py: 1.5, px: 1 }}>
                                                                    <Select
                                                                        fullWidth
                                                                        value={editForm.sku}
                                                                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                                                        sx={{
                                                                            fontSize: '0.85rem',
                                                                            '& .MuiSelect-select': { py: 1.2, px: 1.5 }, // Padding dalam diperbesar
                                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' }
                                                                        }}
                                                                    >
                                                                        {skuList.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>{s}</MenuItem>)}
                                                                    </Select>
                                                                </TableCell>

                                                                {/* ? CELL HARGA: TextField diperbesar pad-nya */}
                                                                <TableCell align="right" sx={{ py: 1.5, px: 1 }}>
                                                                    <TextField
                                                                        fullWidth
                                                                        value={editForm.harga}
                                                                        onChange={handleEditHargaChange}
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                fontSize: '0.85rem',
                                                                                '& input': { padding: '10px 14px' }, // Padding dalam diperbesar
                                                                                '& fieldset': { borderColor: '#e0e0e0' }
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>

                                                                {/* ? CELL QTY: TextField diperbesar pad-nya */}
                                                                <TableCell align="center" sx={{ py: 1.5, px: 1 }}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        value={editForm.qty}
                                                                        onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                fontSize: '0.85rem',
                                                                                '& input': { padding: '10px 14px', textAlign: 'center' },
                                                                                '& fieldset': { borderColor: '#e0e0e0' }
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>

                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, color: 'primary.main' }}>
                                                                    {formatRupiah(currentRowTotal)}
                                                                </TableCell>
                                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                                    <Tooltip title="Simpan"><IconButton color="primary" size="small" onClick={() => saveEdit(record.id)}><SaveIcon /></IconButton></Tooltip>
                                                                    <Tooltip title="Batal"><IconButton color="default" size="small" onClick={cancelEdit}><CancelIcon /></IconButton></Tooltip>
                                                                </TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', py: 1 }}>{item.sku}</TableCell>
                                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.8rem', py: 1 }}>{formatRupiah(item.harga)}</TableCell>
                                                                <TableCell align="center" sx={{ py: 1 }}><Chip label={item.qty} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1 }}>{formatRupiah(item.harga * item.qty)}</TableCell>
                                                                <TableCell align="center" sx={{ py: 1 }}>
                                                                    <Tooltip title="Edit"><IconButton color="primary" size="small" onClick={() => startEdit(record.id, item)}><EditIcon /></IconButton></Tooltip>
                                                                    <Tooltip title="Hapus"><IconButton color="error" size="small" onClick={() => handleDeleteItem(record.id, item.id)}><DeleteIcon /></IconButton></Tooltip>
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                );
                                            })}

                                            {/* ? Render Baris Baru (Tambah Item) - Juga diperbesar pad-nya */}
                                            {isAddingNew && (
                                                <TableRow sx={{ backgroundColor: '#f0fff4' }}>
                                                    <TableCell sx={{ py: 1.5, px: 1 }}>
                                                        <Select
                                                            fullWidth
                                                            value={editForm.sku}
                                                            onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                                            sx={{
                                                                fontSize: '0.85rem',
                                                                '& .MuiSelect-select': { py: 1.2, px: 1.5 },
                                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' }
                                                            }}
                                                        >
                                                            <MenuItem value="" disabled>Pilih SKU</MenuItem>
                                                            {skuList.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>{s}</MenuItem>)}
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.5, px: 1 }}>
                                                        <TextField
                                                            fullWidth
                                                            value={editForm.harga}
                                                            onChange={handleEditHargaChange}
                                                            placeholder="0"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    fontSize: '0.85rem',
                                                                    '& input': { padding: '10px 14px' },
                                                                    '& fieldset': { borderColor: '#e0e0e0' }
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.5, px: 1 }}>
                                                        <TextField
                                                            fullWidth
                                                            type="number"
                                                            value={editForm.qty}
                                                            onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                                                            placeholder="0"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    fontSize: '0.85rem',
                                                                    '& input': { padding: '10px 14px', textAlign: 'center' },
                                                                    '& fieldset': { borderColor: '#e0e0e0' }
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, color: 'success.main' }}>
                                                        {formatRupiah((parseInt(editForm.harga.replace(/\./g, ''), 10) || 0) * (parseInt(editForm.qty, 10) || 0))}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                                        <Tooltip title="Simpan Item Baru"><IconButton color="success" size="small" onClick={() => saveEdit(record.id)}><SaveIcon /></IconButton></Tooltip>
                                                        <Tooltip title="Batal"><IconButton color="default" size="small" onClick={cancelEdit}><CancelIcon /></IconButton></Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Grand Total Footer */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1.5, borderTop: '2px dashed #f0f0f0', px: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WalletIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                        <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ fontSize: '0.8rem' }}>GRAND TOTAL</Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold" color="primary" sx={{ fontSize: '1rem', fontFamily: 'monospace', backgroundColor: '#fff5f5', px: 1.5, py: 0.5, borderRadius: 2 }}>
                                        Rp {formatRupiah(grandTotal)}
                                    </Typography>
                                </Box>

                                {/* Tombol Tambah Item */}
                                {!isAddingNew && editingItem?.recordId !== record.id && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleAddItem(record.id)}
                                        sx={{
                                            mt: 1.5,
                                            py: 1,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '0.8rem',
                                            borderStyle: 'dashed',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        Tambah Item SKU (Jika Ada yang Tertinggal)
                                    </Button>
                                )}

                            </Box>
                        </Box>
                    </Paper>
                );
            })}

            <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, fontSize: '0.85rem' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}