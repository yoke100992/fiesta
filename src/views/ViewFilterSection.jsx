import { Box, Paper, Typography, Stack, Avatar, Divider, Chip, TextField, Button, Tooltip, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Switch, Autocomplete, Checkbox, ListItemText } from '@mui/material';
import { FilterList as FilterIcon, Person as PersonIcon, Clear as ClearIcon, PlayArrow as ApplyIcon, Download as DownloadIcon, PhotoLibrary as PhotoIcon, TableChart as TableIcon, ViewList as ViewListIcon, Check as CheckIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function ViewFilterSection({
    filterNama, setFilterNama, startDate, setStartDate, endDate, setEndDate,
    namaList, reportFormat, setReportFormat, includePhotos, setIncludePhotos,
    onApply, onReset, onDownload, isDownloading, pivotDataLength
}) {
    return (
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
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, fontWeight: 600 }}>
                            Nama SPG <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Bisa pilih beberapa)</span>
                        </Typography>
                        <Autocomplete
                            multiple options={namaList} value={filterNama} onChange={(e, newValue) => setFilterNama(newValue)}
                            limitTags={2} getOptionLabel={(option) => option || ''} isOptionEqualToValue={(option, value) => option === value} disableCloseOnSelect
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>
                                    <Checkbox icon={<PersonIcon sx={{ fontSize: 18 }} />} checkedIcon={<CheckIcon sx={{ fontSize: 18 }} />} checked={selected} sx={{ mr: 1 }} />
                                    <ListItemText primary={option} sx={{ '& .MuiTypography-root': { fontSize: '0.9rem' } }} />
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder={filterNama.length === 0 ? "Semua Nama SPG" : `${filterNama.length} SPG dipilih`}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'white', fontSize: '0.95rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                                {params.InputProps?.startAdornment} {/* ? PERBAIKAN ERROR DI SINI */}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => (
                                <Chip {...getTagProps({ index })} key={option} label={option} size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600, fontSize: '0.75rem', height: 24, '& .MuiChip-deleteIcon': { fontSize: 14 } }} />
                            ))}
                        />
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
                        <Button variant="contained" onClick={onApply} startIcon={<ApplyIcon />} sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', background: '#667eea', '&:hover': { background: '#3874BC' } }}>Terapkan</Button>
                        <Tooltip title="Reset Filter"><Button variant="outlined" onClick={onReset} sx={{ minWidth: 'auto', p: 1.5, borderRadius: 3, borderColor: '#cbd5e1', color: '#64748b', '&:hover': { borderColor: '#667eea', color: '#667eea' } }}><ClearIcon /></Button></Tooltip>
                    </Stack>
                </Stack>
            </Stack>

            {filterNama.length > 0 && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SPG Dipilih ({filterNama.length}):</Typography>
                    {filterNama.map(nama => (
                        <Chip key={nama} label={nama} size="small" onDelete={() => setFilterNama(prev => prev.filter(n => n !== nama))} sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 600, fontSize: '0.75rem', height: 24, '& .MuiChip-deleteIcon': { color: 'white', fontSize: 14 } }} />
                    ))}
                </Box>
            )}

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
                <Button variant="contained" onClick={onDownload} startIcon={<DownloadIcon />} disabled={pivotDataLength === 0} sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', background: '#3874BC', '&:disabled': { background: '#cbd5e1', color: '#94a3b8' } }}>
                    Download {reportFormat === 'pivot' ? 'Pivot' : 'Raw Data'} {includePhotos ? '(Dengan Foto)' : '(Tanpa Foto)'}
                </Button>
            </Box>
        </Paper>
    );
}