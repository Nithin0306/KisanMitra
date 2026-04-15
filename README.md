# 🌾 KisanMitra - Farmer's Voice Assistant

KisanMitra is a voice-first, AI-powered agricultural assistant designed for Indian farmers. It bridges the digital literacy gap by natively speaking to farmers in their local languages (Hindi, Tamil, Telugu, Kannada, Marathi, Punjabi) and answering their critical agricultural questions relating to crop recommendations, volatile market prices, and government scheme eligibility.

## ✨ Current Features

- **🗣️ Voice-First Interaction**: Integrated with [Sarvam AI's](https://www.sarvam.ai) `saaras:v3` Speech-to-Text inference to seamlessly transcribe rural languages.
- **🧠 Hybrid AI Architecture**: Uses **Google Gemini** for intent extraction and human-friendly explanation generation, paired with strict deterministic Python rule-engines that guarantee accurate, hallucination-free agricultural advice.
- **🌱 Crop Recommendations**: Dynamic crop evaluations based on soil types, fetching live weather forecasts via Open-Meteo, and comparing against custom agricultural rules.
- **📈 Market Prices**: Fetches and performs trend analysis, confidence scoring, and moving averages to tell farmers whether to 'SELL', 'WAIT', or 'HOLD', helping maximize their profit margins.
- **🏛️ Scheme Matching**: Matches farmers to state and national agricultural schemes based on land holding size, crops grown, and geography.
- **📱 Mobile App**: A React Native (Expo) mobile frontend optimized for lower-end Android devices with tactile audio feedback and clean UI.

---

## 🛠️ Tech Stack
- **Frontend**: React Native, Expo, StyleSheet
- **Backend**: FastAPI, Python, SQLAlchemy
- **Databases**: PostgreSQL (Main DB), Redis (API rate limit & caching)
- **AI/LLM**: Google Gemini (`google-generativeai`)
- **Speech-to-Text**: Sarvam AI (`saaras:v3`)

---

## 🚀 How to Run Locally

### 1. Pre-requisites
- **Node.js**: v18+ 
- **Python**: v3.11+ 
- **Docker**: For running PostgreSQL and Redis containers.

### 2. Backend Setup
1. Navigate into the backend repository.
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment.
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies.
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the Environment Variables by copying the example env.
   ```bash
   cp .env.example .env
   # Ensure you set your GEMINI_API_KEY inside the .env file!
   ```
5. Spin up the infrastructure using Docker Compose.
   ```bash
   docker-compose up -d
   ```
6. Run the FastAPI Application.
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory.
   ```bash
   cd frontend
   ```
2. Install npm dependencies.
   ```bash
   npm install
   ```
3. Set your environment variables by copying the example.
   ```bash
   cp .env.example .env
   ```
   **Important:** 
   - Add your [Sarvam AI Key](https://developer.sarvam.ai) to `EXPO_PUBLIC_SARVAM_API_KEY`.
   - Update `EXPO_PUBLIC_API_BASE_URL` depending on where you are testing. (Web uses `127.0.0.1`, but an Android device will need your dev machine's local Wi-Fi IP address like `192.168.1.5` or `10.99.12.124`).
4. Start the Expo application.
   ```bash
   npx expo start
   ```
5. Scan the QR Code using the **Expo Go** app on your Android/iOS physical device, or press `w` to open it in your local browser for rapid testing!

---

## ⚠️ Notes on API Keys
1. **Google Gemini (Backend)**: If you are seeing `"PermissionDenied"` errors when speaking, you must enable the **Generative Language API** in the Google Cloud console where you generated the key, or generate a fresh key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. **Sarvam AI (Frontend)**: If you get a `400 Bad Request` or unauthorized error when uploading audio, verify your API Key in the frontend `.env`.
