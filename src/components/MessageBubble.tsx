import { useState, useEffect } from "react";
import { Lock, Image as ImageIcon } from "lucide-react";
import { decryptMessage } from "@/utils/crypto";
import { extractMessageFromImage } from "@/utils/steganography";
import { PasscodeModal } from "./PasscodeModal";
import { toast } from "sonner";

interface Message {
  id: string;
  message_type: string;
  encrypted_content?: string;
  image_url?: string;
  has_passcode: boolean;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

export const MessageBubble = ({ message, isSent }: MessageBubbleProps) => {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [extractedData, setExtractedData] = useState<{ ciphertext: string; metadata: string } | null>(null);

  const handleTextDecrypt = async () => {
    if (!message.encrypted_content || decryptedText) return;

    try {
      setIsDecrypting(true);
      const [ciphertext, metadata] = message.encrypted_content.split('|||');
      const decrypted = await decryptMessage(ciphertext, metadata);
      setDecryptedText(decrypted);
    } catch (error: any) {
      console.error('Decryption error:', error);
      toast.error('Failed to decrypt message');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleImageClick = async () => {
    if (!message.image_url) return;

    try {
      setIsDecrypting(true);
      const data = await extractMessageFromImage(message.image_url);
      
      if (!data) {
        toast.error('No hidden message found in image');
        return;
      }

      setExtractedData(data);

      // Check if passcode is needed
      const metadataObj = JSON.parse(atob(data.metadata));
      if (metadataObj.hasPasscode) {
        setShowPasscodeModal(true);
      } else {
        // Decrypt directly
        const decrypted = await decryptMessage(data.ciphertext, data.metadata);
        setDecryptedText(decrypted);
        toast.success('Message revealed!');
      }
    } catch (error: any) {
      console.error('[MessageBubble] Extraction error:', error);
      
      // Provide specific error messages based on error type
      if (error.message.includes('IMAGE_LOAD_ERROR')) {
        toast.error('Failed to load image - check your connection');
      } else if (error.message.includes('CHECKSUM_ERROR')) {
        toast.error('Image corrupted or altered - cannot extract message');
      } else if (error.message.includes('PARSE_ERROR')) {
        toast.error('Could not extract hidden data - image may be corrupted');
      } else if (error.message.includes('DATA_LENGTH_ERROR')) {
        toast.error('Invalid data detected - image may not contain a hidden message');
      } else if (error.message.includes('VALIDATION_ERROR')) {
        toast.error('Data validation failed - image may be corrupted');
      } else {
        toast.error('Failed to extract message from image');
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handlePasscodeSubmit = async (passcode: string) => {
    if (!extractedData) return;

    try {
      const decrypted = await decryptMessage(extractedData.ciphertext, extractedData.metadata, passcode);
      setDecryptedText(decrypted);
      setShowPasscodeModal(false);
      toast.success('Message revealed!');
    } catch (error: any) {
      console.error('[MessageBubble] Decryption error:', error);
      if (error.message.includes('Passcode required') || error.message.includes('Invalid passcode')) {
        toast.error('Incorrect passcode - try again');
      } else {
        toast.error('Failed to decrypt - data may be corrupted');
      }
      throw error;
    }
  };

  // Auto-decrypt text messages without passcode
  useEffect(() => {
    if (message.message_type === 'text' && !decryptedText && message.encrypted_content && !isDecrypting) {
      handleTextDecrypt();
    }
  }, [message.id]);

  return (
    <>
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-slide-up`}>
        <div
          className={`max-w-[70%] rounded-2xl p-3 ${
            isSent
              ? 'bg-[hsl(var(--message-sent))] text-white'
              : 'bg-[hsl(var(--message-received))] text-foreground'
          }`}
        >
          {message.message_type === 'text' ? (
            <div>
              {isDecrypting ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Decrypting...</span>
                </div>
              ) : decryptedText ? (
                <p className="text-sm break-words">{decryptedText}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Encrypted message</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={handleImageClick}
                className="relative group cursor-pointer"
                disabled={isDecrypting}
              >
                <img
                  src={message.image_url}
                  alt="Shared image"
                  className="max-w-full rounded-lg"
                  style={{ maxHeight: '300px' }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
              </button>
              {decryptedText && (
                <div className="mt-2 p-2 bg-black/20 rounded-lg">
                  <p className="text-sm break-words">{decryptedText}</p>
                </div>
              )}
            </div>
          )}
          <div className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-muted-foreground'}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <PasscodeModal
        isOpen={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onSubmit={handlePasscodeSubmit}
      />
    </>
  );
};
