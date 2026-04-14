// speech.ts — STT and TTS integration via Sarvam AI.
//
// STT: Sarvam Speech-to-Text API (REST, multipart audio upload)
// TTS: expo-speech (built-in) for voice output — no extra SDK needed for MVP.
//      In production, swap to Sarvam TTS for regional accent fidelity.
//
// Audio recording uses expo-av (already available via Expo).

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Speech from 'expo-speech';
import { LanguageCode } from '../utils/constants';

// Sarvam AI STT endpoint — replace with your API key
const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY ?? '';

// Map our language codes to Sarvam's language codes
const SARVAM_LANG_MAP: Record<LanguageCode, string> = {
  'hi-IN': 'hi-IN',
  'ta-IN': 'ta-IN',
  'te-IN': 'te-IN',
  'kn-IN': 'kn-IN',
  'mr-IN': 'mr-IN',
  'en-IN': 'en-IN',
};

export type STTResult = {
  transcript: string;
  confidence: number;
  language_code: LanguageCode;
};

type RecordingState = {
  recording: Audio.Recording | null;
};

const _state: RecordingState = { recording: null };

// Recording

export async function startRecording(): Promise<void> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  _state.recording = recording;
}

export async function stopRecordingAndTranscribe(
  language: LanguageCode
): Promise<STTResult> {
  if (!_state.recording) {
    throw new Error('No active recording');
  }

  await _state.recording.stopAndUnloadAsync();
  const uri = _state.recording.getURI();
  _state.recording = null;

  if (!uri) throw new Error('Recording URI is null');

  return await _callSarvamSTT(uri, language);
}

// Cancel recording without transcribing (user dismissed)
export async function cancelRecording(): Promise<void> {
  if (_state.recording) {
    await _state.recording.stopAndUnloadAsync().catch(() => {});
    _state.recording = null;
  }
}

// Sarvam STT API call

async function _callSarvamSTT(audioUri: string, language: LanguageCode): Promise<STTResult> {
  // Build multipart/form-data request
  const form = new FormData();
  form.append('file', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  form.append('model', 'saarika:v2');
  form.append('language_code', SARVAM_LANG_MAP[language]);
  form.append('with_timestamps', 'false');

  try {
    const res = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Sarvam STT error: ${res.status}`);
    }

    const data = await res.json();
    // Sarvam response shape: { transcript: string, language_code: string }
    return {
      transcript: data.transcript ?? '',
      confidence: data.confidence ?? 0.9, // Sarvam doesn't always return confidence
      language_code: language,
    };
  } catch (err) {
    // If Sarvam is unavailable, return empty transcript — orchestrator handles it
    console.warn('Sarvam STT failed:', err);
    throw err;
  }
}

// TTS (Voice output)

// Expo-speech locale map — used as fallback TTS
const EXPO_SPEECH_LOCALE: Record<LanguageCode, string> = {
  'hi-IN': 'hi-IN',
  'ta-IN': 'ta-IN',
  'te-IN': 'te-IN',
  'kn-IN': 'kn-IN',
  'mr-IN': 'mr-IN',
  'en-IN': 'en-IN',
};

export async function speakText(text: string, language: LanguageCode): Promise<void> {
  // Stop any currently playing speech
  Speech.stop();

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: EXPO_SPEECH_LOCALE[language],
      rate: 0.85,      // Slightly slower for clarity in noisy rural environments
      pitch: 1.0,
      onDone: () => resolve(),
      onError: () => resolve(), // Don't crash on TTS failure
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
