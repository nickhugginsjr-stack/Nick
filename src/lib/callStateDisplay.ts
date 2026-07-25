import type { CallState } from "@/lib/types";

export const CALL_STATE_DISPLAY: Record<
  CallState,
  { label: string; color: string; pulse: boolean }
> = {
  QUEUED: { label: "READY", color: "text-state-idle", pulse: false },
  PREVIEW: { label: "PRESS SPACE TO DIAL", color: "text-accent", pulse: true },
  DIALING_REP: { label: "CALLING YOU", color: "text-state-warn", pulse: true },
  RINGING_REP: { label: "CALLING YOU", color: "text-state-warn", pulse: true },
  DIALING_PROSPECT: { label: "DIALING...", color: "text-state-warn", pulse: true },
  RINGING_PROSPECT: { label: "RINGING...", color: "text-state-info", pulse: true },
  CONNECTED: { label: "CONNECTED", color: "text-state-live", pulse: false },
  BUSY: { label: "BUSY", color: "text-state-danger", pulse: false },
  FAILED: { label: "FAILED", color: "text-state-danger", pulse: false },
  NO_ANSWER: { label: "NO ANSWER", color: "text-state-idle", pulse: false },
  VOICEMAIL: { label: "VOICEMAIL", color: "text-state-voicemail", pulse: false },
  SAVING: { label: "SAVING...", color: "text-state-idle", pulse: true },
  COMPLETED: { label: "YOUR TURN", color: "text-state-live", pulse: false },
};
