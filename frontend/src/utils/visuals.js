import catalog from '../data/catalog.json';

export const IMAGES = {
  hero: '/img/hero.jpg',
  ruins: '/img/hippodrome.jpg',
  coast: '/img/coast.jpg',
  dining: '/img/categories/covers/restaurants.svg',
  streets: '/img/hero.jpg',
  hotel: '/img/categories/covers/hotels.svg',
  cafe: '/img/categories/covers/coffee.svg',
  health: '/img/categories/covers/hospitals.svg',
  market: '/img/categories/covers/supermarkets.svg',
  service: '/img/categories/covers/services.svg',
  clothing: '/img/categories/covers/clothing.jpg',
  barber: '/img/categories/covers/barber.jpg',
  night: '/img/beach.jpg',
  fallback: '/img/categories/covers/restaurants.svg',
  beach: '/img/beach.jpg',
  port: '/img/port.jpg',
  hippodrome: '/img/hippodrome.jpg',
};

export const CATEGORY_ASSETS = {
  restaurants: {
    cover: '/img/categories/covers/restaurants.svg',
    icon: '/img/categories/icons/restaurants.svg',
  },
  'coffee shops': {
    cover: '/img/categories/covers/coffee.svg',
    icon: '/img/categories/icons/coffee.svg',
  },
  hotels: {
    cover: '/img/categories/covers/hotels.svg',
    icon: '/img/categories/icons/hotels.svg',
  },
  pools: {
    cover: '/img/categories/covers/pools.svg',
    icon: '/img/categories/icons/pools.svg',
  },
  hospitals: {
    cover: '/img/categories/covers/hospitals.svg',
    icon: '/img/categories/icons/hospitals.svg',
  },
  pharmacies: {
    cover: '/img/categories/covers/pharmacies.svg',
    icon: '/img/categories/icons/pharmacies.svg',
  },
  supermarkets: {
    cover: '/img/categories/covers/supermarkets.svg',
    icon: '/img/categories/icons/supermarkets.svg',
  },
  services: {
    cover: '/img/categories/covers/services.svg',
    icon: '/img/categories/icons/services.svg',
  },
  'clothing store': {
    cover: '/img/categories/covers/clothing.jpg',
    icon: '/img/categories/icons/clothing.svg',
  },
  'barber shop': {
    cover: '/img/categories/covers/barber.jpg',
    icon: '/img/categories/icons/barber.svg',
  },
};

const coverByName = Object.fromEntries(
  catalog.categories.map((category) => [category.name.toLowerCase(), category.cover])
);

const assetsFor = (name = '') => {
  const n = name.toLowerCase();
  if (CATEGORY_ASSETS[n]) return CATEGORY_ASSETS[n];
  const match = Object.entries(CATEGORY_ASSETS).find(([key]) => n.includes(key.split(' ')[0]));
  return match ? match[1] : null;
};

export const categoryCover = (name = '') => {
  const n = name.toLowerCase();
  if (coverByName[n]) return coverByName[n];
  const assets = assetsFor(name);
  if (assets?.cover) return assets.cover;
  if (n.includes('hotel') || n.includes('stay')) return IMAGES.hotel;
  if (n.includes('restaurant') || n.includes('food') || n.includes('dining')) return IMAGES.dining;
  if (n.includes('cafe') || n.includes('coffee')) return IMAGES.cafe;
  if (n.includes('pool')) return IMAGES.beach;
  if (n.includes('hospital') || n.includes('health')) return IMAGES.health;
  if (n.includes('pharm')) return CATEGORY_ASSETS.pharmacies.cover;
  if (n.includes('cloth') || n.includes('fashion') || n.includes('boutique')) return IMAGES.clothing;
  if (n.includes('barber') || n.includes('salon') || n.includes('hair')) return IMAGES.barber;
  if (n.includes('super') || n.includes('market')) return IMAGES.market;
  if (n.includes('service') || n.includes('repair') || n.includes('laundry')) return IMAGES.service;
  return IMAGES.fallback;
};

export const categoryIcon = (name = '') => assetsFor(name)?.icon || '';

export const businessCover = (business) =>
  business?.coverImage || categoryCover(business?.category?.name || '');
