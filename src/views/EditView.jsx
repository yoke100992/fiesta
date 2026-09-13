import { useState, useEffect } from 'react';
import {
    Box, Paper, Select, MenuItem, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Snackbar, Alert, CircularProgress, Typography,
    Chip, Stack, Divider, Avatar, Tooltip, Fade
} from '@mui/material';
import {
    Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon,
    Cancel as CancelIcon, Search as SearchIcon, CalendarMonth as CalendarIcon,
    Person as PersonIcon, Store as StoreIcon, Image as ImageIcon,
    AccountBalanceWallet as WalletIcon, PlaylistAdd as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getSelloutData, getNamaList, getSkuList, updateSellout, deleteSellout } from '../utils/storage';

// ✅ FUNGSI BANTU: Format tanggal ke YYYY-MM-DD sesuai waktu LOKAL
const formatDateLocal = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ✅ FUNGSI BANTU: Format Rupiah
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
            setSnackbar({ open: true, message: editingItem.itemId === 'new' ? 'Item baru ditambahkan!' : 'Data berhasil diupdate!', severity: 'success' });
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
            setSnackbar({ open: true, message: 'Record dihapus karena tidak ada item', severity: 'success' });
        } else {
            await updateSellout(recordId, { items: updatedItems });
            setSnackbar({ open: true, message: 'Item berhasil dihapus', severity: 'success' });
        }
        handleSearch();
    };

    return (
        <Box sx={{ pb: 8 }}> {/* pb: 8 agar tidak tertutup bottom nav */}

            {/* ========== FILTER CARD ========== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4,
                border: '1px solid rgba(30, 64, 175, 0.08)',
                background: 'white',
                boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#1e40af', width: 40, height: 40, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }}>
                        <SearchIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e40af', lineHeight: 1.2 }}>
                            Cari Data Sell Out
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Filter berdasarkan Nama SPG dan Tanggal
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>Nama SPG</Typography>
                        <Select
                            fullWidth displayEmpty
                            value={filterNama}
                            onChange={(e) => setFilterNama(e.target.value)}
                            startAdornment={<PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />}
                            sx={{
                                borderRadius: 3, backgroundColor: '#f8fafc', fontSize: '0.95rem',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1e40af', borderWidth: 2 }
                            }}
                        >
                            <MenuItem value="" disabled>Pilih Nama SPG</MenuItem>
                            <MenuItem value="">Semua Nama</MenuItem>
                            {namaList.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '0.95rem' }}>{n}</MenuItem>)}
                        </Select>
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>Tanggal</Typography>
                        <DatePicker
                            label="Pilih Tanggal"
                            value={filterDate}
                            onChange={setFilterDate}
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

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSearch}
                        startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
                        sx={{
                            py: 1.5, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem',
                            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)',
                            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                            '&:hover': { background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' }
                        }}
                    >
                        Tampilkan Data
                    </Button>
                </Stack>
            </Paper>

            {/* ========== LOADING STATE ========== */}
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#1e40af' }} />
                    <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>Memuat data...</Typography>
                </Box>
            )}

            {/* ========== EMPTY STATE ========== */}
            {!loading && results.length === 0 && (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}>
                    <SearchIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="#64748b" sx={{ mb: 1, fontWeight: 600 }}>Tidak ada data ditemukan</Typography>
                    <Typography variant="body2" color="#94a3b8">Coba ubah filter nama atau tanggal di atas.</Typography>
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
                            p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4,
                            boxShadow: '0 2px 12px rgba(30, 64, 175, 0.04)',
                            border: '1px solid rgba(30, 64, 175, 0.06)',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': { boxShadow: '0 8px 24px rgba(30, 64, 175, 0.08)' }
                        }}
                    >
                        {/* Card Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                            <Avatar sx={{ bgcolor: '#1e40af', width: 44, height: 44, fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }}>
                                {record.nama.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', color: '#1e293b', lineHeight: 1.2 }}>{record.nama}</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<StoreIcon sx={{ fontSize: '16px !important' }} />}
                                        label={record.namaToko}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 24, fontSize: '0.75rem', borderColor: '#cbd5e1', color: '#475569', bgcolor: '#f8fafc' }}
                                    />
                                    <Chip
                                        icon={<CalendarIcon sx={{ fontSize: '16px !important' }} />}
                                        label={record.tanggal}
                                        size="small"
                                        sx={{ height: 24, fontSize: '0.75rem', bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }}
                                    />
                                </Stack>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2.5 }} />

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>

                            {/* Image Section */}
                            <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box
                                    component="img"
                                    src={record.foto}
                                    alt="Foto Toko"
                                    sx={{
                                        width: { xs: '100%', md: 140 },
                                        height: { xs: 160, md: 140 },
                                        objectFit: 'cover',
                                        borderRadius: 3,
                                        border: '2px solid #e2e8f0',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease, border-color 0.3s ease',
                                        '&:hover': { transform: 'scale(1.02)', borderColor: '#1e40af' }
                                    }}
                                    onClick={() => window.open(record.foto, '_blank')}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', fontWeight: 500 }}>
                                    <ImageIcon sx={{ fontSize: 14 }} /> Klik untuk perbesar
                                </Typography>
                            </Box>

                            {/* Table Section */}
                            <Box sx={{ flexGrow: 1, overflowX: 'auto' }}>
                                <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem', py: 1.5 }}>SKU</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem', py: 1.5 }}>HARGA</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem', py: 1.5 }}>QTY</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem', py: 1.5 }}>TOTAL</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '0.75rem', py: 1.5 }}>AKSI</TableCell>
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
                                                            backgroundColor: isEditing ? '#eff6ff' : 'transparent',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        {isEditing ? (
                                                            <>
                                                                <TableCell sx={{ py: 1.5, px: 1 }}>
                                                                    <Select
                                                                        fullWidth
                                                                        value={editForm.sku}
                                                                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                                                        sx={{
                                                                            borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem',
                                                                            '& .MuiSelect-select': { py: 1, px: 1.5 },
                                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1e40af', borderWidth: 2 }
                                                                        }}
                                                                    >
                                                                        {skuList.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>{s}</MenuItem>)}
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ py: 1.5, px: 1 }}>
                                                                    <TextField
                                                                        fullWidth
                                                                        value={editForm.harga}
                                                                        onChange={handleEditHargaChange}
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem',
                                                                                '& input': { padding: '8px 12px', textAlign: 'right' },
                                                                                '& fieldset': { borderColor: '#1e40af', borderWidth: 2 }
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
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem',
                                                                                '& input': { padding: '8px 12px', textAlign: 'center' },
                                                                                '& fieldset': { borderColor: '#1e40af', borderWidth: 2 }
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, color: '#1e40af', fontFamily: 'monospace' }}>
                                                                    {formatRupiah(currentRowTotal)}
                                                                </TableCell>
                                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                                    <Tooltip title="Simpan"><IconButton color="success" size="small" onClick={() => saveEdit(record.id)}><SaveIcon /></IconButton></Tooltip>
                                                                    <Tooltip title="Batal"><IconButton color="default" size="small" onClick={cancelEdit}><CancelIcon /></IconButton></Tooltip>
                                                                </TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem', py: 1.5, color: '#334155' }}>{item.sku}</TableCell>
                                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.85rem', py: 1.5, color: '#334155' }}>{formatRupiah(item.harga)}</TableCell>
                                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                                    <Chip label={item.qty} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#334155' }} />
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, color: '#1e40af', fontFamily: 'monospace' }}>
                                                                    {formatRupiah(item.harga * item.qty)}
                                                                </TableCell>
                                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                                    <Tooltip title="Edit"><IconButton color="primary" size="small" onClick={() => startEdit(record.id, item)} sx={{ '&:hover': { bgcolor: '#eff6ff' } }}><EditIcon /></IconButton></Tooltip>
                                                                    <Tooltip title="Hapus"><IconButton color="error" size="small" onClick={() => handleDeleteItem(record.id, item.id)} sx={{ '&:hover': { bgcolor: '#fee2e2' } }}><DeleteIcon /></IconButton></Tooltip>
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Render Baris Baru (Tambah Item) */}
                                            {isAddingNew && (
                                                <Fade in timeout={300}>
                                                    <TableRow sx={{ backgroundColor: '#f0fdf4' }}>
                                                        <TableCell sx={{ py: 1.5, px: 1 }}>
                                                            <Select
                                                                fullWidth
                                                                value={editForm.sku}
                                                                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                                                sx={{
                                                                    borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem',
                                                                    '& .MuiSelect-select': { py: 1, px: 1.5 },
                                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#16a34a', borderWidth: 2 }
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
                                                                        borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem',
                                                                        '& input': { padding: '8px 12px', textAlign: 'right' },
                                                                        '& fieldset': { borderColor: '#16a34a', borderWidth: 2 }
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
                                                                        borderRadius: 2, backgroundColor: 'white', fontSize: '0.85rem',
                                                                        '& input': { padding: '8px 12px', textAlign: 'center' },
                                                                        '& fieldset': { borderColor: '#16a34a', borderWidth: 2 }
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, color: '#16a34a', fontFamily: 'monospace' }}>
                                                            {formatRupiah((parseInt(editForm.harga.replace(/\./g, ''), 10) || 0) * (parseInt(editForm.qty, 10) || 0))}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                                            <Tooltip title="Simpan Item Baru"><IconButton color="success" size="small" onClick={() => saveEdit(record.id)}><SaveIcon /></IconButton></Tooltip>
                                                            <Tooltip title="Batal"><IconButton color="default" size="small" onClick={cancelEdit}><CancelIcon /></IconButton></Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                </Fade>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Grand Total Footer */}
                                <Paper elevation={0} sx={{
                                    mt: 2, p: 2, borderRadius: 3,
                                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                    border: '1px solid rgba(30, 64, 175, 0.15)'
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#1e40af', width: 40, height: 40, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)' }}>
                                                <WalletIcon sx={{ fontSize: 22 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" color="#1e40af" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Grand Total
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" fontWeight="bold" color="#1e40af" sx={{
                                            fontSize: '1.2rem', fontFamily: 'monospace',
                                            backgroundColor: 'white', px: 2.5, py: 1, borderRadius: 2,
                                            boxShadow: '0 2px 8px rgba(30, 64, 175, 0.1)',
                                            border: '1px solid #bfdbfe'
                                        }}>
                                            Rp {formatRupiah(grandTotal)}
                                        </Typography>
                                    </Box>
                                </Paper>

                                {/* Tombol Tambah Item */}
                                {!isAddingNew && editingItem?.recordId !== record.id && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleAddItem(record.id)}
                                        sx={{
                                            mt: 2, py: 1.5, borderRadius: 3, textTransform: 'none', fontSize: '0.9rem', fontWeight: 600,
                                            borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', color: '#64748b',
                                            transition: 'all 0.3s ease',
                                            '&:hover': { borderColor: '#1e40af', color: '#1e40af', backgroundColor: '#eff6ff', borderStyle: 'dashed' }
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

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}