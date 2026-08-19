const VISITOR_KEY = 'tyre-visitor-id';
const RATINGS_KEY = 'tyre-my-ratings';

export const getVisitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch (err) {
    return `v_${Date.now().toString(16)}`;
  }
};

export const getSavedRating = (businessId) => {
  try {
    const map = JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
    return Number(map[String(businessId)]) || 0;
  } catch (err) {
    return 0;
  }
};

export const saveRating = (businessId, stars) => {
  try {
    const map = JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
    map[String(businessId)] = Number(stars);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(map));
  } catch (err) {
    // Ignore private-mode storage errors.
  }
};
