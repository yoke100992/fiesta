import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Stack, Avatar, Divider, Chip,
    CircularProgress, Select, MenuItem, Button, Tooltip, LinearProgress,
    Snackbar, Alert, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
    ShoppingCart as CartIcon,
    Group as GroupIcon, Store as StoreIcon, EmojiEvents as TrophyIcon,
    Inventory as InventoryIcon, CalendarMonth as CalendarIcon,
    Clear as ClearIcon, PlayArrow as ApplyIcon, Person as PersonIcon,
    ContentCopy as CopyIcon, Insights as InsightsIcon,
    Star as StarIcon, ShowChart as ShowChartIcon,
    FilterList as FilterIcon, RocketLaunch as RocketIcon,
    WorkspacePremium as MedalIcon, Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getSelloutDataByDateRange, calculateAnalytics, getNamaList } from '../utils/storage';

const formatDateLocal = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatRupiah = (number) => new Intl.NumberFormat('id-ID').format(number);
const formatRupiahShort = (number) => {
    if (number >= 1000000000) return `${(number / 1000000000).toFixed(1)}M`;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}Jt`;
    if (number >= 1000) return `${(number / 1000).toFixed(0)}K`;
    return formatRupiah(number);
};
const formatDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
};
const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const [, , day] = dateStr.split('-');
    return parseInt(day);
};

// ==========================================
// STAT CARD - Responsive
// ==========================================
const StatCard = ({ icon, label, value, color, subtext, highlight }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const colorMap = {
        blue: {
            bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            iconBg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            text: '#1e40af', border: '#bfdbfe', glow: 'rgba(30, 64, 175, 0.15)'
        },
        green: {
            bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            iconBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            text: '#059669', border: '#bbf7d0', glow: 'rgba(5, 150, 105, 0.15)'
        },
        purple: {
            bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            iconBg: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
            text: '#7c3aed', border: '#ddd6fe', glow: 'rgba(124, 58, 237, 0.15)'
        },
        orange: {
            bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            iconBg: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
            text: '#ea580c', border: '#fed7aa', glow: 'rgba(234, 88, 12, 0.15)'
        }
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: { xs: 2.5, md: 3 },
                background: c.bg,
                border: `2px solid ${c.border}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                height: '100%',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${c.glow}`,
                    borderColor: c.text
                }
            }}
        >
            {highlight && (
                <Chip
                    icon={<StarIcon sx={{ fontSize: 10 }} />}
                    label="Best"
                    size="small"
                    sx={{
                        position: 'absolute', top: 10, right: 10,
                        bgcolor: c.text, color: 'white',
                        fontWeight: 'bold', fontSize: '0.6rem', height: 20
                    }}
                />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, md: 1.5 }, mb: { xs: 1.5, md: 2 } }}>
                <Avatar sx={{
                    background: c.iconBg,
                    width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 },
                    boxShadow: `0 4px 12px ${c.glow}`
                }}>{icon}</Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{
                        color: c.text, fontWeight: 700, fontSize: { xs: '0.65rem', md: '0.7rem' },
                        textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>{label}</Typography>
                </Box>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{
                color: '#1e293b',
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.75rem' },
                lineHeight: 1.2,
                fontFamily: "'Inter', sans-serif",
                mb: 0.5,
                wordBreak: 'break-word'
            }}>{value}</Typography>
            {subtext && (
                <Typography variant="caption" sx={{
                    color: '#64748b', fontSize: { xs: '0.7rem', md: '0.8rem' },
                    display: 'block', fontWeight: 500, mt: 0.5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{subtext}</Typography>
            )}
        </Paper>
    );
};

// ==========================================
// BAR CHART - Responsive
// ==========================================
const BarChart = ({ data, maxHeight = 260 }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!data || data.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                <ShowChartIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.3 }} />
                <Typography variant="body2" fontWeight={600}>Belum ada data tren</Typography>
                <Typography variant="caption" color="#cbd5e1">Pilih periode yang memiliki data</Typography>
            </Box>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const bestDayIdx = data.findIndex(d => d.value === maxValue);
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(maxValue * p));

    return (
        <Box sx={{ mt: 2, px: { xs: 0.5, md: 1 } }}>
            <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, height: maxHeight, position: 'relative' }}>
                {/* Y-Axis */}
                <Box sx={{
                    width: { xs: 38, md: 50 }, display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', pb: 3, pt: 0.5
                }}>
                    {[...yTicks].reverse().map((tick, idx) => (
                        <Typography key={idx} variant="caption" sx={{
                            fontSize: { xs: '0.5rem', md: '0.6rem' }, color: '#94a3b8',
                            fontFamily: 'monospace', textAlign: 'right', lineHeight: 1
                        }}>
                            {formatRupiahShort(tick)}
                        </Typography>
                    ))}
                </Box>

                {/* Chart Area */}
                <Box sx={{
                    flex: 1, position: 'relative',
                    borderLeft: '2px solid #e2e8f0',
                    borderBottom: '2px solid #e2e8f0'
                }}>
                    {/* Grid Lines */}
                    {[0.25, 0.5, 0.75, 1].map((p, idx) => (
                        <Box key={idx} sx={{
                            position: 'absolute',
                            left: 0, right: 0,
                            bottom: `${p * 100}%`,
                            borderBottom: '1px dashed #e2e8f0',
                            zIndex: 0
                        }} />
                    ))}

                    {/* Bars */}
                    <Box sx={{
                        display: 'flex', alignItems: 'flex-end',
                        gap: { xs: 0.3, md: 1 },
                        height: '100%',
                        px: { xs: 0.5, md: 1 },
                        pb: 3,
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {data.map((item, idx) => {
                            const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                            const isBest = idx === bestDayIdx;
                            return (
                                <Tooltip
                                    key={idx}
                                    title={
                                        <Box sx={{ textAlign: 'center', p: 0.5 }}>
                                            <Typography variant="caption" fontWeight="bold">{item.label}</Typography>
                                            <Typography variant="caption" display="block">Rp {formatRupiah(item.value)}</Typography>
                                            {isBest && <Chip label="Best Day" size="small" sx={{ mt: 0.5, bgcolor: '#fbbf24', color: '#1e293b', fontWeight: 'bold', fontSize: '0.65rem', height: 20 }} />}
                                        </Box>
                                    }
                                    arrow
                                >
                                    <Box sx={{
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', height: '100%',
                                        justifyContent: 'flex-end', position: 'relative'
                                    }}>
                                        {heightPercent > 15 && (
                                            <Typography variant="caption" sx={{
                                                fontSize: { xs: '0.45rem', md: '0.65rem' },
                                                color: isBest ? '#059669' : '#475569',
                                                fontWeight: isBest ? 800 : 600,
                                                mb: 0.5,
                                                fontFamily: 'monospace',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {formatRupiahShort(item.value)}
                                            </Typography>
                                        )}
                                        <Box sx={{
                                            width: '100%',
                                            maxWidth: { xs: 24, md: 48 },
                                            height: `${heightPercent}%`,
                                            minHeight: 4,
                                            background: isBest
                                                ? 'linear-gradient(180deg, #059669 0%, #10b981 50%, #34d399 100%)'
                                                : 'linear-gradient(180deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                                            borderRadius: '6px 6px 0 0',
                                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            boxShadow: isBest
                                                ? '0 -4px 12px rgba(5, 150, 105, 0.4)'
                                                : '0 -2px 8px rgba(30, 64, 175, 0.2)',
                                            '&:hover': {
                                                opacity: 0.85,
                                                transform: 'scaleY(1.02)'
                                            }
                                        }}>
                                            {isBest && (
                                                <Box sx={{
                                                    position: 'absolute', top: -10, left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    fontSize: '0.85rem'
                                                }}>??</Box>
                                            )}
                                        </Box>
                                        <Typography variant="caption" sx={{
                                            fontSize: { xs: '0.45rem', md: '0.7rem' },
                                            color: isBest ? '#059669' : '#475569',
                                            mt: 0.75, textAlign: 'center', lineHeight: 1,
                                            fontWeight: isBest ? 800 : 600,
                                            position: 'absolute', bottom: -24, width: '100%',
                                            writingMode: { xs: 'vertical-rl', md: 'horizontal-tb' },
                                            transform: { xs: 'rotate(180deg)', md: 'none' }
                                        }}>
                                            {item.shortLabel}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
            <Box sx={{
                display: 'flex', justifyContent: 'center', gap: { xs: 1.5, md: 2.5 },
                mt: { xs: 3, md: 4 }, pt: 2, borderTop: '1px solid #f1f5f9',
                flexWrap: 'wrap'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, background: 'linear-gradient(180deg, #1e40af 0%, #60a5fa 100%)' }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.65rem', md: '0.75rem' }, fontWeight: 600 }}>Penjualan</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, background: 'linear-gradient(180deg, #059669 0%, #34d399 100%)' }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.65rem', md: '0.75rem' }, fontWeight: 600 }}>Hari Terbaik</Typography>
                </Box>
            </Box>
        </Box>
    );
};

// ==========================================
// RANKING LIST - Responsive
// ==========================================
const RankingList = ({ title, icon, data, valueKey, labelKey, color, formatValue = 'rupiah' }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!data || data.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                <TrophyIcon sx={{ fontSize: 36, mb: 1, opacity: 0.3 }} />
                <Typography variant="body2" fontWeight={600}>Belum ada data</Typography>
                <Typography variant="caption" color="#cbd5e1">Data akan muncul setelah filter diterapkan</Typography>
            </Box>
        );
    }

    const maxValue = Math.max(...data.map(d => d[valueKey]));
    const medals = ['??', '??', '??', '4', '5'];
    const medalColors = ['#fbbf24', '#cbd5e1', '#fb923c', '#94a3b8', '#94a3b8'];

    const formatDisplay = (val) => {
        if (formatValue === 'rupiah') return `Rp ${formatRupiah(val)}`;
        if (formatValue === 'qty') return `${formatRupiah(val)} pcs`;
        return val;
    };

    return (
        <Box>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                mb: 2, pb: 1.5, borderBottom: '2px solid #f1f5f9'
            }}>
                <Avatar sx={{
                    bgcolor: color, width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 },
                    boxShadow: `0 4px 12px ${color}30`
                }}>{icon}</Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{
                    color: '#1e293b', fontSize: { xs: '0.95rem', md: '1.05rem' }, flex: 1
                }}>{title}</Typography>
            </Box>
            <Stack spacing={isMobile ? 1.5 : 2}>
                {data.map((item, idx) => {
                    const percent = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0;
                    const isTop = idx === 0;
                    return (
                        <Box key={idx}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, mb: 0.75,
                                p: { xs: 1, md: 1.5 }, borderRadius: 2,
                                bgcolor: isTop ? `${color}08` : 'transparent',
                                border: isTop ? `2px solid ${color}25` : '2px solid transparent',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    bgcolor: `${color}05`,
                                    transform: 'translateX(4px)'
                                }
                            }}>
                                <Typography sx={{
                                    fontSize: isMobile ? (idx < 3 ? '1.2rem' : '0.9rem') : (idx < 3 ? '1.5rem' : '1rem'),
                                    width: { xs: 28, md: 36 }, textAlign: 'center',
                                    fontWeight: idx < 3 ? 'bold' : 'normal',
                                    color: medalColors[idx]
                                }}>{medals[idx]}</Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={isTop ? 700 : 600} sx={{
                                        color: '#1e293b',
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: isMobile ? (isTop ? '0.9rem' : '0.8rem') : (isTop ? '1rem' : '0.9rem')
                                    }}>{item[labelKey]}</Typography>
                                    {isTop && (
                                        <Chip
                                            label="Top"
                                            size="small"
                                            sx={{
                                                mt: 0.5, height: 16,
                                                bgcolor: color, color: 'white',
                                                fontWeight: 'bold', fontSize: '0.55rem'
                                            }}
                                        />
                                    )}
                                </Box>
                                <Typography variant="body2" fontWeight="bold" sx={{
                                    color: color,
                                    fontFamily: "'Inter', monospace",
                                    fontSize: isMobile ? (isTop ? '0.85rem' : '0.75rem') : (isTop ? '1rem' : '0.9rem'),
                                    whiteSpace: 'nowrap',
                                    ml: 0.5
                                }}>
                                    {formatDisplay(item[valueKey])}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={percent}
                                sx={{
                                    height: { xs: 6, md: 8 }, borderRadius: 4,
                                    bgcolor: '#f1f5f9',
                                    '& .MuiLinearProgress-bar': {
                                        background: isTop
                                            ? `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`
                                            : `linear-gradient(90deg, ${color}99 0%, ${color}66 100%)`,
                                        borderRadius: 4,
                                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }
                                }}
                            />
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function AnalyticsView() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [filterNama, setFilterNama] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [rawData, setRawData] = useState([]);
    const [namaList, setNamaList] = useState([]);
    const [isFiltered, setIsFiltered] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadNama = async () => {
            const nama = await getNamaList();
            setNamaList(nama);
        };
        loadNama();
    }, []);

    const handleLoadAnalytics = async () => {
        if (!startDate || !endDate) {
            setSnackbar({ open: true, message: 'Pilih tanggal mulai dan akhir terlebih dahulu', severity: 'warning' });
            return;
        }
        setLoading(true);
        try {
            const data = await getSelloutDataByDateRange(startDate, endDate);
            const filteredData = filterNama ? data.filter(d => d.nama === filterNama) : data;
            setRawData(filteredData);
            const stats = calculateAnalytics(filteredData);
            setAnalytics(stats);
            setIsFiltered(true);
            if (filteredData.length === 0) {
                setSnackbar({ open: true, message: 'Tidak ada data untuk periode ini', severity: 'info' });
            }
        } catch (err) {
            console.error('Error:', err);
            setSnackbar({ open: true, message: 'Gagal memuat data: ' + err.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStartDate(null);
        setEndDate(null);
        setFilterNama('');
        setAnalytics(null);
        setRawData([]);
        setIsFiltered(false);
    };

    const handleCopySummary = async () => {
        if (!analytics) return;
        const period = `${formatDateIndo(formatDateLocal(startDate))} - ${formatDateIndo(formatDateLocal(endDate))}`;
        let text = `*?? Ringkasan Analitik Penjualan*\n`;
        text += `Periode: ${period}\n`;
        if (filterNama) text += `SPG: ${filterNama}\n`;
        text += `\n*?? Total Revenue:* Rp ${formatRupiah(analytics.totalRevenue)}\n`;
        text += `*?? Total Transaksi:* ${analytics.totalTransactions}\n`;
        text += `*?? Rata-rata/Transaksi:* Rp ${formatRupiah(Math.round(analytics.averagePerTransaction))}\n`;
        text += `*?? SPG Aktif:* ${analytics.activeSPG}\n`;
        text += `*?? Toko Unik:* ${analytics.uniqueToko}\n`;
        if (analytics.topSPG.length > 0) {
            text += `\n*?? Top 3 SPG:*\n`;
            analytics.topSPG.slice(0, 3).forEach((spg, i) => {
                text += `${i + 1}. ${spg.nama} - Rp ${formatRupiah(spg.total)}\n`;
            });
        }
        try {
            await navigator.clipboard.writeText(text);
            setSnackbar({ open: true, message: '? Ringkasan berhasil disalin!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: '? Gagal menyalin', severity: 'error' });
        }
    };

    const chartData = analytics?.dailySales.slice(-14).map(d => ({
        label: formatDateIndo(d.tanggal),
        shortLabel: formatDateShort(d.tanggal),
        value: d.total
    })) || [];

    if (loading) {
        return (
            <Box sx={{
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                minHeight: '60vh', gap: 2
            }}>
                <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#1e40af' }} />
                <Typography variant="body1" color="#64748b" fontWeight={600}>
                    Menganalisis data...
                </Typography>
                <Typography variant="caption" color="#94a3b8">
                    Menghitung statistik & ranking
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: { xs: 10, md: 8 } }}>
            {/* ===== HEADER GRADIENT ===== */}
            <Paper elevation={0} sx={{
    p: isMobile ? 2 : { xs: 2.5, md: 4 },
    mb: isMobile ? 2 : 3,
    borderRadius: isMobile ? 2 : 4,
    // ? SOFT SKY: Gradient biru langit yang segar & bersih
    background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
    color: '#ffffff',
    // ? SHADOW BIRU LEMBUT
    boxShadow: '0 12px 40px rgba(14, 165, 233, 0.25)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""', position: 'absolute',
        top: -100, right: -100,
        width: isMobile ? 200 : 300, height: isMobile ? 200 : 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
    }
}}>
    {/* ... (Kode Title Row di dalam Paper ini bisa Anda samakan dengan Opsi 1 di atas) ... */}
    {/* ... (Sisa kode Filter Section di bawahnya tetap sama) ... */}

                {/* Filter Section - Grid Layout */}
                <Box sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: 2, md: 3 },
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr auto' },
                    gap: { xs: 1.5, md: 2 },
                    alignItems: 'end',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <Box>
                        <Typography variant="caption" sx={{
                            display: 'block', mb: 0.5, opacity: 0.9,
                            fontWeight: 600, fontSize: '0.65rem',
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>Nama SPG</Typography>
                        <Select
                            fullWidth displayEmpty
                            value={filterNama}
                            onChange={(e) => setFilterNama(e.target.value)}
                            startAdornment={<PersonIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, fontSize: 18 }} />}
                            sx={{
                                bgcolor: 'white', borderRadius: 2, fontSize: { xs: '0.85rem', md: '0.95rem' },
                                '& .MuiSelect-select': { py: 1.2, px: 1.5 },
                                '& fieldset': { borderColor: 'transparent' }
                            }}
                        >
                            <MenuItem value="" sx={{ fontSize: '0.9rem' }}><em>Semua Nama SPG</em></MenuItem>
                            {namaList.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '0.9rem' }}>{n}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{
                            display: 'block', mb: 0.5, opacity: 0.9,
                            fontWeight: 600, fontSize: '0.65rem',
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>Tanggal Mulai</Typography>
                        <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white', borderRadius: 2,
                                            '& fieldset': { borderColor: 'transparent' },
                                            fontSize: { xs: '0.85rem', md: '0.95rem' }
                                        }
                                    }
                                }
                            }}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{
                            display: 'block', mb: 0.5, opacity: 0.9,
                            fontWeight: 600, fontSize: '0.65rem',
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>Tanggal Akhir</Typography>
                        <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white', borderRadius: 2,
                                            '& fieldset': { borderColor: 'transparent' },
                                            fontSize: { xs: '0.85rem', md: '0.95rem' }
                                        }
                                    }
                                }
                            }}
                        />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={handleLoadAnalytics}
                            startIcon={<ApplyIcon />}
                            sx={{
                                bgcolor: 'white', color: '#1e40af',
                                borderRadius: 2, fontWeight: 'bold',
                                textTransform: 'none',
                                px: { xs: 2, md: 3 },
                                py: 1.2,
                                fontSize: { xs: '0.85rem', md: '0.95rem' },
                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#f1f5f9', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }
                            }}
                        >
                            Terapkan
                        </Button>
                        <Tooltip title="Reset Filter">
                            <IconButton
                                onClick={handleReset}
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    color: 'white',
                                    borderRadius: 2,
                                    width: { xs: 36, md: 40 },
                                    height: { xs: 36, md: 40 },
                                    border: '1px solid',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' }
                                }}
                            >
                                <ClearIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
            </Paper>

            {/* ===== EMPTY STATE ===== */}
            {!isFiltered && !loading && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, md: 8 },
                        textAlign: 'center',
                        borderRadius: { xs: 2, md: 4 },
                        border: '2px dashed #cbd5e1',
                        bgcolor: '#f8fafc'
                    }}
                >
                    <Box sx={{
                        width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 }, mx: 'auto', mb: 2,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(30, 64, 175, 0.1)'
                    }}>
                        <RocketIcon sx={{ fontSize: { xs: 40, md: 52 }, color: '#1e40af' }} />
                    </Box>
                    <Typography variant="h6" color="#1e293b" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Siap Menganalisis Data
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3, maxWidth: 400, mx: 'auto', lineHeight: 1.6, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                        Pilih rentang tanggal di atas, lalu klik <strong style={{ color: '#1e40af' }}>"Terapkan"</strong> untuk melihat insight penjualan.
                    </Typography>
                </Paper>
            )}

            {/* ===== HASIL ANALITIK ===== */}
            {!loading && analytics && isFiltered && (
                <>
                    {/* Periode Info */}
                    <Box sx={{
                        mb: { xs: 2, md: 3 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        p: { xs: 1.5, md: 2 },
                        bgcolor: '#f8fafc',
                        borderRadius: { xs: 2, md: 3 },
                        border: '1px solid #e2e8f0'
                    }}>
                        <FilterIcon sx={{ color: '#64748b', fontSize: { xs: 18, md: 20 } }} />
                        <Chip
                            icon={<CalendarIcon sx={{ fontSize: { xs: 14, md: 16 } }} />}
                            label={`Periode: ${formatDateIndo(formatDateLocal(startDate))} - ${formatDateIndo(formatDateLocal(endDate))}`}
                            sx={{
                                bgcolor: '#eff6ff', color: '#1e40af',
                                fontWeight: 600, fontSize: { xs: '0.7rem', md: '0.85rem' },
                                height: { xs: 28, md: 32 }
                            }}
                        />
                        {filterNama && (
                            <Chip
                                icon={<PersonIcon sx={{ fontSize: { xs: 14, md: 16 } }} />}
                                label={`SPG: ${filterNama}`}
                                sx={{
                                    bgcolor: '#f5f3ff', color: '#7c3aed',
                                    fontWeight: 600, fontSize: { xs: '0.7rem', md: '0.85rem' },
                                    height: { xs: 28, md: 32 }
                                }}
                            />
                        )}
                        <Chip
                            label={`${rawData.length} Transaksi`}
                            sx={{
                                bgcolor: '#f0fdf4', color: '#059669',
                                fontWeight: 600, fontSize: { xs: '0.7rem', md: '0.85rem' },
                                height: { xs: 28, md: 32 }
                            }}
                        />
                        {analytics.dailySales.length > 0 && (
                            <Chip
                                icon={<ShowChartIcon sx={{ fontSize: { xs: 14, md: 16 } }} />}
                                label={`${analytics.dailySales.length} Hari Aktif`}
                                sx={{
                                    bgcolor: '#fff7ed', color: '#ea580c',
                                    fontWeight: 600, fontSize: { xs: '0.7rem', md: '0.85rem' },
                                    height: { xs: 28, md: 32 }
                                }}
                            />
                        )}
                    </Box>

                    {/* Stat Cards - Responsive Grid */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        gap: { xs: 1.5, md: 2.5 },
                        mb: { xs: 2.5, md: 4 }
                    }}>
                        <StatCard
                            icon={<TrendingUpIcon />}
                            label="Total Revenue"
                            value={`Rp ${formatRupiah(analytics.totalRevenue)}`}
                            color="blue"
                            subtext={`Dari ${analytics.totalTransactions} transaksi`}
                            highlight={true}
                        />
                        <StatCard
                            icon={<CartIcon />}
                            label="Rata-rata"
                            value={`Rp ${formatRupiah(Math.round(analytics.averagePerTransaction))}`}
                            color="green"
                            subtext="Per record penjualan"
                        />
                        <StatCard
                            icon={<GroupIcon />}
                            label="SPG Aktif"
                            value={analytics.activeSPG}
                            color="purple"
                            subtext={`dari ${namaList.length} total SPG`}
                        />
                        <StatCard
                            icon={<StoreIcon />}
                            label="Toko Unik"
                            value={analytics.uniqueToko}
                            color="orange"
                            subtext="Lokasi berbeda"
                        />
                    </Box>

                    {/* Chart & Top SPG - Responsive Layout */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                        gap: { xs: 2, md: 3 },
                        mb: { xs: 2.5, md: 4 }
                    }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, md: 3.5 },
                                borderRadius: { xs: 2, md: 4 },
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                background: 'white'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Avatar sx={{
                                    bgcolor: '#1e40af', width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 },
                                    boxShadow: '0 4px 12px rgba(30,64,175,0.3)'
                                }}>
                                    <ShowChartIcon sx={{ fontSize: { xs: 18, md: 22 } }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{
                                        color: '#1e293b', fontSize: { xs: '0.95rem', md: '1.1rem' },
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        Tren Penjualan Harian
                                    </Typography>
                                    <Typography variant="caption" color="#64748b" sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                                        {chartData.length} hari terakhir
                                    </Typography>
                                </Box>
                                {chartData.length > 0 && (
                                    <Chip
                                        icon={<TrendingUpIcon sx={{ fontSize: { xs: 12, md: 14 } }} />}
                                        label={`Peak: ${formatRupiahShort(Math.max(...chartData.map(d => d.value)))}`}
                                        size="small"
                                        sx={{
                                            bgcolor: '#f0fdf4', color: '#059669',
                                            fontWeight: 'bold', fontSize: { xs: '0.6rem', md: '0.7rem' }
                                        }}
                                    />
                                )}
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <BarChart data={chartData} maxHeight={isMobile ? 200 : 260} />
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, md: 3.5 },
                                borderRadius: { xs: 2, md: 4 },
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                background: 'white'
                            }}
                        >
                            <RankingList
                                title="Top 5 SPG"
                                icon={<MedalIcon />}
                                data={analytics.topSPG}
                                valueKey="total"
                                labelKey="nama"
                                color="#1e40af"
                            />
                        </Paper>
                    </Box>

                    {/* Top SKU & Top Toko */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: { xs: 2, md: 3 }
                    }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, md: 3.5 },
                                borderRadius: { xs: 2, md: 4 },
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                background: 'white'
                            }}
                        >
                            <RankingList
                                title="Top 5 SKU"
                                icon={<InventoryIcon />}
                                data={analytics.topSKU}
                                valueKey="revenue"
                                labelKey="sku"
                                color="#059669"
                            />
                        </Paper>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, md: 3.5 },
                                borderRadius: { xs: 2, md: 4 },
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                background: 'white'
                            }}
                        >
                            <RankingList
                                title="Top 5 Toko"
                                icon={<StoreIcon />}
                                data={analytics.topToko}
                                valueKey="total"
                                labelKey="toko"
                                color="#ea580c"
                            />
                        </Paper>
                    </Box>
                </>
            )}

            {/* No Data State */}
            {!loading && isFiltered && (!analytics || analytics.totalTransactions === 0) && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 6, md: 10 },
                        textAlign: 'center',
                        borderRadius: { xs: 2, md: 4 },
                        border: '2px dashed #e2e8f0',
                        bgcolor: '#f8fafc'
                    }}
                >
                    <Box sx={{
                        width: { xs: 70, md: 90 }, height: { xs: 70, md: 90 }, mx: 'auto', mb: 2,
                        borderRadius: '50%',
                        bgcolor: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <TrendingDownIcon sx={{ fontSize: { xs: 36, md: 48 }, color: '#cbd5e1' }} />
                    </Box>
                    <Typography variant="h6" color="#64748b" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Tidak ada data ditemukan
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" sx={{ maxWidth: 300, mx: 'auto', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                        Coba ubah rentang tanggal atau filter nama SPG
                    </Typography>
                </Paper>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: { xs: 2, md: 3 },
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', md: '0.9rem' }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}