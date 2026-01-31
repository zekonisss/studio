"use client";

import React, { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { useTheme } from "next-themes"; // Importuojame temų kablys

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const highlightedCountries = ["440", "428", "233", "616"];

type Coordinate = [number, number];

interface MapMarker {
  name: string;
  coordinates: Coordinate;
  isCapital?: boolean;
}

const markers: MapMarker[] = [
  // ... (TAVO MARKERIAI, TAS PATS KODAS KAIP BUVO ANKSČIAU) ...
  { name: "Vilnius", coordinates: [25.2797, 54.6872], isCapital: true },
  { name: "Kaunas", coordinates: [23.9036, 54.8985] },
  { name: "Klaipėda", coordinates: [21.1443, 55.7037] },
  { name: "Šiauliai", coordinates: [23.3137, 55.9349] },
  { name: "Ryga", coordinates: [24.1052, 56.9496], isCapital: true },
  { name: "Talinas", coordinates: [24.7536, 59.4370], isCapital: true },
  { name: "Pärnu", coordinates: [24.4971, 58.3859] },
  { name: "Varšuva", coordinates: [21.0122, 52.2297], isCapital: true },
  { name: "Białystok", coordinates: [23.1688, 53.1325] },
  { name: "Gdańsk", coordinates: [18.6466, 54.3520] },
];

const connections: { from: string; to: string }[] = [
  { from: "Varšuva", to: "Białystok" },
  { from: "Białystok", to: "Kaunas" },
  { from: "Kaunas", to: "Vilnius" },
  { from: "Kaunas", to: "Klaipėda" },
  { from: "Kaunas", to: "Šiauliai" },
  { from: "Šiauliai", to: "Ryga" },
  { from: "Ryga", to: "Pärnu" },
  { from: "Pärnu", to: "Talinas" },
  { from: "Varšuva", to: "Gdańsk" },
];

export function InteractiveMap() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Laukiame kol komponentas užsikraus kliente, kad gautume tikrą temą
  useEffect(() => {
    setMounted(true);
  }, []);

  // Nustatome ar šiuo metu tamsus režimas
  const isDark = mounted && (theme === 'dark' || resolvedTheme === 'dark');

  // SPALVŲ PALETĖS (DINAMINĖS)
  const colors = {
    base: isDark ? "#1e293b" : "#e2e8f0",      // Tamsi pilka / Šviesi pilka
    highlight: isDark ? "#06b6d4" : "#2563eb", // Cyan / Blue
    hover: isDark ? "#22d3ee" : "#3b82f6",     // Ryškesnė Cyan / Ryškesnė Blue
    stroke: isDark ? "#0f172a" : "#cbd5e1",    // Sienos
    line: isDark ? "#67e8f9" : "#3b82f6",      // Linijos
    bg: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)", // Konteinerio fonas
    border: isDark ? "#1e293b" : "#cbd5e1",    // Konteinerio rėmelis
    text: isDark ? "white" : "#0f172a",        // Teksto spalva
  };

  const getCoords = (name: string): Coordinate => {
    return markers.find((m) => m.name === name)?.coordinates || [0, 0];
  };

  return (
    <div 
      className="w-full h-[500px] relative overflow-hidden rounded-xl border transition-colors duration-300"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [23.5, 56], 
          scale: 2000,
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const isHighlighted = highlightedCountries.includes(geo.id);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isHighlighted ? colors.highlight : colors.base,
                      stroke: colors.stroke,
                      strokeWidth: 0.5,
                      outline: "none",
                      transition: "all 250ms",
                    },
                    hover: {
                      fill: isHighlighted ? colors.hover : colors.base,
                      stroke: colors.stroke,
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: isHighlighted ? "pointer" : "default",
                      filter: isHighlighted
                        ? `drop-shadow(0 0 10px ${colors.highlight})`
                        : "none",
                    },
                    pressed: {
                      fill: isHighlighted ? colors.hover : colors.base,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {connections.map((conn, index) => (
          <Line
            key={index}
            from={getCoords(conn.from)}
            to={getCoords(conn.to)}
            stroke={colors.line}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
        ))}

        {markers.map(({ name, coordinates, isCapital }) => (
          <Marker key={name} coordinates={coordinates}>
            <circle
              r={isCapital ? 6 : 3}
              fill={isCapital ? (isDark ? "white" : "#1e40af") : colors.line}
              stroke={colors.line}
              strokeWidth={isCapital ? 2 : 0}
            />
            
            {isCapital && (
                 <circle
                 r={10}
                 fill={colors.line}
                 opacity={0.3}
                 className="animate-ping"
               />
            )}

            <text
              textAnchor="middle"
              y={isCapital ? -12 : 14}
              style={{
                fontFamily: "system-ui",
                fill: colors.text, // Dinaminė teksto spalva
                fontSize: isCapital ? "11px" : "9px",
                fontWeight: isCapital ? "bold" : "normal",
                textShadow: isDark ? "0px 1px 3px rgba(0,0,0,0.9)" : "none",
                pointerEvents: "none"
              }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      {/* Gradientas apačioje irgi turi keistis */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
             background: isDark 
             ? "linear-gradient(to top, #020617, transparent)" 
             : "linear-gradient(to top, #f8fafc, transparent)"
        }}
      ></div>
    </div>
  );
}