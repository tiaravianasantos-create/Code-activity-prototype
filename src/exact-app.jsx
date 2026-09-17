import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Expand, LoaderCircle, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";
import "./exact.css";
import "./horizontal-layout.css";

const lessons = [
  {
    title: "Build the travel-time matrix",
    body: "We have one depot and three delivery locations. The matrix stores the travel time between every pair of locations. Because travel times are symmetric, each value appears on both sides of the diagonal.",
    note: "Run the code to create the 4 × 4 matrix and inspect the initial network.",
    code: `n = 4  # 1 depot + 3 locations\ninstance = np.zeros([n, n], dtype=int)\n\ninstance[0,1] = 59\ninstance[0,2] = 51\ninstance[0,3] = 50\ninstance[1,2] = 61\ninstance[1,3] = 52\ninstance[2,3] = 52\n\nfor i in range(n):\n    for j in range(i + 1, n):\n        instance[j, i] = instance[i, j]`,
    output: "[[ 0 59 51 50]\n [59  0 61 52]\n [51 61  0 52]\n [50 52 52  0]]",
    visual: "network",
  },
  {
    title: "The remote depot scenario",
    body: "What if the depot is much farther from every delivery location? Change every journey to and from the depot to two hours (120 minutes).",
    note: "Use row and column indexing. The diagonal must remain zero.",
    code: `# Complete both indices\ninstance[0, ___] = 120\ninstance[___, 0] = 120\n\nvisualize_instance(instance)`,
    answer: `# Set all depot departures and arrivals\ninstance[0, 1:] = 120\ninstance[1:, 0] = 120\n\nvisualize_instance(instance)`,
    output: "Remote depot configured correctly.",
    visual: "network",
    graded: true,
    completionDescription: "You set both depot rows and columns to 120 minutes while keeping the diagonal unchanged.",
  },
  {
    title: "Map journeys to binary variables",
    body: "Connections always use the same order: first connect to the depot, then location 1, location 2 and location 3. Helper functions convert between a matrix edge and its binary variable.",
    note: "For four locations, the model needs 12 directed-edge variables.",
    code: `# Generate n0 to n11\nnum_vars = n * (n - 1)\nvariables = symbols([f"n{i}" for i in range(num_vars)])\n\ndef get_edge_idx(u, v):\n    return u*(n-1) + (v if v < u else v-1)\n\ndef get_edge_coords(idx, n):\n    u = idx // (n-1)\n    pos = idx % (n-1)\n    v = pos if pos < u else pos + 1\n    return (u, v)`,
    output: "Generated 12 variables: n0 … n11",
  },
  {
    title: "Give the van a reason to leave",
    body: "If the van stays at the depot, the current objective costs 2 × A × n. Taking one edge adds travel_time − 2A, making short journeys attractive.",
    note: "Calculate the cost reduction when travel time is zero.",
    code: `one_edge_cost = terms[0] + (___)\ncost_reduction = terms[0] - one_edge_cost\n\nprint("Cost of leaving depot =", one_edge_cost)\nprint("Cost reduction =", cost_reduction)`,
    answer: `one_edge_cost = terms[0] + (0 - 2*A)\ncost_reduction = terms[0] - one_edge_cost\n\nprint("Cost of leaving depot =", one_edge_cost)\nprint("Cost reduction =", cost_reduction)`,
    output: "Cost of leaving depot = 36600\nCost reduction = 12200",
    graded: true,
    passes: false,
    completionDescription: "You applied the departure incentive and correctly calculated the reduction for a zero-minute journey.",
  },
  {
    title: "Add the cost of every road",
    body: "Each directed road contributes its travel time plus the departure incentive. The loop below adds one linear term for every possible journey.",
    note: "All 12 route variables should appear in the objective.",
    code: `for u in range(n):\n    for v in range(n):\n        if u != v:\n            edge = get_edge_idx(u, v)\n            weight = instance[u, v] - 2*A\n            terms.append(weight * variables[edge])\n\nprint(terms)`,
    output: "Added 12 linear terms.\nTotal terms so far: 13",
  },
  {
    title: "Find the strongest route incentive",
    body: "The smallest coefficient gives the strongest incentive for an edge to be selected. Sort the terms, extract its variable index, then map it back to a route.",
    note: "The fastest journey is between the depot and location 3.",
    code: `sorted_terms = sorted(terms, key=lambda t: t.as_coeff_Mul()[0])\n\nindx = str(sorted_terms[___].as_coeff_Mul()[1])[1:]\nroute = get_edge_coords(___, n)\n\nprint(indx)\nprint(route)`,
    answer: `sorted_terms = sorted(terms, key=lambda t: t.as_coeff_Mul()[0])\n\nindx = str(sorted_terms[0].as_coeff_Mul()[1])[1:]\nroute = get_edge_coords(int(indx), n)\n\nprint(indx)\nprint(route)`,
    output: "2\n(0, 3)",
    visual: "edge",
    graded: true,
    completionDescription: "You sorted the coefficients, extracted the variable index, and mapped it back to the fastest route.",
  },
  {
    title: "Enforce one arrival and departure",
    body: "Distance alone can select too many roads. Quadratic penalties make it expensive to choose two different outbound or inbound edges for the same location.",
    note: "These terms encode the rule: visit each location once.",
    code: `for node in range(n):\n    out_edges = [get_edge_idx(node, v) for v in range(n) if v != node]\n    for i in range(len(out_edges)):\n        for j in range(i+1, len(out_edges)):\n            terms.append(2*A*variables[out_edges[i]]*variables[out_edges[j]])\n\n    in_edges = [get_edge_idx(u, node) for u in range(n) if u != node]`,
    output: "Added degree penalties.\nTotal terms so far: 37",
    graded: true,
    completionDescription: "You added pairwise penalties so every location has one arrival and one departure.",
  },
  {
    title: "Measure the cost of taking every road",
    body: "Without degree penalties, selecting every edge can look artificially attractive. Compute the linear cost, then add the penalty for repeatedly visiting locations.",
    note: "Compare the unpenalized and full objective values.",
    code: `total_cost = 2*A*n\nfor i in range(n):\n    for j in range(n):\n        if i != j:\n            total_cost += instance[i,j] ___\n\npenalty = ___\nprint(total_cost)\nprint(total_cost + penalty)`,
    answer: `total_cost = 2*A*n\nfor i in range(n):\n    for j in range(n):\n        if i != j:\n            total_cost += instance[i,j] - 2*A\n\npenalty = 2*A*n*(n-1)*(n-2)\nprint(total_cost)\nprint(total_cost + penalty)`,
    output: "Total cost without penalties: -96560\nFull cost including penalties: 49840",
  },
  {
    title: "Prevent disconnected delivery loops",
    body: "A route may satisfy every local arrival and departure rule but still split into disconnected cycles. Higher-order terms penalize those subtours.",
    note: "Each product represents all edges in one forbidden cycle.",
    code: `non_depot_nodes = list(range(1, n))\nfor length in range(2, n-1):\n    for subset in itertools.combinations(non_depot_nodes, length):\n        first = subset[0]\n        for rest in itertools.permutations(subset[1:]):\n            cycle = [first] + list(rest)\n            subtour_term = 1\n            for k in range(length):\n                u = cycle[k]\n                v = cycle[(k+1) % length]\n                subtour_term *= variables[get_edge_idx(u, v)]\n            terms.append(P*subtour_term)`,
    output: "Added 3 subtour penalties.\nTotal terms so far: 40",
  },
  {
    title: "Check a proposed solution",
    body: "A new solver returned the edge selections below. Use the subtour products to determine whether the route contains a disconnected loop.",
    note: "A non-zero subtour product means the solution is invalid.",
    code: `solution = {0:1, 1:1, 2:0, 3:1, 4:0, 5:1,\n            6:0, 7:1, 8:1, 9:0, 10:0, 11:1}\n\nprint(solution[4] * solution[___])\n\nis_valid_solution = ___`,
    answer: `solution = {0:1, 1:1, 2:0, 3:1, 4:0, 5:1,\n            6:0, 7:1, 8:1, 9:0, 10:0, 11:1}\n\nprint(solution[4] * solution[6])\n\nis_valid_solution = False`,
    output: "1\nDisconnected loop detected.",
    visual: "subtour",
    graded: true,
    passes: false,
    completionDescription: "You identified the non-zero subtour product and correctly rejected the disconnected route.",
  },
  {
    title: "Compile the cost polynomial",
    body: "The final objective combines the constant, linear road costs, degree penalties, and subtour penalties into one symbolic expression Fire Opal can solve.",
    note: "This produces a single polynomial over the 12 binary variables.",
    code: `cost_function = Add(*terms)\n\nprint(f"Compiled polynomial with {len(terms)} terms")\nprint(cost_function)`,
    output: "Successfully compiled cost polynomial with 40 terms!\n48800 - 12150*n0 - 12149*n1 - … + 12200*n10*n11",
  },
  {
    title: "Choose a quantum device",
    body: "Fire Opal can query the connected IBM account for compatible devices. The selected backend will execute the optimization circuit.",
    note: "For this prototype, a simulated backend keeps the activity fast and repeatable.",
    code: `supported_devices = fo.show_supported_devices(\n    credentials=credentials\n)["supported_devices"]\n\nfor name in supported_devices:\n    print(name)`,
    output: "fake_mumbai\nibm_brisbane\nibm_kyiv",
  },
  {
    title: "Prepare the QAOA job",
    body: "Pass the compiled objective, IBM credentials, and backend name to the QAOA solver. This prepares the job without executing it yet.",
    note: "The solver configuration is now ready to submit.",
    code: `fire_opal_job = fo.solve_qaoa(\n    problem=cost_function,\n    credentials=credentials,\n    backend_name="fake_mumbai"\n)`,
    output: "QAOA job prepared successfully.",
  },
  {
    title: "Run the quantum optimization",
    body: "Request the job result to execute the optimization. Fire Opal samples candidate bitstrings and searches for a low-cost valid route.",
    note: "The production calculation may take longer depending on the device queue.",
    code: `fire_opal_solution = fire_opal_job.result()`,
    output: "Optimization complete.\n8 iterations · 8192 samples",
    delay: true,
  },
  {
    title: "Interpret the quantum result",
    body: "The most frequent bitstrings are the most likely candidate routes. Reorder the solver bits, compare their probabilities, and identify the leading solution.",
    note: "Click the result graphic to inspect the full distribution.",
    code: `distribution = reorder_result_distribution(\n    fire_opal_solution, variables\n)\nplot_dictionaries_as_a_histogram([distribution])\n\nmost_likely = max(distribution, key=distribution.get)\nbest_cost = fire_opal_solution["solution_bitstring_cost"]`,
    output: "Most likely bitstring: 001010100010\nSolution cost: 214 min",
    visual: "histogram",
  },
  {
    title: "Verify the route classically",
    body: "For four locations, we can test every possible delivery order. Compare the exact classical optimum with the route returned by the quantum optimizer.",
    note: "Click the route graphic for a larger view of the final journey.",
    code: `best_route = None\nbest_classical_cost = float("inf")\n\nfor perm in permutations(range(1, n)):\n    route = [0] + list(perm) + [0]\n    cost = sum(instance[route[i], route[i+1]]\n               for i in range(len(route)-1))\n    if cost < best_classical_cost:\n        best_route = route\n        best_classical_cost = cost`,
    output: "Classical optimum: [0, 1, 3, 2, 0]\nClassical cost: 214 min\nQuantum cost: 214 min\n✓ Optimal solution confirmed",
    visual: "route",
  },
];

function NetworkGraphic({ kind }) {
  const isSubtour = kind === "subtour";
  const routeOnly = kind === "route" || isSubtour;
  const edges = routeOnly
    ? (isSubtour ? [[52,85,166,48],[166,48,52,85],[144,188,258,133],[258,133,144,188]] : [[52,85,166,48],[166,48,258,133],[258,133,144,188],[144,188,52,85]])
    : [[52,85,166,48],[52,85,144,188],[52,85,258,133],[166,48,144,188],[166,48,258,133],[144,188,258,133]];
  return <svg className="result-graphic network-graphic" viewBox="0 0 310 230" preserveAspectRatio="none" role="img" aria-label={isSubtour ? "Disconnected route visualization" : "Delivery network visualization"}>
    {edges.map((edge, index) => <line key={index} x1={edge[0]} y1={edge[1]} x2={edge[2]} y2={edge[3]} className={routeOnly ? "chosen-edge" : "map-edge"} />)}
    {!routeOnly && ["120","120","120","61","52","52"].map((value,index) => <text key={index} x={[105,85,155,146,204,205][index]} y={[63,137,105,126,87,169][index]}>{value}</text>)}
    {[[52,85,"D"],[166,48,"1"],[144,188,"2"],[258,133,"3"]].map(([x,y,label], index) => <g key={label} className={index === 0 ? "map-node depot-node" : "map-node"}><circle cx={x} cy={y} r="18"/><text x={x} y={y+4}>{label}</text></g>)}
  </svg>;
}

function Histogram() {
  const bars = [8,14,10,22,18,31,24,86,38,19,12,16];
  return <div className="result-graphic histogram" role="img" aria-label="Bitstring probability distribution">{bars.map((height,index) => <span key={index} className={index === 7 ? "peak" : ""} style={{height:`${height}%`}}><i>{index === 7 ? "001010100010" : ""}</i></span>)}</div>;
}

function Graphic({ kind }) {
  if (kind === "histogram") return <Histogram />;
  if (["network","edge","subtour","route"].includes(kind)) return <NetworkGraphic kind={kind === "edge" ? "route" : kind} />;
  return null;
}

const pythonTokenPattern = /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(def|for|in|if|else|elif|return|import|from|as|print|range|None|True|False|and|or|not)\b|\b(\d+(?:\.\d+)?)\b/g;

function HighlightedCode({ code, highlightRef }) {
  const lines = code.split("\n");
  return <pre className="syntax-layer" ref={highlightRef} aria-hidden="true">{lines.map((line, lineIndex) => {
    const tokens = [];
    let cursor = 0;
    for (const match of line.matchAll(pythonTokenPattern)) {
      if (match.index > cursor) tokens.push(line.slice(cursor, match.index));
      const className = match[1] ? "syntax-comment" : match[2] ? "syntax-string" : match[3] ? "syntax-keyword" : "syntax-number";
      tokens.push(<span className={className} key={`${lineIndex}-${match.index}`}>{match[0]}</span>);
      cursor = match.index + match[0].length;
    }
    if (cursor < line.length) tokens.push(line.slice(cursor));
    return <span className="syntax-line" key={lineIndex}>{tokens}{lineIndex < lines.length - 1 ? "\n" : ""}</span>;
  })}</pre>;
}

function App() {
  const [step, setStep] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [code, setCode] = useState(lessons[0].code);
  const [status, setStatus] = useState("idle");
  const [modal, setModal] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [completionToast, setCompletionToast] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [completed, setCompleted] = useState(new Set());
  const highlightRef = useRef(null);
  const lesson = lessons[step];
  const activeTopic = Math.floor(step / 4);
  const isCompactActivity = lesson.code.includes("___");
  const isGraded = lesson.graded === true;
  const isCorrect = lesson.passes !== false;

  const navigateToStep = (nextStep) => {
    const direction = nextStep >= step ? "forward" : "backward";
    const updateStep = () => {
      setTransitionDirection(direction);
      setStep(nextStep);
    };

    if (!document.startViewTransition) {
      updateStep();
      return;
    }

    document.documentElement.dataset.activityDirection = direction;
    const transition = document.startViewTransition(() => flushSync(updateStep));
    transition.finished.finally(() => delete document.documentElement.dataset.activityDirection);
  };

  const topicIsComplete = (topicIndex) => (
    Array.from({ length: 4 }, (_, index) => topicIndex * 4 + index)
      .every((lessonIndex) => completed.has(lessonIndex))
  );

  useEffect(() => {
    setCode(lessons[step].code);
    setStatus("idle");
    setModal(false);
    setCompletionToast(false);
    setAnswerRevealed(false);
  }, [step]);

  useEffect(() => {
    if (status !== "loading") return undefined;
    const timer = window.setTimeout(() => setStatus("result"), lesson.delay ? 5000 : 900);
    return () => window.clearTimeout(timer);
  }, [status, lesson.delay]);

  useEffect(() => {
    if (status !== "result" || isGraded) return;
    setCompleted((current) => new Set(current).add(step));
    setCompletionToast(true);
  }, [isGraded, status, step]);

  const run = () => {
    setCompletionToast(false);
    setAnswerRevealed(false);
    if (lesson.answer) setCode(lesson.answer);
    setStatus("loading");
  };

  const continueActivity = () => {
    setCompletionToast(false);
    setStatus("idle");
    if (step < lessons.length - 1) navigateToStep(step + 1);
  };

  const retryActivity = () => {
    setCode(lesson.code);
    setStatus("idle");
    setCompletionToast(false);
    setAnswerRevealed(false);
  };

  const showAnswer = () => {
    if (lesson.answer) setCode(lesson.answer);
    setCompleted((current) => new Set(current).add(step));
    setAnswerRevealed(true);
    setStatus("result");
    setCompletionToast(true);
  };

  const submit = () => {
    if (status !== "result" || !isGraded) return;
    if (isCorrect) setCompleted((current) => new Set(current).add(step));
    setCompletionToast(true);
  };

  const openModal = () => {
    setModalClosing(false);
    setModal(true);
  };

  const closeModal = () => {
    setModalClosing(true);
    window.setTimeout(() => {
      setModal(false);
      setModalClosing(false);
    }, 180);
  };

  return <TooltipProvider delayDuration={100}>
    <main className="app">
      <header className="app-header">
        <div className="app-header-brand" aria-label="Classiq home"><img className="app-header-mark" src="/logo.svg" alt="" /></div>
        <div className="app-header-tabs" role="tablist" aria-label="Workspace views">
          <button className="app-header-tab active" role="tab" aria-selected="true">Learn</button>
          <button className="app-header-tab" role="tab" aria-selected="false">Practice</button>
        </div>
        <img className="app-header-tools" src="/right.svg" alt="Workspace controls and profile" />
      </header>
      <div className="workspace">
        <nav className="progress-nav" aria-label="Course progress">
          <div className="progress-crumbs" aria-label="Breadcrumb"><span>Applications</span><span>›</span><span className="crumb-current">Logistics</span></div>
          <div className="topic-progress">
            {Array.from({ length: 4 }, (_, topicIndex) => {
              const isActive = topicIndex === activeTopic;
              const isComplete = topicIsComplete(topicIndex);
              if (isActive) {
                return <div className="topic-expanded" aria-label={`Topic ${topicIndex + 1}`} key={topicIndex}>
                  {Array.from({ length: 4 }, (_, activityIndex) => {
                    const lessonIndex = topicIndex * 4 + activityIndex;
                    return <button key={lessonIndex} className={`${completed.has(lessonIndex) ? "complete" : ""} ${lessonIndex === step ? "current" : ""}`} aria-label={`Topic ${topicIndex + 1}, activity ${activityIndex + 1}: ${lessons[lessonIndex].title}`} onClick={() => navigateToStep(lessonIndex)} />;
                  })}
                </div>;
              }
              return <button key={topicIndex} className={`topic-circle ${isComplete ? "complete" : ""}`} aria-label={`Open topic ${topicIndex + 1}${isComplete ? ", complete" : ""}`} onClick={() => navigateToStep(topicIndex * 4)} />;
            })}
          </div>
          <Button className="assistance-button" variant="ghost"><Sparkles size={16} />Assist me</Button>
        </nav>
        <div className="workspace-content">
        <section className="lesson-copy lesson-fade" key={`lesson-${step}`}><h1>{lesson.title}</h1><p>{lesson.body}</p><div className="lesson-note">{lesson.note}</div></section>
        <section className={`work-area code-panel-transition ${isCompactActivity ? "work-area-compact" : ""}`}>
          <div className={`editor-pane editor-scroll editor-scroll-${transitionDirection} ${isCompactActivity ? "editor-pane-compact" : ""}`} key={`editor-${step}`}>
            <div className="line-numbers">{Array.from({length:Math.max(8,code.split("\n").length)},(_,index)=><span key={index}>{index+1}</span>)}</div>
            <div className="editor-code-stack">
              <HighlightedCode code={code} highlightRef={highlightRef} />
              <textarea
                aria-label="Python code"
                value={code}
                spellCheck="false"
                onScroll={(event) => {
                  if (highlightRef.current) {
                    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
                    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
                  }
                }}
                onChange={(event) => {
                  setCode(event.target.value);
                  setStatus("idle");
                  setCompletionToast(false);
                  setAnswerRevealed(false);
                }}
              />
            </div>
          </div>
          <div className="run-row"><Button className="run" onClick={run} disabled={status === "loading"}><Play size={11} fill="currentColor"/>Run</Button><Button variant="ghost" onClick={()=>{setCode(lesson.code);setStatus("idle");setCompletionToast(false);setAnswerRevealed(false);}}><RotateCcw size={13}/>Reset</Button></div>
          <div className={`output-pane ${status === "result" && isGraded && completed.has(step) ? "output-result" : `output-${status}`} `}><div className="output-label"><span>▱ Output</span><span className={`grading-badge ${isGraded ? "graded" : "not-graded"}`}>{isGraded ? "Graded" : "Not Graded"}</span></div>{status === "idle" && <div className="empty-output state-enter" key="idle"><div className="output-symbol">⌬</div><strong>No output yet</strong><small>Execute the code above to display the output.</small></div>}{status === "loading" && <div className="loading-output state-enter" role="status"><LoaderCircle size={28}/><strong>Running your code</strong><small>{lesson.delay ? "Optimizing candidate routes…" : "Preparing output…"}</small></div>}{status === "result" && <div className="result-output state-enter" key="result">{lesson.visual ? <div className="graphic-result"><button className="graphic-button" onClick={openModal} aria-label="Open result graphic"><Graphic kind={lesson.visual}/><span><Expand size={12}/> View larger</span></button>{isGraded && completed.has(step) && <div className="assertion-alert" role="status">Assertion critieria met!</div>}</div> : <div className="text-result"><pre>{lesson.output}</pre>{isGraded && completed.has(step) && <div className="assertion-alert" role="status">Assertion critieria met!</div>}</div>}{lesson.visual && <pre>{lesson.output}</pre>}</div>}</div>
          {status === "result" && isGraded && !completionToast && <div className="footer-actions"><Button onClick={submit}>Submit</Button></div>}
        </section>
        </div>
      </div>
      {completionToast && <div className="completion-toast" role="status" aria-live="polite"><div><strong>{isGraded && !isCorrect && !answerRevealed ? <X className="completion-x" size={16}/> : <Check className="completion-check" size={16}/>} {isGraded && !isCorrect && !answerRevealed ? "Not quite" : "Well done"}</strong><span>{isGraded && !isCorrect && !answerRevealed ? "This isnt really what we were after. check the question and look at the tests that are failing" : isGraded ? "You correctly applied the right logic and got the right result. All assertions are met." : "Activity complete"}</span></div>{isGraded && !isCorrect && !answerRevealed ? <div className="completion-actions"><Button onClick={retryActivity}>Retry</Button><Button variant="outline" onClick={showAnswer}>Show answer</Button></div> : <Button onClick={continueActivity}>Continue<ArrowRight size={14}/></Button>}</div>}
      {modal && <div className={`modal-backdrop ${modalClosing ? "is-closing" : ""}`} role="presentation" onMouseDown={closeModal}><div className="graphic-modal" role="dialog" aria-modal="true" aria-label={`${lesson.title} result`} onMouseDown={(event)=>event.stopPropagation()}><div className="modal-head"><div><small>RESULT</small><h2>{lesson.title}</h2></div><Button variant="ghost" size="icon" aria-label="Close" onClick={closeModal}><X size={18}/></Button></div><div className="modal-content"><Graphic kind={lesson.visual}/></div><pre>{lesson.output}</pre></div></div>}
    </main>
  </TooltipProvider>;
}

createRoot(document.getElementById("root")).render(<App/>);