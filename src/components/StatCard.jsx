import { Card, CardContent, Box, Typography } from '@mui/material';

export default function StatCard({ title, value, icon, color = 'primary', trend }) {
    return (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(30, 64, 175, 0.08)',
                border: '1px solid rgba(30, 64, 175, 0.06)',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(30, 64, 175, 0.12)'
                }
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            background: color === 'primary'
                                ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                                : color === 'success'
                                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                : 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)'
                        }}
                    >
                        {icon}
                    </Box>
                    {trend && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: trend > 0 ? '#10b981' : '#ef4444',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                            }}
                        >
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </Typography>
                    )}
                </Box>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        color: 'text.primary',
                        mb: 0.5
                    }}
                >
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
}