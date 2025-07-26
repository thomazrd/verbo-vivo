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
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const setAudioDataRef = useRef<React.Dispatch<React.SetStateAction<any[]>> | null>(null);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    streamRef.current = null;
    audioContextRef.current = null;
    animationFrameRef.current = null;
    setAudioDataRef.current = null;
  }, []);

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
      cleanupAudio();
    };

    recognition.onend = () => {
      setIsListening(false);
      cleanupAudio();
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      cleanupAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            streamRef.current = stream;
            setTranscript('');
            setError(null);
            recognitionRef.current?.start();
            setIsListening(true);
            if (setAudioDataRef.current) {
              visualize(stream, setAudioDataRef.current);
            }
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
      cleanupAudio();
    }
  }, [isListening, cleanupAudio]);

  const visualize = useCallback((stream: MediaStream, setAudioData: React.Dispatch<React.SetStateAction<any[]>>) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const sampleSize = 32;
      const processedData = [];
      const step = Math.floor(bufferLength / sampleSize);
      for (let i = 0; i < sampleSize; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        processedData.push({ value: sum / step });
      }
      setAudioData(processedData);
    };
    draw();
  }, []);
  
  const visualizeAudio = (setAudioData: React.Dispatch<React.SetStateAction<any[]>>) => {
    setAudioDataRef.current = setAudioData;
  }

  return { isListening, transcript, startListening, stopListening, error, visualizeAudio };
};
