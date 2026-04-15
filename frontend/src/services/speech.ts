// speech.ts — STT via Sarvam AI (saaras:v3) + TTS via expo-speech.
//
// saaras:v3 only needs `file` and `model` — language is auto-detected.
// expo-av records .m4a on both iOS and Android.

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { LanguageCode } from '../utils/constants';

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY ?? '';

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
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) throw new Error('Microphone permission denied');

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

export async function cancelRecording(): Promise<void> {
  if (_state.recording) {
    await _state.recording.stopAndUnloadAsync().catch(() => {});
    _state.recording = null;
  }
}

// Sarvam saaras:v3 — only `file` and `model` required, language auto-detected

async function _callSarvamSTT(audioUri: string, language: LanguageCode): Promise<STTResult> {
  const form = new FormData();
  // On web: fetch the blob URL → convert to a real File object.
  // On native iOS/Android: pass the { uri, name, type } object that RN fetch understands.
  if (Platform.OS === 'web') {
    const response = await globalThis.fetch(audioUri);
    const blob = await response.blob();
    const file = new File([blob], 'recording.webm', { type: blob.type || 'audio/webm' });
    form.append('file', file);
  } else {
    form.append('file', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/mp4',
    } as unknown as Blob);
  }
  form.append('model', 'saaras:v3');

  const res = await fetch(SARVAM_STT_URL, {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: form,
  });

  if (!res.ok) {
    // Log the actual response body so we can debug 4xx errors
    const errorBody = await res.text().catch(() => '');
    console.error(`Sarvam STT ${res.status}:`, errorBody);
    throw new SarvamSTTError(`STT failed (${res.status}): ${errorBody}`, res.status);
  }

  const data = await res.json();

  // saaras:v3 response: { transcript, language_code, confidence? }
  return {
    transcript: data.transcript ?? '',
    // saaras:v3 may not always return confidence; assume good quality
    confidence: typeof data.confidence === 'number' ? data.confidence : 0.95,
    language_code: language,
  };
}

// TTS

const EXPO_SPEECH_LOCALE: Record<LanguageCode, string> = {
  'hi-IN': 'hi-IN',
  'ta-IN': 'ta-IN',
  'te-IN': 'te-IN',
  'kn-IN': 'kn-IN',
  'mr-IN': 'mr-IN',
  'en-IN': 'en-IN',
};

export async function speakText(text: string, language: LanguageCode): Promise<void> {
  Speech.stop();
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: EXPO_SPEECH_LOCALE[language],
      rate: 0.85,
      pitch: 1.0,
      onDone: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

// Custom error class so HomeScreen can distinguish STT errors from audio errors
export class SarvamSTTError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'SarvamSTTError';
    this.statusCode = statusCode;
  }
}
