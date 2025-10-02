import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Event Engagement Booster! 🎉",
    description: "Let's take a quick tour to help you get started with managing events and engaging your attendees.",
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Your dashboard shows key metrics like active events, registrations, attendance rates, and email engagement. Monitor your event performance at a glance.",
  },
  {
    id: "events",
    title: "Create & Manage Events",
    description: "Create events, set dates and locations, and track registrations. Publish events to make them available for public registration.",
  },
  {
    id: "attendees",
    title: "Track Your Attendees",
    description: "View all registered attendees, their interests, and engagement scores. Use this data to personalize your communication.",
  },
  {
    id: "campaigns",
    title: "Email Campaigns",
    description: "Send personalized reminders and follow-ups. Our AI helps personalize content based on attendee interests and behavior.",
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    description: "Track engagement patterns, email open rates, and attendance trends to optimize your events.",
  },
  {
    id: "complete",
    title: "You're All Set! ✨",
    description: "Start creating events and engaging your attendees. The platform will automatically send personalized reminders and track engagement.",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg shadow-2xl border-2">
        <CardHeader className="relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
              data-testid="button-skip-tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mb-4">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-base">{step.description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            data-testid="button-previous-step"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStep < tourSteps.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="gradient-primary"
              data-testid="button-next-step"
            >
              {currentStep === tourSteps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
