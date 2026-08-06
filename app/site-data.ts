export type Platform = "ios" | "android";

export type DemoPhase = {
  id: "due" | "open" | "check" | "intercept";
  eyebrow: string;
  title: string;
  description: string;
};

export type InterceptionBehavior = {
  id: "blocker";
  label: string;
  title: string;
  description: string;
  friction: string;
};

export type Integration = {
  name: string;
  icon: string;
  platformNote?: string;
};

export type IntegrationGroup = {
  title: string;
  accent: "violet" | "cyan" | "lime" | "orange";
  items: Integration[];
};

export type PlanTier = {
  name: "Free" | "Plus" | "Pro";
  eyebrow: string;
  price: string;
  highlighted?: boolean;
  features: string[];
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export const demoPhases: DemoPhase[] = [
  {
    id: "due",
    eyebrow: "01 · Work ready",
    title: "Work is due",
    description: "3 tasks are waiting.",
  },
  {
    id: "open",
    eyebrow: "02 · Distraction",
    title: "You open a distraction",
    description: "Example: Moments.",
  },
  {
    id: "check",
    eyebrow: "03 · Nonlate",
    title: "Nonlate checks",
    description: "Finds 3 due tasks.",
  },
  {
    id: "intercept",
    eyebrow: "04 · Intercept",
    title: "Blocker appears",
    description: "Actual iOS + Android screens.",
  },
];

export const blockingBehavior: InterceptionBehavior = {
  id: "blocker",
  label: "Core experience",
  title: "Block distracting apps when work is due.",
  description:
    "The blocker shows what is overdue and due next, then sends you back to the plan or into the timed break you configured.",
  friction: "Deadline context, not a generic wall",
};

const icon = (name: string) => `/assets/integrations/${name}.png`;

export const integrationGroups: IntegrationGroup[] = [
  {
    title: "School",
    accent: "violet",
    items: [
      { name: "Canvas", icon: icon("canvas") },
      { name: "Google Classroom", icon: icon("google_classroom") },
      { name: "Moodle", icon: icon("moodle") },
      { name: "Blackboard", icon: icon("blackboard") },
      { name: "Brightspace", icon: icon("brightspace") },
      { name: "Schoology", icon: icon("schoology") },
    ],
  },
  {
    title: "Calendars",
    accent: "cyan",
    items: [
      { name: "Google Calendar", icon: icon("google_calendar") },
      { name: "Outlook Calendar", icon: icon("outlook_calendar") },
      { name: "Calendar feeds", icon: icon("ical") },
    ],
  },
  {
    title: "Tasks",
    accent: "lime",
    items: [
      { name: "Google Tasks", icon: icon("google_tasks") },
      { name: "Todoist", icon: icon("todoist") },
      { name: "TickTick", icon: icon("ticktick") },
      { name: "Microsoft To Do", icon: icon("microsoft_todo") },
      { name: "Apple Reminders", icon: icon("apple_reminders"), platformNote: "iOS" },
    ],
  },
  {
    title: "Work & projects",
    accent: "orange",
    items: [
      { name: "Notion", icon: icon("notion") },
      { name: "Asana", icon: icon("asana") },
      { name: "Monday.com", icon: icon("monday") },
      { name: "Trello", icon: icon("trello") },
      { name: "ClickUp", icon: icon("clickup") },
      { name: "GitHub Issues", icon: icon("github") },
      { name: "Linear", icon: icon("linear") },
      { name: "Jira", icon: icon("jira") },
      { name: "Slack", icon: icon("slack") },
      { name: "Microsoft Planner", icon: icon("microsoft_planner") },
      { name: "Microsoft Teams", icon: icon("microsoft_teams") },
    ],
  },
];

export const planTiers: PlanTier[] = [
  {
    name: "Free",
    eyebrow: "The essentials",
    price: "$0",
    features: [
      "1 active source",
      "Up to 3 protected apps",
      "Sync when you open or refresh",
      "Core tasks and reminders",
      "Ad-supported",
    ],
  },
  {
    name: "Plus",
    eyebrow: "Best for most people",
    price: "Paid",
    highlighted: true,
    features: [
      "3 active sources",
      "Hourly background sync",
      "Apps, websites, and categories",
      "Widgets, themes, and insights",
      "No ads",
    ],
  },
  {
    name: "Pro",
    eyebrow: "Everything connected",
    price: "Paid",
    features: [
      "All supported task sources",
      "Live Sync where supported",
      "Trello access",
      "Fastest supported updates",
      "Everything in Plus",
    ],
  },
];

export const faqEntries: FaqEntry[] = [
  {
    question: "What happens when I open a blocked app?",
    answer:
      "Nonlate checks what is due and shows the platform-appropriate blocker. You can return to your plan, complete the work, or take the timed break you configured. Focus Lock adds a stronger reflection step to that break flow.",
  },
  {
    question: "Does Nonlate replace my task apps?",
    answer:
      "No. It gathers deadlines from supported services, lets you add manual tasks, and turns that shared due-work context into plans, reminders, and focus rules.",
  },
  {
    question: "Do calendar events trigger blocking?",
    answer:
      "No. Calendar events can appear in your schedule and planning views, but only due tasks participate in deadline-aware blocking.",
  },
  {
    question: "Does every integration update instantly?",
    answer:
      "No. Update speed varies by provider and plan. Free refreshes when you open or manually refresh, Plus adds hourly background sync, and Pro adds Live Sync where supported.",
  },
  {
    question: "Does blocking work identically on iOS and Android?",
    answer:
      "The deadline-aware experience exists on both platforms, but their permissions and presentation differ. iOS uses Apple Screen Time shields; Android uses Accessibility only to detect selected app-open moments and can show a fuller task view.",
  },
  {
    question: "When can I download it?",
    answer:
      "Nonlate is coming soon to iOS and Android. Public store links will appear here only when both listings are genuinely ready.",
  },
];
