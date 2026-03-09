export type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  githubUsername: string;
  githubUserId: string;
  telegramUsername: string;
  telegramChatId: string;
  attendanceRate: number;
  weeklyState: "critical" | "warning" | "success";
  projectsCount: number;
  lastActivity: string;
  aiSummary: string;
  notes: string;
};

export const students: StudentRecord[] = [
  {
    id: "alina-mironova",
    firstName: "Алина",
    lastName: "Миронова",
    githubUsername: "alina-builds",
    githubUserId: "49210031",
    telegramUsername: "@alinadev",
    telegramChatId: "-1002481900111",
    attendanceRate: 45,
    weeklyState: "critical",
    projectsCount: 2,
    lastActivity: "GitHub sync 2 часа назад",
    aiSummary:
      "Сильный визуальный прогресс, но отсутствует план разработки и не закрыта backend-часть.",
    notes: "Нужно заполнить актуальный план до четверга.",
  },
  {
    id: "roman-belyaev",
    firstName: "Роман",
    lastName: "Беляев",
    githubUsername: "promptroman",
    githubUserId: "59284012",
    telegramUsername: "@romanprompt",
    telegramChatId: "-1002481900112",
    attendanceRate: 62,
    weeklyState: "warning",
    projectsCount: 1,
    lastActivity: "Коммит 3 дня назад",
    aiSummary:
      "Есть рабочий интерфейс и фильтры, но структура репозитория расходится с планом.",
    notes: "Проверить, нужен ли перенос части логики в отдельный модуль.",
  },
  {
    id: "mira-sokolova",
    firstName: "Мира",
    lastName: "Соколова",
    githubUsername: "mira-labs",
    githubUserId: "48221309",
    telegramUsername: "@mirasok",
    telegramChatId: "-1002481900113",
    attendanceRate: 78,
    weeklyState: "success",
    projectsCount: 2,
    lastActivity: "AI-отчет 38 минут назад",
    aiSummary:
      "ТЗ покрывается стабильно, есть хороший темп по delivery и понятная дорожная карта.",
    notes: "Подходит для следующего ручного review после пятничного занятия.",
  },
  {
    id: "egor-kuznetsov",
    firstName: "Егор",
    lastName: "Кузнецов",
    githubUsername: "egork-ai",
    githubUserId: "51004418",
    telegramUsername: "@egorkuz",
    telegramChatId: "",
    attendanceRate: 20,
    weeklyState: "critical",
    projectsCount: 1,
    lastActivity: "Нет коммитов 8 дней",
    aiSummary:
      "Проект почти не обновлялся, есть риск расхождения между текущей реализацией и исходным ТЗ.",
    notes: "Нужно вручную запросить chat id и проверить статус проекта.",
  },
];

export function getStudentById(studentId: string) {
  return students.find((student) => student.id === studentId);
}

export const attendanceLessons = [
  {
    id: "2026-03-10",
    title: "Вторник",
    dateLabel: "10 марта",
    attendanceMarked: 14,
    missingMarks: 4,
  },
  {
    id: "2026-03-12",
    title: "Четверг",
    dateLabel: "12 марта",
    attendanceMarked: 0,
    missingMarks: 18,
  },
  {
    id: "2026-03-13",
    title: "Пятница",
    dateLabel: "13 марта",
    attendanceMarked: 0,
    missingMarks: 18,
  },
];

export const projects = [
  {
    id: "ai-notes-assistant",
    studentName: "Алина Миронова",
    name: "AI Notes Assistant",
    status: "in_progress",
    risk: "Нет плана разработки",
    progress: 22,
    lastCommit: "2 дня назад",
  },
  {
    id: "prompt-builder",
    studentName: "Роман Беляев",
    name: "Prompt Builder",
    status: "review",
    risk: "7+ дней без коммитов",
    progress: 41,
    lastCommit: "8 дней назад",
  },
  {
    id: "study-buddy-bot",
    studentName: "Егор Кузнецов",
    name: "Study Buddy Bot",
    status: "planning",
    risk: "Некорректный GitHub repo",
    progress: 0,
    lastCommit: "нет данных",
  },
];
