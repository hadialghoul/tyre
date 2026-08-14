import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitch from './LanguageSwitch';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isAr } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem('token');
  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const links = [
    { label: t('home'), to: '/' },
    { label: t('discover'), to: '/businesses' },
  ];

  return (
    <>
      <AppBar
        position={isHome ? 'fixed' : 'sticky'}
        elevation={0}
        sx={{
          left: 0,
          right: 0,
          width: '100%',
          background: transparent ? 'transparent' : 'rgba(7, 20, 26, 0.94)',
          backdropFilter: transparent ? 'none' : 'blur(18px)',
          borderBottom: transparent ? '1px solid transparent' : '1px solid rgba(200, 163, 106, 0.18)',
          transition: 'background 280ms ease, border-color 280ms ease',
        }}
      >
        <Toolbar
          dir="ltr"
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            minHeight: { xs: 72, md: 84 },
            px: { xs: 2, md: 5 },
            width: '100%',
          }}
        >
          <Box sx={{ justifySelf: 'start', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: { xs: 'flex', lg: 'none' } }}>
              <LanguageSwitch />
            </Box>
          </Box>

          <Box
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#fff',
              lineHeight: 1,
              textAlign: 'center',
              justifySelf: 'center',
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                letterSpacing: isAr ? 0 : '0.14em',
                fontSize: { xs: '0.92rem', md: '1.05rem' },
                color: '#f6f0e6',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {t('tyre')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.62rem',
                letterSpacing: isAr ? 0 : '0.34em',
                color: '#c8a36a',
                mt: 0.4,
                textAlign: 'center',
              }}
            >
              {t('lebanon')}
            </Typography>
          </Box>

          <Box
            sx={{
              justifySelf: 'end',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 1,
                flexWrap: 'nowrap',
              }}
            >
              {links.map((link) => (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  sx={{
                    color: '#f6f0e6',
                    px: 1.5,
                    minWidth: 0,
                    fontWeight: 500,
                    opacity: location.pathname === link.to ? 1 : 0.78,
                    '&:hover': { opacity: 1, background: 'transparent' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
              <LanguageSwitch />
              {token ? (
                <>
                  <Button component={Link} to="/admin" sx={{ color: '#f6f0e6', opacity: 0.78 }}>
                    {t('admin')}
                  </Button>
                  <Button onClick={handleLogout} sx={{ color: '#c8a36a' }}>
                    {t('logout')}
                  </Button>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/businesses"
                  sx={{
                    ml: 0.5,
                    px: 2.2,
                    py: 1,
                    color: '#0b1c22',
                    bgcolor: '#c8a36a',
                    '&:hover': { bgcolor: '#d4b37d' },
                  }}
                >
                  {t('planVisit')}
                </Button>
              )}
            </Box>

            <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center' }}>
              <IconButton
                onClick={() => setOpen(true)}
                sx={{ color: '#f6f0e6' }}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: '#07141a', color: '#f6f0e6', px: 1 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography sx={{ letterSpacing: isAr ? 0 : '0.12em', textAlign: 'center', width: '100%' }}>
            {t('tyre')}
          </Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: '#f6f0e6' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(200,163,106,0.2)' }} />
        <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'center' }}>
          <LanguageSwitch />
        </Box>
        <List>
          {links.map((link) => (
            <ListItemButton
              key={link.to}
              component={Link}
              to={link.to}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={link.label} sx={{ textAlign: 'center' }} />
            </ListItemButton>
          ))}
          {token ? (
            <>
              <ListItemButton component={Link} to="/admin" onClick={() => setOpen(false)}>
                <ListItemText primary={t('admin')} sx={{ textAlign: 'center' }} />
              </ListItemButton>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary={t('logout')} sx={{ textAlign: 'center' }} />
              </ListItemButton>
            </>
          ) : null}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
