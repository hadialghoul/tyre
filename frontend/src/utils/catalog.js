import catalog from '../data/catalog.json';
import { businessAPI, categoryAPI, isApiConfigured } from './api';
import { categoryNamesAr, serviceTypesAr } from '../i18n/translations';

export const SAMPLE_CATEGORIES = catalog.categories.map((category) => ({
  _id: `cat-${category.key}`,
  name: category.name,
  description: category.description,
  icon: category.icon,
  cover: category.cover,
  key: category.key,
}));

const categoryByKey = Object.fromEntries(
  SAMPLE_CATEGORIES.map((category) => [category.key, category])
);

export const SAMPLE_BUSINESSES = catalog.businesses.map((business) => {
  const category = categoryByKey[business.categoryKey];
  return {
    ...business,
    _id: `sample-${business.key}`,
    category,
  };
});

export const getCategoryKind = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('restaurant')) return 'restaurant';
  if (n.includes('cafe') || n.includes('coffee')) return 'cafe';
  if (n.includes('hotel')) return 'hotel';
  if (n.includes('pool')) return 'pool';
  if (n.includes('hospital')) return 'hospital';
  if (n.includes('pharmac')) return 'pharmacy';
  if (n.includes('super') || n.includes('market')) return 'supermarket';
  if (n.includes('service')) return 'service';
  return 'other';
};

export const isDiningCategory = (name = '') => {
  const kind = getCategoryKind(name);
  return kind === 'restaurant' || kind === 'cafe';
};

export const mapsLink = (business) => {
  if (business?.mapsUrl) return business.mapsUrl;
  if (business?.latitude && business?.longitude) {
    return `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
  }
  if (business?.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address}, Tyre, Lebanon`)}`;
  }
  return '';
};

const isSampleId = (id = '') =>
  String(id).startsWith('cat-') || String(id).startsWith('sample-');

const matchesSearch = (business, search) => {
  if (!search) return true;
  const q = String(search).trim().toLowerCase();
  if (!q) return true;
  const catName = business.category?.name || '';
  const haystack = [
    business.name,
    business.description,
    business.address,
    business.serviceType,
    business.phone,
    catName,
    categoryNamesAr[catName],
    serviceTypesAr[business.serviceType],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
};

export const filterSampleBusinesses = ({ category, search, featured } = {}) => {
  return SAMPLE_BUSINESSES.filter((business) => {
    if (category && business.category?._id !== category && business.categoryKey !== category) {
      return false;
    }
    if (featured === 'true' && !business.featured) return false;
    return matchesSearch(business, search);
  });
};

export const getSampleBusiness = (id) =>
  SAMPLE_BUSINESSES.find((business) => business._id === id || business.key === id);

export const loadCategories = async () => {
  if (!isApiConfigured) return SAMPLE_CATEGORIES;

  try {
    const { data } = await categoryAPI.getAll();
    if (Array.isArray(data) && data.length >= 8) return data;
  } catch (err) {
    console.warn('Using local Tyre catalog for categories.');
  }
  return SAMPLE_CATEGORIES;
};

export const loadBusinesses = async (filters = {}) => {
  if (!isApiConfigured || isSampleId(filters.category)) {
    return filterSampleBusinesses(filters);
  }

  try {
    const { data } = await businessAPI.getAll(filters);
    if (!Array.isArray(data)) {
      return filterSampleBusinesses(filters);
    }
    if (filters.search || filters.category || filters.featured) {
      return data;
    }
    if (data.length) return data;
  } catch (err) {
    console.warn('Using local Tyre catalog for businesses.');
  }

  return filterSampleBusinesses(filters);
};

export const loadBusinessById = async (id) => {
  const sample = getSampleBusiness(id);
  if (sample) return sample;
  if (!isApiConfigured) return null;

  const { data } = await businessAPI.getById(id);
  return data;
};
