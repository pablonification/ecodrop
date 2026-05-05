import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Home,
  MapPin,
  QrCode,
  ReceiptText,
  Recycle,
  RotateCcw,
  UserRound,
  Wallet
} from "lucide-react";
import {
  DEPOSIT_INSERT_WINDOW_SECONDS,
  demoArticles,
  demoSmartBins,
  demoTransactions,
  demoUser,
  type DepositSession
} from "@ecodrop/shared";
import { confirmInsert, createDepositSession, validateBottle } from "./api";

type Tab = "home" | "activity" | "education" | "profile";
type FlowStep = "idle" | "qr" | "capture" | "detecting" | "detected" | "invalid" | "insert" | "success" | "failed";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [flow, setFlow] = useState<FlowStep>("idle");
  const [session, setSession] = useState<DepositSession | null>(null);
  const [timer, setTimer] = useState(DEPOSIT_INSERT_WINDOW_SECONDS);
  const nearestBin = demoSmartBins[0];

  useEffect(() => {
    if (flow !== "insert") return;
    setTimer(DEPOSIT_INSERT_WINDOW_SECONDS);
    const interval = window.setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          setFlow("failed");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [flow]);

  async function startQrFlow() {
    setTab("home");
    setFlow("qr");
    setSession(null);
  }

  async function simulateQrScan() {
    const created = await createDepositSession(nearestBin.id);
    setSession(created);
    setFlow("capture");
  }

  async function simulatePhotoValidation() {
    if (!session) return;
    setFlow("detecting");
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const validated = await validateBottle(session.id);
    setSession(validated);
    setFlow(validated.validation?.isValid ? "detected" : "invalid");
  }

  async function confirmBottleInserted() {
    if (!session) return;
    const ok = await confirmInsert(session.id);
    setFlow(ok ? "success" : "failed");
  }

  function closeFlow(nextTab: Tab = "home") {
    setFlow("idle");
    setTab(nextTab);
    setSession(null);
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {flow === "idle" ? (
          <>
            <Header />
            <div className="screen-content">
              {tab === "home" && <HomeScreen onStart={startQrFlow} />}
              {tab === "activity" && <ActivityScreen />}
              {tab === "education" && <EducationScreen />}
              {tab === "profile" && <ProfileScreen />}
            </div>
            <BottomNav tab={tab} setTab={setTab} onStart={startQrFlow} />
          </>
        ) : (
          <DepositFlow
            flow={flow}
            session={session}
            timer={timer}
            onBack={() => closeFlow("home")}
            onQrScan={simulateQrScan}
            onCapture={simulatePhotoValidation}
            onRetry={() => setFlow("capture")}
            onInsert={() => setFlow("insert")}
            onSensorConfirm={confirmBottleInserted}
            onDone={() => closeFlow("activity")}
          />
        )}
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="top-header">
      <div>
        <span className="eyebrow">EcoDrop</span>
        <h1>Good morning, Arqila</h1>
      </div>
      <div className="avatar">A</div>
    </header>
  );
}

function HomeScreen({ onStart }: { onStart: () => void }) {
  const nearby = demoSmartBins[0];
  return (
    <div className="stack">
      <section className="balance-card">
        <div>
          <span className="muted">Current points</span>
          <strong>{demoUser.points.toLocaleString("id-ID")}</strong>
          <p>Tier {demoUser.tier}</p>
        </div>
        <Wallet size={34} />
      </section>

      <button className="primary-action" onClick={onStart}>
        <QrCode size={22} />
        Start Bottle Deposit
      </button>

      <section className="section">
        <div className="section-title">
          <h2>Nearest SmartBin</h2>
          <span>{nearby.capacityPercent}% full</span>
        </div>
        <article className="list-card">
          <MapPin size={22} />
          <div>
            <strong>{nearby.locationName}</strong>
            <p>{nearby.name} is {nearby.status}</p>
          </div>
          <ChevronRight size={18} />
        </article>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Recent Activity</h2>
          <span>View all</span>
        </div>
        {demoTransactions.slice(0, 2).map((transaction) => (
          <article className="list-card" key={transaction.id}>
            <ReceiptText size={22} />
            <div>
              <strong>{transaction.status === "success" ? "Deposit completed" : "Deposit failed"}</strong>
              <p>{transaction.brand} bottle at {transaction.deviceId}</p>
            </div>
            <b>{transaction.points > 0 ? `+${transaction.points}` : "0"}</b>
          </article>
        ))}
      </section>
    </div>
  );
}

function ActivityScreen() {
  return (
    <div className="stack">
      <h2 className="page-title">Activity</h2>
      {demoTransactions.map((transaction) => (
        <article className="list-card tall" key={transaction.id}>
          <ReceiptText size={24} />
          <div>
            <strong>{transaction.status === "success" ? "Bottle accepted" : "Deposit failed"}</strong>
            <p>{transaction.failureReason ?? `${transaction.volumeMl} ml bottle, ${transaction.points} points`}</p>
          </div>
          <ChevronRight size={18} />
        </article>
      ))}
    </div>
  );
}

function EducationScreen() {
  return (
    <div className="stack">
      <h2 className="page-title">Education</h2>
      {demoArticles.map((article) => (
        <article className="article-card" key={article.id}>
          <BookOpen size={24} />
          <div>
            <strong>{article.title}</strong>
            <p>{article.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="stack">
      <section className="profile-card">
        <div className="avatar large">A</div>
        <h2>{demoUser.name}</h2>
        <p>{demoUser.email}</p>
      </section>
      {["Edit Profile", "Help Center", "Privacy Policy"].map((item) => (
        <article className="list-card" key={item}>
          <UserRound size={22} />
          <div>
            <strong>{item}</strong>
            <p>Manage your EcoDrop account</p>
          </div>
          <ChevronRight size={18} />
        </article>
      ))}
    </div>
  );
}

function DepositFlow(props: {
  flow: FlowStep;
  session: DepositSession | null;
  timer: number;
  onBack: () => void;
  onQrScan: () => void;
  onCapture: () => void;
  onRetry: () => void;
  onInsert: () => void;
  onSensorConfirm: () => void;
  onDone: () => void;
}) {
  const validation = props.session?.validation;
  const title = useMemo(() => {
    if (props.flow === "qr") return "Scan QR";
    if (props.flow === "capture") return "Setor Botol";
    if (props.flow === "detecting") return "Detecting";
    if (props.flow === "detected") return "Bottle Detected";
    if (props.flow === "invalid") return "Bottle Not Validated";
    if (props.flow === "insert") return "Insert Bottle";
    return props.flow === "success" ? "Deposit Successful" : "Deposit Failed";
  }, [props.flow]);

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button className="icon-button" onClick={props.onBack} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <h1>{title}</h1>
        <span />
      </header>

      {props.flow === "qr" && (
        <section className="camera-panel">
          <div className="qr-frame">
            <QrCode size={92} />
          </div>
          <p>Point the camera at the QR code on the EcoDrop SmartBin.</p>
          <button className="primary-action" onClick={props.onQrScan}>
            Simulate QR Scan
          </button>
        </section>
      )}

      {props.flow === "capture" && (
        <section className="camera-panel dark">
          <div className="reference-box">
            <div className="bottle-silhouette" />
          </div>
          <p>Place the bottle on the black reference box and keep it inside the overlay.</p>
          <button className="primary-action" onClick={props.onCapture}>
            <Camera size={20} />
            Capture Bottle
          </button>
        </section>
      )}

      {props.flow === "detecting" && (
        <section className="status-panel">
          <div className="loader" />
          <h2>Checking bottle brand and volume</h2>
          <p>EcoDrop is validating the bottle photo with AI/CV.</p>
        </section>
      )}

      {props.flow === "detected" && validation && (
        <section className="result-panel success">
          <Check size={42} />
          <h2>{validation.brand} bottle detected</h2>
          <dl>
            <div><dt>Volume</dt><dd>{validation.volumeMl} ml</dd></div>
            <div><dt>Confidence</dt><dd>{Math.round(validation.confidence * 100)}%</dd></div>
            <div><dt>Estimated points</dt><dd>{validation.estimatedPoints}</dd></div>
          </dl>
          <button className="primary-action" onClick={props.onInsert}>Open SmartBin</button>
        </section>
      )}

      {props.flow === "invalid" && (
        <section className="result-panel failed">
          <CircleAlert size={42} />
          <h2>Bottle could not be validated</h2>
          <p>{validation?.reason ?? "Please retake the photo with the bottle inside the reference box."}</p>
          <button className="primary-action" onClick={props.onRetry}>
            <RotateCcw size={18} />
            Retake Photo
          </button>
        </section>
      )}

      {props.flow === "insert" && (
        <section className="status-panel">
          <div className="timer">{props.timer}</div>
          <h2>Put the bottle into the SmartBin</h2>
          <p>Points are added only after the IR sensor confirms the bottle entered.</p>
          <button className="primary-action" onClick={props.onSensorConfirm}>Simulate Sensor Confirmed</button>
        </section>
      )}

      {props.flow === "success" && (
        <section className="result-panel success">
          <Check size={46} />
          <h2>Deposit confirmed</h2>
          <p>Your points have been added after SmartBin sensor confirmation.</p>
          <button className="primary-action" onClick={props.onDone}>View Activity</button>
        </section>
      )}

      {props.flow === "failed" && (
        <section className="result-panel failed">
          <CircleAlert size={46} />
          <h2>Deposit failed</h2>
          <p>The bottle was not detected before the timer ended. No points were added.</p>
          <button className="primary-action" onClick={props.onRetry}>Try Again</button>
        </section>
      )}
    </div>
  );
}

function BottomNav({ tab, setTab, onStart }: { tab: Tab; setTab: (tab: Tab) => void; onStart: () => void }) {
  return (
    <nav className="bottom-nav">
      <NavButton active={tab === "home"} icon={<Home size={21} />} label="Home" onClick={() => setTab("home")} />
      <NavButton active={tab === "activity"} icon={<ReceiptText size={21} />} label="Activity" onClick={() => setTab("activity")} />
      <button className="setor-button" onClick={onStart} aria-label="Start deposit">
        <Recycle size={31} />
        <span>Setor</span>
      </button>
      <NavButton active={tab === "education"} icon={<BookOpen size={21} />} label="Education" onClick={() => setTab("education")} />
      <NavButton active={tab === "profile"} icon={<UserRound size={21} />} label="Profile" onClick={() => setTab("profile")} />
    </nav>
  );
}

function NavButton(props: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={props.active ? "nav-item active" : "nav-item"} onClick={props.onClick}>
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
}
