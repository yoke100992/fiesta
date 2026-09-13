import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#1e40af',      // Deep Blue
            light: '#3b82f6',
            dark: '#1e3a8a',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#0ea5e9',      // Sky Blue
            light: '#38bdf8',
            dark: '#0284c7',
            contrastText: '#ffffff',
        },
        success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
        },
        info: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '10px 20px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                },
                containedSecondary: {
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 8px rgba(30, 64, 175, 0.06)',
                },
            },
        },
    },
});