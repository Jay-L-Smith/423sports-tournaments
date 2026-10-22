import { AGE_GROUPS } from "@/lib/pbi/weekends";

export function showsEveryAge(filter: string) {
  return filter === "All" || filter === "Underclass" || filter === "Upperclass";
}

export function ageListRank(age: string) {
  const index = AGE_GROUPS.indexOf(age as (typeof AGE_GROUPS)[number]);
  return index < 0 ? AGE_GROUPS.length : index;
}

export function AgeFilter({ value, onChange }: { value: string; onChange: (age: string) => void }) {
  const options = ["All", ...AGE_GROUPS];
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((age) => {
        const on = value === age;
        return (
          <button
            key={age}
            type="button"
            onClick={() => onChange(age)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${on ? "bg-[#1a1a1a] text-white" : "bg-black/5 text-[#1a1a1a]"}`}
          >
            {age}
          </button>
        );
      })}
    </div>
  );
}
