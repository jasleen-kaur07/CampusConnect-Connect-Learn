"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MessageCircle, BookOpen, Lightbulb, Award } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Chat } from "@/components/chat"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface Collaboration {
  id: string;
  title: string;
  description: string;
  type: string;
  requester_id: string;
  status: string;
  collaboration_members: { user_id: string }[];
  requester?: { full_name: string };
}

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [collaborationError, setCollaborationError] = useState<null | any>(null)
  const router = useRouter()
  const { profile } = useAuth()

  const handleGetStarted = () => {
    setAuthMode("signup")
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode("signin")
    setShowAuthModal(true)
  }

  const handleJoinCollaboration = async (collaborationId) => {
    const { error } = await supabase.from('collaboration_members').insert([
      { collaboration_id: collaborationId, user_id: profile.id }
    ]);
    if (!error) {
      // Optionally show a toast and refresh the list
      fetchCollaborations();
    }

    console.log("collaboration.id:", collaboration.id);

    const { data: chatRoom, error: chatRoomError } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('reference_id', collaboration.id)
      .eq('type', 'collaboration')
      .single();

    if (chatRoomError) {
      console.error(chatRoomError);
    }

    if (chatRoom) {
      await supabase.from('chat_participants').insert([
        { room_id: chatRoom.id, user_id: profile.id }
      ]);
      router.push(`/chat/${chatRoom.id}`);
    }
  };

  useEffect(() => {
    const fetchCollaborations = async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select(`
          *,
          requester:requester_id (
            full_name
          ),
          collaboration_members (
            user_id
          )
        `);
      setCollaborations(data || []);
      setCollaborationError(error);
    };
    fetchCollaborations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-0 py-8">
        <nav className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-700 drop-shadow-sm">CampusConnect</span>
          <Button onClick={handleSignIn} className="px-6 py-2 rounded-full border border-blue-500 text-blue-600 font-semibold bg-white hover:bg-blue-50 transition shadow-none">
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-24 text-center overflow-hidden">
        {/* Optional SVG or animated background here */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 drop-shadow mb-4">
          Connect, Collaborate, <span className="text-blue-600">Learn</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Bridge the gap between students and faculty with CampusConnect. Join study groups, find mentors, attend events, and collaborate on projects that matter.
        </p>
        <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition">
          Get Started
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition group">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 mb-4 group-hover:bg-blue-200 transition">
              <Calendar className="text-blue-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Events & Workshops</h3>
            <p className="text-gray-500">Discover and register for academic events, workshops, and competitions</p>
          </div>

          <Card>
            <CardHeader>
              <BookOpen className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>Study Groups</CardTitle>
              <CardDescription>Form or join study groups based on subjects and interests</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Lightbulb className="w-10 h-10 text-yellow-600 mb-2" />
              <CardTitle>Mentorship</CardTitle>
              <CardDescription>Connect with faculty and peers for guidance and collaboration</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>Real-time Chat</CardTitle>
              <CardDescription>Communicate instantly with your study groups and mentors</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-red-600 mb-2" />
              <CardTitle>Skill Matching</CardTitle>
              <CardDescription>Find peers and mentors based on skills and interests</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award className="w-10 h-10 text-indigo-600 mb-2" />
              <CardTitle>Portfolio Showcase</CardTitle>
              <CardDescription>Showcase your projects, research, and achievements</CardDescription>
            </CardHeader>
          </Card>
        </div>
        {/* Collaboration List */}
        {profile && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {collaborations.map((collaboration) => {
              if (!profile) return null;
              console.log(
                "profile.id:", profile.id,
                "collaboration_members:", collaboration.collaboration_members
              );
              // Show chat for all members (including creator)
              const isMember = (collaboration.collaboration_members?.some(
                (member) => member.user_id === profile.id
              ) || collaboration.requester_id === profile.id);
              console.log("isMember:", isMember);
              return (
                <Card key={collaboration.id}>
                  <CardHeader>
                    <CardTitle>{collaboration.title}</CardTitle>
                    <CardDescription>by {collaboration.requester?.full_name}</CardDescription>
                  </CardHeader>
                  <CardDescription>{collaboration.description}</CardDescription>
                  {/* Show Contribute button if not a member and not creator */}
                  {profile.role === "student" &&
                    collaboration.status === "open" &&
                    collaboration.requester_id !== profile.id &&
                    !isMember && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await supabase.from('collaboration_members').insert([
                            { collaboration_id: collaboration.id, user_id: profile.id }
                          ]);
                          fetchCollaborations();
                        }}
                        className="w-full mt-2"
                      >
                        Contribute
                      </Button>
                    )}
                  {/* Show Collaborator or Mentor label and Chat button for all members */}
                  {isMember && (
                    <>
                      <span className="text-green-600 font-semibold block w-full text-center">
                        {profile.role === "faculty" ? "Mentor" : "Collaborator"}
                      </span>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={async () => {
                          // 1. Find or create the chat room for this collaboration
                          let { data: chatRoom } = await supabase
                            .from('chat_rooms')
                            .select('id')
                            .eq('reference_id', collaboration.id)
                            .eq('type', 'collaboration')
                            .single();
                          if (!chatRoom) {
                            const { data: newRoom, error: createRoomError } = await supabase
                              .from('chat_rooms')
                              .insert([
                                {
                                  name: collaboration.title,
                                  type: 'collaboration',
                                  reference_id: collaboration.id,
                                  created_by: profile.id,
                                }
                              ])
                              .select()
                              .single();
                            if (createRoomError || !newRoom) {
                              toast({
                                title: "Error",
                                description: createRoomError?.message || "Failed to create chat room.",
                                variant: "destructive",
                              });
                              return;
                            }
                            chatRoom = newRoom;
                          }
                          if (!chatRoom) return;
                          // Ensure user is a participant
                          const { data: participant } = await supabase
                            .from('chat_participants')
                            .select('id')
                            .eq('room_id', chatRoom.id)
                            .eq('user_id', profile.id)
                            .single();
                          if (!participant) {
                            const { error: addParticipantError } = await supabase
                              .from('chat_participants')
                              .insert([
                                { room_id: chatRoom.id, user_id: profile.id }
                              ]);
                            if (addParticipantError) {
                              toast({
                                title: "Error",
                                description: addParticipantError.message || "Failed to join chat room.",
                                variant: "destructive",
                              });
                              return;
                            }
                          }
                          // Redirect to chat room
                          if (chatRoom) router.push(`/chat/${chatRoom.id}`);
                        }}
                      >
                        Chat
                      </Button>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Campus Experience?</h2>
          <p className="text-xl mb-8 opacity-90">Let's create the CampusConnect community together—be among the first to connect, collaborate, and shape the future!</p>
          <Button onClick={handleGetStarted} size="lg" variant="secondary" className="text-lg px-8 py-3">
            Start Connecting Today
          </Button>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      <footer className="mt-16 py-8 bg-white border-t text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusConnect. All rights reserved.
      </footer>
    </div>
  )
}
