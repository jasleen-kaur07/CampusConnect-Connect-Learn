"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Search, Bell } from "lucide-react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Chat } from "@/components/chat"

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

export function ConnectionRequests() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [connections, setConnections] = useState<string[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const interests = ['Python', 'JavaScript', 'React', 'Next.js', 'AI', 'Machine Learning']
  const router = useRouter()

  useEffect(() => {
    if (profile) {
      setLoading(true); // Start loading
      fetchUsers();
      fetchPendingRequests();
      fetchSentRequests();
      fetchConnections();
    }
  }, [profile]);

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
    } finally {
      setLoading(false)
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
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);
    if (!error && data) {
      const connectedUserIds = data.map((req) =>
        req.sender_id === profile.id ? req.receiver_id : req.sender_id
      );
      setConnections(connectedUserIds);
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
    } catch (error) {
      console.error(`Error ${action}ing connection request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} connection request`,
        variant: "destructive",
      })
    }
  }

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notifications enabled!');
        // You can now send notifications
        new Notification('Notifications are enabled!');
      } else {
        alert('Notifications denied or dismissed.');
      }
    } else {
      alert('This browser does not support notifications.');
    }
  };

  if (!profile) return null;

  const uniquePendingRequests = Array.isArray(pendingRequests)
    ? pendingRequests.filter(
        (req, idx, arr) => arr.findIndex(r => r.id === req.id) === idx
      )
    : [];

  const uniqueUsers = Array.isArray(users)
    ? users.filter(
        (user, idx, arr) => arr.findIndex(u => u.id === user.id) === idx
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connection Requests</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your connections and requests</p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : uniquePendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {uniquePendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-8 h-8 cursor-pointer" onClick={() => router.push('/profile')}>
                      <AvatarImage src={request.sender.profile_image_url || ""} />
                      <AvatarFallback>{request.sender.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.sender.full_name}</p>
                      <p className="text-sm text-gray-500">{request.sender.role}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleConnectionRequest(request.id, 'reject')}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleConnectionRequest(request.id, 'accept')}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Users */}
      <Card>
        <CardHeader>
          <CardTitle>Available Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uniqueUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-8 h-8 cursor-pointer" onClick={() => router.push('/profile')}>
                    <AvatarImage src={user.profile_image_url || ""} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {user.role} {user.department && `• ${user.department}`}
                    </p>
                  </div>
                </div>
                {!connections.includes(user.id) && (
                  <Button
                    variant="outline"
                    onClick={() => sendConnectionRequest(user.id)}
                    disabled={sentRequests.includes(user.id)}
                  >
                    {sentRequests.includes(user.id) ? "Requested" : "Connect"}
                  </Button>
                )}
                {connections.includes(user.id) && (
                  <span className="text-green-600 font-semibold">Connected</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users
              .filter((user) => connections.includes(user.id))
              .map((user) => (
                <div key={user.id} className="flex items-center space-x-4">
                  <Avatar className="w-8 h-8 cursor-pointer" onClick={() => router.push('/profile')}>
                    <AvatarImage src={user.profile_image_url || ""} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {user.role} {user.department && `• ${user.department}`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/connections">Connections</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/chat">Chat</Link>
        </Button>
      </div>

      {showSearch && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow">
            <input
              type="text"
              placeholder="Search interests..."
              className="border p-2 rounded"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
            <ul>
              {interests
                .filter(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(interest => (
                  <li key={interest}>{interest}</li>
                ))}
            </ul>
            <button onClick={() => setShowSearch(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
} 