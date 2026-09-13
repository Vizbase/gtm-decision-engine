"use client";

export type DemoSample = {
  id: string;
  title: string;
  filename: string;
  url: string;
  count: number;
  badge: string;
  description: string;
  highlights: string[];
  tone: "indigo" | "orange" | "blue";
};

const samples: DemoSample[] = [
  {
    id: "gtm",
    title: "GTM Sample",
    filename: "gtm-sample.csv",
    url: "/samples/gtm-sample.csv",
    count: 30,
    badge: "Public-company sample",
    description:
      "A mixed GTM account list designed to show a broad range of sales decisions.",
    highlights: [
      "Multiple sales actions",
      "CRM activity context",
      "Different countries and industries",
    ],
    tone: "indigo",
  },
  {
    id: "hubspot",
    title: "HubSpot Sample",
    filename: "hubspot-sample.csv",
    url: "/samples/hubspot-sample.csv",
    count: 61,
    badge: "Synthetic CRM data",
    description:
      "A realistic HubSpot-style company export with lifecycle and CRM context.",
    highlights: [
      "Leads, customers and opportunities",
      "Large HubSpot-style schema",
      "Automatic column mapping",
    ],
    tone: "orange",
  },
  {
    id: "salesforce",
    title: "Salesforce Sample",
    filename: "salesforce-sample.csv",
    url: "/samples/salesforce-sample.csv",
    count: 121,
    badge: "Synthetic CRM data",
    description:
      "A Salesforce-style account export including CRM states and duplicate-account cases.",
    highlights: [
      "Customers and prospects",
      "Duplicate-domain detection",
      "Salesforce field mapping",
    ],
    tone: "blue",
  },
];


export default function DemoDatasetPicker({
  onSelect,
  onClose,
}: {
  onSelect: (sample: DemoSample) => void;
  onClose: () => void;
}) {
  const styles = {
    indigo: {
      border: "hover:border-indigo-300",
      badge: "bg-indigo-50 text-indigo-700",
      button:
        "bg-indigo-600 hover:bg-indigo-700",
    },
    orange: {
      border: "hover:border-orange-300",
      badge: "bg-orange-50 text-orange-700",
      button:
        "bg-orange-500 hover:bg-orange-600",
    },
    blue: {
      border: "hover:border-blue-300",
      badge: "bg-blue-50 text-blue-700",
      button:
        "bg-blue-600 hover:bg-blue-700",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-7 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-500">
              Interactive Demo
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Choose a sample dataset
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              See how the same GTM Decision Engine handles
              different CRM structures and account datasets.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-5 p-7 lg:grid-cols-3">
          {samples.map((sample) => {
            const style = styles[sample.tone];

            return (
              <div
                key={sample.id}
                className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                  >
                    {sample.badge}
                  </span>

                  <span className="text-sm font-semibold text-slate-400">
                    {sample.count}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-semibold text-slate-950">
                  {sample.title}
                </h3>

                <p className="mt-2 min-h-20 text-sm leading-6 text-slate-500">
                  {sample.description}
                </p>

                <div className="mt-5 space-y-2">
                  {sample.highlights.map(
                    (highlight) => (
                      <div
                        key={highlight}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span className="text-emerald-500">
                          ✓
                        </span>

                        {highlight}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() =>
                      onSelect(sample)
                    }
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${style.button}`}
                  >
                    Use {sample.title}
                  </button>

                  <a
                    href={sample.url}
                    download={sample.filename}
                    className="mt-3 block text-center text-xs font-medium text-slate-400 hover:text-slate-700"
                  >
                    Download sample CSV
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-7 py-4 text-xs leading-5 text-slate-500">
          HubSpot and Salesforce samples contain synthetic CRM
          data. The GTM sample uses public-company information
          for demonstration. No real customer CRM data is
          included.
        </div>
      </div>
    </div>
  );
}
