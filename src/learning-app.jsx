import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Gem, Grid2X2, Lightbulb, LoaderCircle, Play, RotateCcw, Route, X } from "lucide-react";
import { createRoot } from "react-dom/client";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import "./learning.css";

const activities = [
  { eyebrow: "Model the problem", title: "Make the depot remote", body: "Set every journey to and from the depot to 120 minutes. The matrix and map stay linked.", hint: "Only the first row and column need to change." },
  { eyebrow: "Encode the routes", title: "Turn journeys into variables", body: "A binary variable records whether each directed road is used. Select the variable for the highlighted road.", hint: "Edges are ordered by source, skipping self-travel." },
  { eyebrow: "Shape the objective", title: "Give the van a reason to leave", body: "Explore how the penalty scale changes the cost of staying at the depot versus taking a road.", hint: "A lower objective value is more attractive to the solver." },
  { eyebrow: "Add constraints", title: "Spot the broken route", body: "Distance alone is not enough. Inspect the selected roads and identify which delivery rule is broken.", hint: "Each location needs one arrival and one departure." },
  { eyebrow: "Prevent subtours", title: "Find the disconnected loop", body: "A route can obey local degree rules and still split into separate tours. Decide whether this solution is valid.", hint: "Every location must belong to the tour that starts at the depot." },
  { eyebrow: "Solve and verify", title: "Did quantum find the optimum?", body: "Run the prepared model, inspect the most likely route, then compare it with an exact classical check.", hint: "Approximate algorithms can still return the exact optimum." },
];

const baseMatrix = [[0, 59, 51, 50], [59, 0, 61, 52], [51, 61, 0, 52], [50, 52, 52, 0]];

function ToolButton({ label, children }) {
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={label}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

function Network({ mode = "all", remote = false }) {
  const lines = mode === "route"
    ? [[50, 72, 190, 34], [190, 34, 250, 128], [250, 128, 136, 178], [136, 178, 50, 72]]
    : mode === "subtour"
      ? [[50, 72, 190, 34], [190, 34, 50, 72], [136, 178, 250, 128], [250, 128, 136, 178]]
      : [[50, 72, 190, 34], [50, 72, 136, 178], [50, 72, 250, 128], [190, 34, 136, 178], [190, 34, 250, 128], [136, 178, 250, 128]];
  return <svg className="network" viewBox="0 0 300 215" role="img" aria-label="Four-location delivery network">
    {lines.map((line, index) => <line key={index} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} className={mode === "all" ? "network-edge" : "route-edge"} />)}
    {mode === "all" && [[120, 50], [92, 118], [153, 97], [190, 82], [192, 150], [232, 115]].map((point, index) => <text key={index} x={point[0]} y={point[1]} className="edge-label">{remote && index < 3 ? "120" : [59, 51, 50, 61, 52, 52][index]}</text>)}
    <g className="node depot"><circle cx="50" cy="72" r="20" /><text x="50" y="76">D</text></g>
    <g className="node"><circle cx="190" cy="34" r="17" /><text x="190" y="38">1</text></g>
    <g className="node"><circle cx="136" cy="178" r="17" /><text x="136" y="182">2</text></g>
    <g className="node"><circle cx="250" cy="128" r="17" /><text x="250" y="132">3</text></g>
  </svg>;
}

function Feedback({ correct, children }) {
  if (correct === null) return null;
  return <div className={`feedback ${correct ? "success" : "error"}`}>{correct ? <Check size={15} /> : <X size={15} />}<span>{children}</span></div>;
}

function MatrixActivity({ complete }) {
  const [matrix, setMatrix] = useState(baseMatrix);
  const isRemote = [1, 2, 3].every((index) => matrix[0][index] === 120 && matrix[index][0] === 120);
  const updateDepot = (index, value) => {
    const next = matrix.map((row) => [...row]);
    next[0][index] = Number(value) || 0;
    next[index][0] = Number(value) || 0;
    setMatrix(next);
    if ([1, 2, 3].every((column) => next[0][column] === 120)) complete();
  };
  const usePreset = () => {
    setMatrix(baseMatrix.map((row, rowIndex) => row.map((value, columnIndex) => rowIndex !== columnIndex && (rowIndex === 0 || columnIndex === 0) ? 120 : value)));
    complete();
  };
  return <div className="activity-grid"><section className="panel"><div className="panel-heading"><span>Travel-time matrix</span><small>minutes</small></div><div className="matrix"><span /><b>D</b><b>1</b><b>2</b><b>3</b>{matrix.map((row, rowIndex) => <div className="matrix-row" key={rowIndex}><b>{rowIndex || "D"}</b>{row.map((value, columnIndex) => rowIndex === 0 && columnIndex > 0 ? <input key={columnIndex} aria-label={`Depot to location ${columnIndex}`} value={value} onChange={(event) => updateDepot(columnIndex, event.target.value)} /> : <span className={columnIndex === 0 && rowIndex > 0 ? "linked" : ""} key={columnIndex}>{value}</span>)}</div>)}</div><Button variant="outline" onClick={usePreset}>Make depot remote</Button><Feedback correct={isRemote ? true : null}>All depot journeys now take 120 minutes.</Feedback></section><section className="panel visual"><div className="panel-heading"><span>Network preview</span><small>updates live</small></div><Network remote={isRemote} /><div className="legend"><i className="depot-key" /> Depot <i /> Delivery location</div></section></div>;
}

function EncodingActivity({ complete }) {
  const [answer, setAnswer] = useState(null);
  const choose = (option) => { setAnswer(option); if (option === "n2") complete(); };
  return <div className="activity-grid"><section className="panel visual"><div className="panel-heading"><span>Selected journey</span><small>directed edge</small></div><div className="edge-map"><div className="map-node depot-node">Depot <small>0</small></div><ArrowRight /><div className="map-node">Location 3 <small>3</small></div></div><div className="edge-facts"><span>Source <b>0</b></span><span>Destination <b>3</b></span><span>Travel time <b>120 min</b></span></div></section><section className="panel"><div className="panel-heading"><span>Choose the binary variable</span><small>one answer</small></div><code className="formula">get_edge_idx(0, 3) = ?</code><div className="answer-grid">{["n0", "n2", "n3", "n9"].map((option) => <Button key={option} variant="outline" className={answer === option ? "selected" : ""} onClick={() => choose(option)}>{option}</Button>)}</div><Feedback correct={answer === null ? null : answer === "n2"}>{answer === "n2" ? "Correct. n2 records the road from the depot to location 3." : "Count depot edges first and skip the diagonal."}</Feedback></section></div>;
}

function ObjectiveActivity({ complete }) {
  const [multiplier, setMultiplier] = useState(2);
  const [answered, setAnswered] = useState(false);
  const A = 6100;
  return <div className="activity-grid"><section className="panel"><div className="panel-heading"><span>Penalty scale</span><strong>{multiplier}A</strong></div><input className="range" type="range" min="0" max="4" step="1" value={multiplier} onChange={(event) => setMultiplier(Number(event.target.value))} aria-label="Penalty multiplier" /><div className="range-labels"><span>No incentive</span><span>Strong incentive</span></div><p className="prompt">What happens as the penalty increases?</p><Button variant="outline" className={answered ? "selected" : ""} onClick={() => { setAnswered(true); complete(); }}>The van is more likely to leave</Button></section><section className="panel visual"><div className="panel-heading"><span>Live cost breakdown</span><small>lower wins</small></div><div className="cost-comparison"><div><small>Stay at depot</small><strong>{(2 * A * 4).toLocaleString()}</strong><span className="cost-bar stay" /></div><div><small>Take fastest road</small><strong>{(2 * A * 4 + 50 - multiplier * A).toLocaleString()}</strong><span className="cost-bar leave" style={{ width: `${Math.max(18, 88 - multiplier * 13)}%` }} /></div></div><div className="equation"><span>road contribution</span><b>50 − {multiplier}A</b><span>= {(50 - multiplier * A).toLocaleString()}</span></div><Feedback correct={answered ? true : null}>A larger penalty makes taking a road cheaper than staying put.</Feedback></section></div>;
}

function ConstraintActivity({ complete }) {
  const [answer, setAnswer] = useState(null);
  const choose = (value) => { setAnswer(value); if (value === "twice") complete(); };
  return <div className="activity-grid"><section className="panel visual"><div className="panel-heading"><span>Candidate route</span><small>5 selected roads</small></div><Network mode="route" /><div className="constraint-list"><span className="pass"><Check size={13} /> Depot departure</span><span className="fail"><X size={13} /> Location 1</span><span className="pass"><Check size={13} /> Location 2</span></div></section><section className="panel"><div className="panel-heading"><span>Diagnose the route</span><small>constraint check</small></div><p className="prompt">Why does location 1 fail?</p><div className="stacked-answers">{[["missing", "It is never visited"], ["twice", "Two roads leave it"], ["slow", "Its road is too slow"]].map(([value, label]) => <Button key={value} variant="outline" className={answer === value ? "selected" : ""} onClick={() => choose(value)}>{label}</Button>)}</div><Feedback correct={answer === null ? null : answer === "twice"}>{answer === "twice" ? "Exactly. Quadratic penalties discourage multiple departures." : "Look at outgoing arrows, not travel time."}</Feedback></section></div>;
}

function SubtourActivity({ complete }) {
  const [answer, setAnswer] = useState(null);
  const choose = (value) => { setAnswer(value); if (value === "invalid") complete(); };
  return <div className="activity-grid"><section className="panel visual"><div className="panel-heading"><span>Solver proposal</span><small>degree checks pass</small></div><Network mode="subtour" /><div className="subtour-callout"><Route size={15} /> Two separate cycles detected</div></section><section className="panel"><div className="panel-heading"><span>Is this a valid delivery tour?</span><small>choose one</small></div><div className="segment-control"><button className={answer === "valid" ? "active" : ""} onClick={() => choose("valid")}>Valid</button><button className={answer === "invalid" ? "active" : ""} onClick={() => choose("invalid")}>Invalid</button></div><div className="penalty-term"><small>Subtour penalty</small><code>P · n₃ · n₅</code></div><Feedback correct={answer === null ? null : answer === "invalid"}>{answer === "invalid" ? "Correct. Locations 2 and 3 form a loop disconnected from the depot." : "The journey is split even though every node has two edges."}</Feedback></section></div>;
}

function SolverActivity({ complete }) {
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    if (status !== "loading") return undefined;
    const timer = window.setTimeout(() => { setStatus("success"); complete(); }, 5000);
    return () => window.clearTimeout(timer);
  }, [status]);
  if (status === "idle") return <div className="solver-state"><div className="quantum-mark">Q</div><h2>Ready to solve</h2><p>The prepared model has 12 binary variables and 52 objective terms.</p><Button onClick={() => setStatus("loading")}><Play size={14} fill="currentColor" /> Run quantum solver</Button></div>;
  if (status === "loading") return <div className="solver-state"><LoaderCircle className="spinner" size={34} /><h2>Optimizing candidate routes</h2><p>Sampling the objective and ranking valid bitstrings…</p><div className="progress-track"><span /></div></div>;
  return <div className="activity-grid"><section className="panel visual"><div className="panel-heading"><span>Most likely route</span><small>001010100010</small></div><Network mode="route" /><div className="route-summary"><span>D</span><ArrowRight /><span>1</span><ArrowRight /><span>3</span><ArrowRight /><span>2</span><ArrowRight /><span>D</span></div></section><section className="panel"><div className="panel-heading"><span>Solution check</span><small>complete</small></div><div className="score-row"><div><small>Quantum</small><strong>214 min</strong></div><div><small>Classical optimum</small><strong>214 min</strong></div></div><div className="probability"><span style={{ height: "30%" }} /><span style={{ height: "48%" }} /><span className="winner" style={{ height: "92%" }} /><span style={{ height: "38%" }} /><span style={{ height: "22%" }} /></div><Feedback correct>Optimal route found. Both methods agree.</Feedback><Button variant="ghost" onClick={() => setStatus("idle")}><RotateCcw size={13} /> Run again</Button></section></div>;
}

function Activity({ index, complete }) {
  return [MatrixActivity, EncodingActivity, ObjectiveActivity, ConstraintActivity, SubtourActivity, SolverActivity].map((Component, itemIndex) => itemIndex === index ? <Component key={itemIndex} complete={complete} /> : null);
}

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const activity = activities[activeStep];
  const complete = () => setCompleted((current) => new Set(current).add(activeStep));
  return <TooltipProvider delayDuration={100}><main className="app"><header className="topbar"><div className="brand" aria-label="Classiq"><span className="mark" /></div><Tabs defaultValue="learn"><TabsList><TabsTrigger value="learn">Learn</TabsTrigger><TabsTrigger value="practice">Practice</TabsTrigger></TabsList></Tabs><div className="tools"><ToolButton label="Help"><CircleHelp size={15} /></ToolButton><ToolButton label="Achievements"><Gem size={15} /></ToolButton><ToolButton label="Apps"><Grid2X2 size={15} /></ToolButton><span className="avatar">US</span></div></header><div className="workspace"><aside className="stepper" aria-label="Lesson progress"><Button variant="outline" size="icon" className="back" aria-label="Back"><ArrowLeft size={14} /></Button><div className="steps">{activities.map((item, index) => <div className="step-group" key={item.title}><button className={`step ${completed.has(index) ? "done" : ""} ${activeStep === index ? "current" : ""}`} onClick={() => setActiveStep(index)} aria-label={`Step ${index + 1}: ${item.title}`}>{completed.has(index) ? <Check size={11} /> : index + 1}</button>{index < activities.length - 1 && <i className="step-line" />}</div>)}</div></aside><section className="lesson"><p className="lesson-label">{activity.eyebrow}</p><h1>{activity.title}</h1><p>{activity.body}</p><aside className="tip"><Lightbulb size={15} /><div><strong>Hint</strong>{activity.hint}</div></aside><div className="learning-progress"><span>{completed.size} of {activities.length} concepts complete</span><div><i style={{ width: `${completed.size / activities.length * 100}%` }} /></div></div></section><section className="activity" aria-label={activity.title}><div className="crumbs"><span>Applications</span><span>›</span><span>Logistics optimization</span><span>›</span><span>{activity.eyebrow}</span></div><div className="activity-stage"><Activity index={activeStep} complete={complete} /></div><footer className="activity-footer"><Button variant="ghost" disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)}><ArrowLeft size={14} /> Previous</Button><span>Step {activeStep + 1} of {activities.length}</span><Button disabled={!completed.has(activeStep) || activeStep === activities.length - 1} onClick={() => setActiveStep((step) => step + 1)}>Continue <ArrowRight size={14} /></Button></footer></section></div></main></TooltipProvider>;
}

createRoot(document.getElementById("root")).render(<App />);