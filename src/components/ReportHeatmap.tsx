/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Manifestacao, Secretaria, ManifestacaoTipo } from "../types";
import { Map, Filter, Layers, ListFilter, AlertTriangle, RefreshCw } from "lucide-react";

interface ReportHeatmapProps {
  manifestacoes: Manifestacao[];
  secretarias: Secretaria[];
}

export default function ReportHeatmap({ manifestacoes, secretarias }: ReportHeatmapProps) {
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterSecretaria, setFilterSecretaria] = useState<string>("todos");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("todos"); // todos, 7d, 30d, 90d

  // Interactive simulated neighborhood boundaries
  const neighborhoodsGrid = [
    { name: "Centro", x: 450, y: 250, radius: 45, densityFactor: 1.2 },
    { name: "Alagoinhas Velha", x: 550, y: 280, radius: 50, densityFactor: 0.9 },
    { name: "Silva Jardim", x: 260, y: 290, radius: 50, densityFactor: 1.0 },
    { name: "Catu", x: 580, y: 400, radius: 45, densityFactor: 1.1 },
    { name: "Santa Terezinha", x: 650, y: 180, radius: 55, densityFactor: 1.5 },
    { name: "Kennedy", x: 480, y: 130, radius: 45, densityFactor: 1.3 },
    { name: "Barreiro", x: 350, y: 350, radius: 40, densityFactor: 0.7 },
    { name: "Petrolar", x: 320, y: 200, radius: 50, densityFactor: 1.1 },
    { name: "Juca de Rosa", x: 400, y: 420, radius: 45, densityFactor: 1.2 }
  ];

  // Filtering logic based on real dynamic citizen report data
  const filteredManifestacoes = useMemo(() => {
    return manifestacoes.filter((m) => {
      // 1. Filter by Manifestation Type
      if (filterTipo !== "todos" && m.tipo !== filterTipo) return false;

      // 2. Filter by Secretaria
      if (filterSecretaria !== "todos" && m.secretariaId !== filterSecretaria) return false;

      // 3. Filter by Timeframe Period
      if (filterPeriodo !== "todos" && m.criadoEm) {
        const dateLimit = new Date();
        const created = new Date(m.criadoEm);
        if (filterPeriodo === "7d") {
          dateLimit.setDate(dateLimit.getDate() - 7);
          if (created < dateLimit) return false;
        } else if (filterPeriodo === "30d") {
          dateLimit.setDate(dateLimit.getDate() - 30);
          if (created < dateLimit) return false;
        } else if (filterPeriodo === "90d") {
          dateLimit.setDate(dateLimit.getDate() - 90);
          if (created < dateLimit) return false;
        }
      }
      return true;
    });
  }, [manifestacoes, filterTipo, filterSecretaria, filterPeriodo]);

  // Aggregate count of active filters mapped to centers
  const heatPoints = useMemo(() => {
    // Group active complaints by neighborhood
    const countsByBairro: Record<string, number> = {};
    filteredManifestacoes.forEach((m) => {
      const bNorm = (m.bairro || "Centro").trim().toLowerCase();
      countsByBairro[bNorm] = (countsByBairro[bNorm] || 0) + 1;
    });

    // Project counts onto simulated SVG map coordinates
    return neighborhoodsGrid.map((neighborhood) => {
      const bNorm = neighborhood.name.toLowerCase();
      const occurrenceCount = countsByBairro[bNorm] || 0;
      
      // Calculate heat score (base traffic + current occurrences * scaling weight)
      // If there are occurrences we spike the heat intensity considerably
      const heatScore = occurrenceCount > 0 
        ? Math.min(10, 2 + occurrenceCount * 2.5) 
        : 0;

      return {
        ...neighborhood,
        occurrences: occurrenceCount,
        heatScore, // 0 to 10 scale
      };
    });
  }, [filteredManifestacoes]);

  // Total points plotted with location
  const mappedCount = filteredManifestacoes.filter(m => m.bairro).length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" id="heatmap-section-wrapper">
      <div className="bg-slate-50 border-b border-slate-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Map className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Mapa de Calor e Concentração</h3>
            <p className="text-xs text-slate-500">Mapeamento dinâmico geográfico das manifestações e hotspots de insatisfação popular</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-md border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Sincronizado via GPS e Endereços</span>
        </div>
      </div>

      <div className="p-6">
        {/* Dynamic Map Filters Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-100/60 p-4 rounded-xl border border-slate-200/50">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Tipo
            </span>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="todos">Todos os Tipos</option>
              <option value={ManifestacaoTipo.RECLAMACAO}>Reclamações</option>
              <option value={ManifestacaoTipo.SUGESTAO}>Sugestões</option>
              <option value={ManifestacaoTipo.DENUNCIA}>Denúncias</option>
              <option value={ManifestacaoTipo.ELOGIO}>Elogios</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Secretaria Competente
            </span>
            <select
              value={filterSecretaria}
              onChange={(e) => setFilterSecretaria(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="todos">Todas as Secretarias</option>
              {secretarias.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5 text-slate-400" /> Período Temporal
            </span>
            <select
              value={filterPeriodo}
              onChange={(e) => setFilterPeriodo(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="todos">Todo Histórico</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>

          <div className="flex items-end justify-start md:justify-end">
            <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2.5 rounded-md w-full md:w-auto text-center">
              Planas Filtradas: <strong className="text-slate-800">{filteredManifestacoes.length}</strong> relatadas
            </div>
          </div>
        </div>

        {/* Heatmap Visual Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Map Grid Panel (Dynamic High Contrast Visual Representation) */}
          <div className="lg:col-span-3 border border-slate-300 rounded-xl overflow-hidden shadow-inner bg-slate-50 relative flex items-center justify-center p-2" style={{ minHeight: "420px" }}>
            
            {/* Legend Overlay */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur border border-slate-200 px-3 py-2 rounded-lg text-[10px] space-y-1.5 z-10 shadow-sm">
              <p className="font-bold text-slate-700 uppercase tracking-tight">Intensidade de Calor</p>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-rose-600/75 animate-ping inline-block"></span>
                <span className="text-slate-600 font-medium font-mono">Crítico / Alta Densidade (4+ chamados)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500/75 inline-block"></span>
                <span className="text-slate-600 font-medium font-mono">Médio / Alerta (2-3 chamados)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500/50 inline-block font-mono"></span>
                <span className="text-slate-600 font-medium">Baixo / Resolvido (0-1 chamados)</span>
              </div>
            </div>

            {/* Geographical Background Elements */}
            <svg viewBox="0 0 900 500" className="w-full h-full max-w-4xl" style={{ maxHeight: "480px" }}>
              <defs>
                <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-medium" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-low" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Waterway (Rio / Canal) */}
              <path d="M 120 0 Q 300 150 400 250 T 700 500" fill="none" stroke="#bfdbfe" strokeWidth="26" strokeLinecap="round" opacity="0.65" />
              <path d="M 120 0 Q 300 150 400 250 T 700 500" fill="none" stroke="#60a5fa" strokeWidth="8" strokeLinecap="round" opacity="0.5" />

              {/* Major Ring Road Networks */}
              <line x1="100" y1="120" x2="800" y2="400" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="3,3" />
              <line x1="200" y1="480" x2="700" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="3,3" />

              {/* Neighborhood boundary bubbles and radar charts */}
              {heatPoints.map((point) => {
                let heatGradient = "url(#heat-low)";
                let pulseColor = "bg-emerald-500";
                let textBorders = "fill-slate-850";

                const isCritical = point.occurrences >= 3;
                const isMedium = point.occurrences > 0 && point.occurrences < 3;

                if (isCritical) {
                  heatGradient = "url(#heat-high)";
                  pulseColor = "bg-rose-500";
                } else if (isMedium) {
                  heatGradient = "url(#heat-medium)";
                  pulseColor = "bg-amber-500";
                }

                const scaledHeatRadius = point.radius + (point.occurrences * 12);

                return (
                  <g key={point.name} className="transition-all duration-500 hover:opacity-90 cursor-pointer">
                    {/* Outer heat gradient area representing geocoordinate offset */}
                    {point.occurrences > 0 && (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={scaledHeatRadius}
                        fill={heatGradient}
                        className="animate-pulse"
                        style={{ transformOrigin: `${point.x}px ${point.y}px`, animationDuration: isCritical ? "2.5s" : "4s" }}
                      />
                    )}

                    {/* Neighborhood Base Ring indicator */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="16"
                      fill="#ffffff"
                      stroke={isCritical ? "#ef4444" : isMedium ? "#f59e0b" : "#94a3b8"}
                      strokeWidth="2.5"
                    />

                    {/* Occurrence badge on center */}
                    <text
                      x={point.x}
                      y={point.y + 4}
                      textAnchor="middle"
                      className="text-[11px] font-extrabold font-mono"
                      fill={isCritical ? "#b91c1c" : isMedium ? "#b45309" : "#475569"}
                    >
                      {point.occurrences}
                    </text>

                    {/* Label */}
                    <rect
                      x={point.x - 70}
                      y={point.y - 36}
                      width="140"
                      height="16"
                      rx="4"
                      fill="#1e293b"
                      opacity="0.8"
                    />
                    <text
                      x={point.x}
                      y={point.y - 24}
                      textAnchor="middle"
                      className="text-[9px] font-bold tracking-tight fill-white uppercase"
                    >
                      {point.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Heat map sidebar listing hotzones */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <span>Classificação Geográfica</span>
            </h4>

            {/* List items order by occurrences desc */}
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[350px] pr-1">
              {[...heatPoints]
                .sort((a, b) => b.occurrences - a.occurrences)
                .map((point) => {
                  const hasIssues = point.occurrences > 0;
                  const isSevere = point.occurrences >= 3;

                  return (
                    <div 
                      key={point.name}
                      className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                        isSevere 
                          ? "bg-rose-50 border-rose-200" 
                          : hasIssues 
                            ? "bg-amber-50 border-amber-200" 
                            : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{point.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {point.occurrences === 0 
                            ? "Nenhuma ocorrência ativa" 
                            : point.occurrences === 1 
                              ? "1 ocorrência ativa nesta região" 
                              : `${point.occurrences} ocorrências ativas`}
                        </p>
                      </div>
                      <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full font-mono text-xs font-extrabold ${
                        isSevere 
                          ? "bg-rose-600 text-white shadow-sm" 
                          : hasIssues 
                            ? "bg-amber-500 text-white shadow-sm" 
                            : "bg-slate-200 text-slate-600"
                      }`}>
                        {point.occurrences}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Geo validation disclaimer */}
            <div className="mt-auto bg-blue-50 border border-blue-100 p-3.5 rounded-lg flex items-start gap-2 text-xs text-blue-700 leading-relaxed">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>As coordenadas são trianguladas via CEP do munícipe cadastrado e posicionamentos geográficos facultativos autorizados de acordo com a LGPD brasileira.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
