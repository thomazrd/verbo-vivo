"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechToTextOptions {
  onTranscriptChange?: (transcript: string) => void;
}

export const useSpeechToText = ({ onTranscriptChange }: SpeechToTextOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('A API de reconhecimento de fala não é suportada neste navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
      if (onTranscriptChange) {
        onTranscriptChange(finalTranscript);
      }
    };
    
    recognition.onerror = (event) => {
      let errorMessage = 'Ocorreu um erro no reconhecimento de fala.';
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'Permissão para microfone negada. Por favor, habilite o acesso nas configurações do seu navegador.';
      }
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            setTranscript('');
            setError(null);
            recognitionRef.current?.start();
            setIsListening(true);
        })
        .catch(() => {
            setError('Permissão para microfone negada. Por favor, habilite o acesso nas configurações do seu navegador.');
        });
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, error };
};
