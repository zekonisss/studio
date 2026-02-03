"use client";

import { PricingTable } from "@/components/pricing-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader className="items-center text-center">
          <CreditCard className="h-10 w-10 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold tracking-tight">
            Prenumerata
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            Pasirinkite planą, kuris geriausiai tinka jūsų komandai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PricingTable />
        </CardContent>
      </Card>
    </div>
  );
}
