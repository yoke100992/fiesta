import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from './theme';
import Layout from './components/Layout';
import InputView from './views/InputView';
import ViewView from './views/ViewView';
import EditView from './views/EditView';
import SettingsView from './views/SettingsView';

// ? initDB dihapus karena sekarang pakai Firebase Firestore
// Data tidak perlu diinisialisasi lagi di browser

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/input" replace />} />
                            <Route path="/input" element={<InputView />} />
                            <Route path="/view" element={<ViewView />} />
                            <Route path="/edit" element={<EditView />} />
                            <Route path="/settings" element={<SettingsView />} />
                        </Routes>
                    </Layout>
                </Router>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;