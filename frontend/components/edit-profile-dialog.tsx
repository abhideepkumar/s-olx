'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PencilIcon, Upload } from 'lucide-react'

interface User {
  name: string
  usn: string
  email: string
  branch: string
  clg_name: string
  profile_url: string
}

interface EditProfileDialogProps {
  user: User
}

export function EditProfileDialog({ user }: EditProfileDialogProps) {
  const [editedUser, setEditedUser] = useState(user)
  const [newAvatar, setNewAvatar] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUser({ ...editedUser, [e.target.id]: e.target.value })
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAvatar(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Implement profile update logic
    console.log('Profile updated', editedUser, newAvatar)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarImage src={editedUser.profile_url} alt={editedUser.name} />
              <AvatarFallback>{editedUser.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <Label htmlFor="avatar">Change Avatar</Label>
            <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <Button type="button" variant="outline" onClick={() => document.getElementById('avatar')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Avatar
            </Button>
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={editedUser.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="usn">USN</Label>
            <Input id="usn" value={editedUser.usn} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={editedUser.email} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" value={editedUser.branch} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="clg_name">College Name</Label>
            <Input id="clg_name" value={editedUser.clg_name} onChange={handleChange} required />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

