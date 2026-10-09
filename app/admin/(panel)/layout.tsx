import type { ReactNode } from "react";
import { requireAdmin } from "@/backend/auth";
import Sidebar from "@/frontend/components/admin/Sidebar";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/trades", label: "Trades" },
  { href: "/admin/rates", label: "Assets & Rates" },
  { href: "/admin/margins", label: "Margins" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/bugs", label: "Bug reports" },
];

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar links={links} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
