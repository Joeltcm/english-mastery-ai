"use client";

import { ArrowUpRight, BriefcaseBusiness, Building2, Plane } from "lucide-react";

type Scenario = { title: string; context: string; goal: string; prompt: string; icon: typeof Plane; tone: string };

const scenarios: Scenario[] = [
  { title: "Airport connection", context: "Your flight was delayed and you need to ask for a new connection.", goal: "Explain the problem clearly and ask for options.", prompt: "Let’s role-play an airport connection. You are the airline agent and I am the traveler. Speak naturally, ask me follow-up questions, and correct my English after each turn without interrupting the role-play.", icon: Plane, tone: "violet" },
  { title: "Hotel check-in", context: "You arrive at a hotel in another country after a long journey.", goal: "Check in, ask about breakfast, and report a room issue.", prompt: "Let’s role-play checking into a hotel abroad. You are the receptionist and I am the guest. Keep it natural, use realistic travel vocabulary, and correct my English briefly after each turn.", icon: Building2, tone: "sky" },
  { title: "International work trip", context: "You are meeting a new client and need to build rapport.", goal: "Introduce yourself, discuss a schedule, and clarify next steps.", prompt: "Let’s role-play an international work meeting. You are a new client and I am introducing myself. Ask realistic questions, help me sound natural, and give concise Spanish explanations for important corrections.", icon: BriefcaseBusiness, tone: "green" },
];

export function TravelSimulation({ onStart }: { onStart: (prompt: string) => void }) {
  return <section className="travel-simulation"><div className="panel-heading"><div><span className="eyebrow">TRAVEL LAB</span><h3>Practice the moment before it happens</h3></div><span className="progress-badge">3 scenarios</span></div><div className="travel-grid">{scenarios.map(({ title, context, goal, prompt, icon: Icon, tone }) => <article className="travel-card" key={title}><div className={`travel-icon ${tone}`}><Icon size={17} /></div><span className="eyebrow">ROLE-PLAY</span><h4>{title}</h4><p>{context}</p><small><strong>Goal:</strong> {goal}</small><button className="soft-button" onClick={() => onStart(prompt)}>Start in Tutor mode <ArrowUpRight size={14} /></button></article>)}</div></section>;
}
