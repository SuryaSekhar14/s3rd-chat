import { Button } from "@/components/ui/button";
import { observer } from "mobx-react-lite";
import { SettingsIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";

export const ChatHeader = observer(() => {
  const router = useRouter();

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-end items-center p-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
            className="h-8 w-8 rounded-full hover:bg-accent/50 transition-colors p-1"
            aria-label="Open settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
          <div className="p-1">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
});
