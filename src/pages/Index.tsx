import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSelectChat = (userId: string, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
  };

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background p-4 gap-4">
      <div className="w-80 flex-shrink-0">
        <ChatSidebar
          currentUserId={session.user.id}
          selectedChatId={selectedUserId}
          onSelectChat={handleSelectChat}
        />
      </div>
      <div className="flex-1">
        <ChatWindow
          currentUserId={session.user.id}
          otherUserId={selectedUserId}
          otherUsername={selectedUsername}
        />
      </div>
    </div>
  );
};

export default Index;
