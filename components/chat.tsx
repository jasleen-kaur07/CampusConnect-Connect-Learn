"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { UserPlus, MessageCircle } from "lucide-react"

interface User {
  id: string
  full_name: string
  profile_image_url: string | null
  role: string
  department: string | null
}

interface ConnectionRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  sender: User
  receiver: User
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender: User
  receiver: User
}

export function Chat() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [connections, setConnections] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [messagesEndRef] = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile) {
      fetchUsers()
      fetchPendingRequests()
      fetchSentRequests()
      fetchConnections()
    }
  }, [profile])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id)
      subscribeToMessages(selectedUser.id)
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", profile?.id)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          *,
          sender:profiles!connection_requests_sender_id_fkey(*),
          receiver:profiles!connection_requests_receiver_id_fkey(*)
        `)
        .eq("receiver_id", profile?.id)
        .eq("status", "pending")

      if (error) throw error
      setPendingRequests(data || [])
    } catch (error) {
      console.error("Error fetching pending requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSentRequests = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("connection_requests")
      .select("receiver_id")
      .eq("sender_id", profile.id)
      .eq("status", "pending");
    if (!error && data) {
      setSentRequests(data.map((req) => req.receiver_id));
    }
  };

  const fetchConnections = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("connection_requests")
      .select(`
        *,
        sender:profiles!connection_requests_sender_id_fkey(*),
        receiver:profiles!connection_requests_receiver_id_fkey(*)
      `)
      .eq("status", "accepted")
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);
    if (!error && data) {
      const connectedUsers = data.map((req) =>
        req.sender_id === profile.id ? req.receiver : req.sender
      );
      setConnections(connectedUsers);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      const { data: existing, error: existingError } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", profile?.id)
        .eq("receiver_id", receiverId)
        .eq("status", "pending");

      if (existingError) throw existingError;

      if (existing && existing.length > 0) {
        toast({
          title: "Already Sent",
          description: "You have already sent a connection request to this user.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("connection_requests")
        .insert({
          sender_id: profile?.id,
          receiver_id: receiverId,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Connection request sent successfully",
      });
      fetchSentRequests(); // Refresh sent requests
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const handleConnectionRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq("id", requestId)

      if (error) throw error

      setPendingRequests(prev => prev.filter(req => req.id !== requestId))
      toast({
        title: "Success",
        description: `Connection request ${action}ed successfully`,
      })
      fetchConnections(); // Refresh connections
    } catch (error) {
      console.error(`Error ${action}ing connection request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} connection request`,
        variant: "destructive",
      })
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`and(sender_id.eq.${profile?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile?.id})`)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      })
    }
  }

  const subscribeToMessages = (userId: string) => {
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${profile?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile?.id}))`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: profile?.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-[600px] space-x-4">
      {/* Connections List */}
      <Card className="w-1/4">
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : connections.length === 0 ? (
            <p className="text-gray-500">No connections yet</p>
          ) : (
            <div className="space-y-2">
              {connections.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedUser?.id === user.id ? "bg-gray-100 dark:bg-gray-800" : ""
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile_image_url || undefined} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.full_name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>
            {selectedUser ? `Chat with ${selectedUser.full_name}` : "Select a connection to chat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === profile?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === profile?.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit">Send</Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a connection to start chatting
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 