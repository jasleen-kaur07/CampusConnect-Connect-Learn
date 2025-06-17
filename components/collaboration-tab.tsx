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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lightbulb, Plus, User, Clock, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Collaboration {
  id: string
  title: string
  description: string
  type: string
  requester_id: string
  mentor_id: string | null
  status: "open" | "in_progress" | "completed"
  skills_required: string[] | null
  duration_weeks: number | null
  created_at: string
  requester: {
    full_name: string
    role: string
  }
  mentor?: {
    full_name: string
    role: string
  }
}

export function CollaborationTab() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "open" | "my_requests" | "mentoring">("all")
  const { profile } = useAuth()
  const { toast } = useToast()

  const [newCollaboration, setNewCollaboration] = useState({
    title: "",
    description: "",
    type: "",
    skills_required: "",
    duration_weeks: "",
  })

  useEffect(() => {
    fetchCollaborations()
  }, [profile, filter])

  const fetchCollaborations = async () => {
    if (!profile) return

    try {
      let query = supabase.from("collaborations").select(`
          *,
          requester:requester_id (
            full_name,
            role
          ),
          mentor:mentor_id (
            full_name,
            role
          )
        `)

      // Apply filters
      switch (filter) {
        case "open":
          query = query.eq("status", "open")
          break
        case "my_requests":
          query = query.eq("requester_id", profile.id)
          break
        case "mentoring":
          query = query.eq("mentor_id", profile.id)
          break
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setCollaborations(data || [])
    } catch (error) {
      console.error("Error fetching collaborations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCollaboration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const collaborationData = {
        title: newCollaboration.title,
        description: newCollaboration.description,
        type: newCollaboration.type,
        requester_id: profile.id,
        skills_required: newCollaboration.skills_required
          ? newCollaboration.skills_required.split(",").map((skill) => skill.trim())
          : null,
        duration_weeks: newCollaboration.duration_weeks ? Number.parseInt(newCollaboration.duration_weeks) : null,
      }

      const { error } = await supabase.from("collaborations").insert([collaborationData])

      if (error) throw error

      toast({
        title: "Collaboration request created!",
        description: "Your request has been posted successfully.",
      })

      setShowCreateModal(false)
      setNewCollaboration({
        title: "",
        description: "",
        type: "",
        skills_required: "",
        duration_weeks: "",
      })
      fetchCollaborations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create collaboration request.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptCollaboration = async (collaborationId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("collaborations")
        .update({
          mentor_id: profile.id,
          status: "in_progress",
        })
        .eq("id", collaborationId)

      if (error) throw error

      toast({
        title: "Collaboration accepted!",
        description: "You're now mentoring this collaboration.",
      })

      fetchCollaborations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept collaboration.",
        variant: "destructive",
      })
    }
  }

  const handleCompleteCollaboration = async (collaborationId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("collaborations").update({ status: "completed" }).eq("id", collaborationId)

      if (error) throw error

      toast({
        title: "Collaboration completed!",
        description: "The collaboration has been marked as completed.",
      })

      fetchCollaborations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete collaboration.",
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collaboration & Mentorship</h2>
          <p className="text-gray-600 dark:text-gray-400">Connect with mentors and collaborate on projects</p>
        </div>
        {profile?.role === "student" && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Collaboration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Collaboration Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCollaboration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newCollaboration.title}
                    onChange={(e) => setNewCollaboration((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newCollaboration.type}
                    onValueChange={(value) => setNewCollaboration((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collaboration type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentorship">Mentorship</SelectItem>
                      <SelectItem value="project">Project Collaboration</SelectItem>
                      <SelectItem value="research">Research Assistance</SelectItem>
                      <SelectItem value="career_guidance">Career Guidance</SelectItem>
                      <SelectItem value="skill_development">Skill Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCollaboration.description}
                    onChange={(e) => setNewCollaboration((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe what you're looking for help with..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills_required">Skills/Areas (comma-separated)</Label>
                  <Input
                    id="skills_required"
                    value={newCollaboration.skills_required}
                    onChange={(e) => setNewCollaboration((prev) => ({ ...prev, skills_required: e.target.value }))}
                    placeholder="e.g., Machine Learning, Web Development, Research"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_weeks">Expected Duration (weeks)</Label>
                  <Input
                    id="duration_weeks"
                    type="number"
                    value={newCollaboration.duration_weeks}
                    onChange={(e) => setNewCollaboration((prev) => ({ ...prev, duration_weeks: e.target.value }))}
                    placeholder="e.g., 4"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All
        </Button>
        <Button variant={filter === "open" ? "default" : "outline"} size="sm" onClick={() => setFilter("open")}>
          Open Requests
        </Button>
        {profile?.role === "student" && (
          <Button
            variant={filter === "my_requests" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("my_requests")}
          >
            My Requests
          </Button>
        )}
        {profile?.role === "faculty" && (
          <Button
            variant={filter === "mentoring" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("mentoring")}
          >
            Mentoring
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborations.map((collaboration) => (
          <Card key={collaboration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{collaboration.title}</CardTitle>
                  <CardDescription>by {collaboration.requester.full_name}</CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge variant="outline">{collaboration.type.replace("_", " ")}</Badge>
                  <Badge
                    variant={
                      collaboration.status === "open"
                        ? "default"
                        : collaboration.status === "in_progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {collaboration.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{collaboration.description}</p>

              <div className="space-y-2 text-sm">
                {collaboration.mentor && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4 mr-2" />
                    Mentor: {collaboration.mentor.full_name}
                  </div>
                )}
                {collaboration.duration_weeks && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    {collaboration.duration_weeks} weeks
                  </div>
                )}
              </div>

              {collaboration.skills_required && collaboration.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {collaboration.skills_required.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="pt-2 space-y-2">
                {/* Faculty can accept open collaborations */}
                {profile?.role === "faculty" &&
                  collaboration.status === "open" &&
                  collaboration.requester_id !== profile.id && (
                    <Button size="sm" onClick={() => handleAcceptCollaboration(collaboration.id)} className="w-full">
                      Accept & Mentor
                    </Button>
                  )}

                {/* Mentor or requester can complete in-progress collaborations */}
                {collaboration.status === "in_progress" &&
                  (collaboration.mentor_id === profile?.id || collaboration.requester_id === profile?.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCompleteCollaboration(collaboration.id)}
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}

                {collaboration.status === "completed" && (
                  <div className="text-center text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Completed
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {collaborations.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No collaborations found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "open"
              ? "No open collaboration requests at the moment."
              : filter === "my_requests"
                ? "You haven't created any collaboration requests yet."
                : filter === "mentoring"
                  ? "You're not currently mentoring any collaborations."
                  : "No collaboration requests available."}
          </p>
        </div>
      )}
    </div>
  )
}
