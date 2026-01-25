"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

const eventTypes = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

interface UseIdleOptions {
  onIdle: () => void;
  idleTime: number; // in minutes
  promptTime?: number; // in minutes, before idle
}

export function useIdle({ onIdle, idleTime, promptTime = 2 }: UseIdleOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  const idleTimeout = idleTime * 60 * 1000;
  const promptTimeout = (idleTime - promptTime) * 60 * 1000;

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    promptTimerRef.current = setTimeout(() => {
      setIsPromptVisible(true);
    }, promptTimeout);
    
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      setIsPromptVisible(false);
      onIdle();
    }, idleTimeout);
  }, [idleTimeout, promptTimeout, onIdle]);
  
  const reset = useCallback(() => {
    setIsIdle(false);
    setIsPromptVisible(false);
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
    }

    start();
  }, [start]);


  useEffect(() => {
    const handleEvent = () => {
      reset();
    };

    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handleEvent, { passive: true });
    });

    start();

    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handleEvent);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
      }
    };
  }, [reset, start]);

  return { isIdle, isPromptVisible, start, reset };
}
