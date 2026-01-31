"use client";

import React, { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker
} from "react-simple-maps";

const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const TARGET_COUNTRIES = ["LTU", "LVA", "EST", "POL"];

const capitals = {
  "Tallinn": [24.7536, 59.4370],
  "Riga": [24.1052, 56.9496],
  "Vilnius": [25.2797, 54.6872],
  "Warsaw": [21.0122, 52.2297],
};

const lines = [
  { from: "Vilnius", to: "Riga" },
  { from: "Riga", to: "Tallinn" },
  { from: "Tallinn", to: "Warsaw" },
  { from: "Warsaw", to: "Vilnius" },
  { from: "Riga", to: "Warsaw"},
];

const InteractiveMap = () => {
  return (
    <div className="w-full h-full relative">
       <style>
        {`
          .data-line {
            stroke-dasharray: 4 4;
            animation: dash 8s linear infinite;
          }

          @keyframes dash {
            to {
              stroke-dashoffset: -100;
            }
          }
        `}
      </style>
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{
          rotate: [-24.0, -56.0, 0],
          scale: 3000
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isHighlighted = TARGET_COUNTRIES.includes(geo.id);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHighlighted ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted-foreground) / 0.15)"}
                  stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Data lines */}
        {lines.map((line, i) => (
          <Line
            key={i}
            from={capitals[line.from as keyof typeof capitals]}
            to={capitals[line.to as keyof typeof capitals]}
            stroke="hsl(var(--primary) / 0.6)"
            strokeWidth={1.5}
            className="data-line"
            style={{ animationDelay: `${i * -1.5}s` }}
          />
        ))}

        {/* Capitals */}
        {Object.entries(capitals).map(([name, coords]) => (
            <Marker key={name} coordinates={coords as [number, number]}>
                <circle r={3} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={1} />
                <circle r={6} fill="hsl(var(--primary) / 0.3)">
                   <animate
                      attributeName="r"
                      from="3"
                      to="10"
                      dur="1.5s"
                      begin={`${Math.random()}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      dur="1.5s"
                      begin={`${Math.random()}s`}
                      repeatCount="indefinite"
                    />
                </circle>
            </Marker>
        ))}

      </ComposableMap>
    </div>
  );
};

export default memo(InteractiveMap);
