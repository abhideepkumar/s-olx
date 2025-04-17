'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreVertical } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditPostDialog } from '@/components/edit-post-dialog'
import axios from 'axios'

// Types
interface User {
  name: string
  clg_name: string
  profile_url: string
}

interface Post {
  id: string
  content: string
  user: User
  name?: string
}

interface PostsResponse {
  data: Post[]
}

// Constants
const API_BASE_URL = process.env.BACKEND_URL
const API_ENDPOINTS = {
  POST_FEED: `${API_BASE_URL}/api/v1/post/post-feed`,
  CREATE_POST: `${API_BASE_URL}/api/v1/post/create`,
}

// Custom hooks
const useUser = () => {
  if (typeof window === 'undefined') {
    return { name: '', college: '', avatar: '' }
  }

  return {
    name: localStorage.getItem('name') || '',
    college: localStorage.getItem('clg_name') || '',
    avatar: localStorage.getItem('profile_url') || '',
  }
}

// Components
const PostForm = ({ user }: { user: ReturnType<typeof useUser> }) => {
  const [newPost, setNewPost] = useState('')

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) {
      toast.error('Post content cannot be empty.')
      return
    }

    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_POST, {
        content: newPost,
        user: localStorage.getItem('token'),
      })
      toast.success(response.data.message)
      mutate(API_ENDPOINTS.POST_FEED)
      setNewPost('')
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post.')
    }
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
      <form onSubmit={handlePostSubmit}>
        <CardContent>
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="rounded-full">
            Post
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

const PostCard = ({ post, currentUserName }: { post: Post; currentUserName: string }) => (
  <Card key={post.id}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage
              src={post?.user?.profile_url || '/placeholder.svg'}
              alt={post?.user?.name || 'User'}
            />
            <AvatarFallback>{post?.user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post?.user?.name || 'Deleted User'}</p>
            <p className="text-sm text-gray-500">{post?.user?.clg_name}</p>
          </div>
        </div>
        <PostActions post={post} currentUserName={currentUserName} />
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600">{post.content}</p>
    </CardContent>
  </Card>
)

const PostActions = ({ post, currentUserName }: { post: Post; currentUserName: string }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Report</DropdownMenuItem>
      {post.name === currentUserName && (
        <>
          <EditPostDialog post={post} />
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
)

// Main component
export default function CommunityPage() {
  const user = useUser()
  const { data: posts, error, isLoading } = useSWR<PostsResponse>(
    API_ENDPOINTS.POST_FEED,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      return response.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>
  }

  if (error) {
    console.error('Error fetching posts:', error)
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load posts. Please try again later.
      </div>
    )
  }

  if (!posts?.data?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No posts available at the moment.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Community</h1>
      {user.name && <PostForm user={user} />}
      <div className="space-y-6">
        {posts.data.map((post) => (
          <PostCard key={post.id} post={post} currentUserName={user.name} />
        ))}
      </div>
    </div>
  )
}