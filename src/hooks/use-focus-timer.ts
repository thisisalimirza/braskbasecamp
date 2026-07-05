"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFocusTimer(initialMinutes = 25) {
  const [durationSec, setDurationSec] = useState(initialMinutes * 60);
  const [remainingSec, setRemainingSec] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    if (!running) {
      clear();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          clear();
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return clear;
  }, [running, clear]);

  const setMinutes = (minutes: number) => {
    const sec = minutes * 60;
    setDurationSec(sec);
    setRemainingSec(sec);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setRemainingSec(durationSec);
  };

  const toggle = () => setRunning((r) => !r);

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const label = `${mm}:${ss.toString().padStart(2, "0")}`;
  const progress = durationSec > 0 ? 1 - remainingSec / durationSec : 0;

  return {
    label,
    progress,
    running,
    remainingSec,
    toggle,
    reset,
    setMinutes,
    finished: remainingSec === 0 && !running && durationSec > 0,
  };
}
