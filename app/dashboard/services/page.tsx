import { redirect } from "next/navigation";

// Services management merged into the Menu tab. Keep this route as a redirect
// so any old links/bookmarks still land in the right place.
export default function ServicesPage() {
  redirect("/dashboard/menu");
}
