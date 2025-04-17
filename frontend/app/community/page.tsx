// page.tsx - The main server component
import { Suspense } from 'react'
import CommunityClient from '@/client-codes/community-client'
import { revalidatePath } from 'next/cache'

// Define types
export interface User {
  name: string
  clg_name: string
  profile_url: string
}

export interface Post {
  id: string
  content: string
  user: User
  name?: string
}

export interface PostsResponse {
  data: Post[]
}

// API constants
export const API_BASE_URL = process.env.BACKEND_URL
export const API_ENDPOINTS = {
  POST_FEED: `${API_BASE_URL}/api/v1/post/post-feed`,
  CREATE_POST: `${API_BASE_URL}/api/v1/post/create`,
}

// Server action to create a post
export async function createPost(formData: FormData) {
  'use server'
  
  const content = formData.get('content') as string
  const token = formData.get('token') as string
  
  if (!content?.trim()) {
    return { success: false, message: 'Post content cannot be empty' }
  }
  
  try {
    const response = await fetch(API_ENDPOINTS.CREATE_POST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, user: token }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, message: result.message || 'Failed to create post' }
    }
    
    // Revalidate the page to refresh the posts
    revalidatePath('/community')
    return { success: true, message: result.message || 'Post created successfully' }
  } catch (error) {
    console.error('Error creating post:', error)
    return { success: false, message: 'An error occurred while creating the post' }
  }
}

// Server component to fetch posts
async function getPosts(): Promise<PostsResponse | null> {
  try {
    const response = await fetch(API_ENDPOINTS.POST_FEED, {
      cache: 'no-store' // Get fresh data on each request
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching posts:', error)
    return null
  }
}

// Main component (server)
export default async function CommunityPage() {
  const posts = await getPosts()

  // Handle error and empty states
  if (!posts) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center">Community</h1>
        <div className="text-center py-8 text-red-500">
          Failed to load posts. Please try again later.
        </div>
      </div>
    )
  }

  if (!posts.data || posts.data.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center">Community</h1>
        <div className="text-center py-8 text-gray-500">
          No posts available at the moment.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Community</h1>
      <Suspense fallback={<div className="text-center py-8">Loading community...</div>}>
        <CommunityClient 
          posts={posts.data} 
          createPostAction={createPost}
        />
      </Suspense>
    </div>
  )
}