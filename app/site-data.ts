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
  annualPrice?: string;
  highlighted?: boolean;
  features: string[];
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export const appStoreUrl = "https://apps.apple.com/app/id6759996284";
export const playStoreUrl = "https://play.google.com/store/apps/details?id=com.nonlate.app";

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
    "The blocker shows the work that made it appear, with overdue tasks first and upcoming work next. It then offers the task or timed-break actions supported by that platform.",
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

const featuredIntegrationNames = new Set([
  "Canvas", "Google Classroom", "Google Calendar", "Todoist", "Microsoft To Do", "Notion",
]);

export const featuredIntegrations = integrationGroups
  .flatMap((group) => group.items)
  .filter((item) => featuredIntegrationNames.has(item.name));

export const planTiers: PlanTier[] = [
  {
    name: "Free",
    eyebrow: "The essentials",
    price: "$0",
    features: [
      "Try 1 external source at a time for 30 days",
      "Up to 3 protected apps",
      "Source sync on open or refresh during the trial",
      "Manual tasks and core blocking stay free",
      "On-device calendars and reminders stay free",
      "Ad-free, with no automatic trial charge",
    ],
  },
  {
    name: "Plus",
    eyebrow: "Best for most people",
    price: "$5.99 / month",
    annualPrice: "$59.99 / year",
    highlighted: true,
    features: [
      "7-day free trial on monthly or yearly, if eligible",
      "Up to 3 connected sources",
      "Hourly background sync when available",
      "Unlimited app blocking plus supported websites and categories",
      "Widgets, themes, app icons, and extended insights",
      "Custom intercept messages",
    ],
  },
  {
    name: "Pro",
    eyebrow: "Everything connected",
    price: "$11.99 / month",
    annualPrice: "$99.99 / year",
    features: [
      "Unlimited connected task sources",
      "Live Sync for supported integrations",
      "Trello connection and sync",
      "Provider-dependent updates within sync limits",
      "Everything in Plus",
    ],
  },
];

export const faqEntries: FaqEntry[] = [
  {
    question: "What is Nonlate?",
    answer:
      "Nonlate is a deadline-aware task planner and app blocker for iOS and Android. It brings manual tasks and deadlines from supported school, work, and task services into one plan, with calendars alongside them. When a selected distracting app opens while work is due, Nonlate puts those tasks first. You choose the protected apps, due window, and available break settings.",
  },
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
      "No. During the source trial, Free syncs one external source when you open Nonlate or refresh. Plus supports hourly background sync, and Pro adds Live Sync for supported integrations within sync limits. Timing depends on provider permissions, device background limits, and service availability. Live Sync is not guaranteed for every provider or account role.",
  },
  {
    question: "Does blocking work identically on iOS and Android?",
    answer:
      "No. Both platforms check due work before selected distractions, but the operating systems allow different presentations. iOS uses Apple Screen Time shields. Android uses Accessibility only to detect when a selected app opens and can show a fuller blocker with task details.",
  },
  {
    question: "Where can I download Nonlate?",
    answer:
      "Download Nonlate from the Apple App Store for iPhone or Google Play for Android. Public listings are available in the United States and Mozambique; availability and compatible devices may vary by country. The store listing shows the version currently available to you.",
  },
  {
    question: "How do the 30-day source preview and 7-day Plus trial differ?",
    answer:
      "The 30-day source preview lets Free users connect one external source at a time without starting a paid subscription or an automatic charge. Separately, eligible customers can start a 7-day free trial of Plus Monthly or Plus Yearly through their app store. That subscription trial unlocks Plus features and automatically renews at the displayed monthly or yearly price unless cancelled before the trial ends. Eligibility, local pricing, and the renewal date are shown by the store before confirmation. The Plus offer does not add a Pro trial or restart the source-preview window.",
  },
  {
    question: "What stays free after the source trial?",
    answer:
      "Manual tasks, on-device calendars and reminders, and blocking up to three distracting apps stay free. The 30-day trial starts after your first successful external-source connection and permits one external source at a time. Switching sources does not restart the window. When it ends, external syncing pauses, but imported tasks remain available for local completion and blocking. The source trial has no automatic charge and is separate from any subscription introductory offer. Paid access resumes syncing within the purchased plan’s limits.",
  },
  {
    question: "Do I need a Nonlate account, and are there ads?",
    answer:
      "No Nonlate account is required, and every plan is ad-free. Connecting a source may require signing in to that provider and granting its requested permissions. Paid subscriptions are optional, billed through your app store, and renew automatically unless cancelled through that store.",
  },
];
