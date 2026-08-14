import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitch = ({ dark = false }) => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="lang-switch" dir="ltr" style={dark ? { borderColor: 'rgba(11,28,34,0.18)' } : undefined}>
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
        style={dark && lang !== 'en' ? { color: '#5d6b70' } : undefined}
      >
        {t('langEn')}
      </button>
      <button
        type="button"
        className={lang === 'ar' ? 'active' : ''}
        onClick={() => setLang('ar')}
        style={dark && lang !== 'ar' ? { color: '#5d6b70' } : undefined}
      >
        {t('langAr')}
      </button>
    </div>
  );
};

export default LanguageSwitch;
