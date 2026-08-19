import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Rating,
  Chip,
} from '@mui/material';
import { Phone, LocationOn, Language, AccessTime, LocalShipping, MenuBook } from '@mui/icons-material';
import { resolveMediaUrl, businessAPI } from '../utils/api';
import { categoryCover, IMAGES } from '../utils/visuals';
import { getCategoryKind, loadBusinessById, mapsLink, businessLogos } from '../utils/catalog';
import { getVisitorId, getSavedRating, saveRating } from '../utils/visitor';
import { useLanguage } from '../i18n/LanguageContext';
import PhoneNumber from '../components/PhoneNumber';

const BusinessDetail = () => {
  const { id } = useParams();
  const { t, categoryName, serviceName } = useLanguage();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadBusinessById(id);
      setBusiness(data);
      setMyRating(getSavedRating(id));
    } catch (err) {
      setError(t('detailsFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 16, bgcolor: '#f6f0e6' }}>
        <CircularProgress sx={{ color: '#c8a36a' }} />
      </Box>
    );
  }

  if (error || !business) {
    return (
      <Container sx={{ py: 10 }}>
        <Alert severity="error">{error || t('notFound')}</Alert>
      </Container>
    );
  }

  const kind = getCategoryKind(business.category?.name);
  const locationUrl = mapsLink(business);
  const logos = businessLogos(business);
  const heroImage =
    resolveMediaUrl(business.coverImage) ||
    resolveMediaUrl(logos[0]) ||
    categoryCover(business.category?.name) ||
    IMAGES.fallback;

  const facts = [
    business.phone && {
      icon: <Phone sx={{ color: '#c8a36a' }} />,
      label: t('phone'),
      value: <PhoneNumber>{business.phone}</PhoneNumber>,
    },
    business.alternatePhone && {
      icon: <Phone sx={{ color: '#c8a36a' }} />,
      label: t('alternate'),
      value: <PhoneNumber>{business.alternatePhone}</PhoneNumber>,
    },
    business.address && { icon: <LocationOn sx={{ color: '#c8a36a' }} />, label: t('location'), value: business.address },
    business.openingHours && { icon: <AccessTime sx={{ color: '#c8a36a' }} />, label: t('hours'), value: business.openingHours },
    business.serviceType && { icon: <LocationOn sx={{ color: '#c8a36a' }} />, label: t('service'), value: serviceName(business.serviceType) },
    business.hasDelivery && {
      icon: <LocalShipping sx={{ color: '#c8a36a' }} />,
      label: t('delivery'),
      value: business.deliveryPhone ? (
        <>
          {t('deliveryAvailable')} · <PhoneNumber>{business.deliveryPhone}</PhoneNumber>
        </>
      ) : (
        t('deliveryAvailable')
      ),
    },
  ].filter(Boolean);

  const handleRate = async (value) => {
    const stars = Number(value);
    if (!stars || savingRating) return;
    try {
      setSavingRating(true);
      setRatingMessage('');
      const { data } = await businessAPI.addReview(business._id, {
        stars,
        visitorId: getVisitorId(),
      });
      setBusiness(data);
      setMyRating(stars);
      saveRating(business._id, stars);
      setRatingMessage(t('thanksRating'));
    } catch (err) {
      setRatingMessage(err.response?.data?.message || t('ratingFailed'));
    } finally {
      setSavingRating(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f6f0e6', pb: 10 }}>
      <Box sx={{ position: 'relative', height: { xs: 360, md: 560 }, overflow: 'hidden' }}>
        <Box
          component="img"
          src={heroImage}
          alt={business.name}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7,20,26,0.25) 0%, rgba(7,20,26,0.78) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <Container sx={{ pb: { xs: 4, md: 7 } }}>
            <Button
              component={Link}
              to="/businesses"
              sx={{ color: '#c8a36a', mb: 2, px: 0, '&:hover': { background: 'transparent', color: '#f6f0e6' } }}
            >
              {t('backGuide')}
            </Button>
            {business.category && (
              <Typography sx={{ letterSpacing: '0.28em', fontSize: 12, color: '#c8a36a', mb: 1 }}>
                {categoryName(business.category.name)}
                {business.featured ? ` · ${t('featured')}` : ''}
              </Typography>
            )}
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '2.6rem', md: '4.4rem' },
                color: '#f6f0e6',
                lineHeight: 1,
              }}
            >
              {business.name}
            </Typography>
            {business.secondName ? (
              <Typography sx={{ mt: 1.2, color: 'rgba(246,240,230,0.86)', fontSize: { xs: 18, md: 22 } }}>
                {t('secondPlace')} · {business.secondName}
              </Typography>
            ) : null}
            {kind === 'hotel' && business.starRating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 2 }}>
                <Rating value={Number(business.starRating)} readOnly sx={{ color: '#c8a36a' }} />
                <Typography sx={{ color: '#f6f0e6' }}>{t('starHotel', { n: business.starRating })}</Typography>
              </Box>
            ) : null}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 2 }}>
              <Rating
                value={Number(business.rating) || 0}
                precision={0.5}
                readOnly
                sx={{ color: '#c8a36a' }}
              />
              <Typography sx={{ color: '#f6f0e6' }}>
                {business.reviewCount
                  ? `${Number(business.rating).toFixed(1)} · ${t('reviewsCount', { n: business.reviewCount })}`
                  : t('noReviewsYet')}
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: 5, md: 8 } }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
              {business.hasDelivery && <Chip label={t('deliveryAvailable')} sx={{ bgcolor: '#0b1c22', color: '#f6f0e6' }} />}
              {business.menus?.length > 0 && <Chip icon={<MenuBook />} label={t('menuQr')} />}
              {business.serviceType && <Chip label={serviceName(business.serviceType)} />}
            </Stack>
            <Typography sx={{ letterSpacing: '0.22em', fontSize: 12, color: '#c8a36a', mb: 2 }}>
              {t('theStory')}
            </Typography>
            <Typography sx={{ fontSize: 18, lineHeight: 1.9, color: 'text.secondary' }}>
              {business.description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              {locationUrl && (
                <Button
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<LocationOn />}
                  sx={{ px: 3.5, py: 1.3, bgcolor: '#0b1c22', color: '#f6f0e6', '&:hover': { bgcolor: '#16343c' } }}
                >
                  {t('openLocation')}
                </Button>
              )}
              {business.website && (
                <Button
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<Language />}
                  sx={{ px: 3.5, py: 1.3, border: '1px solid #0b1c22', color: '#0b1c22' }}
                >
                  {t('visitWebsite')}
                </Button>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ bgcolor: '#0b1c22', color: '#f6f0e6', p: { xs: 3, md: 4 } }}>
              {logos.length > 0 && (
                <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                  {logos.map((src, index) => (
                    <Box key={src} sx={{ textAlign: 'center' }}>
                      <Box
                        component="img"
                        src={resolveMediaUrl(src)}
                        alt={index === 0 ? `${business.name} logo` : `${business.secondName || business.name} logo`}
                        sx={{ width: 72, height: 72, objectFit: 'contain', bgcolor: '#fff' }}
                      />
                      {(index === 0 ? business.name : business.secondName) ? (
                        <Typography sx={{ mt: 0.8, fontSize: 11, color: 'rgba(246,240,230,0.7)', maxWidth: 72 }}>
                          {index === 0 ? business.name : business.secondName}
                        </Typography>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              )}
              <Typography sx={{ letterSpacing: '0.22em', fontSize: 12, color: '#c8a36a', mb: 3 }}>
                {t('arriveCall')}
              </Typography>
              <Stack spacing={2.4}>
                {facts.map((fact) => (
                  <Box key={fact.label} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    {fact.icon}
                    <Box>
                      <Typography sx={{ fontSize: 12, letterSpacing: '0.16em', color: 'rgba(246,240,230,0.55)', mb: 0.4 }}>
                        {fact.label}
                      </Typography>
                      <Typography sx={{ lineHeight: 1.6 }}>{fact.value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, bgcolor: '#fff', p: { xs: 3, md: 4 }, border: '1px solid rgba(11,28,34,0.06)' }}>
          <Typography sx={{ letterSpacing: '0.22em', fontSize: 12, color: '#c8a36a', mb: 1 }}>
            {t('visitorRating')}
          </Typography>
          <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: '1.6rem', md: '2rem' } }}>
            {t('rateThisPlace')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            {business.reviewCount
              ? `${Number(business.rating || 0).toFixed(1)} / 5 · ${t('reviewsCount', { n: business.reviewCount })}`
              : t('noReviewsYet')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Rating
              name="business-review"
              value={myRating}
              onChange={(_, value) => handleRate(value)}
              disabled={savingRating}
              size="large"
              sx={{ color: '#c8a36a' }}
            />
            <Typography sx={{ color: 'text.secondary' }}>
              {myRating ? t('yourRating') : t('rateThisPlace')}
            </Typography>
          </Box>
          {ratingMessage ? (
            <Alert severity={ratingMessage === t('thanksRating') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {ratingMessage}
            </Alert>
          ) : null}
        </Box>

        {business.menus && business.menus.length > 0 && (
          <Box sx={{ mt: 10 }}>
            <Typography sx={{ letterSpacing: '0.22em', fontSize: 12, color: '#c8a36a', mb: 1 }}>
              {t('menuQr')}
            </Typography>
            <Typography variant="h3" sx={{ mb: 4, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              {t('scanMenu')}
            </Typography>
            <Grid container spacing={2}>
              {business.menus.map((menu, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box sx={{ bgcolor: '#fff', height: '100%', p: 3, textAlign: 'center' }}>
                    {(menu.image || menu.type === 'image') && menu.image && (
                      <Box
                        component="img"
                        src={resolveMediaUrl(menu.image)}
                        alt={menu.name}
                        sx={{ width: 180, height: 180, objectFit: 'contain', mx: 'auto', display: 'block', mb: 2 }}
                      />
                    )}
                    <Typography variant="h5">{menu.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                      {menu.description}
                    </Typography>
                    {menu.link && (
                      <Button
                        href={menu.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mt: 2, px: 0, color: '#0b1c22' }}
                      >
                        {t('openMenu')}
                      </Button>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BusinessDetail;
