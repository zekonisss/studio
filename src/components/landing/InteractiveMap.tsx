"use client";

import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";

// STABILUS ŠALTINIS
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Skaitmeniniai ISO kodai: LT=440, LV=428, EE=233, PL=616
const highlightedCountries = ["440", "428", "233", "616"];

type Coordinate = [number, number];

interface MapMarker {
  name: string;
  coordinates: Coordinate;
  isCapital?: boolean;
}

const markers: MapMarker[] = [
  // LIETUVA
  { name: "Vilnius", coordinates: [25.2797, 54.6872], isCapital: true },
  { name: "Kaunas", coordinates: [23.9036, 54.8985] },
  { name: "Klaipėda", coordinates: [21.1443, 55.7037] },
  { name: "Šiauliai", coordinates: [23.3137, 55.9349] },
  
  // LATVIJA
  { name: "Ryga", coordinates: [24.1052, 56.9496], isCapital: true },
  
  // ESTIJA
  { name: "Talinas", coordinates: [24.7536, 59.4370], isCapital: true },
  { name: "Pärnu", coordinates: [24.4971, 58.3859] },
  
  // LENKIJA
  { name: "Varšuva", coordinates: [21.0122, 52.2297], isCapital: true },
  { name: "Białystok", coordinates: [23.1688, 53.1325] },
  { name: "Gdańsk", coordinates: [18.6466, 54.3520] },
];

// Maršrutai
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
  const colors = {
    base: "#1e293b",      
    highlight: "#06b6d4", 
    hover: "#22d3ee",     
    stroke: "#0f172a",    
    line: "#67e8f9",      
  };

  const getCoords = (name: string): Coordinate => {
    return markers.find((m) => m.name === name)?.coordinates || [0, 0];
  };

  return (
    <div className="w-full h-[500px] relative overflow-hidden rounded-xl bg-slate-900/50 border border-slate-800">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          // IŠTAISYTA: Atitolinome (2000) ir nuleidome centrą (56), 
          // kad tilptų ir Talinas viršuje, ir Varšuva apačioje.
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
              fill={isCapital ? "white" : colors.line}
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
                fill: "white",
                fontSize: isCapital ? "11px" : "9px",
                fontWeight: isCapital ? "bold" : "normal",
                textShadow: "0px 1px 3px rgba(0,0,0,0.9)",
                pointerEvents: "none"
              }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
}