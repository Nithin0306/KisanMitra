// language.ts — UI string translations for all supported languages.
// Only UI chrome strings live here. Response text comes from the backend (already translated).

import { LanguageCode } from './constants';

type UIStrings = {
  micHint: string;
  listening: string;
  thinking: string;
  tapToSpeak: string;
  cropCard: string;
  marketCard: string;
  schemeCard: string;
  riskLabel: string;
  decisionLabel: string;
  lastUpdated: string;
  tryAgain: string;
  selectLanguage: string;
  errorNetwork: string;
  errorLowAudio: string;
  sellNow: string;
  waitLabel: string;
  unknown: string;
  eligibility: string;
  learnMore: string;
  // Landing page
  landingBadge: string;
  landingTitle: string;
  landingTitleHighlight: string;
  landingSubtitle: string;
  landingCta: string;
  landingCtaSub: string;
  landingHowLabel: string;
  landingSwipeHint: string;
  // Feature slides
  feat1Title: string; feat1Desc: string;
  feat2Title: string; feat2Desc: string;
  feat3Title: string; feat3Desc: string;
  feat4Title: string; feat4Desc: string;
};

const strings: Record<LanguageCode, UIStrings> = {
  'hi-IN': {
    micHint: 'बोलने के लिए दबाएं',
    listening: 'सुन रहा हूँ...',
    thinking: 'सोच रहा हूँ...',
    tapToSpeak: 'बोलें',
    cropCard: 'फसल सुझाव',
    marketCard: 'मंडी भाव',
    schemeCard: 'सरकारी योजना',
    riskLabel: 'जोखिम',
    decisionLabel: 'सलाह',
    lastUpdated: 'अंतिम अपडेट',
    tryAgain: 'फिर से बोलें',
    selectLanguage: 'भाषा चुनें',
    errorNetwork: 'नेटवर्क नहीं है। बाद में कोशिश करें।',
    errorLowAudio: 'आवाज़ स्पष्ट नहीं आई। फिर से बोलें।',
    sellNow: 'अभी बेचें',
    waitLabel: 'रुकें',
    unknown: 'जानकारी उपलब्ध नहीं',
    eligibility: 'पात्रता',
    learnMore: 'और जानें',
    landingBadge: '✨ खेती के भविष्य में आपका स्वागत है',
    landingTitle: 'किसान',
    landingTitleHighlight: 'मित्र',
    landingSubtitle: 'आपका AI कृषि सहायक। आवाज़ से चलाएं, गलत सलाह से मुक्त।',
    landingCta: 'सहायक आज़माएं 🎙️',
    landingCtaSub: 'बिना साइन-अप के। किसानों के लिए मुफ़्त।',
    landingHowLabel: 'यह कैसे काम करता है',
    landingSwipeHint: '← स्वाइप करें →',
    feat1Title: 'किसी भी भाषा में बोलें',
    feat1Desc: 'किसानमित्र हिंदी, तमिल, तेलुगु, कन्नड़, मराठी और पंजाबी समझता है। बस टैप करें और बोलें।',
    feat2Title: 'सही फसल चुनें',
    feat2Desc: 'हम 14 दिनों का लाइव मौसम पूर्वानुमान और मिट्टी के प्रकार से शीर्ष 3 सुरक्षित फसलें बताते हैं।',
    feat3Title: 'सही समय पर बेचें',
    feat3Desc: 'अग्रमार्केट से लाइव भाव। हम 3-दिन और 7-दिन का औसत निकालकर SELL, WAIT या HOLD बताते हैं।',
    feat4Title: 'सरकारी योजनाएं खोजें',
    feat4Desc: 'आपके राज्य, फसल और ज़मीन के आधार पर पात्र योजनाएं तुरंत मिलती हैं।',
  },
  'ta-IN': {
    micHint: 'பேச அழுத்தவும்',
    listening: 'கேட்கிறேன்...',
    thinking: 'யோசிக்கிறேன்...',
    tapToSpeak: 'பேசுங்கள்',
    cropCard: 'பயிர் பரிந்துரை',
    marketCard: 'சந்தை விலை',
    schemeCard: 'அரசு திட்டம்',
    riskLabel: 'ஆபத்து',
    decisionLabel: 'ஆலோசனை',
    lastUpdated: 'கடைசியாக புதுப்பிக்கப்பட்டது',
    tryAgain: 'மீண்டும் பேசுங்கள்',
    selectLanguage: 'மொழி தேர்வு',
    errorNetwork: 'இணைப்பு இல்லை. பின்னர் முயற்சிக்கவும்.',
    errorLowAudio: 'குரல் தெளிவாக இல்லை. மீண்டும் பேசுங்கள்.',
    sellNow: 'இப்போது விற்கவும்',
    waitLabel: 'காத்திருங்கள்',
    unknown: 'தகவல் இல்லை',
    eligibility: 'தகுதி',
    learnMore: 'மேலும் அறிக',
    landingBadge: '✨ விவசாயத்தின் எதிர்காலத்திற்கு வரவேற்கிறோம்',
    landingTitle: 'கிசான்',
    landingTitleHighlight: 'மித்ரா',
    landingSubtitle: 'உங்கள் AI விவசாய உதவியாளர். குரல் மூலம் பேசுங்கள், நம்பகமான ஆலோசனை பெறுங்கள்.',
    landingCta: 'உதவியாளரை முயற்சிக்கவும் 🎙️',
    landingCtaSub: 'பதிவு இல்லை. விவசாயிகளுக்கு இலவசம்.',
    landingHowLabel: 'எவ்வாறு செயல்படுகிறது',
    landingSwipeHint: '← ஸ்வைப் செய்யுங்கள் →',
    feat1Title: 'எந்த மொழியிலும் பேசுங்கள்',
    feat1Desc: 'KisanMitra தமிழ், ஹிந்தி, தெலுங்கு, கன்னடம், மராத்தி மற்றும் பஞ்சாபி புரிந்துகொள்கிறது.',
    feat2Title: 'சரியான பயிரை தேர்வு செய்யுங்கள்',
    feat2Desc: '14 நாள் வானிலை மற்றும் மண் வகையை பயன்படுத்தி சிறந்த 3 பயிர்கள் பரிந்துரைக்கப்படும்.',
    feat3Title: 'சரியான நேரத்தில் விற்கவும்',
    feat3Desc: 'நேரடி சந்தை விலை. 3 மற்றும் 7 நாள் சராசரி கணக்கிட்டு SELL, WAIT அல்லது HOLD சொல்கிறோம்.',
    feat4Title: 'அரசு திட்டங்களை கண்டறியுங்கள்',
    feat4Desc: 'உங்கள் மாநிலம், பயிர் மற்றும் நில அளவின் அடிப்படையில் பொருத்தமான திட்டங்கள் உடனடியாக கிடைக்கும்.',
  },
  'te-IN': {
    micHint: 'మాట్లాడటానికి నొక్కండి',
    listening: 'వింటున్నాను...',
    thinking: 'ఆలోచిస్తున్నాను...',
    tapToSpeak: 'మాట్లాడండి',
    cropCard: 'పంట సూచన',
    marketCard: 'మార్కెట్ ధర',
    schemeCard: 'ప్రభుత్వ పథకం',
    riskLabel: 'ప్రమాదం',
    decisionLabel: 'సలహా',
    lastUpdated: 'చివరిగా నవీకరించబడింది',
    tryAgain: 'మళ్లీ మాట్లాడండి',
    selectLanguage: 'భాష ఎంచుకోండి',
    errorNetwork: 'నెట్‌వర్క్ లేదు. తర్వాత ప్రయత్నించండి.',
    errorLowAudio: 'స్పష్టంగా వినబడలేదు. మళ్లీ మాట్లాడండి.',
    sellNow: 'ఇప్పుడు అమ్మండి',
    waitLabel: 'వేచి ఉండండి',
    unknown: 'సమాచారం అందుబాటులో లేదు',
    eligibility: 'అర్హత',
    learnMore: 'మరింత తెలుసుకోండి',
    landingBadge: '✨ వ్యవసాయ భవిష్యత్తుకు స్వాగతం',
    landingTitle: 'కిసాన్',
    landingTitleHighlight: 'మిత్ర',
    landingSubtitle: 'మీ AI వ్యవసాయ సహాయకుడు. గొంతుతో మాట్లాడండి, నమ్మకమైన సలహా పొందండి.',
    landingCta: 'అసిస్టెంట్‌ని ప్రయత్నించండి 🎙️',
    landingCtaSub: 'సైన్-అప్ అవసరం లేదు. రైతులకు ఉచితం.',
    landingHowLabel: 'ఇది ఎలా పనిచేస్తుంది',
    landingSwipeHint: '← స్వైప్ చేయండి →',
    feat1Title: 'ఏ భాషలోనైనా మాట్లాడండి',
    feat1Desc: 'KisanMitra తెలుగు, హిందీ, తమిళం, కన్నడ, మరాఠీ మరియు పంజాబీ అర్థం చేసుకుంటుంది.',
    feat2Title: 'సరైన పంట ఎంచుకోండి',
    feat2Desc: '14 రోజుల లైవ్ వాతావరణ సూచన మరియు మీ నేల రకం ఆధారంగా అగ్ర 3 పంటలు సూచిస్తాం.',
    feat3Title: 'సరైన సమయంలో అమ్మండి',
    feat3Desc: 'లైవ్ మార్కెట్ ధరలు. 3 మరియు 7 రోజుల సగటు లెక్కించి SELL, WAIT లేదా HOLD చెప్తాం.',
    feat4Title: 'ప్రభుత్వ పథకాలు కనుగొనండి',
    feat4Desc: 'మీ రాష్ట్రం, పంట మరియు భూమి ఆధారంగా అర్హమైన పథకాలు వెంటనే చూపిస్తాం.',
  },
  'kn-IN': {
    micHint: 'ಮಾತನಾಡಲು ಒತ್ತಿರಿ',
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
    tapToSpeak: 'ಮಾತನಾಡಿ',
    cropCard: 'ಬೆಳೆ ಶಿಫಾರಸು',
    marketCard: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ',
    schemeCard: 'ಸರ್ಕಾರಿ ಯೋಜನೆ',
    riskLabel: 'ಅಪಾಯ',
    decisionLabel: 'ಸಲಹೆ',
    lastUpdated: 'ಕೊನೆಯ ಅಪ್‌ಡೇಟ್',
    tryAgain: 'ಮತ್ತೆ ಮಾತನಾಡಿ',
    selectLanguage: 'ಭಾಷೆ ಆರಿಸಿ',
    errorNetwork: 'ನೆಟ್‌ವರ್ಕ್ ಇಲ್ಲ. ನಂತರ ಪ್ರಯತ್ನಿಸಿ.',
    errorLowAudio: 'ಧ್ವನಿ ಸ್ಪಷ್ಟವಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ.',
    sellNow: 'ಈಗ ಮಾರಿ',
    waitLabel: 'ಕಾಯಿರಿ',
    unknown: 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ',
    eligibility: 'ಅರ್ಹತೆ',
    learnMore: 'ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
    landingBadge: '✨ ಕೃಷಿಯ ಭವಿಷ್ಯಕ್ಕೆ ಸ್ವಾಗತ',
    landingTitle: 'ಕಿಸಾನ್',
    landingTitleHighlight: 'ಮಿತ್ರ',
    landingSubtitle: 'ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ, ವಿಶ್ವಾಸಾರ್ಹ ಸಲಹೆ ಪಡೆಯಿರಿ.',
    landingCta: 'ಸಹಾಯಕ ಪ್ರಯತ್ನಿಸಿ 🎙️',
    landingCtaSub: 'ಸೈನ್-ಅಪ್ ಇಲ್ಲ. ರೈತರಿಗೆ ಉಚಿತ.',
    landingHowLabel: 'ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    landingSwipeHint: '← ಸ್ವೈಪ್ ಮಾಡಿ →',
    feat1Title: 'ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ',
    feat1Desc: 'KisanMitra ಕನ್ನಡ, ಹಿಂದಿ, ತಮಿಳು, ತೆಲುಗು, ಮರಾಠಿ ಮತ್ತು ಪಂಜಾಬಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತದೆ.',
    feat2Title: 'ಸರಿಯಾದ ಬೆಳೆ ಆರಿಸಿ',
    feat2Desc: '14 ದಿನಗಳ ಲೈವ್ ಹವಾಮಾನ ಮತ್ತು ಮಣ್ಣಿನ ಪ್ರಕಾರ ಆಧರಿಸಿ ಅಗ್ರ 3 ಬೆಳೆಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡುತ್ತೇವೆ.',
    feat3Title: 'ಸರಿಯಾದ ಸಮಯದಲ್ಲಿ ಮಾರಿ',
    feat3Desc: 'ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ. 3 ಮತ್ತು 7 ದಿನಗಳ ಸರಾಸರಿ ಲೆಕ್ಕಿಸಿ SELL, WAIT ಅಥವಾ HOLD ಹೇಳುತ್ತೇವೆ.',
    feat4Title: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ',
    feat4Desc: 'ನಿಮ್ಮ ರಾಜ್ಯ, ಬೆಳೆ ಮತ್ತು ಭೂಮಿ ಆಧಾರದ ಮೇಲೆ ಅರ್ಹ ಯೋಜನೆಗಳನ್ನು ತಕ್ಷಣ ತೋರಿಸುತ್ತೇವೆ.',
  },
  'mr-IN': {
    micHint: 'बोलण्यासाठी दाबा',
    listening: 'ऐकत आहे...',
    thinking: 'विचार करत आहे...',
    tapToSpeak: 'बोला',
    cropCard: 'पीक शिफारस',
    marketCard: 'बाजारभाव',
    schemeCard: 'सरकारी योजना',
    riskLabel: 'जोखीम',
    decisionLabel: 'सल्ला',
    lastUpdated: 'शेवटचे अपडेट',
    tryAgain: 'पुन्हा बोला',
    selectLanguage: 'भाषा निवडा',
    errorNetwork: 'नेटवर्क नाही. नंतर प्रयत्न करा.',
    errorLowAudio: 'आवाज स्पष्ट नाही. पुन्हा बोला.',
    sellNow: 'आता विका',
    waitLabel: 'थांबा',
    unknown: 'माहिती उपलब्ध नाही',
    eligibility: 'पात्रता',
    learnMore: 'अधिक जाणून घ्या',
    landingBadge: '✨ शेतीच्या भविष्यात आपले स्वागत आहे',
    landingTitle: 'किसान',
    landingTitleHighlight: 'मित्र',
    landingSubtitle: 'तुमचा AI कृषी सहाय्यक. आवाजाने वापरा, विश्वासार्ह सल्ला मिळवा.',
    landingCta: 'सहाय्यक वापरून पाहा 🎙️',
    landingCtaSub: 'साइन-अप नाही. शेतकऱ्यांसाठी मोफत.',
    landingHowLabel: 'हे कसे काम करते',
    landingSwipeHint: '← स्वाइप करा →',
    feat1Title: 'कोणत्याही भाषेत बोला',
    feat1Desc: 'KisanMitra मराठी, हिंदी, तमिळ, तेलुगू, कन्नड आणि पंजाबी समजतो.',
    feat2Title: 'योग्य पीक निवडा',
    feat2Desc: '14 दिवसांचे थेट हवामान अंदाज आणि मातीच्या प्रकारावर आधारित शीर्ष 3 पिके सुचवतो.',
    feat3Title: 'योग्य वेळी विका',
    feat3Desc: 'थेट बाजारभाव. 3 आणि 7 दिवसांचे सरासरी काढून SELL, WAIT किंवा HOLD सांगतो.',
    feat4Title: 'सरकारी योजना शोधा',
    feat4Desc: 'तुमचे राज्य, पीक आणि जमिनीनुसार पात्र योजना त्वरित दाखवतो.',
  },
  'en-IN': {
    micHint: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Thinking...',
    tapToSpeak: 'Speak',
    cropCard: 'Crop Suggestion',
    marketCard: 'Market Price',
    schemeCard: 'Govt Scheme',
    riskLabel: 'Risk',
    decisionLabel: 'Advice',
    lastUpdated: 'Last updated',
    tryAgain: 'Try again',
    selectLanguage: 'Select language',
    errorNetwork: 'No network. Try later.',
    errorLowAudio: 'Audio unclear. Please repeat.',
    sellNow: 'Sell Now',
    waitLabel: 'Wait',
    unknown: 'Info unavailable',
    eligibility: 'Eligibility',
    learnMore: 'Learn more',
    landingBadge: '✨ Welcome to the Future of Farming',
    landingTitle: 'Kisan',
    landingTitleHighlight: 'Mitra',
    landingSubtitle: 'Your AI-powered agricultural assistant. Voice-first, hallucination-free, and designed to help you maximize your yield.',
    landingCta: 'Try the Assistant 🎙️',
    landingCtaSub: 'No sign-up required. Free for farmers.',
    landingHowLabel: 'HOW IT WORKS',
    landingSwipeHint: '← Swipe to explore →',
    feat1Title: 'Speak in Any Language',
    feat1Desc: 'KisanMitra understands Hindi, Tamil, Telugu, Kannada, Marathi, and Punjabi. Just tap and talk — no typing, no menus.',
    feat2Title: 'Get the Right Crop',
    feat2Desc: 'We fetch live 14-day weather forecasts and combine them with your soil type to recommend the top 3 safest, most profitable crops.',
    feat3Title: 'Sell at the Right Time',
    feat3Desc: 'Live market prices from Agmarknet. We compute 3-day and 7-day moving averages and tell you exactly: SELL, WAIT, or HOLD.',
    feat4Title: 'Find Govt Schemes for You',
    feat4Desc: "Instantly matched to your state, crop, and land size. We surface government schemes you're eligible for — no forms, just answers.",
  },
};

export function useStrings(lang: LanguageCode): UIStrings {
  return strings[lang] ?? strings['hi-IN'];
}
