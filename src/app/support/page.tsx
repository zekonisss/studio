
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldQuestion, LifeBuoy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";

const faqItemsBase = [
  {
    questionKey: "support.faq.q1.question",
    answerKey: "support.faq.q1.answer",
  },
  {
    questionKey: "support.faq.q2.question",
    answerKey: "support.faq.q2.answer",
  },
  {
    questionKey: "support.faq.q3.question",
    answerKey: "support.faq.q3.answer",
  },
  {
    questionKey: "support.faq.q4.question",
    answerKey: "support.faq.q4.answer",
  },
  {
    questionKey: "support.faq.q5.question",
    answerKey: "support.faq.q5.answer",
  },
  {
    questionKey: "support.faq.q6.question",
    answerKey: "support.faq.q6.answer",
  },
];

export default function SupportPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const faqItems = faqItemsBase.map(item => ({
    question: t(item.questionKey),
    answer: t(item.answerKey)
  }));

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.goBack')}
        </Button>
      </div>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <LifeBuoy className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">{t('support.title')}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {t('support.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
                <AccordionTrigger className="p-4 text-left font-medium text-lg text-foreground hover:no-underline">
                  <div className="flex items-center">
                    <ShieldQuestion className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    {item.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-base text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center border-t pt-8">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('support.contact.title')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('support.contact.description')}
            </p>
            <Button size="lg" asChild>
              <Link href={t('support.contact.emailLink')}>
                {t('support.contact.emailButton')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
