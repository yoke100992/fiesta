import { useRef } from 'react';
import { Box, Paper, Typography, Avatar, Divider, Tooltip, IconButton, CircularProgress, Chip, Stack } from '@mui/material';
import { CalendarMonth as CalendarIcon, CameraAlt as CameraIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// ... (Salin fungsi helper: formatDateIndo, formatRupiah, generateCalendarGrid, PERMIT_CONFIG, getIntensityColor dari ViewView.jsx lama ke sini) ...

export default function ViewCalendar({
    pivotData, allDates, calendarMonth, setCalendarMonth, selectedDate, setSelectedDate,
    calendarFilterNama, setCalendarFilterNama, isNamaFiltered, namaList, permitData,
    onCapture, isCapturing, handleCalendarDateClick, getTotalByDate, getDetailByDate,
    getPermitsByDate, handleCopyReport, handleOpenDeleteDialog, handleDeletePermit
}) {
    const calendarCaptureRef = useRef(null);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    const handleCaptureClick = async () => {
        if (!calendarCaptureRef.current) return;
        const btns = calendarCaptureRef.current.querySelectorAll('.capture-btn');
        btns.forEach(btn => btn.style.display = 'none');
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(calendarCaptureRef.current, { backgroundColor: '#f8fafc', scale: 2, useCORS: true, logging: false });
        btns.forEach(btn => btn.style.display = '');
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        saveAs(blob, `calendar_view.png`);
        onCapture();
    };

    return (
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 3 }, borderRadius: 4, border: '1px solid rgba(102,126,234,0.06)' }}>
            {/* Header dengan Tombol Capture */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40 }}><CalendarIcon sx={{ fontSize: 22 }} /></Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#667eea' }}>Kalender Penjualan</Typography>
                        <Typography variant="caption" color="text.secondary">Klik tanggal untuk detail/permit</Typography>
                    </Box>
                </Box>
                <Tooltip title="Capture & Simpan sebagai PNG">
                    <IconButton onClick={handleCaptureClick} disabled={isCapturing} className="capture-btn" sx={{ bgcolor: '#10b981', color: 'white', width: 40, height: 40, '&:hover': { bgcolor: '#059669' } }}>
                        {isCapturing ? <CircularProgress size={20} color="inherit" /> : <CameraIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filter Nama Tambahan (Hanya muncul jika "Semua Nama") */}
            {!isNamaFiltered && namaList.length > 0 && (
                <Box sx={{ mb: 2.5, p: 2, borderRadius: 3, bgcolor: '#f0f9ff', border: '1px dashed #7dd3fc', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: '#0c4a6e', fontWeight: 700, fontSize: '0.8rem' }}>Filter Calendar per Nama:</Typography>
                    {/* ... (Tambahkan Autocomplete single select untuk calendarFilterNama di sini) ... */}
                </Box>
            )}

            {/* Area yang akan di-Capture */}
            <Box ref={calendarCaptureRef} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 2 }}>
                {/* ... (Salin seluruh logika Grid Kalender, Permit, dan Detail Tanggal dari ViewView.jsx lama ke dalam Box ini) ... */}
            </Box>
        </Paper>
    );
}