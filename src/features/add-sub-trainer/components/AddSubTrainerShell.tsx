import { useAddSubTrainerController } from "../hooks/useAddSubTrainerController";
import { AddSubTrainerHeader } from "./AddSubTrainerHeader";
import { AddSubTrainerSetupScreen } from "./AddSubTrainerSetupScreen";
import { AddSubTrainerPlayScreen } from "./AddSubTrainerPlayScreen";

export function AddSubTrainerShell() {
  const controller = useAddSubTrainerController();

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full h-full min-h-0 flex flex-col gap-3 sm:gap-4">
        <AddSubTrainerHeader controller={controller} />
        {controller.state.screen === "setup" ? (
          <AddSubTrainerSetupScreen controller={controller} />
        ) : (
          <AddSubTrainerPlayScreen controller={controller} />
        )}
      </div>
    </div>
  );
}
