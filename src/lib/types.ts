export type WeeklyState = "critical" | "warning" | "success";

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

export type AttendanceLessonRecord = {
  id: string;
  title: string;
  dateLabel: string;
  attendanceMarked: number;
  missingMarks: number;
};

export type ProjectRecord = {
  id: string;
  studentName: string;
  name: string;
  status: string;
  risk: string;
  progress: number;
  lastCommit: string;
  githubUrl: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  specMarkdown: string;
  planMarkdown: string;
  aiSummary: string;
  nextSteps: string[];
};
