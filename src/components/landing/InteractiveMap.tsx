"use client";

import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  Annotation
} from "react-simple-maps";
import { useTheme } from "next-themes"; // Jei naudoji next-themes, padės su spalvom

// Nuoroda į viešą TopoJSON failą (pasaulio šalys)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Šalių ISO kodai, kurias norime paryškinti
const highlightedCountries = ["LTU", "LVA", "EST", "POL"];

// Sostinių koordinatės (ilgumos, platumos) ir pavadinimai
const markers = [
  { name: "Vilnius", coordinates: [25.2797, 54.6872] },
  { name: "Ryga", coordinates: [24.1052, 56.9496] },
  { name: "Talinas", coordinates: [24.7536, 59.4370] },
  { name: "Varšuva", coordinates: [21.0122, 52.2297] },
];

// Jungtys tarp miestų (kad rodytų duomenų srautą)
const connections = [
  [markers[0].coordinates, markers[3].coordinates], // Vilnius - Varšuva
  [markers[0].coordinates, markers[1].coordinates], // Vilnius - Ryga
  [markers[1].coordinates, markers[2].coordinates], // Ryga - Talinas
  [markers[3].coordinates, markers[1].coordinates], // Varšuva - Ryga
];

export function InteractiveMap() {
  // Spalvų paletė tamsiam režimui (galima derinti pagal tavo Tailwind config)
  const colors = {
    base: "#1e293b", // Slate-800 (kitos šalys)
    highlight: "#06b6d4", // Cyan-500 (tavo šalys)
    hover: "#22d3ee", // Cyan-400 (užvedus pelyte)
    stroke: "#0f172a", // Slate-900 (sienos)
    line: "#67e8f9", // Cyan-300 (linijos)
  };

  return (
    <div className="w-full h-[500px] relative overflow-hidden rounded-xl bg-slate-900/50 border border-slate-800">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [24, 56], // Centruojame ties Baltija
          scale: 2000, // Pritraukiame vaizdą
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // Tikriname, ar šalis yra mūsų sąraše
              const isHighlighted = highlightedCountries.includes(geo.properties.iso_a3);

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
                      // Pridedame švytėjimo efektą užvedus
                      filter: isHighlighted ? `drop-shadow(0 0 8px ${colors.highlight})` : "none"
                    },
                    pressed: {
                       fill: isHighlighted ? colors.hover : colors.base,
                       outline: "none",
                    }
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Duomenų srauto linijos */}
        {connections.map((connection, index) => (
           <Line
             key={index}
             from={connection[0]}
             to={connection[1]}
             stroke={colors.line}
             strokeWidth={1.5}
             strokeLinecap="round"
             strokeOpacity={0.6}
             // Punktyrinė linija atrodo technologiškiau
             strokeDasharray="4 4"
             // Animacija (reikėtų papildomo CSS, bet pradžiai užteks statinės)
           />
         ))}

        {/* Sostinių taškai */}
        {markers.map(({ name, coordinates }) => (
          <Marker key={name} coordinates={coordinates}>
            {/* Pulsuojantis efektas */}
            <circle r={6} fill={colors.line} opacity={0.4} className="animate-ping" />
            <circle r={3} fill="white" />
            <text
              textAnchor="middle"
              y={15}
              style={{ fontFamily: "system-ui", fill: "white", fontSize: "10px", fontWeight: "bold" }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
      
      {/* Perdanga, kad žemėlapis gražiai įsilietų į foną */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
}