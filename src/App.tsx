import { useCallback, useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import SplashScreen from '@/screens/SplashScreen';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import UploadScreen from '@/screens/UploadScreen';
import CalibrationScreen, { type ManualMeasurement } from '@/screens/CalibrationScreen';
import ActivityScreen from '@/screens/ActivityScreen';
import AnalysisScreen from '@/screens/AnalysisScreen';
import ResultScreen from '@/screens/ResultScreen';
import HowItWorksScreen from '@/screens/HowItWorksScreen';
import type { ActivityId, AnalysisResult } from '@/data/shoes';
import { saveAnalysis } from '@/lib/history';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

type Screen = 'splash' | 'auth' | 'home' | 'upload' | 'calibrate' | 'activity' | 'analysis' | 'result' | 'howitworks';


function AppInner() {
  const { session, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('splash');
  const [topImage, setTopImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const [justFinishedFirstAnalysis, setJustFinishedFirstAnalysis] = useState(false);
  const [manualMeasurement, setManualMeasurement] = useState<ManualMeasurement | null>(null);

  const handleSplashDone = () => {
    setScreen(session ? 'home' : 'auth');
  };

  // When session changes (sign in / sign out), route accordingly — unless we're still on splash.
  const handleUploadNext = (top: string, side: string) => {
    setTopImage(top);
    setSideImage(side);
    setScreen('calibrate');
  };

  const handleCalibrationNext = (measurement: ManualMeasurement) => {
    setManualMeasurement(measurement);
    setScreen('activity');
  };

  const handleActivityNext = (selectedActivity: ActivityId) => {
    setActivity(selectedActivity);
    setScreen('analysis');
  };


  const handleAnalysisComplete = useCallback(async (analysisResult: AnalysisResult) => {
    setResult(analysisResult);
    setAnalysisId(null);
    setScreen('result');
    if (session) {
      const saved = await saveAnalysis(analysisResult);
      if (saved) setAnalysisId(saved.id);
      setHistoryTick((t) => t + 1);
      setJustFinishedFirstAnalysis(true);
    }
  }, [session]);

  const goHome = () => {
    setTopImage(null);
    setSideImage(null);
    setActivity(null);
    setResult(null);
    setAnalysisId(null);
    setManualMeasurement(null);
    setScreen('home');
  };

  const handleAnalyzeAgain = () => {
    setTopImage(null);
    setSideImage(null);
    setActivity(null);
    setResult(null);
    setAnalysisId(null);
    setManualMeasurement(null);
    setScreen('home');
    setJustFinishedFirstAnalysis(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="scale-150"><Logo size="md" /></div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Not signed in: show splash first, then the auth screen.
  if (!session) {
    return (
      <div className="min-h-screen">
        {screen === 'splash' ? (
          <SplashScreen onDone={handleSplashDone} />
        ) : (
          <AuthScreen />
        )}
      </div>
    );
  }

  // Signed in.
  return (
    <div className="min-h-screen">
      {screen === 'splash' && <SplashScreen onDone={handleSplashDone} />}
      {screen === 'home' && <HomeScreen onGetStarted={() => setScreen('upload')} onHowItWorks={() => setScreen('howitworks')} historyTick={historyTick} justFinishedFirstAnalysis={justFinishedFirstAnalysis} onAppRatingDismissed={() => setJustFinishedFirstAnalysis(false)} />}
      {screen === 'upload' && <UploadScreen onBack={() => setScreen('home')} onHome={goHome} onNext={handleUploadNext} />}
      {screen === 'calibrate' && topImage && (
        <CalibrationScreen
          topImage={topImage}
          onBack={() => setScreen('upload')}
          onHome={goHome}
          onNext={handleCalibrationNext}
        />
      )}
      {screen === 'activity' && <ActivityScreen onBack={() => setScreen('calibrate')} onHome={goHome} onNext={handleActivityNext} />}
      {screen === 'analysis' && activity && topImage && sideImage && (
        <AnalysisScreen
          activity={activity}
          topImage={topImage}
          sideImage={sideImage}
          manualMeasurement={manualMeasurement}
          onHome={goHome}
          onComplete={handleAnalysisComplete}
        />
      )}

      {screen === 'result' && result && (
        <ResultScreen result={result} analysisId={analysisId} onBack={() => setScreen('activity')} onHome={goHome} onAnalyzeAgain={handleAnalyzeAgain} />
      )}
      {screen === 'howitworks' && <HowItWorksScreen onBack={() => setScreen('home')} onHome={goHome} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
