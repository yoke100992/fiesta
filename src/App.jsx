import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';
import { theme } from './theme';
import Layout from './components/Layout';
import InputView from './views/InputView';
import ViewView from './views/ViewView';
import EditView from './views/EditView';
import SettingsView from './views/SettingsView';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                <Router>
                    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Navigate to="/input" replace />} />
                                <Route path="/input" element={<InputView />} />
                                <Route path="/view" element={<ViewView />} />
                                <Route path="/edit" element={<EditView />} />
                                <Route path="/settings" element={<SettingsView />} />
                            </Routes>
                        </Layout>
                    </Box>
                </Router>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;