import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (passcode: string) => Promise<void>;
}

export const PasscodeModal = ({ isOpen, onClose, onSubmit }: PasscodeModalProps) => {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!passcode.trim()) return;

    try {
      setLoading(true);
      await onSubmit(passcode);
      setPasscode("");
    } catch (error) {
      // Error is handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Enter Passcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>This message is protected</Label>
            <Input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter passcode"
              className="bg-input border-border"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !passcode.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Verifying...' : 'Unlock'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
