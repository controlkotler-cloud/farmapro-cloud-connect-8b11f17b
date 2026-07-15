import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardHighlights } from '@/hooks/useDashboardHighlights';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import {
  EventoCard,
  FormacionCard,
  ForoVivoCard,
  RecursosNuevosCard,
  RetoCard,
} from '@/components/dashboard/HighlightCards';
import { ReboticaBanner } from '@/components/rebotica/ReboticaBanner';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { MiniLeaderboard } from '@/components/dashboard/MiniLeaderboard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const Dashboard = () => {
  const { profile, reloadProfile } = useAuth();
  const { stats } = useDashboard();
  const highlights = useDashboardHighlights();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Sincroniza cuando el profile llega (puede ser null en el primer render
  // porque se carga de forma asíncrona tras onAuthStateChange).
  useEffect(() => {
    if (!profile || dismissed) return;
    setShowOnboarding(!(profile as any).has_completed_onboarding);
  }, [profile, dismissed]);

  const handleOnboardingComplete = () => {
    setDismissed(true);
    setShowOnboarding(false);
    reloadProfile();
  };

  return (
    <div className="space-y-6">
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <DashboardHero
        fullName={profile?.full_name ?? null}
        streak={highlights.streak}
        totalPoints={stats.totalPoints}
        course={highlights.course}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <FormacionCard course={highlights.course} />
        <RetoCard challenge={highlights.challenge} />
        <EventoCard event={highlights.nextEvent} />
      </div>

      <ReboticaBanner />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <ForoVivoCard threads={highlights.threads} />
        <RecursosNuevosCard resources={highlights.resources} />
        <MiniLeaderboard />
      </div>

      <StatsGrid
        coursesCompleted={stats.coursesCompleted}
        resourcesDownloaded={stats.resourcesDownloaded}
        forumPosts={stats.forumPosts}
        challengesCompleted={stats.challengesCompleted}
      />
    </div>
  );
};
