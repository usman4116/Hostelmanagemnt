import Link from "next/link";

type PaymentsNavigationProps = {
  active: "payments" | "verification";
};

const tabs = [
  { key: "payments", label: "Payments", href: "/payments" },
  {
    key: "verification",
    label: "Payment Verification",
    href: "/payment-verification",
  },
] as const;

export default function PaymentsNavigation({ active }: PaymentsNavigationProps) {
  return (
    <nav
      aria-label="Payments module navigation"
      className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
