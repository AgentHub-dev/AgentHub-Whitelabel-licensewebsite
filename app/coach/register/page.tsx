import { Suspense } from "react";
import CoachRegisterForm from "@/app/components/CoachRegisterForm";

export const metadata = {
  title: "Coach werden — AgentHub",
  description: "Registriere deine eigene Unternehmenslizenz als AgentHub-Coach.",
};

export default function CoachRegisterPage() {
  return (
    <Suspense fallback={null}>
      <CoachRegisterForm />
    </Suspense>
  );
}
