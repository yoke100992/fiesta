import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography, Stack, Avatar, Divider, Chip,
    CircularProgress, Button, Tooltip, LinearProgress,
    Snackbar, Alert, IconButton, useMediaQuery, useTheme,
    Autocomplete, TextField, Checkbox, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Collapse, Table, TableBody, TableCell,
    TableHead, TableRow, TableContainer
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
    ShoppingCart as CartIcon, Group as GroupIcon, Store as StoreIcon,
    EmojiEvents as TrophyIcon, Inventory as InventoryIcon,
    CalendarMonth as CalendarIcon, Clear as ClearIcon, PlayArrow as ApplyIcon,
    Person as PersonIcon, ContentCopy as CopyIcon, ShowChart as ShowChartIcon,
    FilterList as FilterIcon, RocketLaunch as RocketIcon,
    WorkspacePremium as MedalIcon, LocationOn as LocationIcon,
    Leaderboard as TeamIcon, Storefront as ChannelIcon,
    Search as SearchIcon, Close as CloseIcon, ArrowBack as BackIcon,
    ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
    Receipt as ReceiptIcon, TouchApp as ClickIcon, Star as StarIcon,
    ArrowForward as ArrowRightIcon, SentimentDissatisfied as InactiveIcon,
    CheckCircle as ActiveIcon, Numbers as NumbersIcon, Category as CategoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ref, get } from 'firebase/database';
import { db } from '../utils/firebase';
import { getSelloutData, getSelloutDataByDateRange } from '../utils/storage';

// ==========================================
// HELPERS
// ==========================================
const formatDateLocal = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        if (numA > 12) return new Date(`${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`);
        if (numB > 12) return new Date(`${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`);
        return new Date(`${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`);
    }
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
};

const isValidDate = (dateStr) => {
    if (dateStr === undefined || dateStr === null) return false;
    const str = String(dateStr).trim().toLowerCase();
    if (str === '' || str === 'undefined' || str === 'null' || str === 'nan' || str === 'false') return false;
    const parsed = parseAnyDate(str);
    return !(parsed.getTime() === 0 || isNaN(parsed.getTime()));
};

const formatRupiah = (number) => new Intl.NumberFormat('id-ID').format(Math.round(number || 0));

const formatRupiahShort = (number) => {
    const n = number || 0;
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}M`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}Jt`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return formatRupiah(n);
};

const formatDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const d = parseAnyDate(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    return parseAnyDate(dateStr).getDate();
};

const CHANNEL_OPTIONS = [
    { value: 'GT', label: 'GT (General Trade)', color: '#059669', bg: '#ecfdf5' },
    { value: 'MT', label: 'MT (Modern Trade)', color: '#7c3aed', bg: '#f5f3ff' }
];
const getChannelConfig = (channel) =>
    CHANNEL_OPTIONS.find(c => c.value === channel) || { value: channel || '-', label: channel || '-', color: '#64748b', bg: '#f1f5f9' };

// ✅ Baca master SPG langsung dari Firebase (support format lama & baru)
const loadNamaDetails = async () => {
    try {
        const snap = await get(ref(db, 'nama'));
        if (!snap.exists()) return [];
        const data = snap.val();
        const out = [];
        Object.entries(data).forEach(([id, v]) => {
            if (typeof v === 'string') {
                out.push({ id, nama: v, channel: '', area: '', teamleader: '' });
            } else if (v && typeof v === 'object') {
                out.push({
                    id,
                    nama: v.nama || '',
                    channel: v.channel || '',
                    area: v.area || '',
                    teamleader: v.teamleader || ''
                });
            }
        });
        return out.filter(x => x.nama).sort((a, b) => a.nama.localeCompare(b.nama));
    } catch (err) {
        console.error('Error load nama detail:', err);
        return [];
    }
};

// ==========================================
// STAT CARD (CLICKABLE)
// ==========================================
const StatCard = ({ icon, label, value, color, subtext, highlight, onClick }) => {
    const colorMap = {
        blue: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', iconBg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', text: '#1e40af', border: '#bfdbfe', glow: 'rgba(30, 64, 175, 0.15)' },
        green: { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', iconBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', text: '#059669', border: '#bbf7d0', glow: 'rgba(5, 150, 105, 0.15)' },
        purple: { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', iconBg: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', text: '#7c3aed', border: '#ddd6fe', glow: 'rgba(124, 58, 237, 0.15)' },
        orange: { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', iconBg: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)', text: '#ea580c', border: '#fed7aa', glow: 'rgba(234, 88, 12, 0.15)' },
        teal: { bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', iconBg: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', text: '#0d9488', border: '#99f6e4', glow: 'rgba(13, 148, 136, 0.15)' },
        pink: { bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', iconBg: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)', text: '#db2777', border: '#fbcfe8', glow: 'rgba(219, 39, 119, 0.15)' }
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
            sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: { xs: 2.5, md: 3 },
                background: c.bg,
                border: `2px solid ${c.border}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${c.glow}`,
                    borderColor: c.text
                } : {},
                '&:hover .detail-hint': { opacity: 1, transform: 'translateX(0)' }
            }}
        >
            {highlight && (
                <Chip
                    icon={<StarIcon sx={{ fontSize: '10px !important' }} />}
                    label="Best"
                    size="small"
                    sx={{ position: 'absolute', top: 10, right: 10, bgcolor: c.text, color: 'white', fontWeight: 'bold', fontSize: '0.6rem', height: 20 }}
                />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, md: 1.5 }, mb: { xs: 1.5, md: 2 } }}>
                <Avatar sx={{ background: c.iconBg, width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, boxShadow: `0 4px 12px ${c.glow}` }}>
                    {icon}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{
                        color: c.text, fontWeight: 700, fontSize: { xs: '0.65rem', md: '0.7rem' },
                        textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>{label}</Typography>
                </Box>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{
                color: '#1e293b', fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.6rem' },
                lineHeight: 1.2, mb: 0.5, wordBreak: 'break-word'
            }}>{value}</Typography>
            {subtext && (
                <Typography variant="caption" sx={{
                    color: '#64748b', fontSize: { xs: '0.68rem', md: '0.78rem' },
                    display: 'block', fontWeight: 500, mt: 0.5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{subtext}</Typography>
            )}
            {onClick && (
                <Box className="detail-hint" sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, mt: 1,
                    opacity: { xs: 1, md: 0 }, transform: { xs: 'none', md: 'translateX(-6px)' },
                    transition: 'all 0.25s ease'
                }}>
                    <ClickIcon sx={{ fontSize: 12, color: c.text }} />
                    <Typography variant="caption" sx={{ color: c.text, fontWeight: 700, fontSize: '0.62rem' }}>
                        Klik untuk detail
                    </Typography>
                    <ArrowRightIcon sx={{ fontSize: 12, color: c.text }} />
                </Box>
            )}
        </Paper>
    );
};

// ==========================================
// BAR CHART (CLICKABLE BARS)
// ==========================================
const BarChart = ({ data, maxHeight = 260, onBarClick }) => {
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
                <Box sx={{ width: { xs: 38, md: 50 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pb: 3, pt: 0.5 }}>
                    {[...yTicks].reverse().map((tick, idx) => (
                        <Typography key={idx} variant="caption" sx={{ fontSize: { xs: '0.5rem', md: '0.6rem' }, color: '#94a3b8', fontFamily: 'monospace', textAlign: 'right', lineHeight: 1 }}>
                            {formatRupiahShort(tick)}
                        </Typography>
                    ))}
                </Box>
                <Box sx={{ flex: 1, position: 'relative', borderLeft: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                    {[0.25, 0.5, 0.75, 1].map((p, idx) => (
                        <Box key={idx} sx={{ position: 'absolute', left: 0, right: 0, bottom: `${p * 100}%`, borderBottom: '1px dashed #e2e8f0', zIndex: 0 }} />
                    ))}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.3, md: 1 }, height: '100%', px: { xs: 0.5, md: 1 }, pb: 3, position: 'relative', zIndex: 1 }}>
                        {data.map((item, idx) => {
                            const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                            const isBest = idx === bestDayIdx;
                            return (
                                <Tooltip
                                    key={idx}
                                    arrow
                                    title={
                                        <Box sx={{ textAlign: 'center', p: 0.5 }}>
                                            <Typography variant="caption" fontWeight="bold" display="block">{item.label}</Typography>
                                            <Typography variant="caption" display="block">Rp {formatRupiah(item.value)}</Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.6rem' }}>Klik untuk detail hari ini</Typography>
                                        </Box>
                                    }
                                >
                                    <Box
                                        onClick={() => onBarClick && onBarClick(item.rawKey)}
                                        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
                                    >
                                        {heightPercent > 15 && (
                                            <Typography variant="caption" sx={{
                                                fontSize: { xs: '0.45rem', md: '0.65rem' },
                                                color: isBest ? '#059669' : '#475569',
                                                fontWeight: isBest ? 800 : 600, mb: 0.5,
                                                fontFamily: 'monospace', whiteSpace: 'nowrap'
                                            }}>
                                                {formatRupiahShort(item.value)}
                                            </Typography>
                                        )}
                                        <Box sx={{
                                            width: '100%', maxWidth: { xs: 24, md: 48 },
                                            height: `${heightPercent}%`, minHeight: 4,
                                            background: isBest
                                                ? 'linear-gradient(180deg, #059669 0%, #10b981 50%, #34d399 100%)'
                                                : 'linear-gradient(180deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                                            borderRadius: '6px 6px 0 0',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            boxShadow: isBest ? '0 -4px 12px rgba(5,150,105,0.4)' : '0 -2px 8px rgba(30,64,175,0.2)',
                                            '&:hover': { opacity: 0.85, transform: 'scaleY(1.03)' }
                                        }}>
                                            {isBest && (
                                                <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                                                    <TrophyIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                                </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1.5, md: 2.5 }, mt: { xs: 3, md: 4 }, pt: 2, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, background: 'linear-gradient(180deg, #1e40af 0%, #60a5fa 100%)' }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.65rem', md: '0.75rem' }, fontWeight: 600 }}>Penjualan</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, background: 'linear-gradient(180deg, #059669 0%, #34d399 100%)' }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.65rem', md: '0.75rem' }, fontWeight: 600 }}>Hari Terbaik</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ClickIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', md: '0.75rem' }, fontWeight: 600 }}>Bar bisa diklik</Typography>
                </Box>
            </Box>
        </Box>
    );
};

// ==========================================
// RANKING LIST (CLICKABLE ITEMS)
// ==========================================
const RankingList = ({ title, icon, data, valueKey, labelKey, color, formatValue = 'rupiah', onItemClick, onSeeAll }) => {
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
    const medals = ['1', '2', '3', '4', '5'];
    const medalColors = ['#f59e0b', '#94a3b8', '#fb923c', '#cbd5e1', '#cbd5e1'];
    const formatDisplay = (val) => {
        if (formatValue === 'rupiah') return `Rp ${formatRupiah(val)}`;
        if (formatValue === 'qty') return `${formatRupiah(val)} pcs`;
        return val;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: '2px solid #f1f5f9' }}>
                <Avatar sx={{ bgcolor: color, width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 }, boxShadow: `0 4px 12px ${color}30` }}>{icon}</Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', fontSize: { xs: '0.95rem', md: '1.05rem' }, flex: 1 }}>{title}</Typography>
                {onSeeAll && (
                    <Button size="small" onClick={onSeeAll} endIcon={<ArrowRightIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 700, color, borderRadius: 2, px: 1 }}>
                        Semua
                    </Button>
                )}
            </Box>
            <Stack spacing={isMobile ? 1.5 : 2}>
                {data.map((item, idx) => {
                    const percent = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0;
                    const isTop = idx === 0;
                    return (
                        <Box key={idx}>
                            <Box
                                onClick={() => onItemClick && onItemClick(item[labelKey])}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, mb: 0.75,
                                    p: { xs: 1, md: 1.5 }, borderRadius: 2,
                                    bgcolor: isTop ? `${color}08` : 'transparent',
                                    border: isTop ? `2px solid ${color}25` : '2px solid transparent',
                                    transition: 'all 0.25s ease', cursor: onItemClick ? 'pointer' : 'default',
                                    '&:hover': onItemClick ? { bgcolor: `${color}12`, transform: 'translateX(4px)', borderColor: `${color}45` } : {}
                                }}
                            >
                                <Avatar sx={{
                                    width: { xs: 24, md: 28 }, height: { xs: 24, md: 28 },
                                    bgcolor: idx < 3 ? medalColors[idx] : '#f1f5f9',
                                    color: idx < 3 ? 'white' : '#94a3b8',
                                    fontSize: { xs: '0.7rem', md: '0.8rem' }, fontWeight: 'bold'
                                }}>{medals[idx]}</Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={isTop ? 700 : 600} sx={{
                                        color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        fontSize: isMobile ? (isTop ? '0.85rem' : '0.78rem') : (isTop ? '0.95rem' : '0.88rem')
                                    }}>{item[labelKey]}</Typography>
                                    {isTop && <Chip label="Top" size="small" sx={{ mt: 0.3, height: 15, bgcolor: color, color: 'white', fontWeight: 'bold', fontSize: '0.55rem' }} />}
                                </Box>
                                <Typography variant="body2" fontWeight="bold" sx={{
                                    color, fontFamily: 'monospace',
                                    fontSize: isMobile ? (isTop ? '0.8rem' : '0.72rem') : (isTop ? '0.95rem' : '0.85rem'),
                                    whiteSpace: 'nowrap', ml: 0.5
                                }}>
                                    {formatDisplay(item[valueKey])}
                                </Typography>
                                {onItemClick && <ArrowRightIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />}
                            </Box>
                            <LinearProgress
                                variant="determinate" value={percent}
                                sx={{
                                    height: { xs: 6, md: 8 }, borderRadius: 4, bgcolor: '#f1f5f9',
                                    '& .MuiLinearProgress-bar': {
                                        background: isTop ? `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)` : `linear-gradient(90deg, ${color}99 0%, ${color}66 100%)`,
                                        borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
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
// BREAKDOWN SECTION (untuk isi Dialog)
// ==========================================
const BreakdownSection = ({ title, icon, color, entries, total, onSelect, defaultLimit = 8 }) => {
    const [q, setQ] = useState('');
    const [showAll, setShowAll] = useState(false);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return entries;
        return entries.filter(e => String(e.key).toLowerCase().includes(s));
    }, [entries, q]);

    if (!entries || entries.length === 0) return null;
    const max = Math.max(...filtered.map(e => e.revenue), 1);
    const visible = showAll ? filtered : filtered.slice(0, defaultLimit);
    const denom = total || Math.max(...entries.map(e => e.revenue), 1);

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Avatar sx={{ bgcolor: `${color}18`, color, width: 30, height: 30 }}>{icon}</Avatar>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b', flex: 1 }}>{title}</Typography>
                <Chip label={`${entries.length} item`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9', fontWeight: 700 }} />
            </Box>

            {entries.length > 6 && (
                <TextField
                    fullWidth size="small" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder={`Cari ${title.toLowerCase()}...`}
                    sx={{
                        mb: 1.5,
                        '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem', bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' } }
                    }}
                    InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 1, color: '#94a3b8' }} /> }}
                />
            )}

            <Stack spacing={0.75}>
                {visible.map((e, idx) => {
                    const pct = denom > 0 ? (e.revenue / denom) * 100 : 0;
                    return (
                        <Box
                            key={e.key}
                            onClick={() => onSelect && onSelect(e.key)}
                            sx={{
                                p: 1.25, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white',
                                cursor: onSelect ? 'pointer' : 'default', transition: 'all 0.2s ease',
                                '&:hover': onSelect ? { borderColor: color, bgcolor: `${color}08`, transform: 'translateX(3px)' } : {}
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, minWidth: 20 }}>#{idx + 1}</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0, color: '#1e293b', fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {e.key}
                                </Typography>
                                {typeof e.qty === 'number' && e.qty > 0 && (
                                    <Chip label={`${formatRupiah(e.qty)} pcs`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#f0fdf4', color: '#059669', fontWeight: 700 }} />
                                )}
                                <Typography variant="body2" fontWeight="bold" sx={{ color, fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                    Rp {formatRupiah(e.revenue)}
                                </Typography>
                                {onSelect && <ArrowRightIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress variant="determinate" value={max > 0 ? (e.revenue / max) * 100 : 0}
                                    sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 700, minWidth: 34, textAlign: 'right' }}>
                                    {pct.toFixed(1)}%
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Stack>

            {filtered.length > defaultLimit && (
                <Button fullWidth size="small" onClick={() => setShowAll(!showAll)}
                    endIcon={showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ mt: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color, borderRadius: 2 }}>
                    {showAll ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${filtered.length})`}
                </Button>
            )}
            {filtered.length === 0 && (
                <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block', textAlign: 'center', py: 2 }}>
                    Tidak ada hasil untuk "{q}"
                </Typography>
            )}
        </Box>
    );
};

// ==========================================
// TRANSACTION ROW (Expandable)
// ==========================================
const TrxRow = ({ rec, index, avgValue }) => {
    const [open, setOpen] = useState(false);
    const items = rec._items || rec.items || [];
    const diff = avgValue ? rec._total - avgValue : 0;

    return (
        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white', overflow: 'hidden' }}>
            <Box onClick={() => setOpen(!open)} sx={{
                p: 1.25, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flexWrap: 'wrap',
                '&:hover': { bgcolor: '#f8fafc' }
            }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, minWidth: 22 }}>#{index + 1}</Typography>
                <Avatar sx={{ bgcolor: '#eff6ff', color: '#1e40af', width: 28, height: 28, fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {(rec._nama || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem', color: '#1e293b' }}>{rec._nama}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={formatDateIndo(rec._tanggal)} size="small" sx={{ height: 17, fontSize: '0.6rem', bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }} />
                        <Chip icon={<StoreIcon sx={{ fontSize: '11px !important' }} />} label={rec._store} size="small" variant="outlined" sx={{ height: 17, fontSize: '0.6rem' }} />
                        <Chip label={`${items.length} SKU • ${formatRupiah(rec._qty)} pcs`} size="small" sx={{ height: 17, fontSize: '0.6rem', bgcolor: '#f1f5f9' }} />
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#059669', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        Rp {formatRupiah(rec._total)}
                    </Typography>
                    {avgValue > 0 && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700, color: diff >= 0 ? '#059669' : '#ef4444' }}>
                            {diff >= 0 ? '+' : ''}{formatRupiahShort(diff)} vs avg
                        </Typography>
                    )}
                </Box>
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                    {open ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Box>
            <Collapse in={open}>
                <Divider />
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75 }}>SKU</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75 }}>Harga</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75 }}>Qty</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75 }}>Subtotal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((it, i) => (
                                <TableRow key={i}>
                                    <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace', py: 0.5 }}>{it.sku}</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontFamily: 'monospace', py: 0.5 }}>{formatRupiah(it.harga)}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', py: 0.5 }}>{it.qty}</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: '#059669', py: 0.5 }}>
                                        {formatRupiah((it.harga || 0) * (it.qty || 0))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Collapse>
        </Box>
    );
};

const TransactionList = ({ records, avgValue = 0 }) => {
    const [q, setQ] = useState('');
    const [limit, setLimit] = useState(20);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return records;
        return records.filter(r =>
            String(r._nama).toLowerCase().includes(s) ||
            String(r._store).toLowerCase().includes(s) ||
            String(r._tanggal).includes(s) ||
            (r._items || []).some(it => String(it.sku).toLowerCase().includes(s))
        );
    }, [records, q]);

    if (!records || records.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                <ReceiptIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>Tidak ada transaksi</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <TextField
                fullWidth size="small" value={q}
                onChange={(e) => { setQ(e.target.value); setLimit(20); }}
                placeholder="Cari nama / toko / SKU / tanggal..."
                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem', bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' } } }}
                InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 1, color: '#94a3b8' }} /> }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>
                Menampilkan {Math.min(limit, filtered.length)} dari {filtered.length} transaksi
            </Typography>
            <Stack spacing={1}>
                {filtered.slice(0, limit).map((r, i) => (
                    <TrxRow key={r.id || i} rec={r} index={i} avgValue={avgValue} />
                ))}
            </Stack>
            {filtered.length > limit && (
                <Button fullWidth onClick={() => setLimit(limit + 30)} endIcon={<ExpandMoreIcon />}
                    sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderRadius: 2, color: '#1e40af' }}>
                    Muat Lebih Banyak ({filtered.length - limit} tersisa)
                </Button>
            )}
        </Box>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function AnalyticsView() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // FILTER STATE
    const [filterNama, setFilterNama] = useState([]);
    const [filterTeamleader, setFilterTeamleader] = useState([]);
    const [filterArea, setFilterArea] = useState([]);
    const [filterChannel, setFilterChannel] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState([]);
    const [namaDetailList, setNamaDetailList] = useState([]);
    const [isFiltered, setIsFiltered] = useState(false);
    const [chartRange, setChartRange] = useState('14');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // DETAIL DIALOG STATE
    const [detail, setDetail] = useState({ open: false, type: '', key: '', label: '', tab: 0 });
    const [detailHistory, setDetailHistory] = useState([]);

    useEffect(() => {
        loadNamaDetails().then(setNamaDetailList);
    }, []);

    const masterNames = useMemo(() => namaDetailList.map(n => n.nama), [namaDetailList]);
    const namaOptions = useMemo(() => {
        const set = new Set(masterNames);
        rawData.forEach(r => { if (r.nama) set.add(r.nama); });
        return Array.from(set).sort();
    }, [masterNames, rawData]);

    const uniqueTeamleaders = useMemo(() => {
        const s = new Set();
        namaDetailList.forEach(n => { if (n.teamleader && n.teamleader.trim()) s.add(n.teamleader.trim()); });
        return Array.from(s).sort();
    }, [namaDetailList]);

    const uniqueAreas = useMemo(() => {
        const s = new Set();
        namaDetailList.forEach(n => { if (n.area && n.area.trim()) s.add(n.area.trim()); });
        return Array.from(s).sort();
    }, [namaDetailList]);

    const infoMap = useMemo(() => {
        const m = {};
        namaDetailList.forEach(n => { m[n.nama] = n; });
        return m;
    }, [namaDetailList]);

    const isNamaAllowed = useCallback((nama) => {
        if (filterNama.length > 0 && !filterNama.includes(nama)) return false;
        const hasInfoFilter = filterTeamleader.length > 0 || filterArea.length > 0 || filterChannel.length > 0;
        if (!hasInfoFilter) return true;
        const info = infoMap[nama];
        if (!info) return false;
        if (filterTeamleader.length > 0 && !filterTeamleader.includes(info.teamleader || '')) return false;
        if (filterArea.length > 0 && !filterArea.includes(info.area || '')) return false;
        if (filterChannel.length > 0 && !filterChannel.includes(info.channel || '')) return false;
        return true;
    }, [filterNama, filterTeamleader, filterArea, filterChannel, infoMap]);

    const targetNamas = useMemo(() => {
        const base = filterNama.length > 0 ? filterNama : masterNames;
        return base.filter(n => isNamaAllowed(n));
    }, [filterNama, masterNames, isNamaAllowed]);

    const totalActiveFilters = filterNama.length + filterTeamleader.length + filterArea.length + filterChannel.length + (startDate ? 1 : 0) + (endDate ? 1 : 0);

    // ===== DEEP ANALYTICS =====
    const deep = useMemo(() => {
        const empty = () => ({ revenue: 0, qty: 0, trx: 0, records: [], bySPG: {}, byToko: {}, bySKU: {}, byDate: {}, _seen: new Set() });
        const spg = {}, toko = {}, sku = {}, date = {};
        const root = empty();
        const records = [];
        let totalRevenue = 0, totalQty = 0;

        rawData.forEach(rec => {
            const items = Array.isArray(rec.items) ? rec.items : [];
            const store = rec.namaToko || rec.toko || rec.outlet || 'Tidak Diketahui';
            const nama = rec.nama || '-';
            const tgl = rec.tanggal || '';
            let recTotal = 0, recQty = 0;
            items.forEach(it => { recTotal += (it.harga || 0) * (it.qty || 0); recQty += (it.qty || 0); });

            const r = { ...rec, _store: store, _nama: nama, _tanggal: tgl, _total: recTotal, _qty: recQty, _items: items };
            records.push(r);
            totalRevenue += recTotal; totalQty += recQty;

            const touch = (b) => {
                b.revenue += recTotal; b.qty += recQty; b.trx += 1; b.records.push(r);
                b.bySPG[nama] = (b.bySPG[nama] || 0) + recTotal;
                b.byToko[store] = (b.byToko[store] || 0) + recTotal;
                b.byDate[tgl] = (b.byDate[tgl] || 0) + recTotal;
            };

            const p = spg[nama] || (spg[nama] = empty()); touch(p);
            const t = toko[store] || (toko[store] = empty()); touch(t);
            const d = date[tgl] || (date[tgl] = empty()); touch(d);
            touch(root);

            items.forEach(it => {
                const val = (it.harga || 0) * (it.qty || 0);
                const q = it.qty || 0;
                const key = it.sku || '(Tanpa SKU)';
                p.bySKU[key] = (p.bySKU[key] || 0) + val;
                t.bySKU[key] = (t.bySKU[key] || 0) + val;
                d.bySKU[key] = (d.bySKU[key] || 0) + val;
                root.bySKU[key] = (root.bySKU[key] || 0) + val;

                const s = sku[key] || (sku[key] = empty());
                s.revenue += val; s.qty += q;
                s.bySPG[nama] = (s.bySPG[nama] || 0) + val;
                s.byToko[store] = (s.byToko[store] || 0) + val;
                s.byDate[tgl] = (s.byDate[tgl] || 0) + val;
                const rid = rec.id || `${tgl}|${nama}|${store}`;
                if (!s._seen.has(rid)) { s._seen.add(rid); s.trx += 1; s.records.push(r); }
            });
        });

        const toList = (obj) => Object.entries(obj).map(([key, v]) => ({ key, ...v })).sort((a, b) => b.revenue - a.revenue);
        const spgList = toList(spg), tokoList = toList(toko), skuList = toList(sku);
        const dateList = Object.entries(date).map(([key, v]) => ({ key, ...v })).sort((a, b) => parseAnyDate(a.key) - parseAnyDate(b.key));
        const avg = records.length ? totalRevenue / records.length : 0;

        return { spg, toko, sku, date, root, records, spgList, tokoList, skuList, dateList, totalRevenue, totalQty, avg };
    }, [rawData]);

    const activeNamas = useMemo(() => deep.spgList.map(s => s.key), [deep.spgList]);
    const inactiveNamas = useMemo(() => targetNamas.filter(n => !deep.spg[n]), [targetNamas, deep.spg]);

    const topSPG = useMemo(() => deep.spgList.slice(0, 5).map(s => ({ nama: s.key, total: s.revenue })), [deep.spgList]);
    const topSKU = useMemo(() => deep.skuList.slice(0, 5).map(s => ({ sku: s.key, revenue: s.revenue, qty: s.qty })), [deep.skuList]);
    const topToko = useMemo(() => deep.tokoList.slice(0, 5).map(s => ({ toko: s.key, total: s.revenue })), [deep.tokoList]);

    const chartData = useMemo(() => {
        const src = chartRange === '14' ? deep.dateList.slice(-14) : deep.dateList;
        return src.map(d => ({
            label: formatDateIndo(d.key),
            shortLabel: formatDateShort(d.key),
            value: d.revenue,
            rawKey: d.key
        }));
    }, [deep.dateList, chartRange]);

    // ===== HANDLERS =====
    const handleLoadAnalytics = async () => {
        setLoading(true);
        try {
            let data = [];
            if (startDate && endDate) {
                data = await getSelloutDataByDateRange(startDate, endDate);
            } else if (startDate) {
                data = await getSelloutDataByDateRange(startDate, new Date());
            } else if (endDate) {
                const all = await getSelloutData();
                const endTs = new Date(endDate).setHours(23, 59, 59, 999);
                data = all.filter(d => isValidDate(d.tanggal) && parseAnyDate(d.tanggal).getTime() <= endTs);
            } else {
                data = await getSelloutData();
            }

            const startTs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
            const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

            const filtered = data.filter(d => {
                if (!isValidDate(d.tanggal)) return false;
                const ts = parseAnyDate(d.tanggal).getTime();
                if (ts === 0 || isNaN(ts)) return false;
                return ts >= startTs && ts <= endTs && isNamaAllowed(d.nama);
            });

            setRawData(filtered);
            setIsFiltered(true);
            setDetail({ open: false, type: '', key: '', label: '', tab: 0 });
            setDetailHistory([]);

            if (filtered.length === 0) {
                setSnackbar({ open: true, message: 'Tidak ada data untuk filter ini', severity: 'info' });
            } else {
                setSnackbar({ open: true, message: `${filtered.length} transaksi berhasil dimuat`, severity: 'success' });
            }
        } catch (err) {
            console.error('Error:', err);
            setSnackbar({ open: true, message: 'Gagal memuat data: ' + err.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStartDate(null); setEndDate(null);
        setFilterNama([]); setFilterTeamleader([]); setFilterArea([]); setFilterChannel([]);
        setRawData([]); setIsFiltered(false);
        setDetail({ open: false, type: '', key: '', label: '', tab: 0 });
        setDetailHistory([]);
    };

    const openDetail = (type, key = '', label = '') => {
        if (detail.open) {
            setDetailHistory(h => [...h, { type: detail.type, key: detail.key, label: detail.label }]);
        }
        setDetail({ open: true, type, key, label: label || key, tab: 0 });
    };
    const backDetail = () => {
        if (detailHistory.length === 0) return;
        const prev = detailHistory[detailHistory.length - 1];
        setDetailHistory(detailHistory.slice(0, -1));
        setDetail({ open: true, ...prev, tab: 0 });
    };
    const closeDetail = () => {
        setDetail({ open: false, type: '', key: '', label: '', tab: 0 });
        setDetailHistory([]);
    };

    const periodLabel = startDate || endDate
        ? `${startDate ? formatDateIndo(formatDateLocal(startDate)) : 'Awal'} - ${endDate ? formatDateIndo(formatDateLocal(endDate)) : 'Sekarang'}`
        : 'Semua Periode';

    const handleCopySummary = async () => {
        if (!isFiltered) return;
        let text = `*RINGKASAN ANALITIK PENJUALAN*\n`;
        text += `Periode: ${periodLabel}\n`;
        if (filterNama.length) text += `SPG: ${filterNama.join(', ')}\n`;
        if (filterTeamleader.length) text += `Teamleader: ${filterTeamleader.join(', ')}\n`;
        if (filterArea.length) text += `Area: ${filterArea.join(', ')}\n`;
        if (filterChannel.length) text += `Channel: ${filterChannel.join(', ')}\n`;
        text += `\nTotal Revenue : Rp ${formatRupiah(deep.totalRevenue)}\n`;
        text += `Total Qty : ${formatRupiah(deep.totalQty)} pcs\n`;
        text += `Total Transaksi : ${deep.records.length}\n`;
        text += `Rata-rata/Transaksi : Rp ${formatRupiah(deep.avg)}\n`;
        text += `SPG Aktif : ${activeNamas.length}/${targetNamas.length}\n`;
        text += `Toko Unik : ${deep.tokoList.length}\n`;
        text += `SKU Terjual : ${deep.skuList.length}\n`;
        if (topSPG.length) {
            text += `\n*Top 5 SPG:*\n`;
            topSPG.forEach((s, i) => { text += `${i + 1}. ${s.nama} - Rp ${formatRupiah(s.total)}\n`; });
        }
        if (inactiveNamas.length) {
            text += `\n*SPG Tidak Aktif (${inactiveNamas.length}):*\n`;
            inactiveNamas.forEach((n, i) => { text += `${i + 1}. ${n}\n`; });
        }
        try {
            await navigator.clipboard.writeText(text);
            setSnackbar({ open: true, message: 'Ringkasan berhasil disalin!', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: 'Gagal menyalin', severity: 'error' });
        }
    };

    // ===== DETAIL DIALOG CONTENT =====
    const dialogTabs = useMemo(() => {
        if (detail.type === 'spg-list') return ['SPG Aktif', 'Tidak Aktif'];
        if (detail.type === 'toko-list') return ['Ranking Toko', 'Transaksi'];
        if (detail.type === 'sku-list') return ['Ranking SKU', 'Transaksi'];
        if (detail.type === 'avg') return ['Per Transaksi', 'Breakdown'];
        return ['Breakdown', 'Transaksi'];
    }, [detail.type]);

    const bucket = useMemo(() => {
        if (!detail.open) return null;
        switch (detail.type) {
            case 'spg': return deep.spg[detail.key];
            case 'toko': return deep.toko[detail.key];
            case 'sku': return deep.sku[detail.key];
            case 'date': return deep.date[detail.key];
            case 'all': case 'avg': case 'spg-list': case 'toko-list': case 'sku-list': return deep.root;
            default: return null;
        }
    }, [detail, deep]);

    const dialogMeta = useMemo(() => {
        const map = {
            'all': { title: 'Detail Total Revenue', icon: <TrendingUpIcon />, color: '#1e40af' },
            'avg': { title: 'Detail Rata-rata Transaksi', icon: <CartIcon />, color: '#059669' },
            'spg-list': { title: 'Detail SPG', icon: <GroupIcon />, color: '#7c3aed' },
            'toko-list': { title: 'Detail Toko', icon: <StoreIcon />, color: '#ea580c' },
            'sku-list': { title: 'Detail SKU', icon: <InventoryIcon />, color: '#0d9488' },
            'qty': { title: 'Detail Quantity', icon: <NumbersIcon />, color: '#db2777' },
            'spg': { title: detail.key, icon: <PersonIcon />, color: '#1e40af' },
            'toko': { title: detail.key, icon: <StoreIcon />, color: '#ea580c' },
            'sku': { title: detail.key, icon: <InventoryIcon />, color: '#0d9488' },
            'date': { title: formatDateIndo(detail.key), icon: <CalendarIcon />, color: '#7c3aed' }
        };
        return map[detail.type] || { title: 'Detail', icon: <ReceiptIcon />, color: '#1e40af' };
    }, [detail.type, detail.key]);

    const toEntries = (obj) => Object.entries(obj || {})
        .map(([key, revenue]) => ({ key, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

    const handleCopyDetail = async () => {
        if (!bucket) return;
        let text = `*${dialogMeta.title}*\nPeriode: ${periodLabel}\n\n`;
        text += `Revenue : Rp ${formatRupiah(bucket.revenue)}\n`;
        text += `Qty : ${formatRupiah(bucket.qty)} pcs\n`;
        text += `Transaksi : ${bucket.trx}\n`;
        const lists = [
            ['Per SPG', toEntries(bucket.bySPG)],
            ['Per Toko', toEntries(bucket.byToko)],
            ['Per SKU', toEntries(bucket.bySKU)]
        ];
        lists.forEach(([label, arr]) => {
            if (arr.length && detail.type !== 'all') {
                text += `\n*${label}:*\n`;
                arr.slice(0, 10).forEach((e, i) => { text += `${i + 1}. ${e.key} - Rp ${formatRupiah(e.revenue)}\n`; });
            }
        });
        try {
            await navigator.clipboard.writeText(text);
            setSnackbar({ open: true, message: 'Detail berhasil disalin!', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: 'Gagal menyalin', severity: 'error' });
        }
    };

    const renderDetailContent = () => {
        if (!bucket) {
            return <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>Data tidak ditemukan</Typography>;
        }
        const tab = detail.tab;

        if (detail.type === 'spg-list') {
            if (tab === 0) {
                return (
                    <BreakdownSection
                        title="Ranking SPG Aktif" icon={<GroupIcon sx={{ fontSize: 16 }} />} color="#7c3aed"
                        entries={deep.spgList.map(s => ({ key: s.key, revenue: s.revenue, qty: s.qty }))}
                        total={deep.totalRevenue} defaultLimit={15}
                        onSelect={(k) => openDetail('spg', k, k)}
                    />
                );
            }
            return (
                <Box>
                    {inactiveNamas.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 5 }}>
                            <ActiveIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#065f46' }}>Semua SPG Aktif!</Typography>
                            <Typography variant="body2" color="text.secondary">Semua {targetNamas.length} SPG dalam filter ini memiliki transaksi</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InactiveIcon sx={{ color: '#f59e0b' }} />
                                <Typography variant="body2" fontWeight={700} sx={{ color: '#92400e' }}>
                                    {inactiveNamas.length} SPG belum ada transaksi dari {targetNamas.length} SPG
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
                                {inactiveNamas.map((n, i) => {
                                    const info = infoMap[n] || {};
                                    const ch = getChannelConfig(info.channel);
                                    return (
                                        <Box key={n} sx={{ p: 1.25, borderRadius: 2, border: '1px solid #fde68a', bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ bgcolor: '#fef3c7', color: '#92400e', width: 30, height: 30, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                {n.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</Typography>
                                                <Box sx={{ display: 'flex', gap: 0.4, mt: 0.3, flexWrap: 'wrap' }}>
                                                    {info.channel && <Chip label={info.channel} size="small" sx={{ height: 15, fontSize: '0.55rem', bgcolor: ch.bg, color: ch.color, fontWeight: 700 }} />}
                                                    {info.area && <Chip label={info.area} size="small" sx={{ height: 15, fontSize: '0.55rem', bgcolor: '#f1f5f9' }} />}
                                                    {info.teamleader && <Chip label={info.teamleader} size="small" sx={{ height: 15, fontSize: '0.55rem', bgcolor: '#e0e7ff', color: '#4338ca' }} />}
                                                </Box>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.6rem' }}>#{i + 1}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    )}
                </Box>
            );
        }

        if (detail.type === 'toko-list') {
            return tab === 0
                ? <BreakdownSection title="Ranking Semua Toko" icon={<StoreIcon sx={{ fontSize: 16 }} />} color="#ea580c" entries={deep.tokoList.map(s => ({ key: s.key, revenue: s.revenue, qty: s.qty }))} total={deep.totalRevenue} defaultLimit={15} onSelect={(k) => openDetail('toko', k, k)} />
                : <TransactionList records={deep.records} />;
        }

        if (detail.type === 'sku-list') {
            return tab === 0
                ? <BreakdownSection title="Ranking Semua SKU" icon={<InventoryIcon sx={{ fontSize: 16 }} />} color="#0d9488" entries={deep.skuList.map(s => ({ key: s.key, revenue: s.revenue, qty: s.qty }))} total={deep.totalRevenue} defaultLimit={15} onSelect={(k) => openDetail('sku', k, k)} />
                : <TransactionList records={deep.records} />;
        }

        if (detail.type === 'avg') {
            if (tab === 0) {
                const sorted = [...deep.records].sort((a, b) => b._total - a._total);
                return (
                    <Box>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 700 }}>
                                Rata-rata: Rp {formatRupiah(deep.avg)} / transaksi • Diurutkan dari nilai terbesar
                            </Typography>
                        </Box>
                        <TransactionList records={sorted} avgValue={deep.avg} />
                    </Box>
                );
            }
            return <BreakdownSection title="Kontribusi per SPG" icon={<GroupIcon sx={{ fontSize: 16 }} />} color="#059669" entries={toEntries(bucket.bySPG)} total={bucket.revenue} onSelect={(k) => openDetail('spg', k, k)} />;
        }

        // ENTITY / ALL
        if (tab === 0) {
            return (
                <Box>
                    {detail.type !== 'spg' && (
                        <BreakdownSection title="Per SPG" icon={<PersonIcon sx={{ fontSize: 16 }} />} color="#1e40af"
                            entries={toEntries(bucket.bySPG)} total={bucket.revenue} onSelect={(k) => openDetail('spg', k, k)} />
                    )}
                    {detail.type !== 'toko' && (
                        <BreakdownSection title="Per Toko" icon={<StoreIcon sx={{ fontSize: 16 }} />} color="#ea580c"
                            entries={toEntries(bucket.byToko)} total={bucket.revenue} onSelect={(k) => openDetail('toko', k, k)} />
                    )}
                    {detail.type !== 'sku' && (
                        <BreakdownSection title="Per SKU" icon={<InventoryIcon sx={{ fontSize: 16 }} />} color="#0d9488"
                            entries={toEntries(bucket.bySKU)} total={bucket.revenue} onSelect={(k) => openDetail('sku', k, k)} />
                    )}
                    {detail.type !== 'date' && (
                        <BreakdownSection title="Per Tanggal" icon={<CalendarIcon sx={{ fontSize: 16 }} />} color="#7c3aed"
                            entries={toEntries(bucket.byDate)} total={bucket.revenue} onSelect={(k) => openDetail('date', k, formatDateIndo(k))} />
                    )}
                </Box>
            );
        }
        return <TransactionList records={bucket.records} avgValue={detail.type === 'all' ? deep.avg : 0} />;
    };

    // ===== LOADING =====
    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
                <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#0ea5e9' }} />
                <Typography variant="body1" color="#64748b" fontWeight={600}>Menganalisis data...</Typography>
                <Typography variant="caption" color="#94a3b8">Menghitung statistik & ranking</Typography>
            </Box>
        );
    }

    const labelSx = { display: 'block', mb: 0.5, opacity: 0.95, fontWeight: 700, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const acSx = (color) => ({
        '& .MuiOutlinedInput-root': {
            bgcolor: 'white', borderRadius: 2, fontSize: '0.85rem',
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: color },
            '&.Mui-focused fieldset': { borderColor: color, borderWidth: 2 }
        }
    });

    return (
        <Box sx={{ pb: { xs: 10, md: 8 } }}>
            {/* ===== HEADER + FILTER ===== */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3.5 }, mb: { xs: 2, md: 3 }, borderRadius: { xs: 2, md: 4 },
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                color: '#ffffff', boxShadow: '0 12px 40px rgba(14, 165, 233, 0.25)',
                position: 'relative', overflow: 'hidden'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, backdropFilter: 'blur(8px)' }}>
                        <ShowChartIcon sx={{ fontSize: { xs: 20, md: 26 } }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', md: '1.5rem' }, lineHeight: 1.2 }}>
                            Analitik Penjualan
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: { xs: '0.68rem', md: '0.8rem' } }}>
                            Klik setiap card untuk melihat detail lengkap
                        </Typography>
                    </Box>
                    {totalActiveFilters > 0 && (
                        <Chip label={`${totalActiveFilters} filter aktif`} size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: '0.7rem', backdropFilter: 'blur(8px)' }} />
                    )}
                </Box>

                <Box sx={{
                    p: { xs: 1.5, md: 2 }, borderRadius: { xs: 2, md: 3 },
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1
                }}>
                    {/* ROW 1: Nama, TL, Area, Channel */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, md: 2 }, mb: { xs: 1.5, md: 2 } }}>
                        <Box>
                            <Typography variant="caption" sx={labelSx}>Nama SPG</Typography>
                            <Autocomplete
                                multiple options={namaOptions} value={filterNama}
                                onChange={(e, v) => setFilterNama(v)}
                                limitTags={1} disableCloseOnSelect size="small"
                                getOptionLabel={(o) => o || ''}
                                isOptionEqualToValue={(o, v) => o === v}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                        <Checkbox checked={selected} size="small" sx={{ mr: 1, py: 0 }} />
                                        <ListItemText primary={option} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder={filterNama.length === 0 ? 'Semua SPG' : `${filterNama.length} dipilih`} sx={acSx('#1e40af')}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (<><PersonIcon sx={{ fontSize: 17, mr: 0.5, color: '#64748b' }} />{params.InputProps?.startAdornment}</>)
                                        }} />
                                )}
                                renderTags={(v, getTagProps) => v.map((o, i) => (
                                    <Chip {...getTagProps({ index: i })} key={o} label={o} size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                                ))}
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={labelSx}>Teamleader</Typography>
                            <Autocomplete
                                multiple options={uniqueTeamleaders} value={filterTeamleader}
                                onChange={(e, v) => setFilterTeamleader(v)}
                                limitTags={1} disableCloseOnSelect size="small"
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                        <Checkbox checked={selected} size="small" sx={{ mr: 1, py: 0 }} />
                                        <ListItemText primary={option} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder={filterTeamleader.length === 0 ? 'Semua TL' : `${filterTeamleader.length} dipilih`} sx={acSx('#6366f1')}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (<><TeamIcon sx={{ fontSize: 17, mr: 0.5, color: '#64748b' }} />{params.InputProps?.startAdornment}</>)
                                        }} />
                                )}
                                renderTags={(v, getTagProps) => v.map((o, i) => (
                                    <Chip {...getTagProps({ index: i })} key={o} label={o} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                                ))}
                                noOptionsText="Belum ada data Teamleader"
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={labelSx}>Area</Typography>
                            <Autocomplete
                                multiple options={uniqueAreas} value={filterArea}
                                onChange={(e, v) => setFilterArea(v)}
                                limitTags={1} disableCloseOnSelect size="small"
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                        <Checkbox checked={selected} size="small" sx={{ mr: 1, py: 0 }} />
                                        <ListItemText primary={option} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder={filterArea.length === 0 ? 'Semua Area' : `${filterArea.length} dipilih`} sx={acSx('#c2410c')}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (<><LocationIcon sx={{ fontSize: 17, mr: 0.5, color: '#64748b' }} />{params.InputProps?.startAdornment}</>)
                                        }} />
                                )}
                                renderTags={(v, getTagProps) => v.map((o, i) => (
                                    <Chip {...getTagProps({ index: i })} key={o} label={o} size="small" sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                                ))}
                                noOptionsText="Belum ada data Area"
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={labelSx}>Channel</Typography>
                            <Autocomplete
                                multiple options={CHANNEL_OPTIONS.map(c => c.value)} value={filterChannel}
                                onChange={(e, v) => setFilterChannel(v)}
                                disableCloseOnSelect size="small"
                                getOptionLabel={(o) => getChannelConfig(o).label}
                                renderOption={(props, option, { selected }) => {
                                    const cfg = getChannelConfig(option);
                                    return (
                                        <li {...props}>
                                            <Checkbox checked={selected} size="small" sx={{ mr: 1, py: 0 }} />
                                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: cfg.color, mr: 1 }} />
                                            <ListItemText primary={cfg.label} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder={filterChannel.length === 0 ? 'Semua Channel' : `${filterChannel.length} dipilih`} sx={acSx('#059669')}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (<><ChannelIcon sx={{ fontSize: 17, mr: 0.5, color: '#64748b' }} />{params.InputProps?.startAdornment}</>)
                                        }} />
                                )}
                                renderTags={(v, getTagProps) => v.map((o, i) => {
                                    const cfg = getChannelConfig(o);
                                    return <Chip {...getTagProps({ index: i })} key={o} label={o} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }} />;
                                })}
                            />
                        </Box>
                    </Box>

                    {/* ROW 2: Tanggal + Aksi */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr auto' }, gap: { xs: 1.5, md: 2 }, alignItems: 'end' }}>
                        <Box>
                            <Typography variant="caption" sx={labelSx}>Tanggal Mulai</Typography>
                            <DatePicker value={startDate} onChange={setStartDate}
                                slotProps={{ textField: { fullWidth: true, size: 'small', sx: acSx('#0284c7') } }} />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={labelSx}>Tanggal Akhir</Typography>
                            <DatePicker value={endDate} onChange={setEndDate}
                                slotProps={{ textField: { fullWidth: true, size: 'small', sx: acSx('#0284c7') } }} />
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Button variant="contained" onClick={handleLoadAnalytics} startIcon={<ApplyIcon />}
                                sx={{
                                    bgcolor: 'white', color: '#0284c7', borderRadius: 2, fontWeight: 'bold',
                                    textTransform: 'none', px: { xs: 2, md: 3 }, py: 1.1, whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                }}>
                                Terapkan
                            </Button>
                            <Tooltip title="Reset Filter">
                                <IconButton onClick={handleReset}
                                    sx={{ color: 'white', borderRadius: 2, width: 40, height: 40, border: '1px solid rgba(255,255,255,0.5)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                                    <ClearIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Box>
                </Box>
            </Paper>

            {/* ===== EMPTY STATE ===== */}
            {!isFiltered && (
                <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: { xs: 2, md: 4 }, border: '2px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
                    <Box sx={{
                        width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 }, mx: 'auto', mb: 2, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(30,64,175,0.1)'
                    }}>
                        <RocketIcon sx={{ fontSize: { xs: 40, md: 52 }, color: '#0284c7' }} />
                    </Box>
                    <Typography variant="h6" color="#1e293b" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Siap Menganalisis Data
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ maxWidth: 430, mx: 'auto', lineHeight: 1.6, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                        Filter <strong>Teamleader / Area / Channel</strong> (kosong = semua), lalu klik <strong style={{ color: '#0284c7' }}>"Terapkan"</strong>.
                        Semua card bisa diklik untuk melihat detail.
                    </Typography>
                </Paper>
            )}

            {/* ===== HASIL ===== */}
            {isFiltered && deep.records.length > 0 && (
                <>
                    {/* Info Bar */}
                    <Box sx={{
                        mb: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
                        p: { xs: 1.5, md: 2 }, bgcolor: '#f8fafc', borderRadius: { xs: 2, md: 3 }, border: '1px solid #e2e8f0'
                    }}>
                        <FilterIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        <Chip icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />} label={periodLabel}
                            sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600, fontSize: '0.72rem', height: 28 }} />
                        {filterNama.map(n => (
                            <Chip key={n} label={n} size="small" onDelete={() => setFilterNama(p => p.filter(x => x !== n))}
                                sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 26, '& .MuiChip-deleteIcon': { color: 'white', fontSize: 14 } }} />
                        ))}
                        {filterTeamleader.map(n => (
                            <Chip key={n} label={`TL: ${n}`} size="small" onDelete={() => setFilterTeamleader(p => p.filter(x => x !== n))}
                                sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 26, '& .MuiChip-deleteIcon': { color: 'white', fontSize: 14 } }} />
                        ))}
                        {filterArea.map(n => (
                            <Chip key={n} label={`Area: ${n}`} size="small" onDelete={() => setFilterArea(p => p.filter(x => x !== n))}
                                sx={{ bgcolor: '#c2410c', color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 26, '& .MuiChip-deleteIcon': { color: 'white', fontSize: 14 } }} />
                        ))}
                        {filterChannel.map(n => {
                            const cfg = getChannelConfig(n);
                            return <Chip key={n} label={cfg.label} size="small" onDelete={() => setFilterChannel(p => p.filter(x => x !== n))}
                                sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', height: 26, border: `1px solid ${cfg.color}40` }} />;
                        })}
                        <Chip label={`${deep.records.length} Transaksi`} sx={{ bgcolor: '#f0fdf4', color: '#059669', fontWeight: 600, fontSize: '0.72rem', height: 28 }} />
                        <Chip label={`${deep.dateList.length} Hari Aktif`} sx={{ bgcolor: '#fff7ed', color: '#ea580c', fontWeight: 600, fontSize: '0.72rem', height: 28 }} />
                        <Button size="small" startIcon={<CopyIcon sx={{ fontSize: '15px !important' }} />} onClick={handleCopySummary}
                            sx={{ ml: 'auto', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: 2, color: '#0284c7' }}>
                            Copy Ringkasan
                        </Button>
                    </Box>

                    {/* STAT CARDS */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2.5 }, mb: { xs: 2.5, md: 4 } }}>
                        <StatCard icon={<TrendingUpIcon />} label="Total Revenue" value={`Rp ${formatRupiah(deep.totalRevenue)}`}
                            color="blue" subtext={`Dari ${deep.records.length} transaksi`} highlight onClick={() => openDetail('all', '', 'Detail Total Revenue')} />
                        <StatCard icon={<CartIcon />} label="Rata-rata" value={`Rp ${formatRupiah(deep.avg)}`}
                            color="green" subtext="Per record penjualan" onClick={() => openDetail('avg', '', 'Detail Rata-rata')} />
                        <StatCard icon={<GroupIcon />} label="SPG Aktif" value={activeNamas.length}
                            color="purple" subtext={`dari ${targetNamas.length} SPG • ${inactiveNamas.length} tidak aktif`} onClick={() => openDetail('spg-list', '', 'Detail SPG')} />
                        <StatCard icon={<StoreIcon />} label="Toko Unik" value={deep.tokoList.length}
                            color="orange" subtext="Lokasi berbeda" onClick={() => openDetail('toko-list', '', 'Detail Toko')} />
                        <StatCard icon={<NumbersIcon />} label="Total Qty" value={`${formatRupiah(deep.totalQty)} pcs`}
                            color="pink" subtext="Total unit terjual" onClick={() => openDetail('sku-list', '', 'Detail SKU')} />
                        <StatCard icon={<CategoryIcon />} label="SKU Terjual" value={deep.skuList.length}
                            color="teal" subtext="Varian produk aktif" onClick={() => openDetail('sku-list', '', 'Detail SKU')} />
                    </Box>

                    {/* CHART + TOP SPG */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: { xs: 2, md: 3 }, mb: { xs: 2.5, md: 4 } }}>
                        <Paper elevation={0} sx={{ p: { xs: 2, md: 3.5 }, borderRadius: { xs: 2, md: 4 }, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Avatar sx={{ bgcolor: '#0284c7', width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 } }}>
                                    <ShowChartIcon sx={{ fontSize: { xs: 18, md: 22 } }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
                                        Tren Penjualan Harian
                                    </Typography>
                                    <Typography variant="caption" color="#64748b" sx={{ fontSize: '0.7rem' }}>
                                        {chartData.length} hari • klik bar untuk detail
                                    </Typography>
                                </Box>
                                <Button size="small" onClick={() => setChartRange(chartRange === '14' ? 'all' : '14')}
                                    sx={{ textTransform: 'none', fontSize: '0.68rem', fontWeight: 700, borderRadius: 2, color: '#0284c7', bgcolor: '#f0f9ff' }}>
                                    {chartRange === '14' ? 'Semua Hari' : '14 Hari'}
                                </Button>
                                {chartData.length > 0 && (
                                    <Chip icon={<TrendingUpIcon sx={{ fontSize: '13px !important' }} />}
                                        label={`Peak: ${formatRupiahShort(Math.max(...chartData.map(d => d.value)))}`} size="small"
                                        sx={{ bgcolor: '#f0fdf4', color: '#059669', fontWeight: 'bold', fontSize: '0.65rem' }} />
                                )}
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <BarChart data={chartData} maxHeight={isMobile ? 200 : 260} onBarClick={(k) => openDetail('date', k, formatDateIndo(k))} />
                        </Paper>

                        <Paper elevation={0} sx={{ p: { xs: 2, md: 3.5 }, borderRadius: { xs: 2, md: 4 }, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: 'white' }}>
                            <RankingList title="Top 5 SPG" icon={<MedalIcon />} data={topSPG} valueKey="total" labelKey="nama" color="#1e40af"
                                onItemClick={(k) => openDetail('spg', k, k)} onSeeAll={() => openDetail('spg-list', '', 'Detail SPG')} />
                        </Paper>
                    </Box>

                    {/* TOP SKU + TOP TOKO */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                        <Paper elevation={0} sx={{ p: { xs: 2, md: 3.5 }, borderRadius: { xs: 2, md: 4 }, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: 'white' }}>
                            <RankingList title="Top 5 SKU" icon={<InventoryIcon />} data={topSKU} valueKey="revenue" labelKey="sku" color="#059669"
                                onItemClick={(k) => openDetail('sku', k, k)} onSeeAll={() => openDetail('sku-list', '', 'Detail SKU')} />
                        </Paper>
                        <Paper elevation={0} sx={{ p: { xs: 2, md: 3.5 }, borderRadius: { xs: 2, md: 4 }, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: 'white' }}>
                            <RankingList title="Top 5 Toko" icon={<StoreIcon />} data={topToko} valueKey="total" labelKey="toko" color="#ea580c"
                                onItemClick={(k) => openDetail('toko', k, k)} onSeeAll={() => openDetail('toko-list', '', 'Detail Toko')} />
                        </Paper>
                    </Box>
                </>
            )}

            {/* NO DATA */}
            {isFiltered && deep.records.length === 0 && (
                <Paper elevation={0} sx={{ p: { xs: 6, md: 10 }, textAlign: 'center', borderRadius: { xs: 2, md: 4 }, border: '2px dashed #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Box sx={{ width: { xs: 70, md: 90 }, height: { xs: 70, md: 90 }, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingDownIcon sx={{ fontSize: { xs: 36, md: 48 }, color: '#cbd5e1' }} />
                    </Box>
                    <Typography variant="h6" color="#64748b" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Tidak ada data ditemukan
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" sx={{ maxWidth: 320, mx: 'auto', fontSize: '0.85rem' }}>
                        Coba ubah rentang tanggal, Teamleader, Area, Channel, atau Nama SPG
                    </Typography>
                </Paper>
            )}

            {/* ===== DIALOG DETAIL ===== */}
            <Dialog
                open={detail.open}
                onClose={closeDetail}
                maxWidth="md"
                fullWidth
                scroll="paper"
                sx={{ '& .MuiDialog-paper': { borderRadius: { xs: 2, md: 3 }, m: { xs: 1, sm: 2 }, maxHeight: { xs: '94vh', md: '90vh' } } }}
            >
                <DialogTitle sx={{
                    pb: 1.5, background: `linear-gradient(135deg, ${dialogMeta.color}12 0%, ${dialogMeta.color}05 100%)`,
                    borderBottom: `1px solid ${dialogMeta.color}25`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        {detailHistory.length > 0 && (
                            <Tooltip title="Kembali">
                                <IconButton size="small" onClick={backDetail} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}>
                                    <BackIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Avatar sx={{ bgcolor: dialogMeta.color, width: 40, height: 40, boxShadow: `0 4px 12px ${dialogMeta.color}40` }}>
                            {dialogMeta.icon}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', md: '1.15rem' }, color: '#1e293b', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {dialogMeta.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                {periodLabel}{detailHistory.length > 0 ? ` • Level ${detailHistory.length + 1}` : ''}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={closeDetail} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Summary Chips */}
                    {bucket && (
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                            <Chip icon={<TrendingUpIcon sx={{ fontSize: '13px !important' }} />} label={`Rp ${formatRupiah(bucket.revenue)}`} size="small"
                                sx={{ bgcolor: '#f0fdf4', color: '#059669', fontWeight: 700, fontSize: '0.72rem', height: 26 }} />
                            <Chip label={`${formatRupiah(bucket.qty)} pcs`} size="small"
                                sx={{ bgcolor: '#fdf2f8', color: '#db2777', fontWeight: 700, fontSize: '0.72rem', height: 26 }} />
                            <Chip label={`${bucket.trx} transaksi`} size="small"
                                sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.72rem', height: 26 }} />
                            {detail.type !== 'all' && detail.type !== 'avg' && deep.totalRevenue > 0 && (
                                <Chip label={`${((bucket.revenue / deep.totalRevenue) * 100).toFixed(1)}% dari total`} size="small"
                                    sx={{ bgcolor: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: '0.72rem', height: 26 }} />
                            )}
                            {detail.type === 'spg' && infoMap[detail.key] && (
                                <>
                                    {infoMap[detail.key].channel && (
                                        <Chip label={getChannelConfig(infoMap[detail.key].channel).label} size="small"
                                            sx={{ bgcolor: getChannelConfig(infoMap[detail.key].channel).bg, color: getChannelConfig(infoMap[detail.key].channel).color, fontWeight: 700, fontSize: '0.7rem', height: 26 }} />
                                    )}
                                    {infoMap[detail.key].area && (
                                        <Chip icon={<LocationIcon sx={{ fontSize: '13px !important' }} />} label={infoMap[detail.key].area} size="small"
                                            sx={{ bgcolor: '#f1f5f9', fontWeight: 600, fontSize: '0.7rem', height: 26 }} />
                                    )}
                                    {infoMap[detail.key].teamleader && (
                                        <Chip icon={<TeamIcon sx={{ fontSize: '13px !important' }} />} label={infoMap[detail.key].teamleader} size="small"
                                            sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 600, fontSize: '0.7rem', height: 26 }} />
                                    )}
                                </>
                            )}
                        </Box>
                    )}
                </DialogTitle>

                <Tabs
                    value={Math.min(detail.tab, dialogTabs.length - 1)}
                    onChange={(e, v) => setDetail(prev => ({ ...prev, tab: v }))}
                    variant="fullWidth"
                    sx={{
                        borderBottom: '1px solid #e2e8f0', minHeight: 44, bgcolor: '#f8fafc',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', minHeight: 44 },
                        '& .Mui-selected': { color: dialogMeta.color },
                        '& .MuiTabs-indicator': { bgcolor: dialogMeta.color, height: 3 }
                    }}
                >
                    {dialogTabs.map((t, i) => {
                        let label = t;
                        if (detail.type === 'spg-list') label = i === 0 ? `SPG Aktif (${activeNamas.length})` : `Tidak Aktif (${inactiveNamas.length})`;
                        return <Tab key={i} label={label} />;
                    })}
                </Tabs>

                <DialogContent sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: '#fcfdff' }}>
                    {renderDetailContent()}
                </DialogContent>

                <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Button size="small" startIcon={<CopyIcon sx={{ fontSize: '16px !important' }} />} onClick={handleCopyDetail}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: dialogMeta.color }}>
                        Copy Detail
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    {detailHistory.length > 0 && (
                        <Button size="small" variant="outlined" startIcon={<BackIcon sx={{ fontSize: '16px !important' }} />} onClick={backDetail}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#cbd5e1', color: '#475569' }}>
                            Kembali
                        </Button>
                    )}
                    <Button size="small" variant="contained" onClick={closeDetail}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: dialogMeta.color, '&:hover': { bgcolor: dialogMeta.color, opacity: 0.9 } }}>
                        Tutup
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 600, fontSize: '0.85rem' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
