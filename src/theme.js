import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: { main: '#E31E24', contrastText: '#fff' }, // Fiesta Red
        secondary: { main: '#B71C1C' },
        background: { default: '#F9F9F9', paper: '#FFFFFF' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h6: { fontWeight: 600 },
    },
    components: {
        MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 } } },
        MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    },
});