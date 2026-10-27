"use client";

import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { irregularVerbs } from "@/lib/irregular-verbs";

const ranges = ["Todos", "1–10", "11–25", "26–50"];

export function IrregularVerbsList() {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("Todos");
  const [expandedRank, setExpandedRank] = useState<number | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleVerbs = useMemo(() => irregularVerbs.filter((verb) => {
    const matchesRange = range === "Todos" || (range === "1–10" && verb.rank <= 10) || (range === "11–25" && verb.rank >= 11 && verb.rank <= 25) || (range === "26–50" && verb.rank >= 26);
    const matchesQuery = !normalizedQuery || `${verb.base} ${verb.past} ${verb.participle} ${verb.meaning}`.toLowerCase().includes(normalizedQuery);
    return matchesRange && matchesQuery;
  }), [normalizedQuery, range]);

  return <section className="irregular-verbs card-panel">
    <div className="panel-heading"><div><span className="eyebrow">REFERENCE LIST</span><h3>Irregular verbs by frequency</h3><p className="irregular-verbs-intro">A practical order for general English. Frequency can vary by context, but these are the verbs worth learning first.</p></div><span className="progress-badge">{irregularVerbs.length} verbs</span></div>
    <div className="irregular-verbs-tools">
      <label className="irregular-search"><Search size={15} /><span className="sr-only">Search irregular verbs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search verb or Spanish meaning…" /></label>
      <div className="irregular-ranges" aria-label="Verb frequency range">{ranges.map((item) => <button key={item} className={range === item ? "irregular-range active" : "irregular-range"} onClick={() => setRange(item)}>{item}</button>)}</div>
    </div>
    <div className="irregular-table" role="table" aria-label="Irregular verbs ordered by frequency">
      <div className="irregular-table-head" role="row"><span>#</span><span>Base form</span><span>Past simple</span><span>Past participle</span><span>Meaning</span><span>Example</span></div>
      {visibleVerbs.map((verb) => { const expanded = expandedRank === verb.rank; return <article className="irregular-row" role="row" key={verb.base}>
        <span className="irregular-rank">{verb.rank}</span><strong>{verb.base}</strong><span className="irregular-past">{verb.past}</span><span className="irregular-participle">{verb.participle}</span><span className="irregular-meaning">{verb.meaning}</span><button className="irregular-example-button" onClick={() => setExpandedRank(expanded ? null : verb.rank)} aria-expanded={expanded}>{expanded ? "Hide" : "View"} <span>{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span></button>
        {expanded && <div className="irregular-example"><span>Example</span><p>{verb.example}</p></div>}
      </article>; })}
    </div>
    {!visibleVerbs.length && <p className="assessment-note">No verbs match that search.</p>}
    <p className="irregular-verbs-note">Tip: learn the first ten deeply, then practice them in travel, daily life, work, technology, and conversation.</p>
  </section>;
}
