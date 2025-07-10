"use client";

import { useState, useEffect, useRef } from 'react';

interface SpeechToTextOptions {
  onTranscript: (transcript: string) => void;
}

export const useSpeechToText = ({ onTranscript }: SpeechToTextOptions) => {
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
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript + ' ');
        // Clear interim transcript if we have a final one for this segment
        interimTranscript = '';
      } else if (interimTranscript) {
        // Send the latest interim transcript
        onTranscript(interimTranscript);
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
      if (isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
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
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, transcript, startListening, stopListening, error };
};
