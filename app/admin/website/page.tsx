import { redirect } from "next/navigation";

// This page was renamed Announcements; keep old links and open tabs working.
export default function OldWebsitePage() {
  redirect("/admin/announcements");
}
