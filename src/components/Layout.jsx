import { useLocation, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, BottomNavigation, BottomNavigationAction, Paper, Container } from '@mui/material';
import InputIcon from '@mui/icons-material/Input';
import ViewListIcon from '@mui/icons-material/ViewList';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/input', label: 'Input', icon: <InputIcon /> },
        { path: '/view', label: 'View', icon: <ViewListIcon /> },
        { path: '/edit', label: 'Edit', icon: <EditIcon /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    const getCurrentTab = () => {
        const index = menuItems.findIndex(item => item.path === location.pathname);
        return index >= 0 ? index : 0;
    };

    return (
        <Box sx={{ pb: 7 }}>
            {/* Modern Header */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                    boxShadow: '0 2px 12px rgba(30, 64, 175, 0.1)',
                }}
            >
                <Toolbar sx={{ minHeight: '64px !important' }}>
                    <DashboardIcon sx={{ mr: 1.5, fontSize: 28 }} />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            letterSpacing: '0.5px',
                            color:'white'
                        }}
                    >
                        SPG Sales Report
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Content */}
            <Container maxWidth="md" sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
                {children}
            </Container>

            {/* Bottom Navigation */}
            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    borderRadius: '20px 20px 0 0',
                    boxShadow: '0 -2px 12px rgba(30, 64, 175, 0.08)'
                }}
                elevation={3}
            >
                <BottomNavigation
                    value={getCurrentTab()}
                    onChange={(event, newValue) => {
                        navigate(menuItems[newValue].path);
                    }}
                    showLabels
                    sx={{
                        '& .MuiBottomNavigationAction-root': {
                            py: 1.5,
                            minWidth: 'auto',
                            '&.Mui-selected': {
                                color: '#1e40af',
                            },
                        },
                        '& .MuiBottomNavigationAction-label': {
                            fontSize: '0.7rem !important',
                            '&.Mui-selected': {
                                fontSize: '0.75rem !important',
                                fontWeight: 600,
                            },
                        },
                    }}
                >
                    {menuItems.map((item) => (
                        <BottomNavigationAction
                            key={item.path}
                            label={item.label}
                            icon={item.icon}
                        />
                    ))}
                </BottomNavigation>
            </Paper>
        </Box>
    );
}