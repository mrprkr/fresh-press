import React, { useState, useEffect } from "react";
import { Box, Text, Newline, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import SelectInput from "ink-select-input";
import { steps, type Step, type StepStatus } from "./steps.js";

// ─── Screens ─────────────────────────────────────────────────────────────────

type Screen = "welcome" | "select" | "confirm" | "running" | "done";

// ─── Status icon ─────────────────────────────────────────────────────────────

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
        <Text color="gray">  Snapshot: 2026-04-07</Text>
      </Box>
      <Newline />
      <Text color="gray">
        {"  Press "}
        <Text color="white" bold>Enter</Text>
        {" to begin  ·  "}
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
  onConfirm,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onConfirm: () => void;
}) {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (input === " ") {
      onToggle(steps[cursor]!.id);
    }
    if (input === "a") {
      // Toggle all
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
    if (key.downArrow || input === "j") setCursor((c) => Math.min(steps.length - 1, c + 1));
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>Select steps to run:</Text>
      <Text color="gray">
        {"  Space: toggle  ·  a: toggle all  ·  Enter: confirm  ·  q: quit"}
      </Text>
      <Newline />
      {steps.map((step, i) => {
        const isSelected = selected.has(step.id);
        const isCursor = i === cursor;
        return (
          <Box key={step.id}>
            <Text color={isCursor ? "cyan" : "white"}>
              {isCursor ? " ❯ " : "   "}
            </Text>
            <Text color={isSelected ? "green" : "gray"}>
              {isSelected ? "[✓]" : "[ ]"}
            </Text>
            <Text color={isCursor ? "white" : "gray"} bold={isCursor}>
              {" "}
              {step.label}
            </Text>
            <Text color="gray" dimColor>
              {" — "}
              {step.description}
            </Text>
          </Box>
        );
      })}
      <Newline />
      <Text color="gray">
        {selected.size}/{steps.length} selected
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
  const selectedSteps = steps.filter((s) => selected.has(s.id));

  useInput((input, key) => {
    if (key.return || input === "y") onConfirm();
    if (input === "n" || key.escape) onBack();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>Ready to restore:</Text>
      <Newline />
      {selectedSteps.map((step) => (
        <Box key={step.id}>
          <Text color="green">  ▸ </Text>
          <Text>{step.label}</Text>
          <Text color="gray" dimColor>{" — "}{step.description}</Text>
        </Box>
      ))}
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
  currentStepId,
  errors,
}: {
  stepStates: Map<string, StepStatus>;
  currentStepId: string | null;
  errors: Map<string, string>;
}) {
  const completed = Array.from(stepStates.values()).filter((s) => s === "done").length;
  const total = stepStates.size;

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text color="cyan" bold>Restoring </Text>
        <Text color="white">({completed}/{total})</Text>
      </Box>
      <Newline />
      {steps
        .filter((s) => stepStates.has(s.id))
        .map((step) => {
          const status = stepStates.get(step.id)!;
          return (
            <Box key={step.id} flexDirection="column">
              <Box>
                <Text>  </Text>
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
                  {"      "}
                  {errors.get(step.id)!.slice(0, 120)}
                </Text>
              )}
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
  const total = stepStates.size;

  useInput((_input, key) => {
    if (key.return || key.escape) exit();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor={failCount > 0 ? "yellow" : "green"} paddingX={2} paddingY={1} flexDirection="column">
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
          <Text color="yellow" bold>Failed steps:</Text>
          {Array.from(errors.entries()).map(([id, err]) => (
            <Box key={id} flexDirection="column">
              <Text color="red">  ✗ {steps.find((s) => s.id === id)?.label}</Text>
              <Text color="gray" dimColor>    {err.slice(0, 200)}</Text>
            </Box>
          ))}
        </>
      )}
      <Newline />
      <Text color="cyan" bold>Manual steps remaining:</Text>
      <Text>  1. Sign into 1Password, Google, iCloud</Text>
      <Text>  2. Sign into Slack, Linear, Figma</Text>
      <Text>  3. tailscale up</Text>
      <Text>  4. Import GPG keys from backup</Text>
      <Text>  5. p10k configure</Text>
      <Text>  6. Install: Stunt Double, Ableton Live 12, Adobe Lightroom</Text>
      <Text>  7. Restore Dock layout (see dock-apps.txt)</Text>
      <Text>  8. Open a new terminal to load shell config</Text>
      <Newline />
      <Text color="gray">Press Enter to exit</Text>
    </Box>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(steps.map((s) => s.id)),
  );
  const [stepStates, setStepStates] = useState<Map<string, StepStatus>>(new Map());
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  // Global quit
  useInput((input) => {
    if (input === "q" && screen !== "running") {
      exit();
    }
  });

  // Run steps sequentially
  useEffect(() => {
    if (screen !== "running") return;

    const selectedSteps = steps.filter((s) => selected.has(s.id));
    let cancelled = false;

    (async () => {
      for (const step of selectedSteps) {
        if (cancelled) break;

        setCurrentStepId(step.id);
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

      setCurrentStepId(null);
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

  const handleConfirm = () => {
    // Initialize states for selected steps
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
      return (
        <RunningScreen
          stepStates={stepStates}
          currentStepId={currentStepId}
          errors={errors}
        />
      );
    case "done":
      return <DoneScreen stepStates={stepStates} errors={errors} />;
  }
}
