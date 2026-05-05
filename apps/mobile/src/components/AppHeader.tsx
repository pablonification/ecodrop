import { CircleHelp } from "lucide-react";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-label="EcoDrop">
        <span className="brand-leaf" />
        <span>ecodrop</span>
      </div>
      <button className="icon-button subtle" aria-label="Bantuan">
        <CircleHelp size={20} />
      </button>
    </header>
  );
}
