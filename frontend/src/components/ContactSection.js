import React from 'react';
import { Box, Container, Typography, Button, Grid, Stack } from '@mui/material';
import { Phone, MailOutline, WhatsApp, LocationOn, AccessTime } from '@mui/icons-material';
import { CONTACT } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import Reveal from './Reveal';

const ContactSection = () => {
  const { t, isAr } = useLanguage();
  const tracking = isAr ? 0 : '0.22em';

  return (
    <Box
      id="contact"
      sx={{
        background: 'linear-gradient(180deg, #0b1c22 0%, #07141a 100%)',
        color: '#f6f0e6',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Reveal>
          <Grid container spacing={6} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Typography sx={{ letterSpacing: tracking, fontSize: 12, color: '#c8a36a', mb: 2, textAlign: { xs: 'center', md: 'start' } }}>
                {t('contactUs')}
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: '2.1rem', md: '3rem' }, lineHeight: 1.15, mb: 2.5, textAlign: { xs: 'center', md: 'start' } }}>
                {t('writeUs')}
              </Typography>
              <Typography sx={{ color: 'rgba(246,240,230,0.72)', lineHeight: 1.9, mb: 4, maxWidth: 420, mx: { xs: 'auto', md: 0 }, textAlign: { xs: 'center', md: 'start' } }}>
                {t('contactIntro')}
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <LocationOn sx={{ color: '#c8a36a' }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, color: 'rgba(246,240,230,0.5)', letterSpacing: tracking }}>
                      {t('location')}
                    </Typography>
                    <Typography>{t('tyreSouth')}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <AccessTime sx={{ color: '#c8a36a' }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, color: 'rgba(246,240,230,0.5)', letterSpacing: tracking }}>
                      {t('hours')}
                    </Typography>
                    <Typography>{t('availableDaily')}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {CONTACT.phones.map((phone, index) => (
                  <Grid item xs={12} sm={6} key={phone.tel}>
                    <Box
                      sx={{
                        height: '100%',
                        p: 3,
                        border: '1px solid rgba(200,163,106,0.22)',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        transition: 'transform 280ms ease, border-color 280ms ease',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          borderColor: '#c8a36a',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: '#c8a36a', letterSpacing: tracking, mb: 1.5 }}>
                        {t('mobile')} 0{index + 1}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '2rem',
                          lineHeight: 1.1,
                          mb: 2.5,
                          direction: 'ltr',
                          unicodeBidi: 'plaintext',
                        }}
                      >
                        {phone.display}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          href={`tel:${phone.tel}`}
                          startIcon={<Phone />}
                          sx={{
                            flex: 1,
                            py: 1.1,
                            bgcolor: '#c8a36a',
                            color: '#0b1c22',
                            '&:hover': { bgcolor: '#d4b37d' },
                          }}
                        >
                          {t('callUs')}
                        </Button>
                        <Button
                          href={`https://wa.me/${phone.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<WhatsApp />}
                          sx={{
                            flex: 1,
                            py: 1.1,
                            border: '1px solid rgba(200,163,106,0.45)',
                            color: '#f6f0e6',
                            '&:hover': { borderColor: '#c8a36a', bgcolor: 'rgba(200,163,106,0.08)' },
                          }}
                        >
                          {t('whatsapp')}
                        </Button>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(200,163,106,0.22)',
                      bgcolor: 'rgba(200,163,106,0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          border: '1px solid rgba(200,163,106,0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          bgcolor: 'rgba(200,163,106,0.12)',
                        }}
                      >
                        <MailOutline sx={{ color: '#c8a36a', fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: '#c8a36a', letterSpacing: tracking }}>
                          {t('email')}
                        </Typography>
                        <Typography sx={{ wordBreak: 'break-all' }}>{CONTACT.email}</Typography>
                      </Box>
                    </Box>
                    <Button
                      href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('WEN B SOUR')}`}
                      sx={{
                        px: 3,
                        py: 1.2,
                        bgcolor: '#c8a36a',
                        color: '#0b1c22',
                        '&:hover': { bgcolor: '#d4b37d' },
                      }}
                    >
                      {t('sendEmail')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Reveal>
      </Container>
    </Box>
  );
};

export default ContactSection;
