export type WeeklyState = "critical" | "warning" | "success";

export type TeacherSessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
  githubLogin: string;
};

export type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  githubUsername: string;
  githubUserId: string;
  telegramUsername: string;
  telegramChatId: string;
  attendanceRate: number;
  weeklyState: WeeklyState;
  projectsCount: number;
  lastActivity: string;
  aiSummary: string;
  notes: string;
};

export type StudentInput = {
  firstName: string;
  lastName: string;
  githubUsername: string;
  githubUserId: string;
  telegramUsername: string;
  telegramChatId: string;
  notes: string;
};

export type AttendanceLessonRecord = {
  id: string;
  title: string;
  dateLabel: string;
  lessonDate: string;
  weekStart: string;
  weekdayCode: "tue" | "thu" | "fri";
  attendanceMarked: number;
  missingMarks: number;
  isGenerated: boolean;
  isClosed: boolean;
};

export type AttendanceGridRow = {
  student: StudentRecord;
  lessonStates: Record<string, "present" | "absent" | "unmarked">;
};

export type AttendanceWeekRecord = {
  weekStart: string;
  lessons: AttendanceLessonRecord[];
  rows: AttendanceGridRow[];
  studentsNeedingAttention: StudentRecord[];
};

export type ProjectRisk =
  | "healthy"
  | "invalid_github_repo"
  | "missing_spec"
  | "missing_plan"
  | "stale_repo"
  | "low_progress";

export type ProjectRecord = {
  id: string;
  studentId: string;
  studentName: string;
  name: string;
  summary: string;
  status: string;
  risk: string;
  riskFlags: ProjectRisk[];
  progress: number;
  aiCompletionPercent: number;
  manualCompletionPercent: number | null;
  manualOverrideEnabled: boolean;
  manualOverrideNote: string;
  lastCommit: string;
  lastCommitSha: string;
  lastSyncAt: string;
  lastAiAnalysisAt: string;
  githubUrl: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  specMarkdown: string;
  planMarkdown: string;
  aiSummary: string;
  nextSteps: string[];
};

export type ProjectInput = {
  studentId: string;
  name: string;
  summary: string;
  githubUrl: string;
  status: string;
  specMarkdown: string;
  planMarkdown: string;
};

export type ProjectAiReportRecord = {
  id: string;
  projectId: string;
  sourceCommitSha: string;
  analysisVersion: string;
  modelName: string;
  inputSnapshotJson: string;
  summary: string;
  completionPercent: number;
  implementedItems: string[];
  partialItems: string[];
  missingItems: string[];
  risks: string[];
  nextSteps: string[];
  createdAt: string;
};
