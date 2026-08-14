import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Container } from '@mui/material';
import { Dashboard, Business, Category } from '@mui/icons-material';
import AdminDashboardHome from './AdminDashboardHome';
import ManageBusinesses from './ManageBusinesses';
import ManageCategories from './ManageCategories';

const AdminDashboard = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Businesses', icon: <Business />, path: '/admin/businesses' },
    { text: 'Categories', icon: <Category />, path: '/admin/categories' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 90px)' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            backgroundColor: '#263238',
            color: 'white',
            pt: 2,
          },
        }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component="a"
                href={item.path}
                sx={{
                  '&:hover': { backgroundColor: '#37474f' },
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>{item.icon}</Box>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
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
