import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Lock } from "lucide-react";
import { encryptMessage } from "@/utils/crypto";
import { hideMessageInImage } from "@/utils/steganography";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StegoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (imageUrl: string, hasPasscode: boolean) => void;
  currentUserId: string;
}

export const StegoModal = ({ isOpen, onClose, onSend, currentUserId }: StegoModalProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [usePasscode, setUsePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image type - prefer PNG, accept WebP
      const validTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a PNG, WebP, or JPEG image');
        return;
      }
      
      // Warn if using JPEG (compression may affect steganography)
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        toast.warning('JPEG images may have compression artifacts. PNG recommended for best results.');
      }
      
      setImageFile(file);
    }
  };

  const handleSend = async () => {
    if (!imageFile || !message.trim()) {
      toast.error('Please select an image and enter a message');
      return;
    }

    if (usePasscode && !passcode.trim()) {
      toast.error('Please enter a passcode');
      return;
    }

    try {
      setLoading(true);

      // Encrypt the message
      const { ciphertext, metadata } = await encryptMessage(
        message,
        usePasscode ? passcode : undefined
      );

      // Hide in image
      const stegoBlob = await hideMessageInImage(imageFile, ciphertext, metadata);

      // Upload to storage
      const fileName = `${currentUserId}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stego-images')
        .upload(fileName, stegoBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stego-images')
        .getPublicUrl(fileName);

      toast.success('Message hidden successfully!');
      onSend(urlData.publicUrl, usePasscode);
      
      // Reset form
      setImageFile(null);
      setMessage("");
      setUsePasscode(false);
      setPasscode("");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to hide message');
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
            Hide Message in Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Image</Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/png,image/webp,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="bg-input border-border"
              />
              {imageFile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {imageFile.name}
                  <span className="ml-2 text-xs">
                    ({(imageFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                💡 PNG or WebP recommended for best results
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secret Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your secret message..."
              className="bg-input border-border min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="passcode"
              checked={usePasscode}
              onCheckedChange={(checked) => setUsePasscode(checked as boolean)}
            />
            <Label htmlFor="passcode" className="cursor-pointer">
              Protect with passcode
            </Label>
          </div>

          {usePasscode && (
            <div className="space-y-2">
              <Label>Passcode</Label>
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="bg-input border-border"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || !imageFile || !message.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Processing...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
