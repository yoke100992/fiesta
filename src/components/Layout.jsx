import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Container } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const tabValue = location.pathname === '/input' ? 0 : location.pathname === '/view' ? 1 : location.pathname === '/edit' ? 2 : 3;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="sticky" color="primary">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        FIESTA SELL OUT
                    </Typography>
                </Toolbar>
                <Tabs value={tabValue} onChange={(e, val) => {
                    const paths = ['/input', '/view', '/edit', '/settings'];
                    navigate(paths[val]);
                }} variant="fullWidth" textColor="inherit" indicatorColor="secondary">
                    <Tab label="Input" />
                    <Tab label="View/Download" />
                    <Tab label="Edit" />
                    <Tab label="Settings" />
                </Tabs>
            </AppBar>
            <Container maxWidth="sm" sx={{ mt: 3, mb: 5, flexGrow: 1 }}>
                {children}
            </Container>
        </Box>
    );
}