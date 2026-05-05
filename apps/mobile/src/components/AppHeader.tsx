import { CircleHelp } from "lucide-react";
import { figmaAssets } from "../assets/figma";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-label="EcoDrop">
        <img src={figmaAssets.ecodropLogo} alt="EcoDrop" />
      </div>
      <button className="icon-button subtle" aria-label="Bantuan">
        <CircleHelp size={20} />
      </button>
    </header>
  );
}
