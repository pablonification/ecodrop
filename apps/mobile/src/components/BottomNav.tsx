import type { ReactNode } from "react";
import { BookOpen, Home, ReceiptText, Recycle, UserRound } from "lucide-react";
import type { Tab } from "../types";

type BottomNavProps = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  onStart: () => void;
};

export function BottomNav({ tab, setTab, onStart }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <NavButton active={tab === "home"} icon={<Home size={19} />} label="Beranda" onClick={() => setTab("home")} />
      <NavButton
        active={tab === "activity"}
        icon={<ReceiptText size={19} />}
        label="Aktivitas"
        onClick={() => setTab("activity")}
      />
      <button className="setor-fab" onClick={onStart} aria-label="Mulai setor botol">
        <Recycle size={25} />
        <span>Setor</span>
      </button>
      <NavButton
        active={tab === "education"}
        icon={<BookOpen size={21} />}
        label="Edukasi"
        onClick={() => setTab("education")}
      />
      <NavButton
        active={tab === "profile"}
        icon={<UserRound size={19} />}
        label="Profil"
        onClick={() => setTab("profile")}
      />
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
