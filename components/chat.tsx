"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"

interface User {
  id: string
  full_name: string
  profile_image_url: string | null
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

interface ChatProps {
  roomId?: string;
}

export function Chat({ roomId }: ChatProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [connections, setConnections] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // For group chat: fetch messages for the room
  useEffect(() => {
    if (roomId && profile) {
      fetchRoomMessages(roomId)
    }
  }, [roomId, profile])

  // For direct chat: fetch connections and messages
  useEffect(() => {
    if (!roomId && profile) {
      fetchConnections()
    }
  }, [profile, roomId])

  useEffect(() => {
    if (!roomId && selectedUser) {
      fetchMessages(selectedUser.id)
    }
  }, [selectedUser, roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchRoomMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`*, sender:profiles!messages_sender_id_fkey(*)`)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
      if (error) throw error
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessages([])
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          *,
          sender:profiles!connection_requests_sender_id_fkey(*),
          receiver:profiles!connection_requests_receiver_id_fkey(*)
        `)
        .eq("status", "accepted")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      if (error) throw error
      if (Array.isArray(data)) {
        const connectedUsers = data.map((req) =>
          req.sender_id === profile.id ? req.receiver : req.sender
        )
        setConnections(connectedUsers)
      } else {
        setConnections([])
      }
    } catch (error) {
      setConnections([])
      console.error("Error fetching connections:", error)
      toast({
        title: "Error",
        description: "Failed to fetch connections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile.id})`)
        .order("created_at", { ascending: true })
      if (error) throw error
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessages([])
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      if (roomId) {
        // Group/collaboration chat
        const { error } = await supabase.from("messages").insert({
          sender_id: profile?.id,
          room_id: roomId,
          content: newMessage.trim(),
        })
        if (error) throw error
        setNewMessage("")
        fetchRoomMessages(roomId)
      } else if (selectedUser) {
        // Direct chat
        const { error } = await supabase
          .from("messages")
          .insert({
            sender_id: profile?.id,
            receiver_id: selectedUser.id,
            content: newMessage.trim(),
          })
        if (error) throw error
        setNewMessage("")
        fetchMessages(selectedUser.id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  // Remove duplicate users by id before rendering
  const uniqueConnections = Array.isArray(connections)
    ? connections.filter((user, idx, arr) => arr.findIndex(u => u.id === user.id) === idx)
    : [];

  if (roomId) {
    // Group/collaboration chat UI
    return (
      <Card className="w-full max-w-2xl mx-auto flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle>Collaboration Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {Array.isArray(messages) && messages.map((message) => {
              const isMe = message.sender_id === profile?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isMe
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={message.sender?.profile_image_url || undefined} />
                        <AvatarFallback>{message.sender?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-xs">{message.sender?.full_name}</span>
                    </div>
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-70 text-right">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
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
        </CardContent>
      </Card>
    )
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
          ) : Array.isArray(connections) && connections.length === 0 ? (
            <p className="text-gray-500">No connections yet</p>
          ) : (
            <div className="space-y-2">
              {uniqueConnections.map((user) => (
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
                {Array.isArray(messages) && messages.map((message) => {
                  const isMe = message.sender_id === profile?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isMe
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                        style={{
                          borderTopRightRadius: isMe ? 0 : undefined,
                          borderTopLeftRadius: !isMe ? 0 : undefined,
                        }}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-70 text-right">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
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