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
    description: "Manual and synced tasks are overdue or due soon.",
  },
  {
    id: "open",
    eyebrow: "02 · Distraction",
    title: "You open a distraction",
    description: "Example: Moments, an app you chose to protect.",
  },
  {
    id: "check",
    eyebrow: "03 · Nonlate",
    title: "Nonlate checks",
    description: "Finds 3 unfinished tasks that match your due-work settings.",
  },
  {
    id: "intercept",
    eyebrow: "04 · Intercept",
    title: "Blocker appears",
    description: "iOS shows its shield; Android shows the fuller task blocker.",
  },
];

export const blockingBehavior: InterceptionBehavior = {
  id: "blocker",
  label: "Core experience",
  title: "Block distracting apps when work is due.",
  description:
    "The blocker shows the work that made it appear—overdue first, then what is due next—and offers the task or timed-break actions supported by that platform.",
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
      "1 connected source at a time",
      "Up to 3 protected apps",
      "Tasks sync when you open Nonlate or refresh",
      "Manual tasks and core blocking",
      "Ads for eligible users",
    ],
  },
  {
    name: "Plus",
    eyebrow: "Best for most people",
    price: "Paid",
    highlighted: true,
    features: [
      "Up to 3 connected sources",
      "Sources refresh hourly in the background",
      "Unlimited app blocking plus supported websites and categories",
      "Widgets, themes, and extended insights",
      "No ads",
    ],
  },
  {
    name: "Pro",
    eyebrow: "Everything connected",
    price: "Paid",
    features: [
      "Unlimited connected task sources",
      "Live Sync for supported integrations",
      "Trello connection and sync",
      "Fastest updates each provider supports",
      "Everything in Plus",
    ],
  },
];

export const faqEntries: FaqEntry[] = [
  {
    question: "What happens when I open a blocked app?",
    answer:
      "When you open an app you chose to protect, Nonlate checks unfinished tasks that are overdue or inside your due window. If matching work exists, it shows the iOS or Android blocker with the actions available on that platform. Focus Lock removes the quick-break option and adds a reflection step before a timed break.",
  },
  {
    question: "Does Nonlate replace my task apps?",
    answer:
      "No. Synced tasks stay connected to their original service, while tasks you create in Nonlate are manual tasks. Nonlate brings both into one due-work list, then uses that list in Planner, Schedule, widgets, alarms, insights, and blocking.",
  },
  {
    question: "Do calendar events trigger blocking?",
    answer:
      "No. Calendar events can appear beside planned work, tasks, classes, and shifts in Schedule, but only unfinished due tasks participate in deadline-aware blocking.",
  },
  {
    question: "Does every integration update instantly?",
    answer:
      "No. Update speed depends on both the provider and your plan. Free syncs when you open Nonlate or refresh, Plus refreshes selected sources hourly in the background, and Pro adds Live Sync only for integrations that support it.",
  },
  {
    question: "Does blocking work identically on iOS and Android?",
    answer:
      "No. Both platforms check due work before selected distractions, but the operating systems allow different presentations. iOS uses Apple Screen Time shields. Android uses Accessibility only to detect when a selected app opens and can show a fuller blocker with task details.",
  },
  {
    question: "When can I download it?",
    answer:
      "Nonlate is coming soon to iOS and Android. This website has no waitlist or placeholder store buttons; verified store links will appear only when the apps are ready to download.",
  },
];
