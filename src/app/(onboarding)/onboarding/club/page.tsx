import { Suspense } from "react";
import ClubSetup from "@/components/onboarding/ClubSetup";

export default function OnboardingClubPage() {
  return (
    <Suspense>
      <ClubSetup />
    </Suspense>
  );
}
