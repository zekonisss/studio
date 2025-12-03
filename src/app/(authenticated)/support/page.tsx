"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { LifeBuoy } from "lucide-react";

export default function SupportPage() {
  const { t } = useLanguage();

  const faqs = [
    {
      id: "q1",
      question: t("support.faq.q1.question"),
      answer: t("support.faq.q1.answer"),
    },
    {
      id: "q2",
      question: t("support.faq.q2.question"),
      answer: t("support.faq.q2.answer"),
    },
    {
      id: "q3",
      question: t("support.faq.q3.question"),
      answer: t("support.faq.q3.answer"),
    },
    {
      id: "q4",
      question: t("support.faq.q4.question"),
      answer: t("support.faq.q4.answer"),
    },
    {
      id: "q5",
      question: t("support.faq.q5.question"),
      answer: t("support.faq.q5.answer"),
    },
    {
      id: "q6",
      question: t("support.faq.q6.question"),
      answer: t("support.faq.q6.answer"),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <LifeBuoy className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold tracking-tight">
            {t("support.title")}
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            {t("support.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-8 md:px-10">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem value={faq.id} key={faq.id}>
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center border-t pt-8">
            <h3 className="text-2xl font-semibold mb-3">
              {t("support.contact.title")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("support.contact.description")}
            </p>
            <Button asChild size="lg">
              <a href={t("support.contact.emailLink")}>
                {t("support.contact.emailButton")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}