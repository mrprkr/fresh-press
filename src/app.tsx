import React, { useState, useEffect } from "react";
import { Box, Text, Newline, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import {
  steps,
  PHASE_META,
  PHASE_ORDER,
  type Step,
  type StepStatus,
  type Phase,
} from "./steps.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "pending":
      return <Text color="gray">○</Text>;
    case "running":
      return (
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
      );
    case "done":
      return <Text color="green">●</Text>;
    case "failed":
      return <Text color="red">✗</Text>;
    case "skipped":
      return <Text color="yellow">◌</Text>;
  }
}

function statusColor(status: StepStatus): string {
  switch (status) {
    case "pending": return "gray";
    case "running": return "cyan";
    case "done": return "green";
    case "failed": return "red";
    case "skipped": return "yellow";
  }
}

function phaseColor(phase: Phase): string {
  switch (phase) {
    case "foundation": return "blue";
    case "accounts": return "yellow";
    case "environment": return "green";
    case "applications": return "magenta";
    case "preferences": return "cyan";
  }
}

// Group steps by phase in order
function groupedSteps(): Array<{ phase: Phase; steps: Step[] }> {
  return PHASE_ORDER.map((phase) => ({
    phase,
    steps: steps.filter((s) => s.phase === phase),
  })).filter((g) => g.steps.length > 0);
}

// Build a flat list of "rows" for the selector (headers + steps)
type Row =
  | { type: "header"; phase: Phase }
  | { type: "step"; step: Step };

function buildRows(): Row[] {
  const rows: Row[] = [];
  for (const group of groupedSteps()) {
    rows.push({ type: "header", phase: group.phase });
    for (const step of group.steps) {
      rows.push({ type: "step", step });
    }
  }
  return rows;
}

const ROWS = buildRows();

// ─── Welcome Screen ──────────────────────────────────────────────────────────

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  useInput((_input, key) => {
    if (key.return) onContinue();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1}>
        <Text color="cyan" bold>
          {"  ╔╦╗┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ╦═╗┌─┐┌─┐┌┬┐┌─┐┬─┐┌─┐"}
        </Text>
        <Text color="cyan" bold>
          {"  ║║║├─┤│  ├─┤││││├┤   ╠╦╝├┤ └─┐ │ │ │├┬┘├┤ "}
        </Text>
        <Text color="cyan" bold>
          {"  ╩ ╩┴ ┴└─┘┴ ┴┴┘└┘└─┘  ╩╚═└─┘└─┘ ┴ └─┘┴└─└─┘"}
        </Text>
        <Newline />
        <Text color="white">  Terraform your macOS dev environment from scratch.</Text>
      </Box>
      <Newline />
      <Box flexDirection="column" paddingX={2}>
        {PHASE_ORDER.map((phase, i) => (
          <Box key={phase}>
            <Text color={phaseColor(phase)} bold>
              {`  ${i + 1}. `}
            </Text>
            <Text color={phaseColor(phase)}>
              {PHASE_META[phase].label}
            </Text>
            <Text color="gray" dimColor>
              {" — "}
              {PHASE_META[phase].description}
            </Text>
          </Box>
        ))}
      </Box>
      <Newline />
      <Text color="gray">
        {"  Press "}
        <Text color="white" bold>Enter</Text>
        {" to configure steps  ·  "}
        <Text color="white" bold>q</Text>
        {" to quit"}
      </Text>
    </Box>
  );
}

// ─── Step Selection Screen ───────────────────────────────────────────────────

function SelectScreen({
  selected,
  onToggle,
  onTogglePhase,
  onConfirm,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onTogglePhase: (phase: Phase) => void;
  onConfirm: () => void;
}) {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    const row = ROWS[cursor];
    if (input === " " && row) {
      if (row.type === "header") {
        onTogglePhase(row.phase);
      } else {
        onToggle(row.step.id);
      }
    }
    if (input === "a") {
      if (selected.size === steps.length) {
        steps.forEach((s) => onToggle(s.id));
      } else {
        steps.forEach((s) => {
          if (!selected.has(s.id)) onToggle(s.id);
        });
      }
    }
    if (key.return) onConfirm();
    if (key.upArrow || input === "k") setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow || input === "j") setCursor((c) => Math.min(ROWS.length - 1, c + 1));
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>Select steps to run:</Text>
      <Text color="gray">
        {"  Space: toggle  ·  a: all  ·  j/k: navigate  ·  Enter: confirm  ·  q: quit"}
      </Text>
      <Newline />
      {ROWS.map((row, i) => {
        const isCursor = i === cursor;

        if (row.type === "header") {
          const phaseSteps = steps.filter((s) => s.phase === row.phase);
          const allSelected = phaseSteps.every((s) => selected.has(s.id));
          const someSelected = phaseSteps.some((s) => selected.has(s.id));
          const check = allSelected ? "[✓]" : someSelected ? "[-]" : "[ ]";

          return (
            <Box key={`h-${row.phase}`} marginTop={i === 0 ? 0 : 1}>
              <Text color={isCursor ? "white" : phaseColor(row.phase)}>
                {isCursor ? " ❯ " : "   "}
              </Text>
              <Text color={allSelected ? "green" : someSelected ? "yellow" : "gray"}>
                {check}
              </Text>
              <Text color={phaseColor(row.phase)} bold>
                {" "}
                {PHASE_META[row.phase].label}
              </Text>
              <Text color="gray" dimColor>
                {" — "}
                {PHASE_META[row.phase].description}
              </Text>
            </Box>
          );
        }

        const isSelected = selected.has(row.step.id);
        return (
          <Box key={row.step.id}>
            <Text color={isCursor ? "cyan" : "white"}>
              {isCursor ? "   ❯ " : "     "}
            </Text>
            <Text color={isSelected ? "green" : "gray"}>
              {isSelected ? "[✓]" : "[ ]"}
            </Text>
            <Text color={isCursor ? "white" : "gray"} bold={isCursor}>
              {" "}
              {row.step.label}
            </Text>
            <Text color="gray" dimColor>
              {" — "}
              {row.step.description}
            </Text>
          </Box>
        );
      })}
      <Newline />
      <Text color="gray">
        {selected.size}/{steps.length} steps selected
      </Text>
    </Box>
  );
}

// ─── Confirm Screen ──────────────────────────────────────────────────────────

function ConfirmScreen({
  selected,
  onConfirm,
  onBack,
}: {
  selected: Set<string>;
  onConfirm: () => void;
  onBack: () => void;
}) {
  useInput((input, key) => {
    if (key.return || input === "y") onConfirm();
    if (input === "n" || key.escape) onBack();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>Ready to restore — {selected.size} steps:</Text>
      <Newline />
      {groupedSteps().map((group) => {
        const phaseSteps = group.steps.filter((s) => selected.has(s.id));
        if (phaseSteps.length === 0) return null;
        return (
          <Box key={group.phase} flexDirection="column">
            <Text color={phaseColor(group.phase)} bold>
              {"  "}
              {PHASE_META[group.phase].label}
            </Text>
            {phaseSteps.map((step) => (
              <Box key={step.id}>
                <Text color="green">    ▸ </Text>
                <Text>{step.label}</Text>
              </Box>
            ))}
          </Box>
        );
      })}
      <Newline />
      <Text color="gray">
        {"  Press "}
        <Text color="white" bold>Enter</Text>
        {" to run  ·  "}
        <Text color="white" bold>n</Text>
        {" to go back"}
      </Text>
    </Box>
  );
}

// ─── Running Screen ──────────────────────────────────────────────────────────

function RunningScreen({
  stepStates,
  errors,
}: {
  stepStates: Map<string, StepStatus>;
  errors: Map<string, string>;
}) {
  const completed = Array.from(stepStates.values()).filter(
    (s) => s === "done" || s === "failed",
  ).length;
  const total = stepStates.size;
  const currentPhase = steps.find(
    (s) => stepStates.get(s.id) === "running",
  )?.phase;

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text color="cyan" bold>Restoring </Text>
        <Text color="white">({completed}/{total})</Text>
        {currentPhase && (
          <Text color={phaseColor(currentPhase)} dimColor>
            {" — "}
            {PHASE_META[currentPhase].label}
          </Text>
        )}
      </Box>
      <Newline />
      {groupedSteps().map((group) => {
        const phaseSteps = group.steps.filter((s) => stepStates.has(s.id));
        if (phaseSteps.length === 0) return null;

        return (
          <Box key={group.phase} flexDirection="column" marginBottom={1}>
            <Text color={phaseColor(group.phase)} bold>
              {"  "}
              {PHASE_META[group.phase].label}
            </Text>
            {phaseSteps.map((step) => {
              const status = stepStates.get(step.id)!;
              return (
                <Box key={step.id} flexDirection="column">
                  <Box>
                    <Text>    </Text>
                    <StatusIcon status={status} />
                    <Text color={statusColor(status)} bold={status === "running"}>
                      {" "}
                      {step.label}
                    </Text>
                    {status === "running" && (
                      <Text color="gray" dimColor>
                        {" — "}
                        {step.description}
                      </Text>
                    )}
                  </Box>
                  {status === "failed" && errors.has(step.id) && (
                    <Text color="red" dimColor>
                      {"        "}
                      {errors.get(step.id)!.slice(0, 120)}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Done Screen ─────────────────────────────────────────────────────────────

function DoneScreen({
  stepStates,
  errors,
}: {
  stepStates: Map<string, StepStatus>;
  errors: Map<string, string>;
}) {
  const { exit } = useApp();
  const doneCount = Array.from(stepStates.values()).filter((s) => s === "done").length;
  const failCount = Array.from(stepStates.values()).filter((s) => s === "failed").length;

  useInput((_input, key) => {
    if (key.return || key.escape) exit();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="round"
        borderColor={failCount > 0 ? "yellow" : "green"}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Text color={failCount > 0 ? "yellow" : "green"} bold>
          {failCount > 0 ? "Restore complete with warnings" : "Restore complete!"}
        </Text>
        <Newline />
        <Text color="green">  ● {doneCount} succeeded</Text>
        {failCount > 0 && <Text color="red">  ✗ {failCount} failed</Text>}
      </Box>
      {failCount > 0 && (
        <>
          <Newline />
          <Text color="yellow" bold>Action needed:</Text>
          {Array.from(errors.entries()).map(([id, err]) => (
            <Box key={id} flexDirection="column">
              <Text color="red">  ✗ {steps.find((s) => s.id === id)?.label}</Text>
              <Text color="gray" dimColor>    {err.slice(0, 200)}</Text>
            </Box>
          ))}
        </>
      )}
      <Newline />
      <Text color="cyan" bold>Remaining manual steps:</Text>
      <Text>  1. Install non-brew apps: Stunt Double, Ableton Live 12, Adobe Lightroom</Text>
      <Text>  2. Configure Tailscale: tailscale up</Text>
      <Text>  3. Import GPG keys from backup</Text>
      <Text>  4. Run p10k configure for Powerlevel10k prompt</Text>
      <Text>  5. Arrange Dock layout (see dock-apps.txt)</Text>
      <Text>  6. Open a new terminal to load shell config</Text>
      <Newline />
      <Text color="gray">Press Enter to exit</Text>
    </Box>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

type Screen = "welcome" | "select" | "confirm" | "running" | "done";

export default function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(steps.map((s) => s.id)),
  );
  const [stepStates, setStepStates] = useState<Map<string, StepStatus>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useInput((input) => {
    if (input === "q" && screen !== "running") {
      exit();
    }
  });

  useEffect(() => {
    if (screen !== "running") return;

    const selectedSteps = steps.filter((s) => selected.has(s.id));
    let cancelled = false;

    (async () => {
      for (const step of selectedSteps) {
        if (cancelled) break;

        setStepStates((prev) => new Map(prev).set(step.id, "running"));

        try {
          await step.run();
          setStepStates((prev) => new Map(prev).set(step.id, "done"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrors((prev) => new Map(prev).set(step.id, msg));
          setStepStates((prev) => new Map(prev).set(step.id, "failed"));
        }
      }

      setScreen("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [screen]);

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTogglePhase = (phase: Phase) => {
    const phaseSteps = steps.filter((s) => s.phase === phase);
    const allSelected = phaseSteps.every((s) => selected.has(s.id));
    setSelected((prev) => {
      const next = new Set(prev);
      phaseSteps.forEach((s) => {
        if (allSelected) next.delete(s.id);
        else next.add(s.id);
      });
      return next;
    });
  };

  const handleConfirm = () => {
    const initial = new Map<string, StepStatus>();
    steps.filter((s) => selected.has(s.id)).forEach((s) => initial.set(s.id, "pending"));
    setStepStates(initial);
    setErrors(new Map());
    setScreen("running");
  };

  switch (screen) {
    case "welcome":
      return <WelcomeScreen onContinue={() => setScreen("select")} />;
    case "select":
      return (
        <SelectScreen
          selected={selected}
          onToggle={handleToggle}
          onTogglePhase={handleTogglePhase}
          onConfirm={() => setScreen("confirm")}
        />
      );
    case "confirm":
      return (
        <ConfirmScreen
          selected={selected}
          onConfirm={handleConfirm}
          onBack={() => setScreen("select")}
        />
      );
    case "running":
      return <RunningScreen stepStates={stepStates} errors={errors} />;
    case "done":
      return <DoneScreen stepStates={stepStates} errors={errors} />;
  }
}
