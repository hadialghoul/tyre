import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Grid, Card, CardActionArea, CardContent, Typography, CircularProgress, Button } from '@mui/material';
import { businessAPI, categoryAPI, statsAPI, resolveMediaUrl } from '../utils/api';
import { categoryCover } from '../utils/visuals';
import CategoryIcon from '../components/CategoryIcon';

const AdminDashboardHome = () => {
  const [stats, setStats] = useState({ businesses: 0, categories: 0 });
  const [traffic, setTraffic] = useState(null);
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [bizRes, catRes, trafficRes] = await Promise.all([
        businessAPI.getAll({}),
        categoryAPI.getAll(),
        statsAPI.get().catch(() => ({ data: null })),
      ]);
      const bizList = Array.isArray(bizRes.data) ? bizRes.data : [];
      const catList = Array.isArray(catRes.data) ? catRes.data : [];
      setBusinesses(bizList);
      setCategories(catList);
      setTraffic(trafficRes?.data || null);
      setStats({
        businesses: bizList.length,
        categories: catList.length,
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                Website visits
              </Typography>
              <Typography variant="h5">{traffic?.totalViews ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Unique visitors: {traffic?.uniqueVisitors ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today: {traffic?.todayViews ?? 0}
              </Typography>
              <Button
                href="https://analytics.google.com/analytics/web/"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ mt: 1, px: 0 }}
              >
                Open Google Analytics · G-929FC0LLN1
              </Button>
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

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Businesses by category
      </Typography>
      <Grid container spacing={2}>
        {categories.map((cat) => {
          const count = businesses.filter(
            (item) => String(item.category?._id || item.category) === String(cat._id)
          ).length;
          return (
            <Grid item xs={12} sm={6} md={3} key={cat._id}>
              <Card>
                <CardActionArea component={Link} to={`/admin/businesses?category=${encodeURIComponent(cat._id)}`}>
                  <Box
                    component="img"
                    src={resolveMediaUrl(cat.cover) || categoryCover(cat.name)}
                    alt=""
                    sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.8 }}>
                      <CategoryIcon category={cat} size={36} />
                      <Typography sx={{ fontWeight: 700 }}>{cat.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {count} {count === 1 ? 'business' : 'businesses'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Button
                    component={Link}
                    to={`/businesses?category=${encodeURIComponent(cat._id)}`}
                    size="small"
                  >
                    View on site
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default AdminDashboardHome;
