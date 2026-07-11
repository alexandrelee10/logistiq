import { redirect } from "next/navigation";
import { isAuthenticated } from "@/app/lib/auth";

export default async function RootPage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/dashboard");
  }

  redirect("/landingPage");
}

// redirect user based on user 