declare interface SpeechRecognition extends EventTarget {
  start(): void;
  stop(): void;
  abort(): void;
  onstart?: () => void;
  onend?: () => void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onerror?: (event: SpeechRecognitionErrorEvent) => void;
  lang: string;
  interimResults: boolean;
}

declare interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

declare interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

declare interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}