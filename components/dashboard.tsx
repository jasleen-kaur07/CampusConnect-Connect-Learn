"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MessageCircle, Settings, LogOut, Bell, Search, UserPlus } from "lucide-react"
import Link from "next/link"
import { EventsTab } from "@/components/events-tab"
import { StudyGroupsTab } from "@/components/study-groups-tab"
import { CollaborationTab } from "@/components/collaboration-tab"
import { ProfileTab } from "@/components/profile-tab"
import { useRouter } from "next/navigation"

export function Dashboard() {
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("events")
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()

  const interests = [
    "Python",
    "JavaScript",
    "React",
    "Next.js",
    "AI",
    "Machine Learning",
    "Data Science",
    "Web Development",
    "Cloud",
    "UI/UX"
  ]

  const handleEnableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setShowNotifications(true)
        new Notification("Notifications are enabled!")
      } else {
        alert("Notifications denied or dismissed.")
      }
    } else {
      alert("This browser does not support notifications.")
    }
  }

  console.log("Current active tab:", activeTab)

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">CampusConnect</span>
              </div>
              <span className="ml-2 px-2 py-1 rounded bg-gray-200 text-xs font-semibold">
                {profile.role === "faculty" ? "Faculty" : "Student"}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connections Button */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/connections">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Connections
                </Link>
              </Button>
              {/* Chat Button */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/chat">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Link>
              </Button>
              {/* Search Icon */}
              <Button variant="ghost" size="sm" onClick={() => setShowSearch(true)}>
                <Search className="w-4 h-4" />
              </Button>
              {/* Notification Icon */}
              <Button variant="ghost" size="sm" onClick={handleEnableNotifications}>
                <Bell className="w-4 h-4" />
              </Button>
              {/* Avatar */}
              <Avatar className="w-8 h-8 cursor-pointer" onClick={() => router.push("/profile") }>
                <AvatarImage src={profile.profile_image_url || ""} />
                <AvatarFallback>
                  {profile.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Log Out */}
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Search Interests</h2>
                <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-gray-900">✕</button>
              </div>
              <input
                type="text"
                placeholder="Search interests..."
                className="border p-2 rounded w-full mb-4"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
              <ul className="max-h-40 overflow-y-auto">
                {interests
                  .filter(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(interest => (
                    <li key={interest} className="py-1 px-2 hover:bg-gray-100 rounded cursor-pointer">
                      {interest}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {profile.full_name}!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {profile.department && `${profile.department} • `}
            {profile.role === "student" && profile.year_of_study && `Year ${profile.year_of_study}`}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </TabsTrigger>
            <TabsTrigger value="study-groups" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Study Groups</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Collaboration</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventsTab />
          </TabsContent>

          <TabsContent value="study-groups">
            <StudyGroupsTab />
          </TabsContent>

          <TabsContent value="collaboration">
            <CollaborationTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
