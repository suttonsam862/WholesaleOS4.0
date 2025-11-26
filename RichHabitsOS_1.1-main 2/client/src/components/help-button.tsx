import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HelpItem {
  question: string;
  answer: string;
  example?: string;
}

interface HelpButtonProps {
  pageTitle: string;
  helpItems: HelpItem[];
}

export function HelpButton({ pageTitle, helpItems }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-foreground"
        data-testid="button-help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-help" aria-describedby="help-description">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help: {pageTitle}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-help"
                aria-label="Close help dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <p id="help-description" className="sr-only">
              Frequently asked questions and help information for {pageTitle}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <Accordion type="single" collapsible className="w-full">
              {helpItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left" data-testid={`accordion-question-${index}`}>
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground" data-testid={`accordion-answer-${index}`}>
                        {item.answer}
                      </p>
                      {item.example && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Example:</p>
                          <p className="text-sm font-mono" data-testid={`accordion-example-${index}`}>
                            {item.example}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {helpItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="help-empty-state">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No help content available for this page yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
