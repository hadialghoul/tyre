import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  Button,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { loadBusinesses, loadCategories, getCategoryKind } from '../utils/catalog';
import BusinessCard from '../components/BusinessCard';
import { IMAGES } from '../utils/visuals';
import { useLanguage } from '../i18n/LanguageContext';

const BusinessList = () => {
  const { t, categoryName, categoryDescription, serviceName } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const [draftSearch, setDraftSearch] = useState(searchQuery);
  const [serviceType, setServiceType] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (searchQuery) filters.search = searchQuery;
      const [list, cats] = await Promise.all([
        loadBusinesses(filters),
        loadCategories(),
      ]);
      setBusinesses(list);
      setCategories(cats);
    } catch (err) {
      setError(t('loadFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setDraftSearch(searchQuery);
    setServiceType('');
  }, [searchQuery, selectedCategory]);

  const updateParams = (nextSearch, nextCategory) => {
    const params = {};
    if (nextSearch) params.search = nextSearch;
    if (nextCategory) params.category = nextCategory;
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams(draftSearch.trim(), selectedCategory);
  };

  const selectedCategoryDoc = categories.find((cat) => cat._id === selectedCategory);
  const selectedCategoryName = selectedCategoryDoc?.name || '';
  const isServices = getCategoryKind(selectedCategoryName) === 'service';
  const pageDescription = isServices
    ? categoryDescription(selectedCategoryName, selectedCategoryDoc?.description || '')
    : '';
  const serviceTypes = [...new Set(businesses.map((item) => item.serviceType).filter(Boolean))];
  const visibleBusinesses = serviceType
    ? businesses.filter((item) => item.serviceType === serviceType)
    : businesses;

  return (
    <Box sx={{ bgcolor: '#f6f0e6', pb: 10 }}>
      <Box sx={{ position: 'relative', height: { xs: 280, md: 380 }, overflow: 'hidden', mb: 6 }}>
        <Box
          component="img"
          src={IMAGES.hippodrome}
          alt="Discover Tyre"
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7,20,26,0.45) 0%, rgba(7,20,26,0.7) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <Container sx={{ pb: 5, textAlign: 'center' }}>
            <Typography sx={{ letterSpacing: '0.32em', fontSize: 12, color: '#c8a36a', mb: 1 }}>
              {t('cityGuide')}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '2.6rem', md: '4.2rem' },
                color: '#f6f0e6',
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              {categoryName(selectedCategoryName) || t('discoverTyre')}
            </Typography>
            {pageDescription ? (
              <Typography
                sx={{
                  mt: 1.5,
                  mx: 'auto',
                  maxWidth: 640,
                  color: 'rgba(246,240,230,0.82)',
                  fontSize: { xs: 14, md: 16 },
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                {pageDescription}
              </Typography>
            ) : null}
          </Container>
        </Box>
      </Box>

      <Container maxWidth="lg">
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: isServices ? '1.2fr 0.8fr 0.8fr auto' : '1.4fr 0.8fr auto',
            },
            gap: 2,
            mb: 6,
            p: { xs: 2, md: 2.5 },
            bgcolor: '#fff',
            border: '1px solid rgba(11,28,34,0.06)',
            alignItems: 'end',
          }}
        >
          <TextField
            label={t('searchCity')}
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            fullWidth
            variant="standard"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#5d6b70' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label={t('category')}
            value={selectedCategory}
            onChange={(e) => updateParams(draftSearch.trim(), e.target.value)}
            fullWidth
            variant="standard"
          >
            <MenuItem value="">{t('allExperiences')}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {categoryName(cat.name)}
              </MenuItem>
            ))}
          </TextField>
          {isServices && (
            <TextField
              select
              label={t('serviceType')}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              fullWidth
              variant="standard"
            >
              <MenuItem value="">{t('allRepairs')}</MenuItem>
              {serviceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {serviceName(type)}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Button
            type="submit"
            sx={{
              px: 3,
              py: 1.1,
              bgcolor: '#0b1c22',
              color: '#f6f0e6',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#16343c' },
            }}
          >
            {t('explore')}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#c8a36a' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {visibleBusinesses.length > 0 ? (
              visibleBusinesses.map((business) => (
                <Grid item xs={12} sm={6} md={4} key={business._id}>
                  <BusinessCard business={business} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">{t('nothingMatched')}</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default BusinessList;
