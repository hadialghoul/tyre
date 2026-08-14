import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Button, Alert, CircularProgress, Typography } from '@mui/material';
import { authAPI } from '../utils/api';
import { IMAGES } from '../utils/visuals';
import { useLanguage } from '../i18n/LanguageContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await authAPI.login(formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 84px)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        py: 8,
      }}
    >
      <Box
        component="img"
        src={IMAGES.hero}
        alt=""
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(7,20,26,0.72)' }} />
      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        <Box sx={{ bgcolor: '#fbf7f0', p: { xs: 4, md: 5 } }}>
          <Typography sx={{ letterSpacing: '0.28em', fontSize: 12, color: '#c8a36a', mb: 1, textAlign: 'center' }}>
            {t('partners')}
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '2.4rem',
              textAlign: 'center',
              mb: 3,
            }}
          >
            {t('signIn')}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              variant="standard"
            />
            <TextField
              fullWidth
              label={t('password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              variant="standard"
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 4, py: 1.4, bgcolor: '#0b1c22', '&:hover': { bgcolor: '#16343c' } }}
              disabled={loading}
              type="submit"
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#c8a36a' }} /> : t('enter')}
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminLogin;
