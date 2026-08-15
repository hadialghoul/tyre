import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { businessAPI, categoryAPI } from '../utils/api';

const AdminDashboardHome = () => {
  const [stats, setStats] = useState({ businesses: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [bizRes, catRes] = await Promise.all([
        businessAPI.getAll({}),
        categoryAPI.getAll(),
      ]);
      setStats({
        businesses: bizRes.data.length,
        categories: catRes.data.length,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Businesses
              </Typography>
              <Typography variant="h5">{stats.businesses}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Categories
              </Typography>
              <Typography variant="h5">{stats.categories}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Quick Links
              </Typography>
              <Typography variant="body2">
                <Link to="/admin/businesses">Manage Businesses</Link>
                {' | '}
                <Link to="/admin/categories">Manage Categories</Link>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardHome;
