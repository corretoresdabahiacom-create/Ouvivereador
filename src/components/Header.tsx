/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { HeaderConfig } from "../types";

interface HeaderProps {
  config: HeaderConfig;
  onLogoClick?: () => void;
}

export default function Header({ config, onLogoClick }: HeaderProps) {
  return (
    <header 
      style={{ backgroundColor: config.backgroundColor || "#024a30", color: config.textColor || "#ffffff" }}
      className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 shadow-lg relative transition-all duration-300 font-sans"
      id="custom-header-wrapper"
    >
      <div 
        className="flex items-center gap-4 cursor-pointer hover:opacity-90 active:scale-[0.99] select-none transition-all"
        onClick={onLogoClick}
        title="Voltar ao Início"
        id="header-logo-container"
      >
        {config.logoUrl ? (
          <img 
            src={config.logoUrl} 
            alt="Logo Câmara" 
            className="h-20 w-20 rounded-full object-cover border border-white/15 shadow-md bg-white p-[1px]" 
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl border border-white/20 shadow-md">
            🏛️
          </div>
        )}

        <div className="text-center md:text-left">
          <h1 className="text-xl font-black tracking-tight">{config.municipioNome || "Câmara de Vereadores"}</h1>
          <p className="text-xs text-white/85 font-semibold flex items-center justify-center md:justify-start gap-1">
            <span>{config.nomePrograma || "Ouvidoria Legislativa Inteligente"}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
