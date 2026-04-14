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
  },
};

export function useStrings(lang: LanguageCode): UIStrings {
  return strings[lang] ?? strings['hi-IN'];
}
