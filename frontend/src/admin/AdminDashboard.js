import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Container,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Dashboard, Business, Category, Menu as MenuIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import AdminDashboardHome from './AdminDashboardHome';
import ManageBusinesses from './ManageBusinesses';
import ManageCategories from './ManageCategories';

const DRAWER_WIDTH = 250;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
  { text: 'Businesses', icon: <Business />, path: '/admin/businesses' },
  { text: 'Categories', icon: <Category />, path: '/admin/categories' },
];

const AdminDashboard = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const drawer = (
    <List>
      {menuItems.map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            component={NavLink}
            to={item.path}
            end={item.path === '/admin'}
            onClick={() => setMobileOpen(false)}
            sx={{
              color: 'inherit',
              '&.active': { backgroundColor: '#37474f' },
              '&:hover': { backgroundColor: '#37474f' },
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>{item.icon}</Box>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 90px)' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 0 : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#263238',
            color: 'white',
            pt: 2,
            ...(isMobile
              ? {}
              : {
                  top: 96,
                  height: 'calc(100% - 96px)',
                }),
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton
                onClick={() => setMobileOpen(true)}
                aria-label="Open admin menu"
                sx={{ color: '#0b1c22' }}
              >
                <MenuIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 600 }}>Admin menu</Typography>
            </Box>
          )}
          <Routes>
            <Route path="/" element={<AdminDashboardHome />} />
            <Route path="/businesses" element={<ManageBusinesses />} />
            <Route path="/categories" element={<ManageCategories />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
