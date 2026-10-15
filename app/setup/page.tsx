import type { Metadata } from "next";
import { QuizSetup } from "@/components/QuizSetup";

export const metadata: Metadata = {
  title: "Create the quiz",
  description: "Replace the awards quiz with a new project list.",
};

export default function SetupPage() {
  return <QuizSetup />;
}
