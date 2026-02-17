import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  message_type: string;
  encrypted_content?: string;
  image_url?: string;
  has_passcode: boolean;
  created_at: string;
}

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
  otherUsername: string;
}

export const ChatWindow = ({ currentUserId, otherUserId, otherUsername }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otherUserId) {
      setChatId(null);
      setMessages([]);
      return;
    }
    loadOrCreateChat();
  }, [otherUserId, loadOrCreateChat]);

  useEffect(() => {
    if (!chatId) return;

    loadMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, loadMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const loadOrCreateChat = useCallback(async () => {
    try {
      // Try to find existing chat
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`)
        .single();

      if (existingChat) {
        setChatId(existingChat.id);
        return;
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user1_id: currentUserId,
          user2_id: otherUserId
        })
        .select('id')
        .single();

      if (error) throw error;
      setChatId(newChat.id);
    } catch (error) {
      console.error('Error loading/creating chat:', error);
      toast.error('Failed to load chat');
    }
  }, [currentUserId, otherUserId]);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  }, [chatId]);

  const handleSendMessage = async (type: 'text' | 'stego', content: string, imageUrl?: string, hasPasscode?: boolean) => {
    if (!chatId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message_type: type,
          encrypted_content: type === 'text' ? content : undefined,
          image_url: type === 'stego' ? imageUrl : undefined,
          has_passcode: hasPasscode || false
        });

      if (error) throw error;

      // Update chat's last message timestamp
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (!otherUserId) {
    return (
      <Card className="h-full flex items-center justify-center bg-card border-border">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a chat to start messaging</p>
          <p className="text-sm mt-2">Your messages will be end-to-end encrypted</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-primary/20 text-primary">
            {otherUsername[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-foreground">{otherUsername}</h3>
          <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSent={message.sender_id === currentUserId}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        currentUserId={currentUserId}
        otherUserId={otherUserId}
        onSendMessage={handleSendMessage}
      />
    </Card>
  );
};
