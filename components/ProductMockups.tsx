// Vector/markup product mockups for the marketing homepage.
// To swap for a REAL screenshot later, replace the component with:
//   <Image src="/product/customer-page.png" alt="..." width={520} height={1040} className="w-full" />
//   <Image src="/product/dashboard.png" alt="..." width={1000} height={640} className="w-full" />

export function CustomerMockup({ className }: { className?: string }) {
  const dishes: [string, string][] = [
    ["Butter chicken", "$15.00"],
    ["Cheese pizza", "$12.00"],
    ["Chicken tacos", "$6.00"],
    ["Mango lassi", "$5.00"],
  ];
  return (
    <svg viewBox="0 0 260 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The customer ordering page on a phone">
      <rect x="4" y="4" width="252" height="492" rx="36" fill="#160c07" />
      <rect x="14" y="14" width="232" height="472" rx="28" fill="#FBF6EE" />
      <rect x="104" y="22" width="52" height="9" rx="4.5" fill="#160c07" />
      <text x="30" y="62" fontSize="16.5" fontWeight="800" fill="#2A1810">Sam&#39;s Kitchen</text>
      <text x="30" y="80" fontSize="10.5" fill="#9b8e7d">Weekend Specials  ·  Pickup &amp; delivery</text>
      <rect x="30" y="92" width="86" height="22" rx="11" fill="#2A1810" /><text x="73" y="107" fontSize="10.5" fontWeight="700" fill="#FBF6EE" textAnchor="middle">Specials</text>
      <rect x="122" y="92" width="74" height="22" rx="11" fill="#F4EBDD" /><text x="159" y="107" fontSize="10.5" fontWeight="600" fill="#9b8e7d" textAnchor="middle">Snacks</text>
      {dishes.map(([name, price], i) => {
        const y = 128 + i * 52;
        return (
          <g key={name}>
            <rect x="30" y={y} width="42" height="42" rx="10" fill="#EFE2CC" />
            <g stroke="#C68A3E" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={`M47 ${y + 11} q-2 2 0 4 M51 ${y + 10} q-2 2 0 4 M55 ${y + 11} q-2 2 0 4`} />
              <path d={`M40 ${y + 24} h22`} /><path d={`M42 ${y + 24} a9 7 0 0 0 18 0`} />
            </g>
            <text x="84" y={y + 18} fontSize="12.5" fontWeight="700" fill="#2A1810">{name}</text>
            <text x="84" y={y + 35} fontSize="11" fill="#9b8e7d">{price}</text>
            <circle cx="214" cy={y + 21} r="14" fill="#E0922F" />
            <path d={`M214 ${y + 15} v12 M208 ${y + 21} h12`} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );
      })}
      <rect x="22" y="430" width="216" height="44" rx="13" fill="#E0922F" />
      <text x="130" y="457" fontSize="13" fontWeight="800" fill="#241409" textAnchor="middle">View order  ·  $38.00</text>
    </svg>
  );
}

export function DashboardMockup({ className }: { className?: string }) {
  const stats: [string, string, boolean][] = [["Open", "5", false], ["Today", "12", false], ["Revenue", "$284", false], ["Unpaid", "$46", true]];
  const rows: [string, string, string, string, boolean][] = [
    ["Priya R.", "3 · Pickup", "$38.00", "New", true],
    ["James C.", "2 · Delivery", "$24.00", "Accepted", false],
    ["Mia T.", "5 · Pickup", "$61.00", "New", true],
    ["David L.", "1 · Pickup", "$12.00", "Completed", false],
  ];
  return (
    <div className={`overflow-hidden rounded-xl border border-black/30 bg-white text-ink shadow-2xl ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 bg-ink px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-cream/20" /><span className="h-2 w-2 rounded-full bg-cream/20" /><span className="h-2 w-2 rounded-full bg-cream/20" />
        <span className="ml-2 text-[11px] font-bold text-spice">Khao</span>
        <span className="ml-2 hidden text-[10px] text-cream/55 sm:inline">Orders · Menu · Report</span>
        <span className="ml-auto text-[9px] font-semibold text-curry">● Live</span>
      </div>
      <div className="p-3.5">
        <div className="grid grid-cols-4 gap-2">
          {stats.map(([l, v, danger]) => (
            <div key={l} className="rounded-lg bg-cream px-2.5 py-2">
              <p className="text-[9px] text-ink/50">{l}</p>
              <p className={`text-base font-extrabold ${danger ? "text-chili" : "text-ink"}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.9fr] bg-panel px-3 py-1.5 text-[8.5px] font-bold uppercase tracking-wide text-ink/50">
            <span>Customer</span><span>Items</span><span>Amount</span><span>Status</span>
          </div>
          {rows.map(([name, items, amt, status, isNew]) => (
            <div key={name} className="grid grid-cols-[1.3fr_1fr_0.8fr_0.9fr] items-center border-t border-line px-3 py-2 text-[10.5px]">
              <span className="font-bold">{name}</span>
              <span className="text-ink/55">{items}</span>
              <span className="font-bold">{amt}</span>
              <span><span className={`rounded-full px-2 py-0.5 text-[8.5px] font-bold ${isNew ? "bg-spice/20 text-[#9a5a14]" : "bg-curry/20 text-[#2c5738]"}`}>{status}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
