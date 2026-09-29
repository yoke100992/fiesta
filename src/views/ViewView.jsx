import { useState, useEffect } from 'react';
import {
Box, Paper, Select, MenuItem, Button, Table, TableBody, TableCell,
TableContainer, TableHead, TableRow, Typography, Stack,
CircularProgress, Alert, Snackbar, Avatar, Divider, Tooltip, TextField,
Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions,
FormControlLabel, Switch, Radio, RadioGroup, FormControl, FormLabel,
ToggleButton, ToggleButtonGroup, Chip, IconButton
} from '@mui/material';
import {
Download as DownloadIcon, FilterList as FilterIcon,
Person as PersonIcon, Clear as ClearIcon, PlayArrow as ApplyIcon,
Receipt as ReceiptIcon, PhotoLibrary as PhotoIcon, TableChart as TableIcon,
ViewList as ViewListIcon, CalendarMonth as CalendarIcon, ChevronLeft, ChevronRight,
Store as StoreIcon, Delete as DeleteIcon, WarningAmberRounded as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getSelloutData, getNamaList, deleteSellout } from '../utils/storage';
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

// ✅ KOMPRESI GAMBAR 90% (kualitas lebih baik)
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
                    const MAX_SIZE = 1000; // ✅ Naikkan max size karena kualitas 90%
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        if (width > height) {
                            height = Math.round((height * MAX_SIZE) / width);
                            width = MAX_SIZE;
                        } else {
                            width = Math.round((width * MAX_SIZE) / height);
                            height = MAX_SIZE;
                        }
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
                        } else {
                            resolve(null);
                        }
                    }, 'image/jpeg', quality);
                } catch (err) {
                    console.error('Error saat kompresi:', err);
                    URL.revokeObjectURL(objectUrl);
                    resolve(null);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(null);
            };

            img.src = objectUrl;
        } catch (err) {
            console.error('Error di compressImage:', err);
            resolve(null);
        }
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
    } catch (err) {
        console.error('Gagal fetch gambar:', url, err);
        return null;
    }
};

const getImageExtension = (url) => {
    if (!url) return 'jpeg';
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.png')) return 'png';
    if (urlLower.includes('.gif')) return 'gif';
    if (urlLower.includes('.webp')) return 'jpeg';
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

    for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        currentWeek.push({ day, dateStr });

        if (currentWeek.length === 7) {
            grid.push(currentWeek);
            currentWeek = [];
        }
    }

    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        grid.push(currentWeek);
    }

    return grid;
};

export default function ViewView() {
    // ✅ HAPUS state isAuthenticated & password
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

    // ✅ STATE BARU: Dialog konfirmasi hapus
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        recordId: null,
        recordInfo: null,
        isDeleting: false
    });

    // ✅ Load data awal (tanpa cek password)
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getSelloutData();
            const nama = await getNamaList();
            setSelloutData(data);
            setNamaList(nama);
            setLoading(false);
        };
        load();
    }, []);

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

        const sortedDates = Array.from(datesSet)
            .filter(d => d && isValidDate(d))
            .sort((a, b) => parseAnyDate(a) - parseAnyDate(b));

        setAllDates(sortedDates);
        setIsFiltered(true);
    };

    const handleResetFilter = () => {
        setFilterNama(''); setStartDate(null); setEndDate(null);
        setPivotData({}); setAllDates([]); setIsFiltered(false);
        setSelectedDate(null);
    };

    const getGrandTotal = (nama) => {
        if (!pivotData[nama]) return 0;
        return Object.values(pivotData[nama].totalByDate).reduce((sum, val) => sum + val, 0);
    };

    const getTotalAll = () => {
        return Object.keys(pivotData).reduce((sum, nama) => sum + getGrandTotal(nama), 0);
    };

    // ✅ FUNGSI: Buka dialog konfirmasi hapus
    const handleOpenDeleteDialog = (recordId, recordInfo) => {
        setDeleteDialog({ open: true, recordId, recordInfo, isDeleting: false });
    };

    // ✅ FUNGSI: Konfirmasi hapus record
    const handleConfirmDelete = async () => {
        if (!deleteDialog.recordId) return;
        setDeleteDialog(prev => ({ ...prev, isDeleting: true }));

        try {
            await deleteSellout(deleteDialog.recordId);
            setSnackbar({
                open: true,
                message: `Data ${deleteDialog.recordInfo?.nama} - ${deleteDialog.recordInfo?.store} berhasil dihapus`,
                severity: 'success'
            });

            // Refresh data dari Firebase
            const freshData = await getSelloutData();
            setSelloutData(freshData);

            // Cek apakah selectedDate masih punya data
            if (selectedDate) {
                const stillHasData = freshData.some(r => r.tanggal === selectedDate);
                if (!stillHasData) {
                    setSelectedDate(null);
                }
            }

            // Re-apply filter dengan data baru
            setPivotData({});
            setTimeout(() => {
                // Trigger re-filter dengan data baru
                const startTs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
                const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

                const filteredData = freshData.filter(d => {
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

                const sortedDates = Array.from(datesSet)
                    .filter(d => d && isValidDate(d))
                    .sort((a, b) => parseAnyDate(a) - parseAnyDate(b));

                setAllDates(sortedDates);
            }, 100);

            setDeleteDialog({ open: false, recordId: null, recordInfo: null, isDeleting: false });
        } catch (error) {
            console.error('Error hapus:', error);
            setSnackbar({ open: true, message: 'Gagal hapus data: ' + error.message, severity: 'error' });
            setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
        }
    };

    // ✅ FUNGSI DOWNLOAD PIVOT
    const handleDownloadPivot = async () => {
        if (Object.keys(pivotData).length === 0) {
            setSnackbar({ open: true, message: 'Tidak ada data untuk didownload', severity: 'warning' });
            return;
        }

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

            const sortedDateStores = Array.from(dateStoreMap.values())
                .sort((a, b) => {
                    const dateCompare = parseAnyDate(a.date) - parseAnyDate(b.date);
                    if (dateCompare !== 0) return dateCompare;
                    return a.store.localeCompare(b.store);
                });

            const COLS_PER_DATE = 3;

            const headersRow1 = ['Nama SPG', 'SKU'];
            sortedDateStores.forEach(() => headersRow1.push('TEMP', 'TEMP', 'TEMP'));
            headersRow1.push('TOTAL SPG');
            const row1 = ws.addRow(headersRow1);
            row1.height = 30;
            row1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            row1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            row1.alignment = { vertical: 'middle', horizontal: 'center' };

            sortedDateStores.forEach((ds, index) => {
                const startCol = 3 + (index * COLS_PER_DATE);
                ws.mergeCells(1, startCol, 1, startCol + COLS_PER_DATE - 1);
                ws.getCell(1, startCol).value = formatDateIndo(ds.date);
            });

            const headersRow2 = ['', ''];
            sortedDateStores.forEach(ds => headersRow2.push(ds.store, ds.store, ds.store));
            headersRow2.push('');
            const row2 = ws.addRow(headersRow2);
            row2.height = 25;
            row2.font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };
            row2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            row2.alignment = { vertical: 'middle', horizontal: 'center' };

            const headersRow3 = ['', ''];
            sortedDateStores.forEach(() => headersRow3.push('Foto', 'Qty', 'Rupiah'));
            headersRow3.push('Rupiah');
            const row3 = ws.addRow(headersRow3);
            row3.height = 25;
            row3.font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };
            row3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            row3.alignment = { vertical: 'middle', horizontal: 'center' };

            ws.getColumn(1).width = 20;
            ws.getColumn(2).width = 25;
            sortedDateStores.forEach((_, index) => {
                const baseCol = 3 + (index * COLS_PER_DATE);
                ws.getColumn(baseCol).width = 16;
                ws.getColumn(baseCol + 1).width = 8;
                ws.getColumn(baseCol + 2).width = 16;
            });
            const totalColIndex = 3 + (sortedDateStores.length * COLS_PER_DATE);
            ws.getColumn(totalColIndex).width = 18;

            const sortedNamas = Object.keys(pivotData).sort();
            const allSkus = new Set();
            sortedNamas.forEach(nama => pivotData[nama].records.forEach(r => r.items.forEach(i => allSkus.add(i.sku))));
            const sortedSkus = Array.from(allSkus).sort();

            const fotoCache = new Map();
            if (includePhotos) {
                const uniqueFotos = new Set();
                Object.values(pivotData).forEach(namaData => {
                    Object.values(namaData.fotoByDate).forEach(url => { if (url) uniqueFotos.add(url); });
                });

                const fotoArray = Array.from(uniqueFotos);
                const batchSize = 5;
                for (let i = 0; i < fotoArray.length; i += batchSize) {
                    const batch = fotoArray.slice(i, i + batchSize);
                    await Promise.all(batch.map(async (url) => {
                        const arrayBuffer = await fetchImageWithCache(url);
                        if (arrayBuffer) {
                            const compressed = await compressImage(arrayBuffer, 0.9); // ✅ 90%
                            if (compressed) fotoCache.set(url, { buffer: compressed, extension: getImageExtension(url) });
                        }
                    }));
                }
            }

            let currentRow = 4;

            for (const nama of sortedNamas) {
                const namaData = pivotData[nama];
                let isFirstRowForNama = true;
                const namaStartRow = currentRow;

                for (const sku of sortedSkus) {
                    const row = ws.addRow([nama, sku]);
                    row.height = isFirstRowForNama && includePhotos ? 120 : 25;
                    row.alignment = { vertical: 'top', horizontal: 'left' };

                    row.eachCell((cell, colNumber) => {
                        const isFotoColumn = colNumber >= 3 && colNumber < totalColIndex && (colNumber - 3) % COLS_PER_DATE === 0;
                        if (isFotoColumn && includePhotos) cell.border = {};
                        else cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });

                    let dataColIndex = 3;
                    for (const { date, store } of sortedDateStores) {
                        const record = namaData.records.find(r => {
                            const rStore = r.namaToko || r.toko || r.outlet || 'Toko Tidak Diketahui';
                            return r.tanggal === date && rStore === store;
                        });

                        const item = record ? record.items.find(i => i.sku === sku) : null;
                        const fotoUrl = record ? record.foto : null;

                        const fotoCell = row.getCell(dataColIndex);
                        fotoCell.alignment = { vertical: 'middle', horizontal: 'center' };
                        fotoCell.border = {};

                        if (isFirstRowForNama && includePhotos && fotoUrl && fotoCache.has(fotoUrl)) {
                            try {
                                const fotoData = fotoCache.get(fotoUrl);
                                const imageId = workbook.addImage({ buffer: fotoData.buffer, extension: fotoData.extension });
                                ws.addImage(imageId, {
                                    tl: { col: dataColIndex - 1, row: currentRow - 1 },
                                    ext: { width: 100, height: 100 }
                                });
                            } catch (err) {
                                console.error('Gagal tambah gambar:', err);
                            }
                        }

                        const qtyCell = row.getCell(dataColIndex + 1);
                        qtyCell.value = item ? item.qty : 0;
                        qtyCell.alignment = { vertical: 'middle', horizontal: 'center' };
                        qtyCell.font = { bold: true, size: 11, color: { argb: 'FF1E40AF' } };
                        qtyCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                        const rupiahCell = row.getCell(dataColIndex + 2);
                        const itemRupiah = item ? (item.harga || 0) * (item.qty || 0) : 0;
                        rupiahCell.value = itemRupiah;
                        rupiahCell.numFmt = '#,##0';
                        rupiahCell.alignment = { vertical: 'middle', horizontal: 'right' };
                        rupiahCell.font = { bold: true, size: 10, color: { argb: 'FF059669' } };
                        rupiahCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                        dataColIndex += COLS_PER_DATE;
                    }

                    if (isFirstRowForNama) {
                        const totalCell = row.getCell(totalColIndex);
                        totalCell.value = getGrandTotal(nama);
                        totalCell.numFmt = '#,##0';
                        totalCell.font = { bold: true, size: 11, color: { argb: 'FF059669' } };
                        totalCell.alignment = { vertical: 'middle', horizontal: 'right' };
                        totalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
                    }

                    currentRow++;
                    isFirstRowForNama = false;
                }

                if (sortedSkus.length > 1) {
                    ws.mergeCells(namaStartRow, totalColIndex, currentRow - 1, totalColIndex);
                }
            }

            const grandTotalRow = ws.addRow([]);
            grandTotalRow.height = 30;
            ws.mergeCells(currentRow, 1, currentRow, totalColIndex - 1);
            const grandTotalLabel = ws.getCell(currentRow, 1);
            grandTotalLabel.value = 'GRAND TOTAL';
            grandTotalLabel.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            grandTotalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            grandTotalLabel.alignment = { vertical: 'middle', horizontal: 'right' };
            grandTotalLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            const grandTotalValue = ws.getCell(currentRow, totalColIndex);
            grandTotalValue.value = getTotalAll();
            grandTotalValue.numFmt = '#,##0';
            grandTotalValue.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            grandTotalValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            grandTotalValue.alignment = { vertical: 'middle', horizontal: 'right' };
            grandTotalValue.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const filename = `Laporan_Pivot_SellOut_${formatDateLocal(startDate || new Date())}_to_${formatDateLocal(endDate || new Date())}${includePhotos ? '' : '_NO_FOTO'}.xlsx`;
            saveAs(blob, filename);

            setSnackbar({ open: true, message: 'Excel Pivot berhasil didownload!', severity: 'success' });
        } catch (error) {
            console.error('Error download:', error);
            setSnackbar({ open: true, message: 'Gagal membuat Excel: ' + error.message, severity: 'error' });
        } finally {
            setIsDownloading(false);
        }
    };

    // ✅ FUNGSI DOWNLOAD RAW DATA
    const handleDownloadRaw = async () => {
        if (Object.keys(pivotData).length === 0) {
            setSnackbar({ open: true, message: 'Tidak ada data untuk didownload', severity: 'warning' });
            return;
        }

        setIsDownloading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Raw Data Sell Out');

            const allRecords = [];
            Object.values(pivotData).forEach(namaData => {
                namaData.records.forEach(record => allRecords.push(record));
            });

            allRecords.sort((a, b) => {
                const dateCompare = parseAnyDate(a.tanggal) - parseAnyDate(b.tanggal);
                if (dateCompare !== 0) return dateCompare;
                const namaCompare = (a.nama || '').localeCompare(b.nama || '');
                if (namaCompare !== 0) return namaCompare;
                return (a.namaToko || '').localeCompare(b.namaToko || '');
            });

            const headers = ['No', 'Tanggal', 'Nama SPG', 'Nama Toko', 'SKU', 'Harga', 'Qty', 'Total'];
            if (includePhotos) headers.push('Foto');

            const headerRow = ws.addRow(headers);
            headerRow.height = 28;
            headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            ws.getColumn(1).width = 6;
            ws.getColumn(2).width = 14;
            ws.getColumn(3).width = 20;
            ws.getColumn(4).width = 22;
            ws.getColumn(5).width = 25;
            ws.getColumn(6).width = 15;
            ws.getColumn(7).width = 8;
            ws.getColumn(8).width = 18;
            if (includePhotos) ws.getColumn(9).width = 18;

            const fotoCache = new Map();
            if (includePhotos) {
                const uniqueFotos = new Set();
                allRecords.forEach(r => { if (r.foto) uniqueFotos.add(r.foto); });
                const fotoArray = Array.from(uniqueFotos);
                const batchSize = 5;
                for (let i = 0; i < fotoArray.length; i += batchSize) {
                    const batch = fotoArray.slice(i, i + batchSize);
                    await Promise.all(batch.map(async (url) => {
                        const arrayBuffer = await fetchImageWithCache(url);
                        if (arrayBuffer) {
                            const compressed = await compressImage(arrayBuffer, 0.9); // ✅ 90%
                            if (compressed) fotoCache.set(url, { buffer: compressed, extension: getImageExtension(url) });
                        }
                    }));
                }
            }

            let rowNumber = 1;
            let currentExcelRow = 2;
            let grandTotalAll = 0;

            for (const record of allRecords) {
                const store = record.namaToko || record.toko || record.outlet || 'Toko Tidak Diketahui';
                const items = record.items || [];
                const firstItemRowIndex = currentExcelRow;

                items.forEach((item, idx) => {
                    const total = (item.harga || 0) * (item.qty || 0);
                    grandTotalAll += total;

                    const rowData = [
                        idx === 0 ? rowNumber : '',
                        idx === 0 ? formatDateIndo(record.tanggal) : '',
                        idx === 0 ? record.nama : '',
                        idx === 0 ? store : '',
                        item.sku,
                        item.harga || 0,
                        item.qty || 0,
                        total
                    ];
                    if (includePhotos) rowData.push(idx === 0 ? 'Foto' : '');

                    const row = ws.addRow(rowData);
                    row.height = idx === 0 && includePhotos ? 80 : 22;
                    row.alignment = { vertical: 'middle', wrapText: true };

                    row.eachCell((cell, colNumber) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        if (colNumber === 1 || colNumber === 7) cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        else if (colNumber === 6 || colNumber === 8) {
                            cell.alignment = { vertical: 'middle', horizontal: 'right' };
                            cell.numFmt = '#,##0';
                        } else cell.alignment = { vertical: 'middle', horizontal: 'left' };

                        if (colNumber === 8) cell.font = { bold: true, color: { argb: 'FF1E40AF' } };
                        if (rowNumber % 2 === 0 && idx === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                    });

                    currentExcelRow++;
                });

                if (items.length > 1) {
                    [1, 2, 3, 4].forEach(col => ws.mergeCells(firstItemRowIndex, col, firstItemRowIndex + items.length - 1, col));
                    if (includePhotos) ws.mergeCells(firstItemRowIndex, 9, firstItemRowIndex + items.length - 1, 9);
                }

                if (includePhotos && record.foto && fotoCache.has(record.foto)) {
                    try {
                        const fotoData = fotoCache.get(record.foto);
                        const imageId = workbook.addImage({ buffer: fotoData.buffer, extension: fotoData.extension });
                        ws.addImage(imageId, {
                            tl: { col: 8, row: firstItemRowIndex - 1 },
                            ext: { width: 90, height: 90 }
                        });
                    } catch (err) {
                        console.error('Gagal tambah gambar:', err);
                    }
                }

                rowNumber++;
            }

            const totalRowCols = includePhotos ? 9 : 8;
            const totalRow = ws.addRow([]);
            totalRow.height = 28;
            ws.mergeCells(currentExcelRow, 1, currentExcelRow, totalRowCols - 1);
            const totalCell = ws.getCell(currentExcelRow, 1);
            totalCell.value = 'GRAND TOTAL';
            totalCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            totalCell.alignment = { vertical: 'middle', horizontal: 'right' };
            totalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            const grandTotalCell = ws.getCell(currentExcelRow, totalRowCols);
            grandTotalCell.value = grandTotalAll;
            grandTotalCell.numFmt = '#,##0';
            grandTotalCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            grandTotalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            grandTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };
            grandTotalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            ws.views = [{ state: 'frozen', ySplit: 1 }];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const filename = `RawData_SellOut_${formatDateLocal(startDate || new Date())}_to_${formatDateLocal(endDate || new Date())}${includePhotos ? '' : '_NO_FOTO'}.xlsx`;
            saveAs(blob, filename);

            setSnackbar({ open: true, message: 'Excel Raw Data berhasil didownload!', severity: 'success' });
        } catch (error) {
            console.error('Error download:', error);
            setSnackbar({ open: true, message: 'Gagal membuat Excel: ' + error.message, severity: 'error' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownload = () => {
        if (reportFormat === 'pivot') handleDownloadPivot();
        else handleDownloadRaw();
    };

    // ✅ HELPER: Calendar - tambahkan recordId
    const getTotalByDate = (dateStr) => {
        let total = 0;
        Object.values(pivotData).forEach(namaData => {
            if (namaData.totalByDate[dateStr]) total += namaData.totalByDate[dateStr];
        });
        return total;
    };

    const getDetailByDate = (dateStr) => {
        const details = [];
        Object.keys(pivotData).sort().forEach(nama => {
            const namaData = pivotData[nama];
            if (namaData.totalByDate[dateStr]) {
                const records = namaData.records.filter(r => r.tanggal === dateStr);
                records.forEach(record => {
                    const store = record.namaToko || record.toko || record.outlet || 'Toko Tidak Diketahui';
                    const total = record.items.reduce((sum, item) => sum + ((item.harga || 0) * (item.qty || 0)), 0);
                    details.push({
                        recordId: record.id, // ✅ SIMPAN ID UNTUK HAPUS
                        nama, store, total,
                        itemCount: record.items.length,
                        qtyCount: record.items.reduce((sum, item) => sum + (item.qty || 0), 0)
                    });
                });
            }
        });
        return details;
    };

    const getIntensityColor = (total, maxTotal) => {
        if (total === 0) return 'transparent';
        const intensity = total / maxTotal;
        if (intensity > 0.75) return '#1e3a8a';
        if (intensity > 0.5) return '#1e40af';
        if (intensity > 0.25) return '#3b82f6';
        if (intensity > 0.1) return '#60a5fa';
        return '#93c5fd';
    };

    if (loading) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress size={60} sx={{ color: '#667eea' }} /></Box>);
    }

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    return (
        <Box sx={{ pb: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* ✅ HAPUS tombol Logout - langsung ke konten */}

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
                            <DatePicker value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } } } }} />
                        </Box>
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5 }}>Tanggal Akhir</Typography>
                            <DatePicker value={endDate} onChange={setEndDate} slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } } } }} />
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                            <Button variant="contained" onClick={handleApplyFilter} startIcon={<ApplyIcon />} sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)', background: '#667eea', '&:hover': { background: '#3874BC' } }}>Terapkan</Button>
                            <Tooltip title="Reset Filter">
                                <Button variant="outlined" onClick={handleResetFilter} sx={{ minWidth: 'auto', p: 1.5, borderRadius: 3, borderColor: '#cbd5e1', color: '#64748b', '&:hover': { borderColor: '#667eea', color: '#667eea', bgcolor: '#eff6ff' } }}><ClearIcon /></Button>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Stack>

                <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opsi Download Excel</Typography>

                    <FormControl sx={{ mb: 2, width: '100%' }}>
                        <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', mb: 1 }}>Format Laporan</FormLabel>
                        <RadioGroup row value={reportFormat} onChange={(e) => setReportFormat(e.target.value)} sx={{ gap: 2 }}>
                            <FormControlLabel value="pivot" control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><ViewListIcon sx={{ fontSize: 18, color: reportFormat === 'pivot' ? '#667eea' : '#94a3b8' }} /><Typography variant="body2" fontWeight={reportFormat === 'pivot' ? 700 : 500} color={reportFormat === 'pivot' ? '#1e293b' : '#64748b'}>Pivot (per SPG & Tanggal)</Typography></Box>} sx={{ flex: 1, p: 1.5, borderRadius: 2, border: `2px solid ${reportFormat === 'pivot' ? '#667eea' : '#e2e8f0'}`, bgcolor: reportFormat === 'pivot' ? '#eff6ff' : 'white', ml: 0, mr: 0 }} />
                            <FormControlLabel value="raw" control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><TableIcon sx={{ fontSize: 18, color: reportFormat === 'raw' ? '#667eea' : '#94a3b8' }} /><Typography variant="body2" fontWeight={reportFormat === 'raw' ? 700 : 500} color={reportFormat === 'raw' ? '#1e293b' : '#64748b'}>Raw Data (Tabel Lengkap)</Typography></Box>} sx={{ flex: 1, p: 1.5, borderRadius: 2, border: `2px solid ${reportFormat === 'raw' ? '#667eea' : '#e2e8f0'}`, bgcolor: reportFormat === 'raw' ? '#eff6ff' : 'white', ml: 0, mr: 0 }} />
                        </RadioGroup>
                    </FormControl>

                    <FormControlLabel control={<Switch checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#667eea' } }} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{includePhotos ? <PhotoIcon sx={{ fontSize: 20, color: '#667eea' }} /> : <TableIcon sx={{ fontSize: 20, color: '#64748b' }} />}<Box><Typography variant="body2" fontWeight={600} color={includePhotos ? '#667eea' : '#64748b'}>{includePhotos ? 'Sertakan Foto (Dikompres 90%)' : 'Tanpa Foto (Lebih Cepat)'}</Typography><Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>{includePhotos ? '⚡ Foto dikompres 90% - kualitas tinggi, tetap cepat' : '⚡ Download lebih cepat tanpa gambar'}</Typography></Box></Box>} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white', ml: 0, mr: 0, alignItems: 'flex-start' }} />
                </Box>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                    <Button variant="contained" onClick={handleDownload} startIcon={<DownloadIcon />} disabled={Object.keys(pivotData).length === 0} sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)', background: '#3874BC', '&:hover': { background: '#3874BC' }, '&:disabled': { background: '#cbd5e1', color: '#94a3b8' } }}>
                        Download {reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'} {includePhotos ? '(Dengan Foto)' : '(Tanpa Foto)'}
                    </Button>
                </Box>
            </Paper>

            {isFiltered && Object.keys(pivotData).length > 0 && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => { if (newMode !== null) setViewMode(newMode); }}
                        sx={{ '& .MuiToggleButton-root': { px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, '&.Mui-selected': { bgcolor: '#667eea', color: 'white' } } }}
                    >
                        <ToggleButton value="pivot"><ViewListIcon sx={{ mr: 1 }} /> Pivot</ToggleButton>
                        <ToggleButton value="calendar"><CalendarIcon sx={{ mr: 1 }} /> Calendar</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

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

            {/* ✅ PIVOT VIEW */}
            {viewMode === 'pivot' && isFiltered && Object.keys(pivotData).length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, boxShadow: '0 2px 12px rgba(102, 126, 234, 0.04)', border: '1px solid rgba(102, 126, 234, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}><ReceiptIcon sx={{ fontSize: 22 }} /></Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#667eea' }}>Pivot Penjualan Harian</Typography>
                            <Typography variant="caption" color="text.secondary">Total Rupiah per SPG per Tanggal</Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />

                    <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'auto', maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, background: '#3874BC', color: 'white', fontWeight: 'bold', minWidth: 160, borderBottom: '2px solid #764ba2' }}>Nama SPG</TableCell>
                                    {allDates.map(date => (
                                        <TableCell key={date} align="center" sx={{ background: '#3879BC', color: 'white', fontWeight: 'bold', minWidth: 110, borderBottom: '2px solid #764ba2', fontSize: '0.75rem', py: 1.5 }}>{formatDateIndo(date)}</TableCell>
                                    ))}
                                    <TableCell align="right" sx={{ background: '#059669', color: 'white', fontWeight: 'bold', minWidth: 130, borderBottom: '2px solid #047857', fontSize: '0.85rem' }}>Total SPG</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.keys(pivotData).sort().map((nama, rowIndex) => (
                                    <TableRow key={nama} hover sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: '#eff6ff', color: '#667eea', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 'bold' }}>{nama.charAt(0).toUpperCase()}</Avatar>
                                                {nama}
                                            </Box>
                                        </TableCell>
                                        {allDates.map(date => {
                                            const total = pivotData[nama].totalByDate[date] || 0;
                                            return (
                                                <TableCell key={date} align="right" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0', color: total > 0 ? '#1e293b' : '#cbd5e1', py: 1.5, fontWeight: total > 0 ? 600 : 400 }}>
                                                    {total > 0 ? formatRupiah(total) : '-'}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 'bold', color: '#059669', fontFamily: 'monospace', fontSize: '0.9rem', borderBottom: '1px solid #bbf7d0', borderLeft: '2px solid #059669', py: 1.5 }}>
                                            {formatRupiah(getGrandTotal(nama))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ bgcolor: '#1e3a8a' }}>
                                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: '#1e3a8a', fontWeight: 'bold', fontSize: '0.9rem', color: 'white', borderBottom: 'none', borderRight: '2px solid #1e40af' }}>
                                        GRAND TOTAL
                                    </TableCell>
                                    {allDates.map(date => {
                                        let dayTotal = 0;
                                        Object.values(pivotData).forEach(namaData => {
                                            dayTotal += namaData.totalByDate[date] || 0;
                                        });
                                        return (
                                            <TableCell key={date} align="right" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'white', fontWeight: 'bold', borderBottom: 'none', py: 1.5 }}>
                                                {dayTotal > 0 ? formatRupiah(dayTotal) : '-'}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell align="right" sx={{ bgcolor: '#059669', fontWeight: 'bold', color: 'white', fontFamily: 'monospace', fontSize: '1rem', borderBottom: 'none', borderLeft: '2px solid #047857', py: 1.5 }}>
                                        {formatRupiah(getTotalAll())}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* ✅ CALENDAR VIEW - RESPONSIF + FITUR HAPUS */}
            {viewMode === 'calendar' && isFiltered && Object.keys(pivotData).length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 1.5, md: 3 }, borderRadius: 4, boxShadow: '0 2px 12px rgba(102, 126, 234, 0.04)', border: '1px solid rgba(102, 126, 234, 0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, md: 2.5 }, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                            <Avatar sx={{ bgcolor: '#667eea', width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 }, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}>
                                <CalendarIcon sx={{ fontSize: { xs: 18, md: 22 } }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, color: '#667eea', lineHeight: 1.2 }}>Kalender Penjualan</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Klik tanggal untuk lihat detail & hapus</Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton onClick={() => setCalendarMonth(prev => {
                                const newMonth = prev.month - 1;
                                const newYear = newMonth < 0 ? prev.year - 1 : prev.year;
                                const finalMonth = newMonth < 0 ? 11 : newMonth;
                                return { year: newYear, month: finalMonth };
                            })} sx={{ bgcolor: '#f8fafc', padding: { xs: '6px', md: '8px' }, '&:hover': { bgcolor: '#eff6ff' } }}>
                                <ChevronLeft sx={{ fontSize: { xs: 20, md: 24 } }} />
                            </IconButton>
                            <Typography variant="h6" fontWeight="bold" sx={{ minWidth: { xs: 120, md: 160 }, textAlign: 'center', color: '#1e293b', fontSize: { xs: '0.85rem', md: '1.1rem' } }}>
                                {months[calendarMonth.month]} {calendarMonth.year}
                            </Typography>
                            <IconButton onClick={() => setCalendarMonth(prev => {
                                const newMonth = prev.month + 1;
                                const newYear = newMonth > 11 ? prev.year + 1 : prev.year;
                                const finalMonth = newMonth > 11 ? 0 : newMonth;
                                return { year: newYear, month: finalMonth };
                            })} sx={{ bgcolor: '#f8fafc', padding: { xs: '6px', md: '8px' }, '&:hover': { bgcolor: '#eff6ff' } }}>
                                <ChevronRight sx={{ fontSize: { xs: 20, md: 24 } }} />
                            </IconButton>
                        </Stack>
                    </Box>
                    <Divider sx={{ mb: { xs: 2, md: 2.5 } }} />

                    <Box sx={{ mb: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, md: 1 }, mb: { xs: 0.5, md: 1 } }}>
                            {daysOfWeek.map(day => (
                                <Typography key={day} variant="caption" fontWeight="bold" sx={{ textAlign: 'center', color: '#64748b', py: { xs: 0.5, md: 1 }, fontSize: { xs: '0.6rem', md: '0.75rem' } }}>{day}</Typography>
                            ))}
                        </Box>

                        {generateCalendarGrid(calendarMonth.year, calendarMonth.month).map((week, weekIdx) => (
                            <Box key={weekIdx} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, md: 1 }, mb: { xs: 0.5, md: 1 } }}>
                                {week.map((dayData, dayIdx) => {
                                    if (!dayData) {
                                        return <Box key={dayIdx} sx={{ aspectRatio: '1', bgcolor: '#f8fafc', borderRadius: { xs: 1, md: 2 } }} />;
                                    }

                                    const total = getTotalByDate(dayData.dateStr);
                                    const maxTotal = Math.max(...allDates.map(d => getTotalByDate(d)), 1);
                                    const bgColor = getIntensityColor(total, maxTotal);
                                    const isSelected = selectedDate === dayData.dateStr;
                                    const hasData = total > 0;

                                    return (
                                        <Box key={dayIdx} onClick={() => hasData && setSelectedDate(dayData.dateStr)} sx={{
                                            aspectRatio: '1', bgcolor: hasData ? bgColor : '#f8fafc',
                                            borderRadius: { xs: 1, md: 2 },
                                            border: isSelected ? '2px solid #667eea' : '1px solid #e2e8f0',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            cursor: hasData ? 'pointer' : 'default', transition: 'all 0.2s ease',
                                            '&:hover': hasData ? { transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {},
                                            p: { xs: 0.5, md: 1 }
                                        }}>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: hasData ? 'white' : '#94a3b8', fontSize: { xs: '0.7rem', md: '0.9rem' }, lineHeight: 1 }}>{dayData.day}</Typography>
                                            {hasData && (
                                                <Typography variant="caption" sx={{ color: 'white', fontSize: { xs: '0.5rem', md: '0.65rem' }, fontWeight: 600, mt: { xs: 0.25, md: 0.5 }, textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word', maxWidth: '100%' }}>
                                                    {total >= 1000000 ? `${(total / 1000000).toFixed(1)}M` : total >= 1000 ? `${(total / 1000).toFixed(0)}K` : formatRupiah(total)}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>

                    {/* ✅ DETAIL PANEL DENGAN TOMBOL HAPUS */}
                    {selectedDate && (
                        <Box sx={{ mt: { xs: 2, md: 3 }, p: { xs: 1.5, md: 2.5 }, borderRadius: { xs: 2, md: 3 }, bgcolor: '#eff6ff', border: '2px solid #667eea' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, mb: { xs: 1.5, md: 2 }, flexWrap: 'wrap' }}>
                                <CalendarIcon sx={{ color: '#667eea', fontSize: { xs: 18, md: 24 } }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e40af', fontSize: { xs: '0.9rem', md: '1.1rem' } }}>Detail: {formatDateIndo(selectedDate)}</Typography>
                                <Chip label={`Total: Rp ${formatRupiah(getTotalByDate(selectedDate))}`} sx={{ ml: { xs: 0, md: 'auto' }, bgcolor: '#059669', color: 'white', fontWeight: 'bold', fontSize: { xs: '0.65rem', md: '0.8rem' }, height: { xs: 24, md: 28 } }} />
                            </Box>
                            <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
                            <Stack spacing={1}>
                                {getDetailByDate(selectedDate).map((detail, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, p: { xs: 1, md: 1.5 }, bgcolor: 'white', borderRadius: { xs: 1.5, md: 2 }, border: '1px solid #bfdbfe', flexWrap: 'wrap' }}>
                                        <Avatar sx={{ bgcolor: '#667eea', width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, fontSize: { xs: '0.8rem', md: '0.9rem' }, fontWeight: 'bold' }}>{detail.nama.charAt(0).toUpperCase()}</Avatar>
                                        <Box sx={{ flex: 1, minWidth: { xs: '120px', md: 'auto' } }}>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#1e293b', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>{detail.nama}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                <Chip icon={<StoreIcon sx={{ fontSize: '12px !important' }} />} label={detail.store} size="small" variant="outlined" sx={{ height: { xs: 20, md: 22 }, fontSize: { xs: '0.6rem', md: '0.7rem' }, '& .MuiChip-label': { px: 0.8 } }} />
                                                <Chip label={`${detail.itemCount} item • ${detail.qtyCount} pcs`} size="small" sx={{ height: { xs: 20, md: 22 }, fontSize: { xs: '0.6rem', md: '0.7rem' }, bgcolor: '#f1f5f9', '& .MuiChip-label': { px: 0.8 } }} />
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#059669', fontFamily: 'monospace', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                                            Rp {formatRupiah(detail.total)}
                                        </Typography>
                                        {/* ✅ TOMBOL HAPUS */}
                                        <Tooltip title="Hapus Record">
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => handleOpenDeleteDialog(detail.recordId, {
                                                    nama: detail.nama,
                                                    store: detail.store,
                                                    date: selectedDate,
                                                    total: detail.total
                                                })}
                                                sx={{
                                                    bgcolor: '#fef2f2',
                                                    '&:hover': { bgcolor: '#fee2e2' },
                                                    ml: { xs: 0, md: 0.5 }
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Paper>
            )}

            {/* ✅ DIALOG KONFIRMASI HAPUS */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => !deleteDialog.isDeleting && setDeleteDialog({ open: false, recordId: null, recordInfo: null, isDeleting: false })}
                sx={{ '& .MuiDialog-paper': { borderRadius: 3, minWidth: { xs: 280, md: 400 } } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444', pb: 1 }}>
                    <WarningIcon /> Konfirmasi Hapus
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Apakah Anda yakin ingin menghapus data berikut?
                    </DialogContentText>
                    {deleteDialog.recordInfo && (
                        <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 2, border: '1px solid #fecaca' }}>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="#991b1b" fontWeight={600}>Tanggal:</Typography>
                                    <Typography variant="body2" color="#1e293b">{formatDateIndo(deleteDialog.recordInfo.date)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="#991b1b" fontWeight={600}>SPG:</Typography>
                                    <Typography variant="body2" color="#1e293b">{deleteDialog.recordInfo.nama}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="#991b1b" fontWeight={600}>Toko:</Typography>
                                    <Typography variant="body2" color="#1e293b">{deleteDialog.recordInfo.store}</Typography>
                                </Box>
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="#991b1b" fontWeight={600}>Total:</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="#059669" sx={{ fontFamily: 'monospace' }}>
                                        Rp {formatRupiah(deleteDialog.recordInfo.total)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                    <Typography variant="caption" color="#991b1b" sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}>
                        ⚠️ Data yang dihapus tidak dapat dikembalikan.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteDialog({ open: false, recordId: null, recordInfo: null, isDeleting: false })}
                        variant="outlined"
                        disabled={deleteDialog.isDeleting}
                        sx={{ borderRadius: 2 }}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        disabled={deleteDialog.isDeleting}
                        startIcon={deleteDialog.isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        {deleteDialog.isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDownloading} disableEscapeKeyDown BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, px: 6, minWidth: 320 }}>
                    <CircularProgress size={55} sx={{ mb: 3, color: '#667eea' }} />
                    <Typography variant="h6" fontWeight="bold" color="#1a202c" align="center">Sedang Memproses...</Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, lineHeight: 1.6 }}>
                        {includePhotos ? `Mengunduh dan mengkompres gambar, lalu menyusun laporan ${reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'}. Mohon tunggu.` : `Menyusun laporan ${reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'}. Mohon tunggu.`}
                    </Typography>
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600, fontSize: '0.9rem' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
