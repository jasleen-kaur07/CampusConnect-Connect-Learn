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
import { Calendar, MapPin, Users, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Event {
  id: string
  title: string
  description: string
  event_type: string
  created_by: string
  start_date: string
  end_date: string
  location: string | null
  max_participants: number | null
  current_participants: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  tags: string[] | null
  image_url: string | null
  created_at: string
  profiles: {
    full_name: string
    role: string
  }
}

export function EventsTab() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set())
  const { profile } = useAuth()
  const { toast } = useToast()

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "",
    start_date: "",
    end_date: "",
    location: "",
    max_participants: "",
    tags: "",
  })

  useEffect(() => {
    fetchEvents()
    if (profile?.role === "student") {
      fetchRegisteredEvents()
    }
  }, [profile])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles:created_by (
            full_name,
            role
          )
        `)
        .eq("status", "upcoming")
        .order("start_date", { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegisteredEvents = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase.from("event_registrations").select("event_id").eq("user_id", profile.id)

      if (error) throw error
      setRegisteredEvents(new Set(data?.map((r) => r.event_id) || []))
    } catch (error) {
      console.error("Error fetching registered events:", error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.event_type,
        created_by: profile.id,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        location: newEvent.location || null,
        max_participants: newEvent.max_participants ? Number.parseInt(newEvent.max_participants) : null,
        tags: newEvent.tags ? newEvent.tags.split(",").map((tag) => tag.trim()) : null,
      }

      // Insert the event and get the new event's ID
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) throw eventError;

      // Register the creator as a participant
      await supabase.from('event_registrations').insert([
        { event_id: event.id, user_id: profile.id }
      ]);

      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      })

      setShowCreateModal(false)
      setNewEvent({
        title: "",
        description: "",
        event_type: "",
        start_date: "",
        end_date: "",
        location: "",
        max_participants: "",
        tags: "",
      })
      fetchEvents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event.",
        variant: "destructive",
      })
    }
  }

  const handleRegisterForEvent = async (eventId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("event_registrations").insert([
        {
          event_id: eventId,
          user_id: profile.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Registered!",
        description: "You've been registered for the event.",
      })

      setRegisteredEvents((prev) => new Set([...prev, eventId]))
      fetchEvents() // Refresh to update participant count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register for event.",
        variant: "destructive",
      })
    }
  }

  const handleUnregisterFromEvent = async (eventId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", profile.id)

      if (error) throw error

      toast({
        title: "Unregistered",
        description: "You've been unregistered from the event.",
      })

      setRegisteredEvents((prev) => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
      fetchEvents() // Refresh to update participant count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unregister from event.",
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h2>
          <p className="text-gray-600 dark:text-gray-400">Discover and register for campus events</p>
        </div>
        {profile?.role === "faculty" && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select
                    value={newEvent.event_type}
                    onValueChange={(value) => setNewEvent((prev) => ({ ...prev, event_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date & Time</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, start_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date & Time</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, end_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Main Auditorium, Room 101"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants (Optional)</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={newEvent.max_participants}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, max_participants: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newEvent.tags}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., AI, Machine Learning, Workshop"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Event
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const isCompleted = new Date(event.start_date) < new Date();
          return (
            <Card
              key={event.id}
              className={isCompleted ? "border-green-600 bg-green-50" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>by {event.profiles.full_name}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant="outline">{event.event_type}</Badge>
                    {isCompleted ? (
                      <Badge variant="secondary" className="text-green-700 border-green-600 bg-green-100 font-bold text-base">Completed</Badge>
                    ) : (
                      <Badge variant="default">{event.status}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{event.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.start_date).toLocaleDateString()} at{" "}
                    {new Date(event.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {event.location && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    {event.current_participants} participants
                    {event.max_participants && ` / ${event.max_participants}`}
                  </div>
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {profile?.role === "student" && (
                  <div className="pt-2">
                    {registeredEvents.has(event.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnregisterFromEvent(event.id)}
                        className="w-full"
                      >
                        Unregister
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRegisterForEvent(event.id)}
                        className="w-full"
                        disabled={event.max_participants ? event.current_participants >= event.max_participants : false}
                      >
                        {event.max_participants && event.current_participants >= event.max_participants
                          ? "Full"
                          : "Register"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {profile?.role === "faculty"
              ? "Create your first event to get started!"
              : "Check back later for new events."}
          </p>
        </div>
      )}
    </div>
  )
}
