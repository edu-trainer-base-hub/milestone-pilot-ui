import React from "react";
import { Globe } from "lucide-react";
import LanguageSelectorBase from "@/components/lang/LanguageSelectorBase.tsx";

export const LanguageSelectorMode = {
  FULL: "FULL",
  ICON: "ICON",
} as const;

export type LanguageSelectorMode = (typeof LanguageSelectorMode)[keyof typeof LanguageSelectorMode];

export interface LanguageSelectorProps {
  mode?: LanguageSelectorMode;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ mode = LanguageSelectorMode.FULL, className = "" }) => {
  // ICON mode: invisible <select> overlays the globe
  if (mode === LanguageSelectorMode.ICON) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="p-1 rounded focus:outline-none">
          <Globe className="w-5 h-5 text-gray-600" aria-hidden="true" />
        </div>

        <div className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          <LanguageSelectorBase />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-5 h-5 text-gray-600" aria-hidden="true" />
      <LanguageSelectorBase />
    </div>
  );
};

export default LanguageSelector;
