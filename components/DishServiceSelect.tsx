"use client";

import { useRouter } from "next/navigation";
import { setDishService } from "@/app/actions";

export default function DishServiceSelect({
  dishId, current, services,
}: { dishId: string; current: string | null; services: { id: string; name: string }[] }) {
  const router = useRouter();
  return (
    <select
      defaultValue={current ?? ""}
      onChange={async (e) => { await setDishService(dishId, e.target.value); router.refresh(); }}
      className="rounded-lg border border-ink/15 px-2 py-1 text-sm bg-white text-ink/70"
    >
      {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      <option value="">Unassigned</option>
    </select>
  );
}
