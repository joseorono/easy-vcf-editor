"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCopyToClipboardOptions {
  resetAfterMs?: number;
}

export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const { resetAfterMs = 1500 } = options;
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const copy = useCallback(async (value: string | undefined | null) => {
    if (!value) return false;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (resetAfterMs > 0) {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          setCopied(false);
        }, resetAfterMs);
      }

      return true;
    } catch {
      // Silently fail if clipboard is not available or permission denied
      return false;
    }
  }, [resetAfterMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, copy };
}
