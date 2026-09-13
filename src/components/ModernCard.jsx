import { Card, CardContent, Box, Typography, Divider } from '@mui/material';

export default function ModernCard({ title, subtitle, children, icon, headerAction }) {
    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: '0 2px 12px rgba(30, 64, 175, 0.06)',
                border: '1px solid rgba(30, 64, 175, 0.06)',
                mb: 3,
                overflow: 'visible'
            }}
        >
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    {icon && (
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)'
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'text.primary' }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {headerAction && (
                        <Box>{headerAction}</Box>
                    )}
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Content */}
                {children}
            </CardContent>
        </Card>
    );
}