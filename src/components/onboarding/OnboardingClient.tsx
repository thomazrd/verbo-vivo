
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { WelcomeStep } from "./WelcomeStep";
import { GoalSelectionStep, type Goal } from "./GoalSelectionStep";
import { TopicSelectionStep, type Topic } from "./TopicSelectionStep";
import { HabitSetupStep } from "./HabitSetupStep";

type OnboardingStep = "welcome" | "goals" | "topics" | "habit";

export function OnboardingClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("welcome");

  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);

  const handleGoalsSubmit = (goals: Goal[]) => {
    setSelectedGoals(goals);
    setStep("topics");
  };

  const handleTopicsSubmit = (topics: Topic[]) => {
    setSelectedTopics(topics);
    setStep("habit");
  };

  const handleFinishOnboarding = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          onboardingCompleted: true,
          goals: selectedGoals.map(g => g.id),
          topics: selectedTopics.map(t => t.id),
        },
        { merge: true }
      );
      router.push("/home");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Failsafe redirect
      router.push("/home");
    }
  };
  
  const renderStep = () => {
      switch(step) {
          case "welcome":
              return <WelcomeStep onNext={() => setStep("goals")} />;
          case "goals":
              return <GoalSelectionStep onNext={handleGoalsSubmit} />;
          case "topics":
              return <TopicSelectionStep onBack={() => setStep("goals")} onNext={handleTopicsSubmit} />;
          case "habit":
              return <HabitSetupStep onBack={() => setStep("topics")} onFinish={handleFinishOnboarding} />;
          default:
              return <WelcomeStep onNext={() => setStep("goals")} />;
      }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                {renderStep()}
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
