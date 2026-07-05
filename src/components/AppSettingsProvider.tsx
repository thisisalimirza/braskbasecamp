"use client";

import { createContext, useContext } from "react";
import type { AppSettings } from "@/lib/settings";

const AppSettingsContext = createContext<AppSettings>({ hardWipLimits: false });

export function AppSettingsProvider({
  settings,
  children,
}: {
  settings: AppSettings;
  children: React.ReactNode;
}) {
  return (
    <AppSettingsContext.Provider value={settings}>{children}</AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettings {
  return useContext(AppSettingsContext);
}
