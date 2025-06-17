"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, BookOpen, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface StudyGroup {
  id: string
  name: string
  description: string
  subject: string
  created_by: string
  max_members: number
  current_members: number
  meeting_schedule: string | null
  is_active: boolean
  tags: string[] | null
  created_at: string
  profiles: {
    full_name: string
    role: string
  }
}

export function StudyGroupsTab() {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set())
  const { profile } = useAuth()
  const { toast } = useToast()

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    subject: "",
    max_members: "10",
    meeting_schedule: "",
    tags: "",
  })

  useEffect(() => {
    fetchStudyGroups()
    if (profile) {
      fetchJoinedGroups()
    }
  }, [profile])

  const fetchStudyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("study_groups")
        .select(`
          *,
          profiles:created_by (
            full_name,
            role
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStudyGroups(data || [])
    } catch (error) {
      console.error("Error fetching study groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJoinedGroups = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase.from("study_group_members").select("group_id").eq("user_id", profile.id)

      if (error) throw error
      setJoinedGroups(new Set(data?.map((m) => m.group_id) || []))
    } catch (error) {
      console.error("Error fetching joined groups:", error)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const groupData = {
        name: newGroup.name,
        description: newGroup.description,
        subject: newGroup.subject,
        created_by: profile.id,
        max_members: Number.parseInt(newGroup.max_members),
        meeting_schedule: newGroup.meeting_schedule || null,
        tags: newGroup.tags ? newGroup.tags.split(",").map((tag) => tag.trim()) : null,
      }

      const { data, error } = await supabase.from("study_groups").insert([groupData]).select().single()

      if (error) throw error

      // Add creator as member
      await supabase.from("study_group_members").insert([
        {
          group_id: data.id,
          user_id: profile.id,
          is_admin: true,
        },
      ])

      toast({
        title: "Study group created!",
        description: "Your study group has been created successfully.",
      })

      setShowCreateModal(false)
      setNewGroup({
        name: "",
        description: "",
        subject: "",
        max_members: "10",
        meeting_schedule: "",
        tags: "",
      })
      fetchStudyGroups()
      fetchJoinedGroups()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create study group.",
        variant: "destructive",
      })
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("study_group_members").insert([
        {
          group_id: groupId,
          user_id: profile.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Joined group!",
        description: "You've successfully joined the study group.",
      })

      setJoinedGroups((prev) => new Set([...prev, groupId]))
      fetchStudyGroups() // Refresh to update member count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join study group.",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("study_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", profile.id)

      if (error) throw error

      toast({
        title: "Left group",
        description: "You've left the study group.",
      })

      setJoinedGroups((prev) => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
      fetchStudyGroups() // Refresh to update member count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave study group.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Study Groups</h2>
          <p className="text-gray-600 dark:text-gray-400">Join or create study groups to collaborate with peers</p>
        </div>
        {profile?.role === "student" && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Study Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newGroup.subject}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Data Structures, Calculus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_members">Max Members</Label>
                  <Input
                    id="max_members"
                    type="number"
                    value={newGroup.max_members}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, max_members: e.target.value }))}
                    min="2"
                    max="50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_schedule">Meeting Schedule (Optional)</Label>
                  <Input
                    id="meeting_schedule"
                    value={newGroup.meeting_schedule}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, meeting_schedule: e.target.value }))}
                    placeholder="e.g., Tuesdays 3-5 PM, Library Room 201"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newGroup.tags}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., algorithms, exam prep, project"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Study Group
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studyGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription>by {group.profiles.full_name}</CardDescription>
                </div>
                <Badge variant="outline">{group.subject}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{group.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  {group.current_members} / {group.max_members} members
                </div>
                {group.meeting_schedule && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    {group.meeting_schedule}
                  </div>
                )}
              </div>

              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="pt-2">
                {joinedGroups.has(group.id) ? (
                  <Button variant="outline" size="sm" onClick={() => handleLeaveGroup(group.id)} className="w-full">
                    Leave Group
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleJoinGroup(group.id)}
                    className="w-full"
                    disabled={group.current_members >= group.max_members}
                  >
                    {group.current_members >= group.max_members ? "Full" : "Join Group"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {studyGroups.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No study groups available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {profile?.role === "student"
              ? "Create your first study group to get started!"
              : "Students can create study groups to collaborate."}
          </p>
        </div>
      )}
    </div>
  )
}
