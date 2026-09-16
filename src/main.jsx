import { useEffect, useState } from "react";
import { CircleHelp, Gem, Grid2X2, Play, RotateCcw, ArrowLeft, LoaderCircle } from "lucide-react";
import { createRoot } from "react-dom/client";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import "./styles.css";

const fieldCount = 5;

function ToolButton({ label, children }) {
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={label}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

function App() {
  const [fields, setFields] = useState(Array(fieldCount).fill(""));
  const [runStatus, setRunStatus] = useState("idle");
  const [showValidation, setShowValidation] = useState(false);
  const steps = ["✓", "2", "3", "4", "5", "6", "7", "8"];
  const remainingFields = fieldCount - fields.filter((field) => field.trim()).length;
  const hasRequiredFields = remainingFields === 0;
  const updateField = (index, value) => {
    setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? value : field));
  };

  useEffect(() => {
    if (hasRequiredFields) setShowValidation(false);
  }, [hasRequiredFields]);

  useEffect(() => {
    if (runStatus !== "loading") return undefined;
    const resultTimer = window.setTimeout(() => setRunStatus("success"), 5000);
    return () => window.clearTimeout(resultTimer);
  }, [runStatus]);

  const runCode = () => {
    if (!hasRequiredFields) {
      setShowValidation(true);
      return;
    }
    setRunStatus("loading");
  };

  const resetExercise = () => {
    setFields(Array(fieldCount).fill(""));
    setShowValidation(false);
    setRunStatus("idle");
  };

  return <TooltipProvider delayDuration={100}>
    <main className="app">
      <header className="topbar">
        <div className="brand" aria-label="Classiq"><span className="mark" /></div>
        <Tabs defaultValue="learn"><TabsList><TabsTrigger value="learn">Learn</TabsTrigger><TabsTrigger value="practice">Practice</TabsTrigger></TabsList></Tabs>
        <div className="tools"><ToolButton label="Help"><CircleHelp size={15} /></ToolButton><ToolButton label="Achievements"><Gem size={15} /></ToolButton><ToolButton label="Apps"><Grid2X2 size={15} /></ToolButton><span className="avatar">US</span></div>
      </header>
      <div className="workspace">
        <aside className="stepper" aria-label="Lesson progress"><Button variant="outline" size="icon" className="back" aria-label="Back"><ArrowLeft size={14} /></Button><div className="steps">{steps.map((step, index) => <div className="step-group" key={step}><span className={`step ${index === 0 ? "done" : ""} ${index === 2 ? "current" : ""}`}>{step}</span>{index < steps.length - 1 && <i className="step-line" />}</div>)}</div></aside>
        <section className="lesson"><p className="lesson-label">Problem specification</p><h1>Title</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><aside className="tip"><strong>Tip</strong>Complete the code on the right, then run it to see your output.</aside></section>
        <section className="coding" aria-label="Python exercise">
          <div className="crumbs"><span>Applications</span><span>›</span><span>Logistics</span><span>›</span><span>Problem specification</span></div>
          <div className="editor-shell">
            <div className="numbers" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
            <div className="code-exercise">
              <div className="code-line"><span>Sample code here</span><input className={showValidation && !fields[0].trim() ? "field-error" : ""} aria-invalid={showValidation && !fields[0].trim()} aria-label="Code field 1" value={fields[0]} onChange={(event) => updateField(0, event.target.value)} /><span>Sample code here</span></div>
              {[1, 2, 3, 4].map((index) => <div className="code-line" key={index}><input className={showValidation && !fields[index].trim() ? "field-error" : ""} aria-invalid={showValidation && !fields[index].trim()} aria-label={`Code field ${index + 1}`} value={fields[index]} onChange={(event) => updateField(index, event.target.value)} /><span>Sample code here</span></div>)}
            </div>
          </div>
          <div className="runbar"><Button className="run" size="compact" disabled={!hasRequiredFields || runStatus === "loading"} onClick={runCode}><Play size={11} fill="currentColor" />Run</Button><Button className="reset" variant="ghost" size="compact" onClick={resetExercise}><RotateCcw size={13} />Reset</Button>{showValidation && <span className="validation-message" role="alert">Fields required</span>}<span className="remaining"><b>{remainingFields}</b> fields remaining</span></div>
          <div className={`output output--${runStatus}`}><div className="output-title">◈ Output</div><div className="empty"><div className="circuit" /><strong>No output yet</strong><small>Execute the code above to display the output.</small></div><div className="loading" role="status"><LoaderCircle size={24} /><strong>Running your code</strong><small>Preparing your output...</small></div><pre className="result">Program executed successfully.{"\n\n"}Sample output{"\n"}Order received and ready for processing.</pre></div>
        </section>
      </div>
    </main>
  </TooltipProvider>;
}

createRoot(document.getElementById("root")).render(<App />);