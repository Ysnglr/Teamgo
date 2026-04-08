import { Suspense } from "react";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default function OnboardingSetupPage() {
  return (
    <Suspense>
      <OnboardingWizard />
    </Suspense>
  );
}
