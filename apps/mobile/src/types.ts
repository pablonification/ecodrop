export type Tab = "home" | "activity" | "education" | "profile";

export type FlowStep =
  | "idle"
  | "qr"
  | "capture"
  | "detecting"
  | "detected"
  | "invalid"
  | "insert"
  | "success"
  | "failed";

export type ProfileView = "main" | "edit" | "help" | "privacy";

export type OverlayView =
  | "withdraw"
  | "withdrawal-history"
  | "notifications"
  | "support"
  | "smartbins"
  | "reward";

export type WithdrawStep = "idle" | "amount" | "qris" | "success" | "failed";
