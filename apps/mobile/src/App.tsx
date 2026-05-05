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
import { AppOverlayScreens } from "./screens/AppOverlayScreens";
import { DepositFlow } from "./screens/DepositFlow";
import { EducationScreen } from "./screens/EducationScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { WithdrawFlow } from "./screens/WithdrawFlow";
import type { FlowStep, ProfileView, OverlayView, WithdrawStep, Tab } from "./types";

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
  const [selectedSmartBin, setSelectedSmartBin] = useState<SmartBin | null>(null);
  const [profileView, setProfileView] = useState<ProfileView>("main");
  const [overlayView, setOverlayView] = useState<OverlayView | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(DEV_SESSION_STORAGE_KEY) === "active");
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>("idle");

  const nearestBin = useMemo(() => devices[0] ?? demoSmartBins[0], [devices]);
  const isProfileSubView = tab === "profile" && profileView !== "main";
  const isHomeBinDetail = tab === "home" && selectedSmartBin !== null;
  const isEducationTab = tab === "education";
  const isEducationDetail = isEducationTab && selectedArticle !== null;
  const isActivityTab = tab === "activity";
  const isActivityDetail = isActivityTab && selectedTransaction !== null;
  const isOverlayView = overlayView !== null;

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
    setSelectedSmartBin(null);
    setProfileView("main");
    setFinalTransaction(null);
    setSession(null);
    setFlow("qr");
  }

  async function createSessionFromQr(qrToken?: string) {
    const token = qrToken ?? nearestBin.id;
    const created = await createDepositSession(token);
    setSession(created);
    setFlow("capture");
  }

  async function closeDeposit(nextTab: Tab = "home") {
    setFlow("idle");
    setSession(null);
    setFinalTransaction(null);
    setTab(nextTab);
    setSelectedSmartBin(null);
    setOverlayView(null);
    await loadAppData();
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setSelectedArticle(null);
    setSelectedTransaction(null);
    setSelectedSmartBin(null);
    setProfileView("main");
    setOverlayView(null);
  }

  function openOverlay(view: OverlayView) {
    setOverlayView(view);
    setSelectedArticle(null);
    setSelectedTransaction(null);
    setSelectedSmartBin(null);
    setProfileView("main");
  }

  function openSmartBinFromOverlay(device: SmartBin) {
    setOverlayView(null);
    setTab("home");
    setSelectedSmartBin(device);
  }

  function startDemoSession() {
    localStorage.setItem(DEV_SESSION_STORAGE_KEY, "active");
    setIsLoggedIn(true);
  }

  function startWithdraw() {
    setWithdrawStep("amount");
  }

  function logout() {
    localStorage.removeItem(DEV_SESSION_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_DEPOSIT_STORAGE_KEY);
    setIsLoggedIn(false);
    setTab("home");
    setFlow("idle");
    setWithdrawStep("idle");
    setProfileView("main");
    setSelectedArticle(null);
    setSelectedTransaction(null);
    setSelectedSmartBin(null);
    setSession(null);
    setFinalTransaction(null);
    setOverlayView(null);
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {!isLoggedIn ? (
          <LoginScreen onLogin={startDemoSession} />
        ) : flow !== "idle" ? (
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
            devices={devices}
          />
        ) : withdrawStep !== "idle" ? (
          <WithdrawFlow
            user={user}
            step={withdrawStep}
            setStep={setWithdrawStep}
            onClose={() => setWithdrawStep("idle")}
            onDone={() => setWithdrawStep("idle")}
          />
        ) : (
          <>
            {!isOverlayView && !isProfileSubView && !isHomeBinDetail && !isEducationTab && !isActivityTab && <AppHeader />}
            <div
              className={
                isOverlayView
                  ? "screen-content overlay-content"
                  : isProfileSubView
                  ? "screen-content profile-subview-content"
                  : isHomeBinDetail
                    ? "screen-content home-bin-detail-content"
                    : isActivityTab
                      ? "screen-content activity-content"
                    : isEducationTab
                      ? "screen-content education-content"
                    : "screen-content"
              }
            >
              {overlayView && (
                <AppOverlayScreens
                  view={overlayView}
                  user={user}
                  devices={devices}
                  onBack={() => setOverlayView(null)}
                  onOpenView={setOverlayView}
                  onOpenSmartBin={openSmartBinFromOverlay}
                  onStartDeposit={startDeposit}
                />
              )}
              {!overlayView && tab === "home" && (
                <HomeScreen
                  user={user}
                  devices={devices}
                  transactions={transactions}
                  onStart={startDeposit}
                  onWithdraw={startWithdraw}
                  onOpenActivity={() => changeTab("activity")}
                  onOpenEducation={() => changeTab("education")}
                  onOpenWithdraw={() => openOverlay("withdraw")}
                  onOpenSmartBins={() => openOverlay("smartbins")}
                  selectedSmartBin={selectedSmartBin}
                  onOpenSmartBin={setSelectedSmartBin}
                  onCloseSmartBin={() => setSelectedSmartBin(null)}
                />
              )}
              {!overlayView && tab === "activity" && (
                <ActivityScreen
                  transactions={transactions}
                  selected={selectedTransaction}
                  onSelect={setSelectedTransaction}
                  onBack={() => setSelectedTransaction(null)}
                  onOpenReward={() => openOverlay("reward")}
                />
              )}
              {!overlayView && tab === "education" && (
                <EducationScreen
                  articles={articles}
                  selected={selectedArticle}
                  onSelect={setSelectedArticle}
                  onBack={() => setSelectedArticle(null)}
                />
              )}
              {tab === "profile" && (
                <ProfileScreen 
                  user={user} 
                  view={profileView} 
                  setView={setProfileView} 
                  onLogout={logout}
                  onOpenWithdraw={() => openOverlay("withdraw")}
                  onOpenWithdrawalHistory={() => openOverlay("withdrawal-history")}
                  onOpenNotifications={() => openOverlay("notifications")}
                  onOpenSupport={() => openOverlay("support")}
                  onWithdraw={startWithdraw}
                />
              )}
            </div>
            {!isOverlayView && !isProfileSubView && !isHomeBinDetail && !isEducationDetail && !isActivityDetail && <BottomNav tab={tab} setTab={changeTab} onStart={startDeposit} />}
          </>
        )}
      </section>
    </main>
  );
}
