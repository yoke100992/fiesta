import { useState, useEffect } from 'react';
import {
    Box, Paper, Select, MenuItem, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, Stack,
    CircularProgress, Alert, Snackbar, Avatar, Divider, Tooltip, TextField,
    Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions,
    FormControlLabel, Switch, Radio, RadioGroup, FormControl, FormLabel,
    ToggleButton, ToggleButtonGroup, Chip, IconButton, Collapse, Autocomplete
} from '@mui/material';
import {
    Download as DownloadIcon, FilterList as FilterIcon,
    Person as PersonIcon, Clear as ClearIcon, PlayArrow as ApplyIcon,
    Receipt as ReceiptIcon, PhotoLibrary as PhotoIcon, TableChart as TableIcon,
    ViewList as ViewListIcon, CalendarMonth as CalendarIcon, ChevronLeft, ChevronRight,
    Store as StoreIcon, Delete as DeleteIcon, WarningAmberRounded as WarningIcon,
    ContentCopy as CopyIcon,
    ExpandMore as ExpandMoreIcon,
    SentimentDissatisfied as InactiveIcon, CheckCircle as ActiveIcon,
    EventBusy as PermitIcon, BeachAccess as OffIcon, LocalHospital as SakitIcon,
    NoteAdd as NoteIcon, Groups as MeetingIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getSelloutData, getNamaList, deleteSellout, getPermitData, addPermit, deletePermit } from '../utils/storage';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
    } catch (e) { return false; }
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

const compressImage = (arrayBuffer, quality = 0.9) => {
    return new Promise((resolve) => {
        try {
            const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1000;
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
                        else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((compressedBlob) => {
                        URL.revokeObjectURL(objectUrl);
                        if (compressedBlob) {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = () => resolve(null);
                            reader.readAsArrayBuffer(compressedBlob);
                        } else { resolve(null); }
                    }, 'image/jpeg', quality);
                } catch (err) { URL.revokeObjectURL(objectUrl); resolve(null); }
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
            img.src = objectUrl;
        } catch (err) { resolve(null); }
    });
};

const imageCache = new Map();
const fetchImageWithCache = async (url) => {
    if (imageCache.has(url)) return imageCache.get(url);
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        imageCache.set(url, arrayBuffer);
        return arrayBuffer;
    } catch (err) { return null; }
};

const getImageExtension = (url) => {
    if (!url) return 'jpeg';
    const u = url.toLowerCase();
    if (u.includes('.png')) return 'png';
    if (u.includes('.gif')) return 'gif';
    return 'jpeg';
};

const generateCalendarGrid = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const grid = [];
    let currentWeek = [];
    for (let i = 0; i < startDayOfWeek; i++) currentWeek.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        currentWeek.push({ day, dateStr });
        if (currentWeek.length === 7) { grid.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        grid.push(currentWeek);
    }
    return grid;
};

const generateWhatsAppReport = (record, dateStr) => {
    const items = record.items || [];
    let report = `*Report Sell out tanggal ${formatDateIndo(dateStr)}*\n`;
    report += `Nama SPG : ${record.nama}\n`;
    report += `Nama Toko : ${record.namaToko || 'Toko Tidak Diketahui'}\n\n`;
    items.forEach((item, idx) => {
        const total = (item.harga || 0) * (item.qty || 0);
        report += `${idx + 1}. ${item.sku} - ${item.qty} * ${formatRupiah(item.harga)} - Rp ${formatRupiah(total)}\n`;
    });
    const grandTotal = items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
    report += `\n*Total Value : Rp ${formatRupiah(grandTotal)}*\n\n`;
    report += `Issue/kendala : ........`;
    return report;
};

// ✅ KONFIGURASI PERMIT (Dengan Meeting)
const PERMIT_CONFIG = {
    Sakit: { color: '#ef4444', bg: '#fee2e2', icon: SakitIcon, label: 'Sakit' },
    Izin: { color: '#f59e0b', bg: '#fef3c7', icon: NoteIcon, label: 'Izin' },
    Off: { color: '#64748b', bg: '#f1f5f9', icon: OffIcon, label: 'Off' },
    Meeting: { color: '#6366f1', bg: '#e0e7ff', icon: MeetingIcon, label: 'Meeting' }
};

export default function ViewView() {
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
    const [isDownloading, setIsDownloading] = useState(false);
    const [reportFormat, setReportFormat] = useState('pivot');
    const [includePhotos, setIncludePhotos] = useState(true);
    const [viewMode, setViewMode] = useState('pivot');
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [selectedDate, setSelectedDate] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, recordId: null, recordInfo: null, isDeleting: false });
    const [showInactiveList, setShowInactiveList] = useState(false);

    const [permitData, setPermitData] = useState([]);
    const [permitDialog, setPermitDialog] = useState({ open: false, dateStr: null });
    const [permitForm, setPermitForm] = useState({ nama: '', jenis: 'Sakit', catatan: '' });
    const [permitSubmitting, setPermitSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getSelloutData();
            const nama = await getNamaList();
            const permits = await getPermitData();
            setSelloutData(data);
            setNamaList(nama);
            setPermitData(permits);
            setLoading(false);
        };
        load();
    }, []);

    const inactiveNamas = namaList.filter(n => !pivotData[n]);
    const activeNamas = Object.keys(pivotData);

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
            return dTs >= startTs && dTs <= endTs && matchNama;
        });

        const pivot = {};
        const datesSet = new Set();

        filteredData.forEach(record => {
            if (!record.nama) return;
            if (!pivot[record.nama]) {
                pivot[record.nama] = { records: [], totalByDate: {}, itemsByDate: {}, fotoByDate: {}, tokoByDate: {} };
            }
            datesSet.add(record.tanggal);
            pivot[record.nama].records.push(record);
            const dayTotal = record.items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
            pivot[record.nama].totalByDate[record.tanggal] = (pivot[record.nama].totalByDate[record.tanggal] || 0) + dayTotal;
            pivot[record.nama].itemsByDate[record.tanggal] = record.items;
            if (record.foto) pivot[record.nama].fotoByDate[record.tanggal] = record.foto;
            if (record.namaToko) pivot[record.nama].tokoByDate[record.tanggal] = record.namaToko;
        });

        setPivotData(pivot);
        const sortedDates = Array.from(datesSet).filter(d => d && isValidDate(d)).sort((a, b) => parseAnyDate(a) - parseAnyDate(b));
        setAllDates(sortedDates);
        setIsFiltered(true);
    };

    const handleResetFilter = () => {
        setFilterNama(''); setStartDate(null); setEndDate(null);
        setPivotData({}); setAllDates([]); setIsFiltered(false);
        setSelectedDate(null); setShowInactiveList(false);
    };

    const getGrandTotal = (nama) => {
        if (!pivotData[nama]) return 0;
        return Object.values(pivotData[nama].totalByDate).reduce((sum, val) => sum + val, 0);
    };

    const getTotalAll = () => Object.keys(pivotData).reduce((sum, nama) => sum + getGrandTotal(nama), 0);

    const handleOpenDeleteDialog = (recordId, recordInfo) => {
        setDeleteDialog({ open: true, recordId, recordInfo, isDeleting: false });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.recordId) return;
        setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteSellout(deleteDialog.recordId);
            setSnackbar({ open: true, message: `Data ${deleteDialog.recordInfo?.nama} berhasil dihapus`, severity: 'success' });
            const freshData = await getSelloutData();
            setSelloutData(freshData);
            if (selectedDate && !freshData.some(r => r.tanggal === selectedDate)) setSelectedDate(null);
            setPivotData({});
            setTimeout(() => {
                const startTs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
                const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
                const filteredData = freshData.filter(d => {
                    if (!d.tanggal || !isValidDate(d.tanggal)) return false;
                    const dTs = parseAnyDate(d.tanggal).getTime();
                    if (dTs === 0 || isNaN(dTs)) return false;
                    return dTs >= startTs && dTs <= endTs && (!filterNama || d.nama === filterNama);
                });
                const pivot = {};
                const datesSet = new Set();
                filteredData.forEach(record => {
                    if (!record.nama) return;
                    if (!pivot[record.nama]) pivot[record.nama] = { records: [], totalByDate: {}, itemsByDate: {}, fotoByDate: {}, tokoByDate: {} };
                    datesSet.add(record.tanggal);
                    pivot[record.nama].records.push(record);
                    const dayTotal = record.items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
                    pivot[record.nama].totalByDate[record.tanggal] = (pivot[record.nama].totalByDate[record.tanggal] || 0) + dayTotal;
                    pivot[record.nama].itemsByDate[record.tanggal] = record.items;
                    if (record.foto) pivot[record.nama].fotoByDate[record.tanggal] = record.foto;
                    if (record.namaToko) pivot[record.nama].tokoByDate[record.tanggal] = record.namaToko;
                });
                setPivotData(pivot);
                setAllDates(Array.from(datesSet).filter(d => d && isValidDate(d)).sort((a, b) => parseAnyDate(a) - parseAnyDate(b)));
            }, 100);
            setDeleteDialog({ open: false, recordId: null, recordInfo: null, isDeleting: false });
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal hapus data: ' + error.message, severity: 'error' });
            setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleCopyReport = async (record) => {
        const reportText = generateWhatsAppReport(record, selectedDate);
        try {
            await navigator.clipboard.writeText(reportText);
            setSnackbar({ open: true, message: '✅ Report berhasil disalin!', severity: 'success' });
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = reportText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try { document.execCommand('copy'); setSnackbar({ open: true, message: '✅ Report berhasil disalin!', severity: 'success' }); }
            catch (e) { setSnackbar({ open: true, message: '❌ Gagal menyalin', severity: 'error' }); }
            document.body.removeChild(textArea);
        }
    };

    const handleCopyInactiveList = async () => {
        if (inactiveNamas.length === 0) return;
        let text = `*SPG Tidak Aktif*\n`;
        text += `Periode: ${startDate ? formatDateIndo(formatDateLocal(startDate)) : 'Awal'} - ${endDate ? formatDateIndo(formatDateLocal(endDate)) : 'Sekarang'}\n\n`;
        text += `Total: ${inactiveNamas.length} SPG\n\n`;
        inactiveNamas.forEach((nama, idx) => { text += `${idx + 1}. ${nama}\n`; });
        try {
            await navigator.clipboard.writeText(text);
            setSnackbar({ open: true, message: '✅ Daftar SPG tidak aktif berhasil disalin!', severity: 'success' });
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-999999px';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); setSnackbar({ open: true, message: '✅ Berhasil disalin!', severity: 'success' }); }
            catch (e) { setSnackbar({ open: true, message: '❌ Gagal menyalin', severity: 'error' }); }
            document.body.removeChild(ta);
        }
    };

    const handleCalendarDateClick = (dateStr) => {
        const total = getTotalByDate(dateStr);
        const permits = getPermitsByDate(dateStr);
        if (total > 0 || permits.length > 0) {
            setSelectedDate(dateStr);
        } else {
            setPermitDialog({ open: true, dateStr });
            setPermitForm({ 
                nama: filterNama || '', 
                jenis: 'Sakit', 
                catatan: '' 
            });
        }
    };

    const handleSavePermit = async () => {
        if (!permitForm.nama) {
            setSnackbar({ open: true, message: 'Pilih nama SPG terlebih dahulu', severity: 'warning' });
            return;
        }
        setPermitSubmitting(true);
        try {
            await addPermit({
                tanggal: permitDialog.dateStr,
                nama: permitForm.nama,
                jenis: permitForm.jenis,
                catatan: permitForm.catatan || '',
                createdAt: new Date().toISOString()
            });
            const freshPermits = await getPermitData();
            setPermitData(freshPermits);
            setSnackbar({
                open: true,
                message: `✅ Permit ${permitForm.jenis} untuk ${permitForm.nama} berhasil disimpan`,
                severity: 'success'
            });
            setPermitDialog({ open: false, dateStr: null });
        } catch (err) {
            setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' });
        } finally {
            setPermitSubmitting(false);
        }
    };

    const handleDeletePermit = async (id) => {
        try {
            await deletePermit(id);
            const freshPermits = await getPermitData();
            setPermitData(freshPermits);
            setSnackbar({ open: true, message: 'Permit dihapus', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' });
        }
    };

    // ✅ FUNGSI DIPERBAIKI: Filter permit berdasarkan filterNama
    const getPermitsByDate = (dateStr) => {
        return permitData.filter(p => {
            if (p.tanggal !== dateStr) return false;
            if (filterNama && p.nama !== filterNama) return false;
            return true;
        });
    };

    const getFilteredPermitsCount = () => {
        return permitData.filter(p => {
            if (filterNama && p.nama !== filterNama) return false;
            return true;
        }).length;
    };

    const handleDownloadPivot = async () => {
        if (Object.keys(pivotData).length === 0) { setSnackbar({ open: true, message: 'Tidak ada data', severity: 'warning' }); return; }
        setIsDownloading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Laporan Pivot Sell Out');
            const dateStoreMap = new Map();
            Object.values(pivotData).forEach(namaData => {
                namaData.records.forEach(record => {
                    const store = record.namaToko || record.toko || record.outlet || 'Toko Tidak Diketahui';
                    const key = `${record.tanggal}|${store}`;
                    if (!dateStoreMap.has(key)) dateStoreMap.set(key, { date: record.tanggal, store });
                });
            });
            const sortedDateStores = Array.from(dateStoreMap.values()).sort((a, b) => {
                const dc = parseAnyDate(a.date) - parseAnyDate(b.date);
                if (dc !== 0) return dc;
                return a.store.localeCompare(b.store);
            });
            const COLS_PER_DATE = 3;
            const h1 = ['Nama SPG', 'SKU'];
            sortedDateStores.forEach(() => h1.push('T', 'T', 'T'));
            h1.push('TOTAL SPG');
            const r1 = ws.addRow(h1);
            r1.height = 30; r1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            r1.alignment = { vertical: 'middle', horizontal: 'center' };
            sortedDateStores.forEach((ds, i) => { const sc = 3 + (i * COLS_PER_DATE); ws.mergeCells(1, sc, 1, sc + COLS_PER_DATE - 1); ws.getCell(1, sc).value = formatDateIndo(ds.date); });
            const h2 = ['', '']; sortedDateStores.forEach(ds => h2.push(ds.store, ds.store, ds.store)); h2.push('');
            const r2 = ws.addRow(h2); r2.height = 25; r2.font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } }; r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; r2.alignment = { vertical: 'middle', horizontal: 'center' };
            const h3 = ['', '']; sortedDateStores.forEach(() => h3.push('Foto', 'Qty', 'Rupiah')); h3.push('Rupiah');
            const r3 = ws.addRow(h3); r3.height = 25; r3.font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } }; r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; r3.alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getColumn(1).width = 20; ws.getColumn(2).width = 25;
            sortedDateStores.forEach((_, i) => { const bc = 3 + (i * COLS_PER_DATE); ws.getColumn(bc).width = 16; ws.getColumn(bc + 1).width = 8; ws.getColumn(bc + 2).width = 16; });
            const totalColIndex = 3 + (sortedDateStores.length * COLS_PER_DATE);
            ws.getColumn(totalColIndex).width = 18;
            const sortedNamas = Object.keys(pivotData).sort();
            const allSkus = new Set();
            sortedNamas.forEach(n => pivotData[n].records.forEach(r => r.items.forEach(i => allSkus.add(i.sku))));
            const sortedSkus = Array.from(allSkus).sort();
            const fotoCache = new Map();
            if (includePhotos) {
                const uf = new Set();
                Object.values(pivotData).forEach(nd => Object.values(nd.fotoByDate).forEach(u => { if (u) uf.add(u); }));
                const fa = Array.from(uf);
                for (let i = 0; i < fa.length; i += 5) {
                    await Promise.all(fa.slice(i, i + 5).map(async (url) => {
                        const ab = await fetchImageWithCache(url);
                        if (ab) { const c = await compressImage(ab, 0.9); if (c) fotoCache.set(url, { buffer: c, extension: getImageExtension(url) }); }
                    }));
                }
            }
            let currentRow = 4;
            for (const nama of sortedNamas) {
                const nd = pivotData[nama]; let isFirst = true; const startRow = currentRow;
                for (const sku of sortedSkus) {
                    const row = ws.addRow([nama, sku]);
                    row.height = isFirst && includePhotos ? 120 : 25;
                    row.alignment = { vertical: 'top', horizontal: 'left' };
                    row.eachCell((cell, cn) => {
                        const isFoto = cn >= 3 && cn < totalColIndex && (cn - 3) % COLS_PER_DATE === 0;
                        if (isFoto && includePhotos) cell.border = {};
                        else cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });
                    let dci = 3;
                    for (const { date, store } of sortedDateStores) {
                        const rec = nd.records.find(r => (r.namaToko || r.toko || r.outlet || 'Toko Tidak Diketahui') === store && r.tanggal === date);
                        const item = rec ? rec.items.find(i => i.sku === sku) : null;
                        const fc = row.getCell(dci); fc.alignment = { vertical: 'middle', horizontal: 'center' }; fc.border = {};
                        if (isFirst && includePhotos && rec?.foto && fotoCache.has(rec.foto)) {
                            try { const fd = fotoCache.get(rec.foto); const iid = workbook.addImage({ buffer: fd.buffer, extension: fd.extension }); ws.addImage(iid, { tl: { col: dci - 1, row: currentRow - 1 }, ext: { width: 100, height: 100 } }); } catch (e) {}
                        }
                        const qc = row.getCell(dci + 1); qc.value = item ? item.qty : 0; qc.alignment = { vertical: 'middle', horizontal: 'center' }; qc.font = { bold: true, size: 11, color: { argb: 'FF1E40AF' } }; qc.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        const rc = row.getCell(dci + 2); rc.value = item ? (item.harga || 0) * (item.qty || 0) : 0; rc.numFmt = '#,##0'; rc.alignment = { vertical: 'middle', horizontal: 'right' }; rc.font = { bold: true, size: 10, color: { argb: 'FF059669' } }; rc.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        dci += COLS_PER_DATE;
                    }
                    if (isFirst) { const tc = row.getCell(totalColIndex); tc.value = getGrandTotal(nama); tc.numFmt = '#,##0'; tc.font = { bold: true, size: 11, color: { argb: 'FF059669' } }; tc.alignment = { vertical: 'middle', horizontal: 'right' }; tc.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; tc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; }
                    currentRow++; isFirst = false;
                }
                if (sortedSkus.length > 1) ws.mergeCells(startRow, totalColIndex, currentRow - 1, totalColIndex);
            }
            const gtr = ws.addRow([]); gtr.height = 30;
            ws.mergeCells(currentRow, 1, currentRow, totalColIndex - 1);
            const gtl = ws.getCell(currentRow, 1); gtl.value = 'GRAND TOTAL'; gtl.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }; gtl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; gtl.alignment = { vertical: 'middle', horizontal: 'right' }; gtl.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            const gtv = ws.getCell(currentRow, totalColIndex); gtv.value = getTotalAll(); gtv.numFmt = '#,##0'; gtv.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }; gtv.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; gtv.alignment = { vertical: 'middle', horizontal: 'right' }; gtv.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Laporan_Pivot_${formatDateLocal(startDate || new Date())}_to_${formatDateLocal(endDate || new Date())}${includePhotos ? '' : '_NO_FOTO'}.xlsx`);
            setSnackbar({ open: true, message: 'Excel Pivot berhasil didownload!', severity: 'success' });
        } catch (error) { setSnackbar({ open: true, message: 'Gagal: ' + error.message, severity: 'error' }); }
        finally { setIsDownloading(false); }
    };

    const handleDownloadRaw = async () => {
        if (Object.keys(pivotData).length === 0) { setSnackbar({ open: true, message: 'Tidak ada data', severity: 'warning' }); return; }
        setIsDownloading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Raw Data Sell Out');
            const allRecords = [];
            Object.values(pivotData).forEach(nd => nd.records.forEach(r => allRecords.push(r)));
            allRecords.sort((a, b) => { const dc = parseAnyDate(a.tanggal) - parseAnyDate(b.tanggal); if (dc !== 0) return dc; return (a.nama || '').localeCompare(b.nama || ''); });
            const headers = ['No', 'Tanggal', 'Nama SPG', 'Nama Toko', 'SKU', 'Harga', 'Qty', 'Total'];
            if (includePhotos) headers.push('Foto');
            const hr = ws.addRow(headers); hr.height = 28; hr.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }; hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; hr.alignment = { vertical: 'middle', horizontal: 'center' }; hr.eachCell(c => { c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
            ws.getColumn(1).width = 6; ws.getColumn(2).width = 14; ws.getColumn(3).width = 20; ws.getColumn(4).width = 22; ws.getColumn(5).width = 25; ws.getColumn(6).width = 15; ws.getColumn(7).width = 8; ws.getColumn(8).width = 18;
            if (includePhotos) ws.getColumn(9).width = 18;
            const fotoCache = new Map();
            if (includePhotos) {
                const uf = new Set(); allRecords.forEach(r => { if (r.foto) uf.add(r.foto); });
                const fa = Array.from(uf);
                for (let i = 0; i < fa.length; i += 5) {
                    await Promise.all(fa.slice(i, i + 5).map(async (url) => {
                        const ab = await fetchImageWithCache(url);
                        if (ab) { const c = await compressImage(ab, 0.9); if (c) fotoCache.set(url, { buffer: c, extension: getImageExtension(url) }); }
                    }));
                }
            }
            let rn = 1, cer = 2, gta = 0;
            for (const rec of allRecords) {
                const store = rec.namaToko || rec.toko || rec.outlet || 'Toko Tidak Diketahui';
                const items = rec.items || []; const fir = cer;
                items.forEach((item, idx) => {
                    const total = (item.harga || 0) * (item.qty || 0); gta += total;
                    const rd = [idx === 0 ? rn : '', idx === 0 ? formatDateIndo(rec.tanggal) : '', idx === 0 ? rec.nama : '', idx === 0 ? store : '', item.sku, item.harga || 0, item.qty || 0, total];
                    if (includePhotos) rd.push(idx === 0 ? 'Foto' : '');
                    const row = ws.addRow(rd); row.height = idx === 0 && includePhotos ? 80 : 22; row.alignment = { vertical: 'middle', wrapText: true };
                    row.eachCell((cell, cn) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        if (cn === 1 || cn === 7) cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        else if (cn === 6 || cn === 8) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = '#,##0'; }
                        else cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        if (cn === 8) cell.font = { bold: true, color: { argb: 'FF1E40AF' } };
                    });
                    cer++;
                });
                if (items.length > 1) { [1, 2, 3, 4].forEach(c => ws.mergeCells(fir, c, fir + items.length - 1, c)); if (includePhotos) ws.mergeCells(fir, 9, fir + items.length - 1, 9); }
                if (includePhotos && rec.foto && fotoCache.has(rec.foto)) {
                    try { const fd = fotoCache.get(rec.foto); const iid = workbook.addImage({ buffer: fd.buffer, extension: fd.extension }); ws.addImage(iid, { tl: { col: 8, row: fir - 1 }, ext: { width: 90, height: 90 } }); } catch (e) {}
                }
                rn++;
            }
            const trc = includePhotos ? 9 : 8;
            const tr = ws.addRow([]); tr.height = 28;
            ws.mergeCells(cer, 1, cer, trc - 1);
            const tc = ws.getCell(cer, 1); tc.value = 'GRAND TOTAL'; tc.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }; tc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; tc.alignment = { vertical: 'middle', horizontal: 'right' }; tc.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            const gc = ws.getCell(cer, trc); gc.value = gta; gc.numFmt = '#,##0'; gc.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }; gc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; gc.alignment = { vertical: 'middle', horizontal: 'right' }; gc.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `RawData_${formatDateLocal(startDate || new Date())}_to_${formatDateLocal(endDate || new Date())}${includePhotos ? '' : '_NO_FOTO'}.xlsx`);
            setSnackbar({ open: true, message: 'Excel Raw Data berhasil didownload!', severity: 'success' });
        } catch (error) { setSnackbar({ open: true, message: 'Gagal: ' + error.message, severity: 'error' }); }
        finally { setIsDownloading(false); }
    };

    const handleDownload = () => { if (reportFormat === 'pivot') handleDownloadPivot(); else handleDownloadRaw(); };

    const getTotalByDate = (dateStr) => { let t = 0; Object.values(pivotData).forEach(nd => { if (nd.totalByDate[dateStr]) t += nd.totalByDate[dateStr]; }); return t; };

    const getDetailByDate = (dateStr) => {
        const details = [];
        Object.keys(pivotData).sort().forEach(nama => {
            const nd = pivotData[nama];
            if (nd.totalByDate[dateStr]) {
                nd.records.filter(r => r.tanggal === dateStr).forEach(record => {
                    const store = record.namaToko || record.toko || record.outlet || 'Toko Tidak Diketahui';
                    const total = record.items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
                    details.push({ recordId: record.id, record, nama, store, total, itemCount: record.items.length, qtyCount: record.items.reduce((sum, item) => sum + (item.qty || 0), 0) });
                });
            }
        });
        return details;
    };

    const getIntensityColor = (total, maxTotal) => {
        if (total === 0) return 'transparent';
        const i = total / maxTotal;
        if (i > 0.75) return '#1e3a8a'; if (i > 0.5) return '#1e40af'; if (i > 0.25) return '#3b82f6'; if (i > 0.1) return '#60a5fa'; return '#93c5fd';
    };

    if (loading) return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress size={60} sx={{ color: '#667eea' }} /></Box>);

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    return (
        <Box sx={{ pb: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* ===== FILTER CARD ===== */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 4, border: '1px solid rgba(102, 126, 234, 0.08)', background: 'white', boxShadow: '0 2px 12px rgba(102, 126, 234, 0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}><FilterIcon sx={{ fontSize: 22 }} /></Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#667eea', lineHeight: 1.2 }}>Filter Laporan</Typography>
                        <Typography variant="caption" color="text.secondary">Pilih kriteria, lalu klik "Terapkan"</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />
                <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Nama SPG</Typography>
                            <Select fullWidth displayEmpty value={filterNama} onChange={(e) => setFilterNama(e.target.value)} startAdornment={<PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />} sx={{ borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea', borderWidth: 2 } }}>
                                <MenuItem value="">Semua Nama SPG</MenuItem>
                                {namaList.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '0.95rem' }}>{n}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Tanggal Mulai</Typography>
                            <DatePicker value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } } } }} />
                        </Box>
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Tanggal Akhir</Typography>
                            <DatePicker value={endDate} onChange={setEndDate} slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } } } }} />
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                            <Button variant="contained" onClick={handleApplyFilter} startIcon={<ApplyIcon />} sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', background: '#667eea', '&:hover': { background: '#3874BC' } }}>Terapkan</Button>
                            <Tooltip title="Reset Filter"><Button variant="outlined" onClick={handleResetFilter} sx={{ minWidth: 'auto', p: 1.5, borderRadius: 3, borderColor: '#cbd5e1', color: '#64748b', '&:hover': { borderColor: '#667eea', color: '#667eea' } }}><ClearIcon /></Button></Tooltip>
                        </Stack>
                    </Stack>
                </Stack>
                <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opsi Download Excel</Typography>
                    <FormControl sx={{ mb: 2, width: '100%' }}>
                        <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', mb: 1 }}>Format Laporan</FormLabel>
                        <RadioGroup row value={reportFormat} onChange={(e) => setReportFormat(e.target.value)} sx={{ gap: 2 }}>
                            <FormControlLabel value="pivot" control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><ViewListIcon sx={{ fontSize: 18, color: reportFormat === 'pivot' ? '#667eea' : '#94a3b8' }} /><Typography variant="body2" fontWeight={reportFormat === 'pivot' ? 700 : 500} color={reportFormat === 'pivot' ? '#1e293b' : '#64748b'}>Pivot</Typography></Box>} sx={{ flex: 1, p: 1.5, borderRadius: 2, border: `2px solid ${reportFormat === 'pivot' ? '#667eea' : '#e2e8f0'}`, bgcolor: reportFormat === 'pivot' ? '#eff6ff' : 'white', ml: 0, mr: 0 }} />
                            <FormControlLabel value="raw" control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><TableIcon sx={{ fontSize: 18, color: reportFormat === 'raw' ? '#667eea' : '#94a3b8' }} /><Typography variant="body2" fontWeight={reportFormat === 'raw' ? 700 : 500} color={reportFormat === 'raw' ? '#1e293b' : '#64748b'}>Raw Data</Typography></Box>} sx={{ flex: 1, p: 1.5, borderRadius: 2, border: `2px solid ${reportFormat === 'raw' ? '#667eea' : '#e2e8f0'}`, bgcolor: reportFormat === 'raw' ? '#eff6ff' : 'white', ml: 0, mr: 0 }} />
                        </RadioGroup>
                    </FormControl>
                    <FormControlLabel control={<Switch checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#667eea' } }} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{includePhotos ? <PhotoIcon sx={{ fontSize: 20, color: '#667eea' }} /> : <TableIcon sx={{ fontSize: 20, color: '#64748b' }} />}<Box><Typography variant="body2" fontWeight={600} color={includePhotos ? '#667eea' : '#64748b'}>{includePhotos ? 'Sertakan Foto (90%)' : 'Tanpa Foto'}</Typography></Box></Box>} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white', ml: 0, mr: 0, alignItems: 'flex-start' }} />
                </Box>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                    <Button variant="contained" onClick={handleDownload} startIcon={<DownloadIcon />} disabled={Object.keys(pivotData).length === 0} sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', background: '#3874BC', '&:disabled': { background: '#cbd5e1', color: '#94a3b8' } }}>
                        Download {reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'} {includePhotos ? '(Dengan Foto)' : '(Tanpa Foto)'}
                    </Button>
                </Box>
            </Paper>

            {/* ✅ PERBAIKAN: Card Status SPG HANYA muncul jika filterNama === '' (Semua Nama SPG) */}
            {isFiltered && namaList.length > 0 && filterNama === '' && (
                <Paper elevation={0} sx={{
                    mb: 3, borderRadius: 4, overflow: 'hidden',
                    border: inactiveNamas.length > 0 ? '2px solid #f59e0b' : '2px solid #10b981',
                    background: inactiveNamas.length > 0 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                }}>
                    <Box onClick={() => inactiveNamas.length > 0 && setShowInactiveList(!showInactiveList)} sx={{
                        p: { xs: 2, md: 2.5 }, display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 },
                        cursor: inactiveNamas.length > 0 ? 'pointer' : 'default',
                        '&:hover': inactiveNamas.length > 0 ? { bgcolor: 'rgba(245, 158, 11, 0.05)' } : {}
                    }}>
                        <Avatar sx={{ bgcolor: inactiveNamas.length > 0 ? '#f59e0b' : '#10b981', width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, boxShadow: inactiveNamas.length > 0 ? '0 4px 12px rgba(245,158,11,0.3)' : '0 4px 12px rgba(16,185,129,0.3)' }}>
                            {inactiveNamas.length > 0 ? <InactiveIcon sx={{ fontSize: { xs: 22, md: 26 } }} /> : <ActiveIcon sx={{ fontSize: { xs: 22, md: 26 } }} />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, color: inactiveNamas.length > 0 ? '#92400e' : '#065f46', lineHeight: 1.2 }}>
                                {inactiveNamas.length > 0 ? `${inactiveNamas.length} SPG Tidak Aktif` : 'Semua SPG Aktif! 🎉'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' }, color: inactiveNamas.length > 0 ? '#b45309' : '#047857', display: 'block', mt: 0.3 }}>
                                {inactiveNamas.length > 0 ? `dari ${namaList.length} total SPG • ${activeNamas.length} SPG aktif • Klik untuk lihat detail` : `${activeNamas.length} SPG sudah mengerjakan`}
                            </Typography>
                        </Box>
                        <Chip label={`${activeNamas.length}/${namaList.length} Aktif`} size="small" sx={{ bgcolor: inactiveNamas.length > 0 ? '#f59e0b' : '#10b981', color: 'white', fontWeight: 'bold', fontSize: { xs: '0.7rem', md: '0.8rem' }, height: { xs: 26, md: 30 }, display: { xs: 'none', sm: 'flex' } }} />
                        {inactiveNamas.length > 0 && <IconButton size="small" sx={{ color: '#92400e', transition: 'transform 0.3s', transform: showInactiveList ? 'rotate(180deg)' : 'rotate(0deg)' }}><ExpandMoreIcon /></IconButton>}
                    </Box>
                    <Collapse in={showInactiveList && inactiveNamas.length > 0}>
                        <Divider sx={{ borderColor: 'rgba(245, 158, 11, 0.2)' }} />
                        <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: 'rgba(255,255,255,0.6)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#92400e', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>Daftar SPG yang belum mengerjakan:</Typography>
                                <Tooltip title="Copy daftar"><Button size="small" variant="outlined" startIcon={<CopyIcon sx={{ fontSize: 16 }} />} onClick={handleCopyInactiveList} sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', borderColor: '#f59e0b', color: '#92400e', py: 0.5, '&:hover': { borderColor: '#d97706', bgcolor: 'rgba(245,158,11,0.1)' } }}>Copy List</Button></Tooltip>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1, md: 1.5 } }}>
                                {inactiveNamas.map((nama, idx) => (
                                    <Box key={nama} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 1.25, md: 1.5 }, bgcolor: 'white', borderRadius: 2, border: '1px solid #fde68a', '&:hover': { borderColor: '#f59e0b', boxShadow: '0 2px 8px rgba(245,158,11,0.15)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
                                        <Avatar sx={{ bgcolor: '#fef3c7', color: '#92400e', width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}>{nama.charAt(0).toUpperCase()}</Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', fontSize: { xs: '0.8rem', md: '0.9rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nama}</Typography>
                                            <Typography variant="caption" sx={{ color: '#b45309', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}><WarningIcon sx={{ fontSize: 12 }} /> Tidak ada data</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 'bold' }}>#{idx + 1}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(245,158,11,0.08)', borderRadius: 2, border: '1px dashed #f59e0b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningIcon sx={{ color: '#d97706', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: '#92400e', fontSize: '0.75rem', fontStyle: 'italic' }}>Silakan hubungi SPG di atas untuk konfirmasi aktivitas mereka.</Typography>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>
            )}

            {/* ===== TOGGLE PIVOT / CALENDAR ===== */}
            {isFiltered && (Object.keys(pivotData).length > 0 || getFilteredPermitsCount() > 0) && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup value={viewMode} exclusive onChange={(e, m) => { if (m) setViewMode(m); }} sx={{ '& .MuiToggleButton-root': { px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, '&.Mui-selected': { bgcolor: '#667eea', color: 'white' } } }}>
                        <ToggleButton value="pivot"><ViewListIcon sx={{ mr: 1 }} /> Pivot</ToggleButton>
                        <ToggleButton value="calendar"><CalendarIcon sx={{ mr: 1 }} /> Calendar</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            {!isFiltered && !loading && (<Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}><FilterIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} /><Typography variant="h6" color="#64748b" fontWeight={600}>Belum ada data</Typography><Typography variant="body2" color="#94a3b8">Klik <strong style={{ color: '#667eea' }}>"Terapkan"</strong></Typography></Paper>)}
            {isFiltered && Object.keys(pivotData).length === 0 && getFilteredPermitsCount() === 0 && (<Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}><ClearIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} /><Typography variant="h6" color="#64748b" fontWeight={600}>Tidak ada data ditemukan</Typography></Paper>)}

            {/* ===== PIVOT VIEW ===== */}
            {viewMode === 'pivot' && isFiltered && Object.keys(pivotData).length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid rgba(102,126,234,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40 }}><ReceiptIcon sx={{ fontSize: 22 }} /></Avatar>
                        <Box><Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#667eea' }}>Pivot Penjualan Harian</Typography><Typography variant="caption" color="text.secondary">Total Rupiah per SPG per Tanggal</Typography></Box>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'auto', maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead><TableRow>
                                <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, background: '#3874BC', color: 'white', fontWeight: 'bold', minWidth: 160 }}>Nama SPG</TableCell>
                                {allDates.map(d => (<TableCell key={d} align="center" sx={{ background: '#3879BC', color: 'white', fontWeight: 'bold', minWidth: 110, fontSize: '0.75rem' }}>{formatDateIndo(d)}</TableCell>))}
                                <TableCell align="right" sx={{ background: '#059669', color: 'white', fontWeight: 'bold', minWidth: 130 }}>Total SPG</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                                {Object.keys(pivotData).sort().map((nama, ri) => (
                                    <TableRow key={nama} hover>
                                        <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: ri % 2 === 0 ? '#fff' : '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem', borderRight: '1px solid #e2e8f0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Avatar sx={{ bgcolor: '#eff6ff', color: '#667eea', width: 32, height: 32, fontSize: '0.8rem' }}>{nama.charAt(0).toUpperCase()}</Avatar>{nama}</Box>
                                        </TableCell>
                                        {allDates.map(d => { const t = pivotData[nama].totalByDate[d] || 0; return (<TableCell key={d} align="right" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: t > 0 ? '#1e293b' : '#cbd5e1', fontWeight: t > 0 ? 600 : 400 }}>{t > 0 ? formatRupiah(t) : '-'}</TableCell>); })}
                                        <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 'bold', color: '#059669', fontFamily: 'monospace', fontSize: '0.9rem', borderLeft: '2px solid #059669' }}>{formatRupiah(getGrandTotal(nama))}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ bgcolor: '#1e3a8a' }}>
                                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: '#1e3a8a', fontWeight: 'bold', color: 'white', borderRight: '2px solid #1e40af' }}>GRAND TOTAL</TableCell>
                                    {allDates.map(d => { let dt = 0; Object.values(pivotData).forEach(nd => { dt += nd.totalByDate[d] || 0; }); return (<TableCell key={d} align="right" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>{dt > 0 ? formatRupiah(dt) : '-'}</TableCell>); })}
                                    <TableCell align="right" sx={{ bgcolor: '#059669', fontWeight: 'bold', color: 'white', fontFamily: 'monospace', fontSize: '1rem', borderLeft: '2px solid #047857' }}>{formatRupiah(getTotalAll())}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* ===== CALENDAR VIEW + PERMIT ===== */}
            {viewMode === 'calendar' && isFiltered && (Object.keys(pivotData).length > 0 || getFilteredPermitsCount() > 0) && (
                <Paper elevation={0} sx={{ p: { xs: 1.5, md: 3 }, borderRadius: 4, border: '1px solid rgba(102,126,234,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, md: 2.5 }, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                            <Avatar sx={{ bgcolor: '#667eea', width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 } }}><CalendarIcon sx={{ fontSize: { xs: 18, md: 22 } }} /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, color: '#667eea' }}>
                                    Kalender Penjualan
                                    {filterNama && <Chip label={filterNama} size="small" sx={{ ml: 1, bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 'bold', fontSize: '0.7rem', height: 22 }} />}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                                    {filterNama ? `Filter aktif: ${filterNama}` : 'Semua SPG'} • Klik tanggal untuk detail/permit
                                </Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton onClick={() => setCalendarMonth(p => ({ year: p.month - 1 < 0 ? p.year - 1 : p.year, month: p.month - 1 < 0 ? 11 : p.month - 1 }))} sx={{ bgcolor: '#f8fafc' }}><ChevronLeft sx={{ fontSize: { xs: 20, md: 24 } }} /></IconButton>
                            <Typography variant="h6" fontWeight="bold" sx={{ minWidth: { xs: 120, md: 160 }, textAlign: 'center', fontSize: { xs: '0.85rem', md: '1.1rem' } }}>{monthNames[calendarMonth.month]} {calendarMonth.year}</Typography>
                            <IconButton onClick={() => setCalendarMonth(p => ({ year: p.month + 1 > 11 ? p.year + 1 : p.year, month: p.month + 1 > 11 ? 0 : p.month + 1 }))} sx={{ bgcolor: '#f8fafc' }}><ChevronRight sx={{ fontSize: { xs: 20, md: 24 } }} /></IconButton>
                        </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mr: 1 }}>Keterangan Permit:</Typography>
                        {Object.entries(PERMIT_CONFIG).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                                <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.color }} />
                                    <Icon sx={{ fontSize: 14, color: cfg.color }} />
                                    <Typography variant="caption" sx={{ color: cfg.color, fontWeight: 600, fontSize: '0.7rem' }}>{cfg.label}</Typography>
                                </Box>
                            );
                        })}
                    </Box>

                    <Divider sx={{ mb: { xs: 2, md: 2.5 } }} />
                    <Box sx={{ mb: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, md: 1 }, mb: { xs: 0.5, md: 1 } }}>
                            {daysOfWeek.map(d => (<Typography key={d} variant="caption" fontWeight="bold" sx={{ textAlign: 'center', color: '#64748b', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>{d}</Typography>))}
                        </Box>
                        {generateCalendarGrid(calendarMonth.year, calendarMonth.month).map((week, wi) => (
                            <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, md: 1 }, mb: { xs: 0.5, md: 1 } }}>
                                {week.map((dd, di) => {
                                    if (!dd) return <Box key={di} sx={{ aspectRatio: '1', bgcolor: '#f8fafc', borderRadius: { xs: 1, md: 2 } }} />;
                                    const total = getTotalByDate(dd.dateStr);
                                    const maxT = Math.max(...allDates.map(d => getTotalByDate(d)), 1);
                                    const hasData = total > 0;
                                    const permits = getPermitsByDate(dd.dateStr);
                                    const hasPermit = permits.length > 0;

                                    return (
                                        <Box
                                            key={di}
                                            onClick={() => handleCalendarDateClick(dd.dateStr)}
                                            sx={{
                                                aspectRatio: '1',
                                                bgcolor: hasData ? getIntensityColor(total, maxT) : (hasPermit ? '#fffbeb' : '#f8fafc'),
                                                borderRadius: { xs: 1, md: 2 },
                                                border: selectedDate === dd.dateStr ? '2px solid #667eea' : (hasPermit && !hasData ? '1px dashed #f59e0b' : '1px solid #e2e8f0'),
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                                                p: { xs: 0.5, md: 1 },
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: hasData ? 'white' : '#475569', fontSize: { xs: '0.7rem', md: '0.9rem' }, lineHeight: 1 }}>{dd.day}</Typography>
                                            {hasData && (
                                                <Typography variant="caption" sx={{ color: 'white', fontSize: { xs: '0.5rem', md: '0.65rem' }, fontWeight: 600, mt: 0.25 }}>
                                                    {total >= 1000000 ? `${(total / 1000000).toFixed(1)}M` : total >= 1000 ? `${(total / 1000).toFixed(0)}K` : formatRupiah(total)}
                                                </Typography>
                                            )}
                                            {hasPermit && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 0.25,
                                                    mt: 0.5,
                                                    width: '100%',
                                                    px: 0.5
                                                }}>
                                                    {permits.slice(0, 3).map((p, idx) => {
                                                        const cfg = PERMIT_CONFIG[p.jenis] || PERMIT_CONFIG.Off;
                                                        return (
                                                            <Box key={idx} sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.25,
                                                                bgcolor: hasData ? 'rgba(255,255,255,0.9)' : cfg.bg,
                                                                px: 0.5,
                                                                py: 0.15,
                                                                borderRadius: 0.75,
                                                                border: `1px solid ${cfg.color}40`,
                                                                width: '100%',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <cfg.icon sx={{ fontSize: { xs: 8, md: 10 }, color: cfg.color, flexShrink: 0 }} />
                                                                <Typography variant="caption" sx={{
                                                                    fontSize: { xs: '0.5rem', md: '0.6rem' },
                                                                    fontWeight: 'bold',
                                                                    color: cfg.color,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    lineHeight: 1
                                                                }}>
                                                                    {p.jenis}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                    {permits.length > 3 && (
                                                        <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', md: '0.6rem' }, color: '#64748b', fontWeight: 'bold' }}>
                                                            +{permits.length - 3} lainnya
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                            {!hasData && !hasPermit && (
                                                <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: { xs: '0.45rem', md: '0.55rem' }, mt: 0.25, fontStyle: 'italic' }}>kosong</Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>

                    {selectedDate && (
                        <Box sx={{ mt: 2, p: { xs: 1.5, md: 2.5 }, borderRadius: { xs: 2, md: 3 }, bgcolor: '#eff6ff', border: '2px solid #667eea' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                <CalendarIcon sx={{ color: '#667eea' }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e40af', fontSize: { xs: '0.9rem', md: '1.1rem' } }}>Detail: {formatDateIndo(selectedDate)}</Typography>
                                {getTotalByDate(selectedDate) > 0 && (
                                    <Chip label={`Total: Rp ${formatRupiah(getTotalByDate(selectedDate))}`} sx={{ ml: { xs: 0, md: 'auto' }, bgcolor: '#059669', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }} />
                                )}
                            </Box>

                            {getDetailByDate(selectedDate).length > 0 && (
                                <>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={1}>
                                        {getDetailByDate(selectedDate).map((detail, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, p: { xs: 1, md: 1.5 }, bgcolor: 'white', borderRadius: 2, border: '1px solid #bfdbfe', flexWrap: 'wrap' }}>
                                                <Avatar sx={{ bgcolor: '#667eea', width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, fontSize: '0.85rem' }}>{detail.nama.charAt(0).toUpperCase()}</Avatar>
                                                <Box sx={{ flex: 1, minWidth: '120px' }}>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>{detail.nama}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                        <Chip icon={<StoreIcon sx={{ fontSize: '12px !important' }} />} label={detail.store} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                        <Chip label={`${detail.itemCount} item • ${detail.qtyCount} pcs`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9' }} />
                                                    </Box>
                                                </Box>
                                                <Typography variant="body1" fontWeight="bold" sx={{ color: '#059669', fontFamily: 'monospace', fontSize: { xs: '0.85rem', md: '1rem' } }}>Rp {formatRupiah(detail.total)}</Typography>
                                                <Tooltip title="Copy Report WA"><IconButton size="small" onClick={() => handleCopyReport(detail.record)} sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}><CopyIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                                <Tooltip title="Hapus"><IconButton color="error" size="small" onClick={() => handleOpenDeleteDialog(detail.recordId, { nama: detail.nama, store: detail.store, date: selectedDate, total: detail.total })} sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                            </Box>
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {getPermitsByDate(selectedDate).length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <PermitIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#92400e' }}>
                                            Permit Hari Ini ({getPermitsByDate(selectedDate).length})
                                        </Typography>
                                    </Box>
                                    <Stack spacing={1}>
                                        {getPermitsByDate(selectedDate).map((permit) => {
                                            const cfg = PERMIT_CONFIG[permit.jenis] || PERMIT_CONFIG.Off;
                                            const Icon = cfg.icon;
                                            return (
                                                <Box key={permit.id} sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                                                    bgcolor: cfg.bg, borderRadius: 2, border: `1px solid ${cfg.color}30`
                                                }}>
                                                    <Avatar sx={{ bgcolor: cfg.color, width: 32, height: 32 }}>
                                                        <Icon sx={{ fontSize: 18, color: 'white' }} />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#1e293b', fontSize: '0.85rem' }}>{permit.nama}</Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <Chip label={permit.jenis} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: cfg.color, color: 'white', fontWeight: 'bold' }} />
                                                            {permit.catatan && <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic' }}>• {permit.catatan}</Typography>}
                                                        </Box>
                                                    </Box>
                                                    <Tooltip title="Hapus Permit">
                                                        <IconButton color="error" size="small" onClick={() => handleDeletePermit(permit.id)} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}

                            {getDetailByDate(selectedDate).length === 0 && getPermitsByDate(selectedDate).length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="body2" color="text.secondary">Tidak ada data atau permit untuk tanggal ini</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Paper>
            )}

            {/* ===== DIALOG PERMIT ===== */}
            <Dialog
                open={permitDialog.open}
                onClose={() => !permitSubmitting && setPermitDialog({ open: false, dateStr: null })}
                sx={{ '& .MuiDialog-paper': { borderRadius: 3, minWidth: { xs: 300, md: 420 }, m: { xs: 2, md: 'auto' } } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f59e0b', pb: 1 }}>
                    <PermitIcon /> Update Permit
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Tanggal: <strong style={{ color: '#1e293b' }}>{permitDialog.dateStr ? formatDateIndo(permitDialog.dateStr) : '-'}</strong>
                    </Typography>
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Nama SPG <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <Autocomplete
                                options={namaList}
                                value={permitForm.nama || null}
                                onChange={(e, v) => setPermitForm({ ...permitForm, nama: v || '' })}
                                getOptionLabel={(option) => option || ''}
                                isOptionEqualToValue={(option, value) => option === value}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Pilih nama SPG..."
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2.5,
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: '#f59e0b' },
                                                '&.Mui-focused fieldset': { borderColor: '#f59e0b', borderWidth: 2 }
                                            }
                                        }}
                                    />
                                )}
                                noOptionsText="Tidak ada nama ditemukan"
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Jenis Permit <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                                {Object.entries(PERMIT_CONFIG).map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    const isSelected = permitForm.jenis === key;
                                    return (
                                        <Box
                                            key={key}
                                            onClick={() => setPermitForm({ ...permitForm, jenis: key })}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                border: `2px solid ${isSelected ? cfg.color : '#e2e8f0'}`,
                                                bgcolor: isSelected ? cfg.bg : 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'center',
                                                '&:hover': { borderColor: cfg.color, transform: 'translateY(-1px)' }
                                            }}
                                        >
                                            <Icon sx={{ fontSize: 24, color: cfg.color, mb: 0.5 }} />
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: isSelected ? cfg.color : '#475569', fontSize: '0.8rem' }}>
                                                {cfg.label}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                                Catatan (opsional)
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={permitForm.catatan}
                                onChange={(e) => setPermitForm({ ...permitForm, catatan: e.target.value })}
                                placeholder="Contoh: Demam, Acara keluarga, dll..."
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2.5,
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#f59e0b' },
                                        '&.Mui-focused fieldset': { borderColor: '#f59e0b', borderWidth: 2 }
                                    }
                                }}
                            />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setPermitDialog({ open: false, dateStr: null })}
                        variant="outlined"
                        disabled={permitSubmitting}
                        sx={{ borderRadius: 2 }}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSavePermit}
                        variant="contained"
                        disabled={permitSubmitting || !permitForm.nama}
                        startIcon={permitSubmitting ? <CircularProgress size={16} color="inherit" /> : <PermitIcon />}
                        sx={{
                            borderRadius: 2,
                            background: '#f59e0b',
                            '&:hover': { background: '#d97706' },
                            '&:disabled': { background: '#cbd5e1' }
                        }}
                    >
                        {permitSubmitting ? 'Menyimpan...' : 'Simpan Permit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== DELETE DIALOG ===== */}
            <Dialog open={deleteDialog.open} onClose={() => !deleteDialog.isDeleting && setDeleteDialog({ open: false, recordId: null, recordInfo: null, isDeleting: false })} sx={{ '& .MuiDialog-paper': { borderRadius: 3, minWidth: { xs: 280, md: 400 } } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}><WarningIcon /> Konfirmasi Hapus</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Yakin ingin menghapus data berikut?</DialogContentText>
                    {deleteDialog.recordInfo && (
                        <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 2, border: '1px solid #fecaca' }}>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', gap: 1 }}><Typography variant="body2" color="#991b1b" fontWeight={600}>Tanggal:</Typography><Typography variant="body2">{formatDateIndo(deleteDialog.recordInfo.date)}</Typography></Box>
                                <Box sx={{ display: 'flex', gap: 1 }}><Typography variant="body2" color="#991b1b" fontWeight={600}>SPG:</Typography><Typography variant="body2">{deleteDialog.recordInfo.nama}</Typography></Box>
                                <Box sx={{ display: 'flex', gap: 1 }}><Typography variant="body2" color="#991b1b" fontWeight={600}>Toko:</Typography><Typography variant="body2">{deleteDialog.recordInfo.store}</Typography></Box>
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="#991b1b" fontWeight={600}>Total:</Typography><Typography variant="body1" fontWeight="bold" color="#059669" sx={{ fontFamily: 'monospace' }}>Rp {formatRupiah(deleteDialog.recordInfo.total)}</Typography></Box>
                            </Stack>
                        </Box>
                    )}
                    <Typography variant="caption" color="#991b1b" sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}>⚠️ Data tidak dapat dikembalikan.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, recordId: null, recordInfo: null, isDeleting: false })} variant="outlined" disabled={deleteDialog.isDeleting} sx={{ borderRadius: 2 }}>Batal</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteDialog.isDeleting} startIcon={deleteDialog.isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />} sx={{ borderRadius: 2 }}>{deleteDialog.isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDownloading} disableEscapeKeyDown BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.7)' } }} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, px: 6, minWidth: 320 }}>
                    <CircularProgress size={55} sx={{ mb: 3, color: '#667eea' }} />
                    <Typography variant="h6" fontWeight="bold" align="center">Sedang Memproses...</Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, lineHeight: 1.6 }}>
                        {includePhotos ? `Mengunduh dan mengkompres gambar, lalu menyusun laporan ${reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'}. Mohon tunggu.` : `Menyusun laporan ${reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'}. Mohon tunggu.`}
                    </Typography>
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
