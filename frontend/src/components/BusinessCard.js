import React from 'react';
import { Card, Typography, Box, Chip, Stack, Rating } from '@mui/material';
import { LocalShipping, MenuBook, LocationOn } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/api';
import { categoryCover, IMAGES } from '../utils/visuals';
import { getCategoryKind, businessLogos } from '../utils/catalog';
import { useLanguage } from '../i18n/LanguageContext';

const BusinessCard = ({ business }) => {
  const { t, categoryName, serviceName, isAr } = useLanguage();
  const kind = getCategoryKind(business.category?.name);
  const logos = businessLogos(business);
  const image =
    resolveMediaUrl(business.coverImage) ||
    resolveMediaUrl(logos[0]) ||
    categoryCover(business.category?.name) ||
    IMAGES.fallback;
  const hasMenu = business.menus?.length > 0;

  return (
    <Card
      component={Link}
      to={`/business/${business._id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        bgcolor: '#fff',
        boxShadow: 'none',
        border: '1px solid rgba(11, 28, 34, 0.06)',
        transition: 'transform 280ms ease, box-shadow 280ms ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 28px 60px rgba(7, 20, 26, 0.16)',
          '& .card-photo': {
            transform: 'scale(1.06)',
          },
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <Box
          className="card-photo"
          component="img"
          src={image}
          alt={business.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 700ms ease',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7,20,26,0.05) 30%, rgba(7,20,26,0.72) 100%)',
          }}
        />
        {logos.length > 0 && (
          <Stack
            direction="row"
            spacing={0.6}
            sx={{ position: 'absolute', top: 14, insetInlineEnd: 14 }}
          >
            {logos.map((src) => (
              <Box
                key={src}
                component="img"
                src={resolveMediaUrl(src)}
                alt=""
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  bgcolor: '#fff',
                  border: '2px solid #f6f0e6',
                }}
              />
            ))}
          </Stack>
        )}
        <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 16, insetInlineStart: 16 }}>
          {business.featured && (
            <Chip label={t('featured')} size="small" sx={{ bgcolor: '#c8a36a', color: '#0b1c22', fontWeight: 700 }} />
          )}
          {business.hasDelivery && (
            <Chip label={t('delivery')} size="small" sx={{ bgcolor: '#f6f0e6', color: '#0b1c22', fontWeight: 700 }} />
          )}
        </Stack>
        <Box sx={{ position: 'absolute', left: 18, right: 18, bottom: 16, color: '#fff' }}>
          {business.category && (
            <Typography sx={{ letterSpacing: isAr ? 0 : '0.18em', fontSize: 11, color: '#c8a36a', mb: 0.6 }}>
              {serviceName(business.serviceType) || categoryName(business.category.name)}
            </Typography>
          )}
          <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.15, color: '#f6f0e6' }}>
            {business.name}
          </Typography>
          {business.secondName ? (
            <Typography sx={{ mt: 0.4, fontSize: 13, color: 'rgba(246,240,230,0.82)' }}>
              {t('secondPlace')} · {business.secondName}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: 2.4, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        {business.address && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
            <LocationOn sx={{ fontSize: 18, color: '#c8a36a', mt: '1px' }} />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {business.address}
            </Typography>
          </Box>
        )}

        {kind === 'hotel' && business.starRating ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={Number(business.starRating)} readOnly size="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('starHotel', { n: business.starRating })}
            </Typography>
          </Box>
        ) : null}

        {kind === 'service' && business.serviceType ? (
          <Chip label={serviceName(business.serviceType)} size="small" sx={{ width: 'fit-content', bgcolor: 'rgba(200,163,106,0.16)' }} />
        ) : null}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {hasMenu && (
            <Chip icon={<MenuBook />} label={t('menuQr')} size="small" sx={{ bgcolor: 'rgba(11,28,34,0.06)' }} />
          )}
          {business.hasDelivery && (
            <Chip icon={<LocalShipping />} label={t('delivery')} size="small" sx={{ bgcolor: 'rgba(46,125,50,0.1)' }} />
          )}
        </Stack>

        <Typography sx={{ mt: 'auto', pt: 1, fontSize: 13, letterSpacing: isAr ? 0 : '0.12em', color: '#0b1c22', fontWeight: 600 }}>
          {t('view')}
        </Typography>
      </Box>
    </Card>
  );
};

export default BusinessCard;
