import React from 'react';
import { Box, Container, Typography, Link, Grid, Stack } from '@mui/material';
import { MailOutline } from '@mui/icons-material';
import { CONTACT } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

const Footer = () => {
  const { t, isAr } = useLanguage();

  return (
    <Box sx={{ background: '#07141a', color: '#f6f0e6', pt: { xs: 8, md: 10 }, pb: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={6}>
          <Grid item xs={12} md={5}>
            <Typography
              sx={{
                letterSpacing: isAr ? 0 : '0.14em',
                fontSize: { xs: '1.15rem', md: '1.35rem' },
                mb: 1,
                fontWeight: 600,
              }}
            >
              {t('tyre')}
            </Typography>
            <Typography sx={{ color: '#c8a36a', letterSpacing: isAr ? 0 : '0.22em', fontSize: 12, mb: 3 }}>
              {t('phoenicianCoast')}
            </Typography>
            <Typography sx={{ color: 'rgba(246,240,230,0.72)', maxWidth: 380, lineHeight: 1.9, fontWeight: 300 }}>
              {t('footerAbout')}
            </Typography>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography sx={{ color: '#c8a36a', letterSpacing: isAr ? 0 : '0.18em', fontSize: 12, mb: 2 }}>
              {t('visit')}
            </Typography>
            <Stack spacing={1.2}>
              <Link href="/" underline="none" sx={{ color: 'rgba(246,240,230,0.82)' }}>{t('home')}</Link>
              <Link href="/businesses" underline="none" sx={{ color: 'rgba(246,240,230,0.82)' }}>{t('discover')}</Link>
              <Link href="/admin/login" underline="none" sx={{ color: 'rgba(246,240,230,0.82)' }}>{t('admin')}</Link>
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography sx={{ color: '#c8a36a', letterSpacing: isAr ? 0 : '0.18em', fontSize: 12, mb: 2 }}>
              {t('seek')}
            </Typography>
            <Stack spacing={1.2}>
              <Link href="/businesses" underline="none" sx={{ color: 'rgba(246,240,230,0.82)' }}>{t('restaurants')}</Link>
              <Link href="/businesses" underline="none" sx={{ color: 'rgba(246,240,230,0.82)' }}>{t('hotels')}</Link>
              <Link href="/businesses" underline="none" sx={{ color: 'rgba(246,240,230,0.82)' }}>{t('services')}</Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography sx={{ color: '#c8a36a', letterSpacing: isAr ? 0 : '0.18em', fontSize: 12, mb: 2 }}>
              {t('arrive')}
            </Typography>
            <Typography sx={{ color: 'rgba(246,240,230,0.82)', lineHeight: 1.9, mb: 1.5 }}>
              {t('tyreSouth')}
              <br />
              {t('medCoast')}
            </Typography>
            <Stack spacing={0.8}>
              {CONTACT.phones.map((phone) => (
                <Link
                  key={phone.tel}
                  href={`tel:${phone.tel}`}
                  underline="none"
                  className="gold-link"
                  sx={{ color: '#f6f0e6', width: 'fit-content' }}
                >
                  {phone.display}
                </Link>
              ))}
              <Link
                href={`mailto:${CONTACT.email}`}
                underline="none"
                className="gold-link"
                sx={{
                  color: '#c8a36a',
                  width: 'fit-content',
                  mt: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <MailOutline sx={{ fontSize: 18 }} />
                {CONTACT.email}
              </Link>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid rgba(200,163,106,0.18)',
            mt: 7,
            pt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1.2,
          }}
        >
          <Box
            component="img"
            src="/images/tyre/logo2.PNG"
            alt="Sawt Al Farah"
            sx={{
              width: { xs: 180, md: 220 },
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          <Typography
            sx={{
              color: '#c8a36a',
              fontSize: 13,
              letterSpacing: isAr ? 0 : '0.12em',
              fontWeight: 500,
            }}
          >
            {t('supportedBy')}
          </Typography>
        </Box>

        <Box
          sx={{
            borderTop: '1px solid rgba(200,163,106,0.12)',
            mt: 4,
            pt: 3,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(246,240,230,0.5)', letterSpacing: isAr ? 0 : '0.08em' }}>
            © {new Date().getFullYear()} {t('discoverTyre')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(246,240,230,0.5)' }}>
            {t('unescoCity')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
