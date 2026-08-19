import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { statsAPI } from '../utils/api';
import { getVisitorId } from '../utils/visitor';

const GA_ID = 'G-929FC0LLN1';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        send_to: GA_ID,
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
    if (!location.pathname.startsWith('/admin')) {
      statsAPI.trackView(getVisitorId()).catch(() => {});
    }
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
