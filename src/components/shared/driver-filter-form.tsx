
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  subcategories: string[];
  tags: string[];
}

const categories: Category[] = [
  {
    id: "fuel_theft",
    name: "Kuro / turto vagystės",
    subcategories: [
      "Kuro vagystė",
      "Įrangos ar krovinio vagystė",
      "Netinkamas įmonės turto naudojimas",
      "Kita"
    ],
    tags: [
      "Pasikartojantis pažeidimas",
      "Tikslingas žalos darymas įmonei",
      "Pakenkta įmonės reputacijai"
    ]
  },
  {
    id: "driving_safety",
    name: "Vairavimo saugumas",
    subcategories: [
      "Avaringumas",
      "Pavojingas vairavimas",
      "Eismo taisyklių pažeidimai",
      "Kita"
    ],
    tags: [
      "Pasikartojantis pažeidimas",
      "Pavojingas vairavimas",
      "Rizika saugumui ar kroviniui"
    ]
  },
  {
    id: "behavior",
    name: "Psichoemocinis elgesys",
    subcategories: [
      "Netinkamas elgesys kolegų atžvilgiu",
      "Konfliktiškas elgesys su klientais",
      "Grasinimai / agresija",
      "Psichotropinių medžiagų vartojimas",
      "Kita"
    ],
    tags: [
      "Konfliktiškas asmuo",
      "Sukeltas konfliktas su klientu",
      "Neetiškas bendravimas / agresija"
    ]
  },
  {
    id: "discipline",
    name: "Darbo drausmės pažeidimai",
    subcategories: [
      "Neblaivus darbo metu",
      "Neatvykimas į darbą be pateisinamos priežasties",
      "Dažnas neatvykimas į darbą",
      "Vėlavimai / darbo laiko nesilaikymas",
      "Savavališkas maršruto keitimas",
      "Kita"
    ],
    tags: [
      "Neatsakingas požiūris į darbą",
      "Pasikartojantis pažeidimas",
      "Savavališkai paliko darbo vietą"
    ]
  },
  {
    id: "technical_damage",
    name: "Techniniai pažeidimai",
    subcategories: [
      "Transporto priemonės ar įrangos tyčinis sugadinimas",
      "Techninės priežiūros ignoravimas",
      "Nepranešimas apie gedimus / defektus",
      "Kita"
    ],
    tags: [
      "Techninis neatsakingumas",
      "Rizika saugumui ar kroviniui"
    ]
  },
  {
    id: "legal_reputation",
    name: "Teisiniai / reputaciniai klausimai",
    subcategories: [
      "Kreipimasis į institucijas",
      "Darbo ginčai / teismai",
      "Pakenkta įmonės reputacijai",
      "Kita"
    ],
    tags: [
      "Buvo teisinis procesas / darbo ginčas",
      "Pakenkta įmonės reputacijai",
      "Neteisėta veikla įtariama"
    ]
  }
];

export default function DriverFilterForm() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCategoryChange = (id: string) => {
    const category = categories.find(c => c.id === id) || null;
    setSelectedCategory(category);
  };

  return (
    <Card className="p-4 max-w-xl mx-auto">
      <CardContent className="pt-6"> {/* Added pt-6 to CardContent for consistency with other cards */}
        <div className="space-y-2">
            <Label htmlFor="category-select" className="block mb-2 text-base">Pasirinkite pažeidimo kategoriją:</Label>
            <Select onValueChange={handleCategoryChange} value={selectedCategory?.id || ""}>
            <SelectTrigger id="category-select" className="text-base h-11">
                <SelectValue placeholder="Pasirinkite kategoriją..." />
            </SelectTrigger>
            <SelectContent>
                {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="text-base">
                    {category.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        {selectedCategory && (
          <div className="mt-6 space-y-4">
            <div>
                <Label className="block mb-2 text-base font-medium">Galimos pažeidimų subkategorijos:</Label>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                {selectedCategory.subcategories.map((sub, index) => (
                    <li key={index}>{sub}</li>
                ))}
                </ul>
            </div>
            <div>
                <Label className="block mt-4 mb-2 text-base font-medium">Galimos žymos:</Label>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                {selectedCategory.tags.map((tag, index) => (
                    <li key={index}>{tag}</li>
                ))}
                </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
