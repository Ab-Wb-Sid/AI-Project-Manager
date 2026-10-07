import type { Role } from "@/types/user";

/** Project hues (Design.md §3.1), assigned in creation order and cycling. */
export const PROJECT_HUES = ["#3B5BDB", "#C2255C", "#2F9E44", "#E8590C", "#7048E8", "#0C8599"];

export const hueFor = (index: number) => PROJECT_HUES[((index % PROJECT_HUES.length) + PROJECT_HUES.length) % PROJECT_HUES.length];

export interface NavItem {
  label: string;
  href: string;
  /** Rendered as the single primary button in the top bar. */
  primary?: boolean;
}

/**
 * Role navigation. Hiding links is a convenience only; the server enforces every rule.
 * A role never sees links it can't use: they are not rendered at all.
 */
export const NAVIGATION: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Projects", href: "/" },
    { label: "Team", href: "/team" },
    { label: "Create from transcript", href: "/transcript", primary: true },
  ],
  MANAGER: [
    { label: "My projects", href: "/" },
    { label: "Team", href: "/team" },
  ],
  AGENT: [
    { label: "My tasks", href: "/my-tasks" },
    { label: "Team", href: "/team" },
  ],
};

export const HOME_FOR_ROLE: Record<Role, string> = {
  ADMIN: "/",
  MANAGER: "/",
  AGENT: "/my-tasks",
};

/** Demo-only login helper (Design.md §5.1). Hide with NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false. */
export const SHOW_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";

export const DEMO_PASSWORD = "Demo123!";

export const DEMO_ACCOUNTS = [
  { email: "admin@novaworks.example", who: "Administrator" },
  { email: "ayesha@novaworks.example", who: "Manager" },
  { email: "ali@novaworks.example", who: "Developer" },
  { email: "hamza@novaworks.example", who: "Developer" },
];
