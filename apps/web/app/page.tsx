
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkspacePage from "./components/WorkspacePage";

export default async function OverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <WorkspacePage
      title="Business overview"
      eyebrow="WELCOME BACK"
      activeHref="/"
      description="See what is happening across your farming and writing relationships today."
    />
  );
}
