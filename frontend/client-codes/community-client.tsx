'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { Post } from '@/app/community/page'
import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { useFormState } from 'react-dom'

// Custom hooks
const useUser = () => {
  const [userData, setUserData] = useState({
    name: '',
    college: '',
    avatar: '',
    token: ''
  })

  useEffect(() => {
    // Only run on client side
    setUserData({
      name: localStorage.getItem('name') || '',
      college: localStorage.getItem('clg_name') || '',
      avatar: localStorage.getItem('profile_url') || '',
      token: localStorage.getItem('token') || ''
    })
  }, [])

  return userData
}

// Submit button with loading state
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="rounded-full" disabled={pending}>
      {pending ? 'Posting...' : 'Post'}
    </Button>
  )
}

// Post form component for creating new posts
const PostForm = ({ 
  user, 
  createPostAction 
}: { 
  user: ReturnType<typeof useUser>, 
  createPostAction: (formData: FormData) => Promise<{ success: boolean, message: string }>
}) => {
  const [content, setContent] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState(createPostAction, { success: false, message: '' })
  
  // Handle form state updates
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        setContent('') // Clear the textarea on success
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  // Custom action that includes the form data
  const handleSubmit = (formData: FormData) => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty.')
      return
    }
    
    // Add token to the form data
    formData.append('token', user.token)
    return createPostAction(formData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.avatar || '/placeholder.svg'} alt={user.name} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-500">{user.college}</p>
          </div>
        </div>
      </CardHeader>
      <form ref={formRef} action={handleSubmit}>
        <CardContent>
          <Textarea
            name="content"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  )
}

// Simple post card component
const PostCard = ({ post }: { post: Post }) => (
  <Card key={post.id}>
    <CardHeader>
      <div className="flex items-center">
        <Avatar>
          <AvatarImage
            src={post?.user?.profile_url || '/placeholder.svg'}
            alt={post?.user?.name || 'User'}
          />
          <AvatarFallback>{post?.user?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="font-semibold">{post?.user?.name || 'Deleted User'}</p>
          <p className="text-xs text-gray-500">{post?.user?.clg_name}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600">{post.content}</p>
    </CardContent>
  </Card>
)

// Client component
export default function CommunityClient({ 
  posts, 
  createPostAction 
}: { 
  posts: Post[], 
  createPostAction: (formData: FormData) => Promise<{ success: boolean, message: string }>
}) {
  const user = useUser()

  return (
    <div className="space-y-6">
      {user.name && <PostForm user={user} createPostAction={createPostAction} />}
      <div className="space-y-6">
        {posts.map((post,index) => (
          <PostCard key={index} post={post} />
        ))}
      </div>
    </div>
  )
}