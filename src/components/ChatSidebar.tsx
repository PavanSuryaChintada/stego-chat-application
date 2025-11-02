import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquarePlus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
}

interface ChatSidebarProps {
  currentUserId: string;
  selectedChatId?: string;
  onSelectChat: (userId: string, username: string) => void;
}

export const ChatSidebar = ({ currentUserId, selectedChatId, onSelectChat }: ChatSidebarProps) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId) return;
    loadChats();
  }, [currentUserId]);

  const loadChats = async () => {
    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get other user profiles
      const formattedChats = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const otherUserId = chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', otherUserId)
            .single();

          return {
            id: chat.id,
            userId: otherUserId,
            username: profile?.username || 'Unknown',
            lastMessageAt: chat.last_message_at
          };
        })
      );

      setChats(formattedChats);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const searchUsers = async () => {
    if (!search.trim()) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', currentUserId)
        .ilike('username', `%${search}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
      setShowNewChat(true);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              placeholder="Search users..."
              className="pl-9 bg-input border-border"
            />
          </div>
          <Button
            onClick={searchUsers}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {showNewChat && users.length > 0 ? (
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-2 py-2">Search Results</div>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onSelectChat(user.id, user.username);
                  setShowNewChat(false);
                  setSearch("");
                  setUsers([]);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <Avatar>
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">{user.username}</div>
                  <div className="text-xs text-muted-foreground">Start a conversation</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {chats.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <MessageSquarePlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No chats yet</p>
                <p className="text-xs mt-1">Search for users to start chatting</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.userId, chat.username)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg transition-colors ${
                    selectedChatId === chat.userId ? 'bg-secondary' : ''
                  }`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {chat.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground">{chat.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(chat.lastMessageAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
