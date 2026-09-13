"use client";

export type PriorityFilter =
  | "all"
  | "high_priority"
  | "work_now"
  | "open_opportunity"
  | "existing_customer";


const filters: {
  value: PriorityFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "high_priority",
    label: "High Priority",
  },
  {
    value: "work_now",
    label: "Work Now",
  },
  {
    value: "open_opportunity",
    label: "Open Opportunity",
  },
  {
    value: "existing_customer",
    label: "Customers",
  },
];


export default function PriorityFilters({
  value,
  onChange,
  counts,
}: {
  value: PriorityFilter;
  onChange: (value: PriorityFilter) => void;
  counts: Record<PriorityFilter, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = value === filter.value;

        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              active
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {filter.label}

            <span
              className={`ml-2 ${
                active
                  ? "text-slate-300"
                  : "text-slate-400"
              }`}
            >
              {counts[filter.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
