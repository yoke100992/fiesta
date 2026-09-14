import { useState, useEffect } from 'react';
import {
    Box, Paper, Select, MenuItem, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, Stack,
    CircularProgress, Alert, Snackbar, Avatar, Divider, Tooltip, TextField, InputAdornment, IconButton
} from '@mui/material';
import {
    Download as DownloadIcon, FilterList as FilterIcon,
    Person as PersonIcon, Clear as ClearIcon, PlayArrow as ApplyIcon,
    Receipt as ReceiptIcon, Lock, Visibility, VisibilityOff, Login, Logout as LogoutIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getSelloutData, getNamaList } from '../utils/storage';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ==========================================
// KONFIGURASI PASSWORD
// ==========================================
const CORRECT_PASSWORD = 'admin123';

// ==========================================
// FUNGSI BANTU
// ==========================================

const formatDateLocal = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatRupiah = (number) => new Intl.NumberFormat('id-ID').format(number);

const formatDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
};

const isValidDate = (dateStr) => {
    if (dateStr === undefined || dateStr === null) return false;
    const str = String(dateStr).trim().toLowerCase();
    if (str === '' || str === 'undefined' || str === 'null' || str === 'nan' || str === 'false') return false;
    try {
        const parsed = parseAnyDate(str);
        if (parsed.getTime() === 0 || isNaN(parsed.getTime())) return false;
        return true;
    } catch (e) {
        return false;
    }
};

const parseAnyDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str);
    const parts = str.split('/');
    if (parts.length === 3) {
        const [a, b, year] = parts;
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (numA > 12) return new Date(`${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`);
        if (numB > 12) return new Date(`${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`);
        return new Date(`${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`);
    }
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
};

// ==========================================
// KOMPONEN PASSWORD PROTECTION
// ==========================================
function PasswordProtection({ onUnlock }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleUnlock = () => {
        if (password === CORRECT_PASSWORD) {
            setError('');
            sessionStorage.setItem('viewview_authenticated', 'true');
            onUnlock && onUnlock();
        } else {
            setError('Password yang Anda masukkan salah. Silakan coba lagi.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #667eea 100%)',
                p: 3,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    maxWidth: 450,
                    width: '100%',
                    p: 5,
                    borderRadius: 4,
                    textAlign: 'center',
                    background: 'white',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Box
                    sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                    }}
                >
                    <Lock sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#1a202c', fontSize: '1.5rem' }}>
                    Akses Terbatas
                </Typography>

                <Typography variant="body2" sx={{ mb: 4, color: '#718096', lineHeight: 1.6, px: 2 }}>
                    Masukkan password untuk mengakses halaman pengaturan data.
                </Typography>

                <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    onKeyPress={handleKeyPress}
                    error={!!error}
                    sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: '#f7fafc',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                                borderColor: '#e2e8f0',
                                borderWidth: 2,
                            },
                            '&:hover fieldset': {
                                borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                            },
                        },
                        '& .MuiInputBase-input': {
                            padding: '14px 16px',
                            fontSize: '0.95rem',
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Lock sx={{ color: '#a0aec0', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    sx={{ color: '#a0aec0' }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.875rem' }}>
                        {error}
                    </Alert>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleUnlock}
                    disabled={!password.trim()}
                    startIcon={<Login />}
                    sx={{
                        py: 1.8,
                        borderRadius: 3,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #667eea 100%)',
                        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
                            boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                            transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                            background: '#e2e8f0',
                            color: '#a0aec0',
                            boxShadow: 'none',
                        },
                    }}
                >
                    Buka Pengaturan
                </Button>

                <Typography variant="caption" sx={{ mt: 3, display: 'block', color: '#a0aec0', fontSize: '0.75rem' }}>
                    Hint: Password default adalah "admin123"
                </Typography>
            </Paper>
        </Box>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ViewView() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('viewview_authenticated') === 'true';
    });

    const [filterNama, setFilterNama] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selloutData, setSelloutData] = useState([]);
    const [namaList, setNamaList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [pivotData, setPivotData] = useState({});
    const [allDates, setAllDates] = useState([]);
    const [isFiltered, setIsFiltered] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (!isAuthenticated) return;

        const load = async () => {
            setLoading(true);
            const data = await getSelloutData();
            const nama = await getNamaList();
            setSelloutData(data);
            setNamaList(nama);
            setLoading(false);
        };
        load();
    }, [isAuthenticated]);

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('viewview_authenticated');
        setFilterNama('');
        setStartDate(null);
        setEndDate(null);
        setPivotData({});
        setAllDates([]);
        setIsFiltered(false);
    };

    const handleApplyFilter = () => {
        const startTs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
        const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        const filteredData = selloutData.filter(d => {
            if (d.tanggal === undefined || d.tanggal === null) return false;
            const tanggalStr = String(d.tanggal).trim().toLowerCase();
            if (!tanggalStr || tanggalStr === 'undefined' || tanggalStr === 'null' || tanggalStr === 'nan' || tanggalStr === 'false' || tanggalStr === '') return false;
            if (!isValidDate(d.tanggal)) return false;

            const dTs = parseAnyDate(d.tanggal).getTime();
            if (dTs === 0 || isNaN(dTs)) return false;

            const matchNama = filterNama ? d.nama === filterNama : true;
            const matchStart = dTs >= startTs;
            const matchEnd = dTs <= endTs;
            return matchNama && matchStart && matchEnd;
        });

        const pivot = {};
        const datesSet = new Set();

        filteredData.forEach(record => {
            if (!record.nama || record.nama === undefined || record.nama === null) return;
            const namaStr = String(record.nama).trim().toLowerCase();
            if (!namaStr || namaStr === 'undefined' || namaStr === 'null') return;

            if (!pivot[record.nama]) {
                pivot[record.nama] = { records: [], totalByDate: {}, itemsByDate: {}, fotoByDate: {} };
            }
            datesSet.add(record.tanggal);
            pivot[record.nama].records.push(record);

            const dayTotal = record.items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
            pivot[record.nama].totalByDate[record.tanggal] = (pivot[record.nama].totalByDate[record.tanggal] || 0) + dayTotal;
            pivot[record.nama].itemsByDate[record.tanggal] = record.items;
            if (record.foto) pivot[record.nama].fotoByDate[record.tanggal] = record.foto;
        });

        setPivotData(pivot);

        const sortedDates = Array.from(datesSet)
            .filter(d => {
                if (d === undefined || d === null) return false;
                const str = String(d).trim().toLowerCase();
                if (!str || str === 'undefined' || str === 'null' || str === 'nan') return false;
                return isValidDate(d);
            })
            .sort((a, b) => parseAnyDate(a) - parseAnyDate(b));

        setAllDates(sortedDates);
        setIsFiltered(true);
    };

    const handleResetFilter = () => {
        setFilterNama(''); setStartDate(null); setEndDate(null);
        setPivotData({}); setAllDates([]); setIsFiltered(false);
    };

    const getGrandTotal = (nama) => {
        if (!pivotData[nama]) return 0;
        return Object.values(pivotData[nama].totalByDate).reduce((sum, val) => sum + val, 0);
    };

    const handleDownloadExcel = async () => {
        if (Object.keys(pivotData).length === 0) {
            setSnackbar({ open: true, message: 'Tidak ada data untuk didownload', severity: 'warning' });
            return;
        }

        setSnackbar({ open: true, message: 'Sedang memproses Excel dengan gambar...', severity: 'info' });

        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Laporan Pivot Sell Out');

            // Header Row 1
            const headersRow1 = ['Nama SPG', 'SKU'];
            allDates.forEach(date => headersRow1.push(date, ''));
            const row1 = ws.addRow(headersRow1);
            row1.height = 30;
            row1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            row1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            row1.alignment = { vertical: 'middle', horizontal: 'center' };

            allDates.forEach((date, index) => {
                const startCol = 3 + (index * 2);
                ws.mergeCells(1, startCol, 1, startCol + 1);
            });

            // Header Row 2
            const headersRow2 = ['', ''];
            allDates.forEach(() => headersRow2.push('Foto', 'Qty'));
            const row2 = ws.addRow(headersRow2);
            row2.height = 25;
            row2.font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };
            row2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            row2.alignment = { vertical: 'middle', horizontal: 'center' };

            // Set column widths
            ws.getColumn(1).width = 20;
            ws.getColumn(2).width = 25;
            allDates.forEach((_, index) => {
                ws.getColumn(3 + (index * 2)).width = 18;
                ws.getColumn(4 + (index * 2)).width = 10;
            });

            // Get sorted data
            const sortedNamas = Object.keys(pivotData).sort();
            const allSkus = new Set();
            sortedNamas.forEach(nama => pivotData[nama].records.forEach(r => r.items.forEach(i => allSkus.add(i.sku))));
            const sortedSkus = Array.from(allSkus).sort();

            let currentRow = 3;

            for (const nama of sortedNamas) {
                const namaData = pivotData[nama];
                let isFirstRowForNama = true; // Track apakah ini baris pertama untuk SPG ini

                for (const sku of sortedSkus) {
                    const row = ws.addRow([nama, sku]);
                    row.height = isFirstRowForNama ? 120 : 25; // Baris pertama lebih tinggi untuk foto
                    row.alignment = { vertical: 'top', horizontal: 'left' };
                    row.eachCell((cell) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });

                    let colIndex = 3;
                    for (const date of allDates) {
                        const record = namaData.records.find(r => r.tanggal === date);
                        const item = record ? record.items.find(i => i.sku === sku) : null;
                        const fotoUrl = record ? record.foto : null;

                        const fotoCell = row.getCell(colIndex);
                        fotoCell.alignment = { vertical: 'top', horizontal: 'center' };

                        // Tambahkan foto HANYA di baris pertama setiap SPG, dan gunakan foto original (tidak di-compress)
                        if (isFirstRowForNama && fotoUrl) {
                            try {
                                // Gunakan URL original, bukan thumbnail
                                const response = await fetch(fotoUrl);
                                const arrayBuffer = await response.arrayBuffer();
                                const imageId = workbook.addImage({ buffer: arrayBuffer, extension: 'png' });
                                ws.addImage(imageId, {
                                    tl: { col: colIndex - 1, row: currentRow - 1 },
                                    ext: { width: 100, height: 100 }
                                });
                            } catch (err) {
                                console.error('Gagal load gambar:', err);
                            }
                        }

                        const qtyCell = row.getCell(colIndex + 1);
                        qtyCell.value = item ? item.qty : 0;
                        qtyCell.alignment = { vertical: 'middle', horizontal: 'center' };
                        qtyCell.font = { bold: true, size: 11, color: { argb: 'FF1E40AF' } };
                        colIndex += 2;
                    }

                    currentRow++;
                    isFirstRowForNama = false; // Setelah baris pertama, set ke false
                }
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const filename = `Laporan_Pivot_SellOut_${formatDateLocal(startDate || new Date())}_to_${formatDateLocal(endDate || new Date())}.xlsx`;
            saveAs(blob, filename);
            setSnackbar({ open: true, message: 'Excel berhasil didownload!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal membuat Excel: ' + error.message, severity: 'error' });
        }
    };

    // ==========================================
    // TAMPILKAN PASSWORD PROTECTION JIKA BELUM LOGIN
    // ==========================================
    if (!isAuthenticated) {
        return <PasswordProtection onUnlock={() => setIsAuthenticated(true)} />;
    }

    // ==========================================
    // TAMPILKAN LOADING
    // ==========================================
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} sx={{ color: '#667eea' }} />
            </Box>
        );
    }

    // ==========================================
    // TAMPILKAN DASHBOARD
    // ==========================================
    return (
        <Box sx={{ pb: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>

            {/* TOP BAR WITH LOGOUT */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, mb: 1 }}>
                <Tooltip title="Keluar dari Dashboard">
                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#cbd5e1',
                            color: '#64748b',
                            '&:hover': {
                                borderColor: '#ef4444',
                                color: '#ef4444',
                                bgcolor: '#fef2f2'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </Tooltip>
            </Box>

            {/* FILTER CARD */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4,
                border: '1px solid rgba(102, 126, 234, 0.08)',
                background: 'white',
                boxShadow: '0 2px 12px rgba(102, 126, 234, 0.04)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}>
                        <FilterIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#667eea', lineHeight: 1.2 }}>
                            Filter Laporan
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Pilih kriteria, lalu klik "Terapkan"
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Nama SPG</Typography>
                            <Select
                                fullWidth displayEmpty
                                value={filterNama}
                                onChange={(e) => setFilterNama(e.target.value)}
                                startAdornment={<PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />}
                                sx={{
                                    borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea', borderWidth: 2 }
                                }}
                            >
                                <MenuItem value="">Semua Nama SPG</MenuItem>
                                {namaList.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '0.95rem' }}>{n}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Tanggal Mulai</Typography>
                            <DatePicker
                                value={startDate}
                                onChange={setStartDate}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem',
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#667eea' },
                                                '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Tanggal Akhir</Typography>
                            <DatePicker
                                value={endDate}
                                onChange={setEndDate}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem',
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#667eea' },
                                                '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                            <Button
                                variant="contained"
                                onClick={handleApplyFilter}
                                startIcon={<ApplyIcon />}
                                sx={{
                                    py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold',
                                    textTransform: 'none', fontSize: '0.95rem',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                                    background: '#667eea',
                                    '&:hover': { background: '#3874BC' }
                                }}
                            >
                                Terapkan
                            </Button>
                            <Tooltip title="Reset Filter">
                                <Button
                                    variant="outlined"
                                    onClick={handleResetFilter}
                                    sx={{
                                        minWidth: 'auto', p: 1.5, borderRadius: 3,
                                        borderColor: '#cbd5e1', color: '#64748b',
                                        '&:hover': { borderColor: '#667eea', color: '#667eea', bgcolor: '#eff6ff' }
                                    }}
                                >
                                    <ClearIcon />
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Stack>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                    <Button
                        variant="contained"
                        onClick={handleDownloadExcel}
                        startIcon={<DownloadIcon />}
                        disabled={Object.keys(pivotData).length === 0}
                        sx={{
                            py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold',
                            textTransform: 'none', fontSize: '0.95rem',
                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
                            background: '#3874BC',
                            '&:hover': { background: '#3874BC' },
                            '&:disabled': { background: '#cbd5e1', color: '#94a3b8' }
                        }}
                    >
                        Download Excel Pivot (Dengan Foto)
                    </Button>
                </Box>
            </Paper>

            {/* EMPTY STATES */}
            {!isFiltered && !loading && (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}>
                    <FilterIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="#64748b" sx={{ mb: 1, fontWeight: 600 }}>Belum ada data yang ditampilkan</Typography>
                    <Typography variant="body2" color="#94a3b8">Silakan pilih filter di atas dan klik <strong style={{ color: '#667eea' }}>"Terapkan"</strong>.</Typography>
                </Paper>
            )}
            {isFiltered && Object.keys(pivotData).length === 0 && (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}>
                    <ClearIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="#64748b" sx={{ mb: 1, fontWeight: 600 }}>Tidak ada data ditemukan</Typography>
                    <Typography variant="body2" color="#94a3b8">Coba ubah filter tanggal atau nama SPG.</Typography>
                </Paper>
            )}

            {/* PIVOT TABLE WEB VIEW */}
            {isFiltered && Object.keys(pivotData).length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, boxShadow: '0 2px 12px rgba(102, 126, 234, 0.04)', border: '1px solid rgba(102, 126, 234, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}>
                            <ReceiptIcon sx={{ fontSize: 22 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#667eea' }}>
                                Pivot Penjualan Harian
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total Rupiah per SPG per Tanggal
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />

                    <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'auto', maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{
                                        position: 'sticky', left: 0, zIndex: 3,
                                        background: '#3874BC',
                                        color: 'white', fontWeight: 'bold', minWidth: 160,
                                        borderBottom: '2px solid #764ba2'
                                    }}>
                                        Nama SPG
                                    </TableCell>

                                    {allDates.map(date => (
                                        <TableCell key={date} align="center" sx={{
                                            background: '#3879BC',
                                            color: 'white', fontWeight: 'bold', minWidth: 110,
                                            borderBottom: '2px solid #764ba2', fontSize: '0.75rem', py: 1.5
                                        }}>
                                            {formatDateIndo(date)}
                                        </TableCell>
                                    ))}

                                    <TableCell align="right" sx={{
                                        background: '#3874BC',
                                        color: 'white', fontWeight: 'bold', minWidth: 130,
                                        borderBottom: '2px solid #667eea', fontSize: '0.85rem'
                                    }}>
                                        Grand Total
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.keys(pivotData).sort().map((nama, rowIndex) => (
                                    <TableRow key={nama} hover sx={{
                                        '&:last-child td': { borderBottom: 0 },
                                        '&:hover': { bgcolor: '#f8fafc' }
                                    }}>
                                        <TableCell sx={{
                                            position: 'sticky', left: 0, zIndex: 1,
                                            bgcolor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                                            fontWeight: 'bold', fontSize: '0.85rem',
                                            borderBottom: '1px solid #e2e8f0',
                                            borderRight: '1px solid #e2e8f0'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: '#eff6ff', color: '#667eea', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    {nama.charAt(0).toUpperCase()}
                                                </Avatar>
                                                {nama}
                                            </Box>
                                        </TableCell>

                                        {allDates.map(date => {
                                            const total = pivotData[nama].totalByDate[date] || 0;
                                            return (
                                                <TableCell key={date} align="right" sx={{
                                                    fontFamily: 'monospace', fontSize: '0.85rem',
                                                    borderBottom: '1px solid #e2e8f0',
                                                    color: total > 0 ? '#1e293b' : '#cbd5e1',
                                                    py: 1.5, fontWeight: total > 0 ? 600 : 400
                                                }}>
                                                    {total > 0 ? formatRupiah(total) : '-'}
                                                </TableCell>
                                            );
                                        })}

                                        <TableCell align="right" sx={{
                                            bgcolor: '#eff6ff',
                                            fontWeight: 'bold', color: '#667eea',
                                            fontFamily: 'monospace', fontSize: '0.9rem',
                                            borderBottom: '1px solid #bfdbfe',
                                            borderLeft: '1px solid #bfdbfe',
                                            py: 1.5
                                        }}>
                                            {formatRupiah(getGrandTotal(nama))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600, fontSize: '0.9rem' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}