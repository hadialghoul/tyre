import catalog from '../data/catalog.json';

export const IMAGES = {
  hero: '/img/hero.jpg',
  ruins: '/img/hippodrome.jpg',
  coast: '/img/coast.jpg',
  dining: '/img/port.jpg',
  streets: '/img/hero.jpg',
  hotel: '/img/coast.jpg',
  cafe: '/img/hero.jpg',
  health: '/img/coast.jpg',
  market: '/img/port.jpg',
  service: '/img/hippodrome.jpg',
  night: '/img/beach.jpg',
  fallback: '/img/port.jpg',
  beach: '/img/beach.jpg',
  port: '/img/port.jpg',
  hippodrome: '/img/hippodrome.jpg',
};

const coverByName = Object.fromEntries(
  catalog.categories.map((category) => [category.name.toLowerCase(), category.cover])
);

export const categoryCover = (name = '') => {
  const n = name.toLowerCase();
  if (coverByName[n]) return coverByName[n];
  if (n.includes('hotel') || n.includes('stay')) return IMAGES.hotel;
  if (n.includes('restaurant') || n.includes('food') || n.includes('dining')) return IMAGES.dining;
  if (n.includes('cafe') || n.includes('coffee')) return IMAGES.cafe;
  if (n.includes('pool')) return IMAGES.beach;
  if (n.includes('hospital') || n.includes('health') || n.includes('pharm')) return IMAGES.health;
  if (n.includes('super') || n.includes('market') || n.includes('shop')) return IMAGES.market;
  if (n.includes('service') || n.includes('repair') || n.includes('laundry')) return IMAGES.service;
  return IMAGES.streets;
};

export const businessCover = (business) =>
  business?.coverImage || categoryCover(business?.category?.name || '');
