import { Button } from "@/components/ui/button";
import { observer } from "mobx-react-lite";
import { SettingsIcon, MessageSquare, AlertCircle, LogIn, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const ChatHeader = observer(() => {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { 
    remainingMessages, 
    isLimitReached, 
    isInitialized, 
    showLimitDialog,
    hideLimitReachedDialog
  } = usePreviewMode();

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const handleCloseDialog = () => {
    hideLimitReachedDialog();
  };

  const showPreviewBanner = !isSignedIn && isInitialized;

  return (
    <>
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {showPreviewBanner && (
          <div className="border-b border-border/50">
            <div className="px-4 py-2">
              {isLimitReached ? (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-foreground">Preview limit reached</span>
                    <span className="text-muted-foreground">- Sign in to continue</span>
                  </div>
                  <Button 
                    onClick={handleSignIn} 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700 h-7 px-3"
                  >
                    <LogIn className="h-3 w-3 mr-1" />
                    Sign In
                  </Button>
                </div>
              ) : (
                              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-foreground">Free Preview</span>
                  <span className="text-muted-foreground">
                    You have 10 messages for the preview
                  </span>
                </div>
                  <Button 
                    onClick={handleSignIn} 
                    variant="outline" 
                    size="sm"
                    className="border-blue-500/50 hover:bg-blue-500/10 h-7 px-3"
                  >
                    <LogIn className="h-3 w-3 mr-1" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
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

      <Dialog open={showLimitDialog && !isSignedIn} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Preview Limit Reached!
              </h3>
              <p className="text-muted-foreground max-w-sm">
                You've used all 10 free preview messages. Sign in now to continue your conversation with unlimited access.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-4">
              <Button 
                onClick={handleSignIn} 
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Button>
              
              <Button 
                onClick={handleCloseDialog} 
                variant="ghost" 
                className="w-full"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
