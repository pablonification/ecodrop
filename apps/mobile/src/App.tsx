import { useEffect, useMemo, useState } from "react";
import {
  demoArticles,
  demoSmartBins,
  demoTransactions,
  demoUser,
  type DepositSession,
  type DepositTransaction,
  type EcoUser,
  type EducationArticle,
  type SmartBin
} from "@ecodrop/shared";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import {
  createDepositSession,
  getCurrentUser,
  getEducationArticles,
  getSmartBins,
  getTransactions
} from "./api";
import { ActivityScreen } from "./screens/ActivityScreen";
import { DepositFlow } from "./screens/DepositFlow";
import { EducationScreen } from "./screens/EducationScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import type { FlowStep, ProfileView, Tab } from "./types";

const ACTIVE_DEPOSIT_STORAGE_KEY = "ecodrop.activeDeposit";
const DEV_SESSION_STORAGE_KEY = "ecodrop.devSession";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [flow, setFlow] = useState<FlowStep>("idle");
  const [user, setUser] = useState<EcoUser>(demoUser);
  const [devices, setDevices] = useState<SmartBin[]>(demoSmartBins);
  const [transactions, setTransactions] = useState<DepositTransaction[]>(demoTransactions);
  const [articles, setArticles] = useState<EducationArticle[]>(demoArticles);
  const [session, setSession] = useState<DepositSession | null>(null);
  const [finalTransaction, setFinalTransaction] = useState<DepositTransaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<DepositTransaction | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);
  const [profileView, setProfileView] = useState<ProfileView>("main");
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(DEV_SESSION_STORAGE_KEY) === "active");

  const nearestBin = useMemo(() => devices[0] ?? demoSmartBins[0], [devices]);

  useEffect(() => {
    void loadAppData();
    restoreActiveDeposit();
  }, []);

  useEffect(() => {
    if (flow === "idle" || !session) {
      localStorage.removeItem(ACTIVE_DEPOSIT_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      ACTIVE_DEPOSIT_STORAGE_KEY,
      JSON.stringify({ session, flow })
    );
  }, [flow, session]);

  async function loadAppData() {
    const [nextUser, nextDevices, nextTransactions, nextArticles] = await Promise.all([
      getCurrentUser(),
      getSmartBins(),
      getTransactions(),
      getEducationArticles()
    ]);
    setUser(nextUser);
    setDevices(nextDevices);
    setTransactions(nextTransactions);
    setArticles(nextArticles);
  }

  function restoreActiveDeposit() {
    const raw = localStorage.getItem(ACTIVE_DEPOSIT_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { session: DepositSession; flow: FlowStep };
      if (parsed.session && parsed.flow !== "success" && parsed.flow !== "failed") {
        setSession(parsed.session);
        setFlow(parsed.flow);
      }
    } catch {
      localStorage.removeItem(ACTIVE_DEPOSIT_STORAGE_KEY);
    }
  }

  async function startDeposit() {
    setTab("home");
    setSelectedArticle(null);
    setSelectedTransaction(null);
    setProfileView("main");
    setFinalTransaction(null);
    setSession(null);
    setFlow("qr");
  }

  async function createSessionFromQr() {
    const created = await createDepositSession(nearestBin.id);
    setSession(created);
    setFlow("capture");
  }

  async function closeDeposit(nextTab: Tab = "home") {
    setFlow("idle");
    setSession(null);
    setFinalTransaction(null);
    setTab(nextTab);
    await loadAppData();
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setSelectedArticle(null);
    setSelectedTransaction(null);
    setProfileView("main");
  }

  function startDemoSession() {
    localStorage.setItem(DEV_SESSION_STORAGE_KEY, "active");
    setIsLoggedIn(true);
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {!isLoggedIn ? (
          <LoginScreen onLogin={startDemoSession} />
        ) : flow === "idle" ? (
          <>
            <AppHeader />
            <div className="screen-content">
              {tab === "home" && (
                <HomeScreen
                  user={user}
                  devices={devices}
                  transactions={transactions}
                  onStart={startDeposit}
                  onOpenActivity={() => changeTab("activity")}
                  onOpenEducation={() => changeTab("education")}
                />
              )}
              {tab === "activity" && (
                <ActivityScreen
                  transactions={transactions}
                  selected={selectedTransaction}
                  onSelect={setSelectedTransaction}
                  onBack={() => setSelectedTransaction(null)}
                />
              )}
              {tab === "education" && (
                <EducationScreen
                  articles={articles}
                  selected={selectedArticle}
                  onSelect={setSelectedArticle}
                  onBack={() => setSelectedArticle(null)}
                />
              )}
              {tab === "profile" && (
                <ProfileScreen user={user} view={profileView} setView={setProfileView} />
              )}
            </div>
            <BottomNav tab={tab} setTab={changeTab} onStart={startDeposit} />
          </>
        ) : (
          <DepositFlow
            flow={flow}
            setFlow={setFlow}
            session={session}
            setSession={setSession}
            finalTransaction={finalTransaction}
            setFinalTransaction={setFinalTransaction}
            onCreateSession={createSessionFromQr}
            onClose={() => closeDeposit("home")}
            onDone={() => closeDeposit("home")}
          />
        )}
      </section>
    </main>
  );
}
