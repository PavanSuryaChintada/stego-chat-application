import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon } from "lucide-react";
import { StegoModal } from "./StegoModal";
import { encryptMessage } from "@/utils/crypto";
import { toast } from "sonner";

interface MessageInputProps {
  currentUserId: string;
  otherUserId: string;
  onSendMessage: (type: 'text' | 'stego', content: string, imageUrl?: string, hasPasscode?: boolean) => void;
}

export const MessageInput = ({ currentUserId, otherUserId, onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showStegoModal, setShowStegoModal] = useState(false);

  const handleSendText = async () => {
    if (!message.trim()) return;

    try {
      // Encrypt the message
      const { ciphertext, metadata } = await encryptMessage(message);
      const encryptedPayload = `${ciphertext}|||${metadata}`;
      
      await onSendMessage('text', encryptedPayload);
      setMessage("");
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSendStego = async (imageUrl: string, hasPasscode: boolean) => {
    await onSendMessage('stego', '', imageUrl, hasPasscode);
    setShowStegoModal(false);
  };

  return (
    <>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowStegoModal(true)}
            className="shrink-0 border-border hover:bg-secondary"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
            placeholder="Type a message..."
            className="flex-1 bg-input border-border"
          />
          
          <Button
            onClick={handleSendText}
            disabled={!message.trim()}
            className="shrink-0 bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <StegoModal
        isOpen={showStegoModal}
        onClose={() => setShowStegoModal(false)}
        onSend={handleSendStego}
        currentUserId={currentUserId}
      />
    </>
  );
};
