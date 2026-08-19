import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import BusinessCard from '../components/BusinessCard';
import Reveal from '../components/Reveal';
import ContactSection from '../components/ContactSection';
import { IMAGES, displayCategoryCover } from '../utils/visuals';
import { loadCategories, loadBusinesses } from '../utils/catalog';
import { resolveMediaUrl } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import CategoryIcon from '../components/CategoryIcon';

const Home = () => {
  const navigate = useNavigate();
  const { t, categoryName, categoryDescription, isAr } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, featured] = await Promise.all([
        loadCategories(),
        loadBusinesses({ featured: 'true' }),
      ]);
      setCategories(cats);
      setFeaturedBusinesses(featured.slice(0, 6));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/businesses?search=${encodeURIComponent(query.trim())}` : '/businesses');
  };

  const stories = [
    { title: t('story1Title'), copy: t('story1Copy'), image: IMAGES.ruins },
    { title: t('story2Title'), copy: t('story2Copy'), image: IMAGES.coast },
    { title: t('story3Title'), copy: t('story3Copy'), image: IMAGES.port },
  ];

  const tracking = isAr ? 0 : '0.28em';

  return (
    <Box sx={{ bgcolor: '#f6f0e6' }}>
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          color: '#fff',
        }}
      >
        <Box
          className="hero-kenburns"
          component="img"
          src={IMAGES.hero}
          alt={t('discoverTyre')}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(7,20,26,0.55) 0%, rgba(7,20,26,0.28) 42%, rgba(7,20,26,0.78) 100%)',
          }}
        />

        <Container sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pt: 8 }}>
          <Typography
            className="fade-up"
            sx={{
              letterSpacing: tracking,
              fontSize: { xs: 11, md: 13 },
              color: '#c8a36a',
              mb: 3,
            }}
          >
            {t('unescoLebanon')}
          </Typography>
          <Box
            className="hero-title"
            sx={{
              fontWeight: 600,
              letterSpacing: isAr ? 0 : { xs: '0.12em', md: '0.22em' },
              fontSize: { xs: '2.4rem', sm: '4.2rem', md: '6.2rem' },
              lineHeight: 0.95,
              color: '#f6f0e6',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {t('tyre').split('').map((char, index) => (
              char === ' ' ? (
                <span key={`s-${index}`} className="hero-space" />
              ) : (
                <span
                  key={`${char}-${index}`}
                  className="hero-letter"
                  style={{ animationDelay: `${0.08 + index * 0.08}s` }}
                >
                  {char}
                </span>
              )
            ))}
          </Box>
          <Typography
            className="fade-up-delay-2"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '1.35rem', md: '2.05rem' },
              color: 'rgba(246,240,230,0.9)',
              mt: 2,
              mb: 5,
              textAlign: 'center',
            }}
          >
            {t('heroSubtitle')}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSearch}
            className="fade-up-delay-2"
            sx={{
              mx: 'auto',
              maxWidth: 640,
              display: 'flex',
              bgcolor: 'rgba(251,247,240,0.94)',
              overflow: 'hidden',
            }}
          >
            <TextField
              fullWidth
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#5d6b70', ml: 1.5 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                px: 1,
                py: 0.6,
                '& input': { py: 1.6, fontSize: 16 },
              }}
            />
            <Button
              type="submit"
              sx={{
                px: { xs: 2.5, md: 4 },
                bgcolor: '#c8a36a',
                color: '#0b1c22',
                borderRadius: 0,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#d4b37d' },
              }}
            >
              {t('explore')}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 7,
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 4, md: 8 },
              flexWrap: 'wrap',
              color: 'rgba(246,240,230,0.8)',
            }}
          >
            {[
              { k: '2750 BC', v: t('founded') },
              { k: t('heritage'), v: t('tyre') },
              { k: t('coast') === 'Coast' ? 'Mediterranean' : 'المتوسط', v: t('coast') },
            ].map((item) => (
              <Box key={item.k} className="fade-up-delay-2" sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: 22, md: 28 } }}>
                  {item.k}
                </Typography>
                <Typography sx={{ letterSpacing: tracking, fontSize: 11, color: '#c8a36a' }}>
                  {item.v}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>

        <Typography
          className="scroll-cue"
          sx={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            textAlign: 'center',
            letterSpacing: tracking,
            fontSize: 11,
            color: 'rgba(246,240,230,0.7)',
          }}
        >
          {t('scroll')}
        </Typography>
      </Box>

      <Container sx={{ py: { xs: 9, md: 14 } }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <Reveal>
              <Typography sx={{ letterSpacing: tracking, fontSize: 12, color: '#c8a36a', mb: 2, textAlign: { xs: 'center', md: 'start' } }}>
                {t('livingCity')}
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '2.4rem', md: '3.6rem' }, lineHeight: 1.15, mb: 3, textAlign: { xs: 'center', md: 'start' } }}>
                {t('oldestCities')}
                <Box component="span" sx={{ color: '#6b4e2e' }}>
                  {' '}{t('stillFacingSea')}
                </Box>
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 18, lineHeight: 1.9, maxWidth: 520, mb: 4, mx: { xs: 'auto', md: 0 }, textAlign: { xs: 'center', md: 'start' } }}>
                {t('livingCopy')}
              </Typography>
              <Box sx={{ textAlign: { xs: 'center', md: 'start' } }}>
                <Button
                  component={Link}
                  to="/businesses"
                  sx={{
                    px: 4,
                    py: 1.4,
                    bgcolor: '#0b1c22',
                    color: '#f6f0e6',
                    '&:hover': { bgcolor: '#16343c' },
                  }}
                >
                  {t('beginExploring')}
                </Button>
              </Box>
            </Reveal>
          </Grid>
          <Grid item xs={12} md={6}>
            <Reveal delay={120}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 2, minHeight: 460 }}>
                <Box
                  component="img"
                  src={IMAGES.ruins}
                  alt={t('story1Title')}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 460, transition: 'transform 700ms ease', '&:hover': { transform: 'scale(1.03)' } }}
                />
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box component="img" src={IMAGES.streets} alt={t('story3Title')} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 700ms ease', '&:hover': { transform: 'scale(1.03)' } }} />
                  <Box component="img" src={IMAGES.coast} alt={t('story2Title')} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 700ms ease', '&:hover': { transform: 'scale(1.03)' } }} />
                </Box>
              </Box>
            </Reveal>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ px: { xs: 2, md: 4 }, pb: { xs: 8, md: 12 } }}>
        <Reveal>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography sx={{ letterSpacing: tracking, fontSize: 12, color: '#c8a36a', mb: 1 }}>
              {t('threeWays')}
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
              {t('storiesOfTyre')}
            </Typography>
          </Box>
        </Reveal>
        <Grid container spacing={2}>
          {stories.map((story, index) => (
            <Grid item xs={12} md={4} key={story.title}>
              <Reveal delay={index * 120}>
                <Box
                  sx={{
                    position: 'relative',
                    height: { xs: 360, md: index === 1 ? 520 : 460 },
                    overflow: 'hidden',
                    mt: { md: index === 1 ? 0 : 4 },
                  }}
                >
                  <Box
                    component="img"
                    src={story.image}
                    alt={story.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 800ms ease',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 25%, rgba(7,20,26,0.82) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      p: 4,
                      color: '#fff',
                    }}
                  >
                    <Typography sx={{ letterSpacing: tracking, fontSize: 11, color: '#c8a36a', mb: 1 }}>
                      0{index + 1}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#f6f0e6', mb: 1 }}>
                      {story.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(246,240,230,0.78)', lineHeight: 1.7 }}>
                      {story.copy}
                    </Typography>
                  </Box>
                </Box>
              </Reveal>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Container sx={{ pb: { xs: 8, md: 12 } }}>
        <Reveal>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography sx={{ letterSpacing: tracking, fontSize: 12, color: '#c8a36a', mb: 1 }}>
              {t('findPlace')}
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
              {t('whereToGo')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 560, lineHeight: 1.8, mx: 'auto' }}>
              {t('whereToGoCopy')}
            </Typography>
          </Box>
        </Reveal>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#c8a36a' }} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {categories.map((cat, index) => (
              <Grid item xs={12} sm={6} md={3} key={cat._id}>
                <Reveal delay={index * 70}>
                  <Box
                    component={Link}
                    to={`/businesses?category=${cat._id}`}
                    sx={{
                      display: 'block',
                      position: 'relative',
                      height: { xs: 240, md: 320 },
                      overflow: 'hidden',
                      textDecoration: 'none',
                      '&:hover .category-cover': { transform: 'scale(1.06)' },
                    }}
                  >
                    <Box
                      className="category-cover"
                      component="img"
                      src={resolveMediaUrl(displayCategoryCover(cat))}
                      alt={categoryName(cat.name)}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 700ms ease' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(7,20,26,0.1) 20%, rgba(7,20,26,0.78) 100%)',
                        p: 3.5,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <CategoryIcon category={cat} size={48} sx={{ mb: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }} />
                      <Typography sx={{ color: '#c8a36a', letterSpacing: tracking, fontSize: 12, mb: 0.8 }}>
                        {t('category')}
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#f6f0e6' }}>
                        {categoryName(cat.name)}
                      </Typography>
                      {(cat.description || categoryDescription(cat.name)) && (
                        <Typography sx={{ color: 'rgba(246,240,230,0.75)', mt: 1, fontSize: 14, lineHeight: 1.5 }}>
                          {categoryDescription(cat.name, cat.description)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {featuredBusinesses.length > 0 && (
        <Box sx={{ bgcolor: '#0b1c22', color: '#f6f0e6', py: { xs: 8, md: 12 } }}>
          <Container>
            <Reveal>
              <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography sx={{ letterSpacing: tracking, fontSize: 12, color: '#c8a36a', mb: 1 }}>
                  {t('theEdit')}
                </Typography>
                <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '3.1rem' }, color: '#f6f0e6' }}>
                  {t('placesWorth')}
                </Typography>
              </Box>
            </Reveal>
            <Grid container spacing={3} alignItems="stretch">
              {featuredBusinesses.map((business, index) => (
                <Grid item xs={12} sm={6} md={4} key={business._id} sx={{ display: 'flex' }}>
                  <Reveal delay={index * 80} fill>
                    <BusinessCard business={business} />
                  </Reveal>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 420, md: 520 },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={IMAGES.night}
          alt={t('yourDays')}
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(7,20,26,0.58)' }} />
        <Container sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <Reveal>
            <Typography sx={{ letterSpacing: tracking, fontSize: 12, color: '#c8a36a', mb: 2 }}>
              {t('yourDays')}
            </Typography>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: { xs: '2.2rem', md: '3.6rem' },
                maxWidth: 760,
                mx: 'auto',
                lineHeight: 1.25,
                mb: 4,
                textAlign: 'center',
              }}
            >
              {t('comeForRuins')}
            </Typography>
            <Button
              component={Link}
              to="/businesses"
              sx={{
                px: 5,
                py: 1.5,
                bgcolor: '#c8a36a',
                color: '#0b1c22',
                '&:hover': { bgcolor: '#d4b37d' },
              }}
            >
              {t('seeGuide')}
            </Button>
          </Reveal>
        </Container>
      </Box>

      <ContactSection />
    </Box>
  );
};

export default Home;
