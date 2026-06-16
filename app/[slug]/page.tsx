import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Storefront from "@/components/Storefront";
import type { Dish, Vendor, Service } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "active")
    .maybeSingle();

  if (!vendor) notFound();
  const v = vendor as Vendor;

  const { data: servicesData } = await supabase
    .from("services")
    .select("*")
    .eq("vendor_id", v.id)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  const activeServices = (servicesData ?? []) as Service[];

  const { data: dishesData } = await supabase
    .from("dishes")
    .select("*")
    .eq("vendor_id", v.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const dishes = (dishesData ?? []) as Dish[];

  const groups = activeServices
    .map((s) => ({
      service: { id: s.id, name: s.name, description: s.description, date: s.service_date },
      dishes: dishes.filter((d) => d.service_id === s.id),
    }))
    .filter((g) => g.dishes.length > 0);

  return <Storefront vendor={v} groups={groups} />;
}
