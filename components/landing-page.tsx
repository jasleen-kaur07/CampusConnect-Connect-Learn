"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MessageCircle, BookOpen, Lightbulb, Award } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Chat } from "@/components/chat"

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [collaborations, setCollaborations] = useState([])
  const [collaborationError, setCollaborationError] = useState(null)
  const router = useRouter()

  const handleGetStarted = () => {
    setAuthMode("signup")
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode("signin")
    setShowAuthModal(true)
  }

  const isCreator = collaboration.requester_id === profile.id;
  const isMember = collaboration.collaboration_members?.some(
    (member) => member.user_id === profile.id
  );

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
            full_name,
            role
          ),
          mentor:mentor_id (
            full_name,
            role
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
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusConnect</span>
          </div>
          <Button onClick={handleSignIn} variant="outline">
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Connect, Collaborate, <span className="text-blue-600">Learn</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Bridge the gap between students and faculty with CampusConnect. Join study groups, find mentors, attend
          events, and collaborate on projects that matter.
        </p>
        <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-3">
          Get Started
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Calendar className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>Events & Workshops</CardTitle>
              <CardDescription>Discover and register for academic events, workshops, and competitions</CardDescription>
            </CardHeader>
          </Card>

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

          {profile?.role === "student" &&
            collaboration.status === "open" &&
            collaboration.requester_id !== profile.id &&
            !(collaboration.collaboration_members || []).some(m => m.user_id === profile.id) && (
              <Button
                size="sm"
                onClick={async () => {
                  await supabase.from('collaboration_members').insert([
                    { collaboration_id: collaboration.id, user_id: profile.id }
                  ]);
                  fetchCollaborations();
                }}
                className="w-full"
              >
                Contribute
              </Button>
            )
          }
          {profile && (collaboration.collaboration_members || []).some(m => m.user_id === profile.id) && (
            <>
              <span className="text-green-600 font-semibold block w-full text-center">You're a contributor</span>
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  console.log("Test button clicked!");
                  alert("Test button clicked!");
                  router.push("/chat/test");
                }}
              >
                Test Open Chat
              </Button>
            </>
          )}
        </div>
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

      <Button onClick={() => alert("Test button works!")}>Test Button</Button>
    </div>
  )
}
