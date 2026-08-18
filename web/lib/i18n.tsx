'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'mr' | 'hi';

const translations = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.overview.desc': 'National Executive Summary',
    'nav.heatmap': 'Heatmap',
    'nav.heatmap.desc': 'GIS Spatiotemporal Layers',
    'nav.districts': 'Districts',
    'nav.districts.desc': 'Sortable Surveillance Matrix',
    'nav.rag': 'Clinical AI & RAG',
    'nav.rag.desc': 'IDSP/WHO Knowledge Engine',
    'nav.resources': 'PHC Inventory Buffer',
    'nav.resources.desc': 'Supplies & Restock Dispatch',
    'nav.alerts': 'Alerts',
    'nav.alerts.desc': 'LLM Briefs & Field SOS',
    'nav.reports': 'Reports',
    'nav.reports.desc': 'Official Record Bulletin',

    // Headers & Branding
    'brand.title': 'Arogya Prahari',
    'brand.subtitle': 'Command Dashboard',
    'brand.tagline': 'One view, every district\'s risk.',
    'brand.tagline2': 'एक नज़र, हर ज़िले की स्थिति',

    // Dashboard Overview
    'overview.monitored_districts': 'Monitored Districts',
    'overview.districts_active': 'Districts active',
    'overview.coverage': 'Coverage: Maharashtra State',
    'overview.synced': '100% Synced',
    'overview.high_critical': 'High/Critical Outbreaks',
    'overview.dho_action': 'Requires DHO Action',
    'overview.clusters': 'Pune & Nashik clusters',
    'overview.view_feed': 'View Feed',
    'overview.case_velocity': '7-Day Case Velocity',
    'overview.vs_prev_week': 'vs prev week',
    'overview.active_cases_total': 'Active Cases Total',
    'overview.patients': 'patients',
    'overview.asha_telemetry': 'Active ASHA Cadre',
    'overview.workers_reporting': 'State Deployed Workforce',
    'overview.field_uploads': 'Digital Pilot Accounts',
    'overview.pilot_registered': 'pilot app accounts',
    'overview.field_cadre_deployed': 'deployed across 36 districts',
    
    // Page Header
    'header.executive_overview': 'Executive Surveillance Overview',
    'header.gis_heatmap': 'GIS Spatiotemporal Heatmap',
    'header.district_matrix': 'District Surveillance Matrix',
    'header.rag_protocols': 'National IDSP Guidelines RAG & Vector Engine',
    'header.phc_buffer': 'Primary Health Centre (PHC) Medical Supplies Buffer',
    'header.incident_feed': 'Incident & LLM Alert Feed',
    'header.gov_bulletin': 'Government Governance Bulletin',
    'header.maharashtra_grid': 'Maharashtra Surveillance Grid',
    'header.rag': 'Medical Guidelines RAG',
    'header.phc': 'PHC Buffer Stock',
    
    // Misc
    'misc.loading': 'Loading District Outbreak Intelligence...',
    'misc.loading_sub': 'Aggregating ASHA case reports, Qdrant vectors & LSTM forecast',
  },
  mr: {
    // Navigation
    'nav.overview': 'दृष्टिक्षेप',
    'nav.overview.desc': 'राज्यस्तरीय सारांश',
    'nav.heatmap': 'प्रादुर्भाव नकाशा',
    'nav.heatmap.desc': 'भौगोलिक-स्थानिक विश्लेषण',
    'nav.districts': 'जिल्हा नियंत्रण कक्ष',
    'nav.districts.desc': 'जिल्हास्तरीय सर्वेक्षण स्थिती',
    'nav.rag': 'वैद्यकीय AI व RAG',
    'nav.rag.desc': 'IDSP/WHO संदर्भ प्रणाली',
    'nav.resources': 'PHC औषधसाठा',
    'nav.resources.desc': 'साहित्य पुरवठा व वाटप',
    'nav.alerts': 'धोक्याच्या सूचना',
    'nav.alerts.desc': 'आपत्कालीन संदेश व एआय (AI) विश्लेषण',
    'nav.reports': 'शासकीय अहवाल',
    'nav.reports.desc': 'अधिकृत परिपत्रके व बुलेटिन',

    // Headers & Branding
    'brand.title': 'आरोग्य प्रहरी',
    'brand.subtitle': 'नियंत्रण कक्ष (Control Room)',
    'brand.tagline': 'सार्वजनिक आरोग्य विभागाचे रिअल-टाइम सर्वेक्षण.',
    'brand.tagline2': 'सार्वजनिक स्वास्थ्य विभाग का रियल-टाइम सर्वेक्षण.',

    // Dashboard Overview
    'overview.monitored_districts': 'सर्वेक्षणाखालील जिल्हे',
    'overview.districts_active': 'बाधित जिल्हे',
    'overview.coverage': 'कार्यक्षेत्र: महाराष्ट्र राज्य',
    'overview.synced': 'रिअल-टाइम डेटा अद्ययावत',
    'overview.high_critical': 'अतिधोकादायक व गंभीर प्रादुर्भाव',
    'overview.dho_action': 'जिल्हा आरोग्य अधिकाऱ्यांची (DHO) त्वरित कार्यवाही अपेक्षित',
    'overview.clusters': 'सक्रिय हॉटस्पॉट',
    'overview.view_feed': 'सविस्तर माहिती पहा',
    'overview.case_velocity': 'रुग्णवाढीचा वेग (मागील ७ दिवस)',
    'overview.vs_prev_week': 'मागील आठवड्याच्या तुलनेत',
    'overview.active_cases_total': 'एकूण उपचाराधीन रुग्ण (Active Cases)',
    'overview.patients': 'रुग्ण',
    'overview.asha_telemetry': 'आशा (ASHA) क्षेत्रीय कर्मचारी वर्ग',
    'overview.workers_reporting': 'एकूण कार्यरत कर्मचारी',
    'overview.field_uploads': 'डिजिटल पायलट खाती',
    'overview.pilot_registered': 'नोंदणीकृत अ‍ॅप खाती',
    'overview.field_cadre_deployed': '३६ जिल्ह्यांमध्ये कार्यरत',

    // Page Header
    'header.executive_overview': 'साथरोग सर्वेक्षण व नियंत्रण अहवाल',
    'header.gis_heatmap': 'भौगोलिक-स्थानिक प्रादुर्भाव नकाशा',
    'header.district_matrix': 'जिल्हास्तरीय सर्वेक्षण व नियंत्रण',
    'header.rag_protocols': 'राष्ट्रीय IDSP वैद्यकीय मार्गदर्शक तत्त्वे व RAG प्रणाली',
    'header.phc_buffer': 'प्राथमिक आरोग्य केंद्र (PHC) औषधसाठा व्यवस्थापन',
    'header.incident_feed': 'आपत्कालीन संदेश व सतर्कता फीड',
    'header.gov_bulletin': 'शासकीय प्रशासन व आरोग्य बुलेटिन',
    'header.maharashtra_grid': 'महाराष्ट्र सार्वजनिक आरोग्य सर्वेक्षण ग्रिड',
    'header.rag': 'वैद्यकीय संदर्भ प्रणाली (Medical Guidelines)',
    'header.phc': 'प्राथमिक आरोग्य केंद्र (PHC) औषधसाठा',

    // Misc
    'misc.loading': 'जिल्हास्तरीय माहिती प्राप्त केली जात आहे...',
    'misc.loading_sub': 'आशा अहवाल, कृत्रिम बुद्धिमत्ता (AI) विश्लेषण आणि अंदाज अद्ययावत करत आहे...',
  },
  hi: {
    // Navigation
    'nav.overview': 'एक नज़र',
    'nav.overview.desc': 'राज्य-स्तरीय सारांश',
    'nav.heatmap': 'प्रकोप मानचित्र',
    'nav.heatmap.desc': 'भौगोलिक-स्थानिक विश्लेषण',
    'nav.districts': 'जिला नियंत्रण कक्ष',
    'nav.districts.desc': 'जिला-स्तरीय निगरानी स्थिति',
    'nav.rag': 'चिकित्सा AI एवं RAG',
    'nav.rag.desc': 'IDSP/WHO संदर्भ इंजन',
    'nav.resources': 'PHC दवा एवं संसाधन',
    'nav.resources.desc': 'दवा स्टॉक व आपातकालीन आपूर्ति',
    'nav.alerts': 'चेतावनियां (Alerts)',
    'nav.alerts.desc': 'आपातकालीन संदेश और एआई (AI) विश्लेषण',
    'nav.reports': 'सरकारी रिपोर्ट',
    'nav.reports.desc': 'आधिकारिक परिपत्र और बुलेटिन',

    // Headers & Branding
    'brand.title': 'आरोग्य प्रहरी',
    'brand.subtitle': 'नियंत्रण कक्ष (Control Room)',
    'brand.tagline': 'सार्वजनिक स्वास्थ्य विभाग का रियल-टाइम सर्वेक्षण.',
    'brand.tagline2': 'सार्वजनिक स्वास्थ्य विभाग का रियल-टाइम सर्वेक्षण.',

    // Dashboard Overview
    'overview.monitored_districts': 'निगरानी के अंतर्गत ज़िले',
    'overview.districts_active': 'प्रभावित ज़िले',
    'overview.coverage': 'कार्यक्षेत्र: महाराष्ट्र राज्य',
    'overview.synced': 'रियल-टाइम डेटा अद्यतन',
    'overview.high_critical': 'अति-गंभीर प्रकोप (High Risk)',
    'overview.dho_action': 'जिला स्वास्थ्य अधिकारी (DHO) की त्वरित कार्रवाई अपेक्षित',
    'overview.clusters': 'सक्रिय हॉटस्पॉट',
    'overview.view_feed': 'विस्तृत जानकारी देखें',
    'overview.case_velocity': 'संक्रमण दर (पिछले 7 दिन)',
    'overview.vs_prev_week': 'पिछले सप्ताह की तुलना में',
    'overview.active_cases_total': 'कुल उपचाराधीन मरीज़ (Active Cases)',
    'overview.patients': 'मरीज़',
    'overview.asha_telemetry': 'आशा (ASHA) क्षेत्रीय कार्यबल',
    'overview.workers_reporting': 'कुल तैनात कार्यबल',
    'overview.field_uploads': 'डिजिटल पायलट खाते',
    'overview.pilot_registered': 'पंजीकृत ऐप खाते',
    'overview.field_cadre_deployed': '36 ज़िलों में तैनात',

    // Page Header
    'header.executive_overview': 'महामारी निगरानी एवं नियंत्रण सारांश',
    'header.gis_heatmap': 'भौगोलिक-स्थानिक प्रकोप मानचित्र',
    'header.district_matrix': 'जिला-स्तरीय निगरानी तंत्र',
    'header.rag_protocols': 'राष्ट्रीय IDSP चिकित्सा दिशानिर्देश एवं RAG इंजन',
    'header.phc_buffer': 'प्राथमिक स्वास्थ्य केंद्र (PHC) दवा स्टॉक प्रबंधन',
    'header.incident_feed': 'आपातकालीन संदेश और चेतावनी फीड',
    'header.gov_bulletin': 'सरकारी प्रशासन एवं स्वास्थ्य बुलेटिन',
    'header.maharashtra_grid': 'महाराष्ट्र सार्वजनिक स्वास्थ्य निगरानी ग्रिड',
    'header.rag': 'चिकित्सा संदर्भ प्रणाली (Medical Guidelines)',
    'header.phc': 'प्राथमिक स्वास्थ्य केंद्र (PHC) दवा स्टॉक',

    // Misc
    'misc.loading': 'जिला-स्तरीय डेटा प्राप्त किया जा रहा है...',
    'misc.loading_sub': 'आशा रिपोर्ट, एआई (AI) विश्लेषण और पूर्वानुमान अद्यतन किया जा रहा है...',
  }
};

type Translations = typeof translations.en;
type TranslationKeys = keyof Translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key]
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('arogya-lang') as Language;
    if (saved && ['en', 'mr', 'hi'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('arogya-lang', lang);
  };

  const t = (key: TranslationKeys) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
