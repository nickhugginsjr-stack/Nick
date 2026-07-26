export type CallState =
  | "QUEUED"
  | "PREVIEW"
  | "DIALING_REP"
  | "RINGING_REP"
  | "DIALING_PROSPECT"
  | "RINGING_PROSPECT"
  | "CONNECTED"
  | "BUSY"
  | "FAILED"
  | "NO_ANSWER"
  | "VOICEMAIL"
  | "SAVING"
  | "COMPLETED";

export type Disposition =
  | "APPOINTMENT"
  | "FOLLOW_UP"
  | "VOICEMAIL"
  | "NO_ANSWER"
  | "NOT_INTERESTED"
  | "WRONG_NUMBER"
  | "DO_NOT_CALL"
  | "SAVE_AND_NEXT";

export type RelationshipStatus =
  | "COLD"
  | "WARM"
  | "FOLLOW_UP"
  | "CLIENT"
  | "DO_NOT_CALL";

export interface ProspectSnapshot {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  industry: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  relationshipStatus: RelationshipStatus;
  script: string | null;
  quickFacts: string | null;
  lastContactedAt: string | null;
}

export interface NoteSnapshot {
  id: string;
  content: string;
  createdAt: string;
}

export interface CallSnapshot {
  id: string;
  sessionId: string;
  prospectId: string;
  state: CallState;
  disposition: Disposition | null;
  startedAt: string;
  connectedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  prospect: ProspectSnapshot;
  notes: NoteSnapshot[];
  previousNotes: NoteSnapshot[];
}

export interface ActivityEventSnapshot {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface SessionSnapshot {
  session: {
    id: string;
    status: "ACTIVE" | "ENDED";
    goal: number;
    startedAt: string;
    endedAt: string | null;
    repPhone: string;
  };
  currentCall: CallSnapshot | null;
  stateCounts: Record<string, number>;
  dispositionCounts: Record<string, number>;
  totalDials: number;
  avgCallDurationSeconds: number;
  activity: ActivityEventSnapshot[];
}

export interface DailyProgress {
  dials: number;
  goal: number;
  pct: number;
}

export const DISPOSITIONS: {
  key: Disposition;
  shortcut: string;
  label: string;
}[] = [
  { key: "APPOINTMENT", shortcut: "1", label: "Appointment" },
  { key: "FOLLOW_UP", shortcut: "2", label: "Follow-up" },
  { key: "VOICEMAIL", shortcut: "3", label: "Voicemail" },
  { key: "NO_ANSWER", shortcut: "4", label: "No Answer" },
  { key: "NOT_INTERESTED", shortcut: "5", label: "Not Interested" },
  { key: "WRONG_NUMBER", shortcut: "6", label: "Wrong Number" },
  { key: "DO_NOT_CALL", shortcut: "7", label: "Do Not Call" },
  { key: "SAVE_AND_NEXT", shortcut: "8", label: "Save & Next" },
];
