"use client";

export type SortOption =
  | "rank"
  | "priority"
  | "icp"
  | "signals";


export default function QueueControls({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search company or domain..."
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
      </div>

      <select
        value={sort}
        onChange={(event) =>
          onSortChange(
            event.target.value as SortOption
          )
        }
        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
      >
        <option value="rank">
          Sort: Rank
        </option>

        <option value="priority">
          Sort: Priority
        </option>

        <option value="icp">
          Sort: ICP Fit
        </option>

        <option value="signals">
          Sort: Signals
        </option>
      </select>
    </div>
  );
}
