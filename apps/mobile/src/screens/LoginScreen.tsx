import { figmaAssets } from "../assets/figma";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <section className="login-screen">
      <div className="login-brand">
        <img className="login-logo-mark" src={figmaAssets.ecodropLogo} alt="EcoDrop" />
        <p>Welcome back to a greener world.</p>
      </div>
      <section className="login-card">
        <button className="google-login-button" onClick={onLogin}>
          <img src={figmaAssets.googleIcon} alt="" />
          Continue with Google
        </button>
      </section>
    </section>
  );
}
