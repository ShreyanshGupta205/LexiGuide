"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase";

export function FirebaseInit() {
  useEffect(() => {
    initAnalytics().catch(() => {
      // Graceful fallback if analytics is blocked or unsupported
    });
  }, []);

  return null;
}
