import 'package:flutter_riverpod/flutter_riverpod.dart';

class LanguageState {
  final String languageCode; // 'en', 'mr', 'hi'
  final String languageName; // 'English', 'मराठी', 'हिंदी'

  const LanguageState({
    required this.languageCode,
    required this.languageName,
  });
}

class LanguageNotifier extends StateNotifier<LanguageState> {
  LanguageNotifier()
      : super(const LanguageState(
          languageCode: 'en',
          languageName: 'English',
        ));

  void setLanguage(String code) {
    switch (code) {
      case 'mr':
        state = const LanguageState(
          languageCode: 'mr',
          languageName: 'मराठी',
        );
        break;
      case 'hi':
        state = const LanguageState(
          languageCode: 'hi',
          languageName: 'हिंदी',
        );
        break;
      case 'en':
      default:
        state = const LanguageState(
          languageCode: 'en',
          languageName: 'English',
        );
        break;
    }
  }

  String translate(String key) {
    final translations = _appTranslations[key];
    if (translations == null) return key;
    return translations[state.languageCode] ?? translations['en'] ?? key;
  }
}

final languageProvider = StateNotifierProvider<LanguageNotifier, LanguageState>((ref) {
  return LanguageNotifier();
});

const Map<String, Map<String, String>> _appTranslations = {
  // --- APP & NAVIGATION ---
  'app_title': {
    'en': 'Arogya Prahari',
    'mr': 'आरोग्य प्रहरी',
    'hi': 'आरोग्य प्रहरी',
  },
  'nav_home': {
    'en': 'Home',
    'mr': 'मुख्यपृष्ठ',
    'hi': 'होम',
  },
  'nav_report': {
    'en': 'New Report',
    'mr': 'नवीन तपासणी',
    'hi': 'नई जांच',
  },
  'nav_history': {
    'en': 'Log History',
    'mr': 'नोंद इतिहास',
    'hi': 'लॉग इतिहास',
  },
  'nav_guide': {
    'en': 'Clinical Guide',
    'mr': 'मार्गदर्शन',
    'hi': 'मार्गदर्शन',
  },
  'nav_profile': {
    'en': 'Profile',
    'mr': 'माझे प्रोफाइल',
    'hi': 'मेरी प्रोफ़ाइल',
  },

  // --- HOME SCREEN ---
  'greeting_morning': {
    'en': 'Good Morning,',
    'mr': 'शुभ प्रभात,',
    'hi': 'शुभ प्रभात,',
  },
  'pending_sync': {
    'en': 'Pending Sync',
    'mr': 'सिंक बाकी',
    'hi': 'सिंक बाकी',
  },
  'gps_active': {
    'en': 'GPS Active',
    'mr': 'GPS सुरू आहे',
    'hi': 'GPS सक्रिय',
  },
  'start_screening_title': {
    'en': 'New Case Screening',
    'mr': 'नवीन रुग्ण तपासणी',
    'hi': 'नई मरीज़ जांच',
  },
  'start_screening_desc': {
    'en': 'Log symptoms, evaluate triage risk & get immediate clinical guidance.',
    'mr': 'लक्षणे नोंदवा, धोका पातळी तपासा व त्वरित उपचार मार्गदर्शन मिळवा.',
    'hi': 'लक्षण दर्ज करें, जोखिम स्तर जांचें और तत्काल उपचार मार्गदर्शन प्राप्त करें.',
  },
  'start_screening_btn': {
    'en': 'Start Patient Intake',
    'mr': 'तपासणी सुरू करा',
    'hi': 'जांच शुरू करें',
  },
  'sos_banner_title': {
    'en': 'Emergency Outbreak SOS',
    'mr': 'तातडीची मदत (SOS)',
    'hi': 'आपातकालीन सहायता (SOS)',
  },
  'sos_banner_desc': {
    'en': 'One-tap alert to District Command Center & nearby PHC doctors during outbreaks.',
    'mr': 'रोगाच्या उद्रेकावेळी जिल्हा नियंत्रण कक्ष व जवळच्या डॉक्टरांना तत्काळ संदेश पाठवा.',
    'hi': 'प्रकोप के समय जिला नियंत्रण कक्ष और डॉक्टरों को तत्काल आपातकालीन संदेश भेजें.',
  },
  'trigger_sos': {
    'en': 'Trigger SOS Alert',
    'mr': 'SOS सूचना पाठवा',
    'hi': 'SOS अलर्ट भेजें',
  },
  'weekly_activity': {
    'en': 'Weekly Screening Activity',
    'mr': 'साप्ताहिक तपासणी नोंदी',
    'hi': 'साप्ताहिक जांच गतिविधि',
  },
  'risk_distribution': {
    'en': 'Triage Risk Distribution',
    'mr': 'रुग्ण धोका वर्गीकरण',
    'hi': 'मरीज़ जोखिम वर्गीकरण',
  },

  // --- PATIENT INTAKE (STEPS 1-6) ---
  'step_1_title': {
    'en': 'Step 1 of 6: Patient Basics',
    'mr': 'पायरी १/६: रुग्णाची प्राथमिक माहिती',
    'hi': 'चरण 1/6: मरीज़ की बुनियादी जानकारी',
  },
  'patient_name': {
    'en': 'Patient Full Name',
    'mr': 'रुग्णाचे पूर्ण नाव',
    'hi': 'मरीज़ का पूरा नाम',
  },
  'age': {
    'en': 'Age (Years)',
    'mr': 'वय (वर्षे)',
    'hi': 'उम्र (वर्ष)',
  },
  'gender': {
    'en': 'Gender',
    'mr': 'लिंग',
    'hi': 'लिंग',
  },
  'male': {
    'en': 'Male',
    'mr': 'पुरुष',
    'hi': 'पुरुष',
  },
  'female': {
    'en': 'Female',
    'mr': 'महिला',
    'hi': 'महिला',
  },
  'other': {
    'en': 'Other',
    'mr': 'इतर',
    'hi': 'अन्य',
  },
  'contact_number': {
    'en': 'Mobile / Contact Number',
    'mr': 'मोबाईल / संपर्क क्रमांक',
    'hi': 'मोबाइल / संपर्क नंबर',
  },
  'village_phc': {
    'en': 'Village / Wasti',
    'mr': 'गाव / वस्ती',
    'hi': 'गाँव / बस्ती',
  },
  'next_btn': {
    'en': 'Next Step',
    'mr': 'पुढे जा',
    'hi': 'आगे बढ़ें',
  },
  'back_btn': {
    'en': 'Back',
    'mr': 'मागे',
    'hi': 'पीछे',
  },

  // --- SYMPTOMS ---
  'step_2_title': {
    'en': 'Step 2 of 6: Symptoms Selection',
    'mr': 'पायरी २/६: लक्षणे निवडा',
    'hi': 'चरण 2/6: लक्षण चुनें',
  },
  'select_symptoms_desc': {
    'en': 'Tap all symptoms currently reported by the patient:',
    'mr': 'रुग्णामध्ये आढळलेली सर्व लक्षणे निवडा:',
    'hi': 'मरीज़ में पाए जाने वाले सभी लक्षण चुनें:',
  },
  'sym_fever': {
    'en': 'High Fever',
    'mr': 'तीव्र ताप',
    'hi': 'तेज़ बुखार',
  },
  'sym_diarrhea': {
    'en': 'Watery Diarrhea',
    'mr': 'पातळ जुलाब',
    'hi': 'दस्त (डायरिया)',
  },
  'sym_vomiting': {
    'en': 'Vomiting',
    'mr': 'उलट्या',
    'hi': 'उल्टी',
  },
  'sym_dehydration': {
    'en': 'Severe Dehydration',
    'mr': 'तीव्र डिहायड्रेशन',
    'hi': 'गंभीर निर्जलीकरण',
  },
  'sym_abdominal_pain': {
    'en': 'Abdominal Pain',
    'mr': 'पोटात दुखणे',
    'hi': 'पेट दर्द',
  },
  'sym_rash': {
    'en': 'Skin Rash',
    'mr': 'अंगावर पुरळ',
    'hi': 'त्वचा पर चकत्ते',
  },
  'sym_body_ache': {
    'en': 'Body Ache / Joint Pain',
    'mr': 'अंगदुखी / सांधेदुखी',
    'hi': 'बदन दर्द / जोड़ों का दर्द',
  },
  'sym_cough': {
    'en': 'Cough & Cold',
    'mr': 'खोकला आणि सर्दी',
    'hi': 'खांसी और जुकाम',
  },
  'sym_breathless': {
    'en': 'Breathing Difficulty',
    'mr': 'श्वास घेण्यास त्रास',
    'hi': 'सांस लेने में कठिनाई',
  },
  'sym_lethargy': {
    'en': 'Lethargy / Drowsiness',
    'mr': 'सुस्ती व तीव्र थकवा',
    'hi': 'सुस्ती और कमजोरी',
  },
  'custom_symptom_hint': {
    'en': 'Add other custom symptom...',
    'mr': 'इतर लक्षण लिहा...',
    'hi': 'अन्य लक्षण दर्ज करें...',
  },

  // --- DURATION & VITALS ---
  'step_3_title': {
    'en': 'Step 3 of 6: Duration & Temperature',
    'mr': 'पायरी ३/६: आजाराचे दिवस व तापमान',
    'hi': 'चरण 3/6: बीमारी की अवधि व तापमान',
  },
  'duration_days': {
    'en': 'Symptom Duration (Days)',
    'mr': 'आजाराचे दिवस (कालावधी)',
    'hi': 'लक्षणों की अवधि (दिन)',
  },
  'body_temperature': {
    'en': 'Body Temperature (°F)',
    'mr': 'शरीराचे तापमान (°F)',
    'hi': 'शरीर का तापमान (°F)',
  },

  // --- MEDICAL BACKGROUND ---
  'step_4_title': {
    'en': 'Step 4 of 6: Medical History',
    'mr': 'पायरी ४/६: वैद्यकीय पार्श्वभूमी',
    'hi': 'चरण 4/6: चिकित्सीय इतिहास',
  },
  'comorbidities': {
    'en': 'Existing Conditions / Comorbidities',
    'mr': 'आधीचे आजार किंवा विशेष स्थिती',
    'hi': 'पहले से मौजूद बीमारियां या स्थिति',
  },

  // --- CLINICAL IMAGE ---
  'step_5_title': {
    'en': 'Step 5 of 6: Clinical Photo (Optional)',
    'mr': 'पायरी ५/६: फोटो जोडा (पर्यायी)',
    'hi': 'चरण 5/6: नैदानिक फोटो (वैकल्पिक)',
  },

  // --- REVIEW & TRIAGE ---
  'step_6_title': {
    'en': 'Step 6 of 6: Review Report',
    'mr': 'पायरी ६/६: अहवाल तपासा व जमा करा',
    'hi': 'चरण 6/6: रिपोर्ट समीक्षा और जमा करें',
  },
  'submit_triage_btn': {
    'en': 'Submit & Evaluate Triage',
    'mr': 'अहवाल सादर करा व वर्गीकरण करा',
    'hi': 'रिपोर्ट जमा करें और ट्राइएज देखें',
  },
  'triage_result_title': {
    'en': 'Triage Classification Result',
    'mr': 'रुग्ण वर्गीकरण निकाल (Triage)',
    'hi': 'ट्राइएज वर्गीकरण परिणाम',
  },
  'risk_low': {
    'en': 'Low Risk (Green Tier)',
    'mr': 'कमी धोका (हिरवा स्तर)',
    'hi': 'कम जोखिम (हरा स्तर)',
  },
  'risk_mod': {
    'en': 'Moderate Risk (Amber Tier)',
    'mr': 'मध्यम धोका (पिवळा स्तर)',
    'hi': 'मध्यम जोखिम (पीला स्तर)',
  },
  'risk_high': {
    'en': 'High Risk - Outbreak Alert (Red Tier)',
    'mr': 'अति धोकादायक - तत्काळ संदर्भ सेवा (लाल स्तर)',
    'hi': 'उच्च जोखिम - तत्काल रेफरल (लाल स्तर)',
  },
  'save_report_btn': {
    'en': 'Save & Sync Report',
    'mr': 'अहवाल जतन करा व सिंक करा',
    'hi': 'रिपोर्ट सहेजें और सिंक करें',
  },
  'view_guidance_btn': {
    'en': 'View Clinical Protocol',
    'mr': 'उपचार मार्गदर्शक पहा',
    'hi': 'उपचार निर्देश देखें',
  },

  // --- HISTORY & SYNC ---
  'sync_now': {
    'en': 'Sync Now',
    'mr': 'आत्ताच सिंक करा',
    'hi': 'अभी सिंक करें',
  },
  'sync_complete': {
    'en': 'Sync Complete! All reports sent to Central Server.',
    'mr': 'सिंक पूर्ण! सर्व अहवाल मुख्य सर्व्हरवर पाठवले गेले.',
    'hi': 'सिंक पूरा हुआ! सभी रिपोर्ट केंद्रीय सर्वर पर भेज दी गईं.',
  },
  'online': {
    'en': 'Online',
    'mr': 'ऑनलाइन',
    'hi': 'ऑनलाइन',
  },
  'offline': {
    'en': 'Offline',
    'mr': 'ऑफलाइन',
    'hi': 'ऑफलाइन',
  },

  // --- CLINICAL ASSISTANT ---
  'assistant_title': {
    'en': 'Clinical AI Assistant',
    'mr': 'क्लिनिकल AI सहाय्यक',
    'hi': 'क्लिनिकल AI सहायक',
  },
  'ask_hint': {
    'en': 'Ask clinical guidance question...',
    'mr': 'उपचार किंवा लक्षण मार्गदर्शनाबद्दल विचारा...',
    'hi': 'उपचार या दिशानिर्देशों के बारे में पूछें...',
  },

  // --- PROFILE & SETTINGS ---
  'profile': {
    'en': 'Profile',
    'mr': 'माझे प्रोफाइल',
    'hi': 'मेरी प्रोफ़ाइल',
  },
  'achievements': {
    'en': 'Achievements & Activity',
    'mr': 'कामगिरी व दैनंदिन नोंदी',
    'hi': 'उपलब्धियां और दैनिक कार्य',
  },
  'report_history': {
    'en': 'Report History',
    'mr': 'रुग्ण अहवाल इतिहास',
    'hi': 'रिपोर्ट इतिहास',
  },
  'view_report_history': {
    'en': 'View Report History',
    'mr': 'सर्व रुग्ण अहवाल पहा',
    'hi': 'सभी रिपोर्ट देखें',
  },
  'archive_desc': {
    'en': 'Search, filter, and review submitted patients',
    'mr': 'नोंदवलेल्या रुग्णांची संपूर्ण यादी व शोध',
    'hi': 'दर्ज किए गए मरीज़ों की सूची और खोज',
  },
  'settings': {
    'en': 'App Settings',
    'mr': 'अ‍ॅप सेटिंग्ज',
    'hi': 'ऐप सेटिंग्स',
  },
  'language': {
    'en': 'Language / भाषा',
    'mr': 'भाषा / Language',
    'hi': 'भाषा / Language',
  },
  'logout': {
    'en': 'Logout',
    'mr': 'लॉग आउट करा',
    'hi': 'लॉग आउट करें',
  },
};
