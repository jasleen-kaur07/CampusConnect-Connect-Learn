"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, MapPin, Calendar, Link, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function ProfileTab() {
  const { profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    department: profile?.department || "",
    year_of_study: profile?.year_of_study?.toString() || "",
    bio: profile?.bio || "",
    skills: profile?.skills?.join(", ") || "",
    portfolio_url: profile?.portfolio_url || "",
  })

  const handleSave = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const updates = {
        full_name: formData.full_name,
        department: formData.department || null,
        year_of_study:
          profile.role === "student" && formData.year_of_study ? Number.parseInt(formData.year_of_study) : null,
        bio: formData.bio || null,
        skills: formData.skills
          ? formData.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : null,
        portfolio_url: formData.portfolio_url || null,
      }

      await updateProfile(updates)

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      })

      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || "",
      department: profile?.department || "",
      year_of_study: profile?.year_of_study?.toString() || "",
      bio: profile?.bio || "",
      skills: profile?.skills?.join(", ") || "",
      portfolio_url: profile?.portfolio_url || "",
    })
    setIsEditing(false)
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your profile information and showcase your skills</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={profile.profile_image_url || ""} />
              <AvatarFallback className="text-2xl">
                {profile.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{profile.full_name}</CardTitle>
            <CardDescription>
              <Badge variant={profile.role === "faculty" ? "default" : "secondary"}>
                {profile.role === "faculty" ? "Faculty" : "Student"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4 mr-2" />
              {profile.email}
            </div>

            {profile.department && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                {profile.department}
              </div>
            )}

            {profile.role === "student" && profile.year_of_study && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                Year {profile.year_of_study}
              </div>
            )}

            {profile.portfolio_url && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Link className="w-4 h-4 mr-2" />
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Portfolio
                </a>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>{isEditing ? "Update your profile information" : "Your profile details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                {profile.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="year_of_study">Year of Study</Label>
                    <Select
                      value={formData.year_of_study}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, year_of_study: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Tell others about yourself, your interests, and goals..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills & Interests</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
                    placeholder="e.g., JavaScript, Machine Learning, Data Science"
                  />
                  <p className="text-xs text-gray-500">Separate skills with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, portfolio_url: e.target.value }))}
                    placeholder="https://your-portfolio.com"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {profile.bio && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">About</h3>
                    <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Skills & Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!profile.bio && (!profile.skills || profile.skills.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Complete your profile to help others connect with you</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsEditing(true)}>
                      Add Information
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
