'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThumbsUp, ThumbsDown, MessageSquare, MoreVertical } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { EditPostDialog } from '@/components/edit-post-dialog'

export default function CommunityPage() {
  const [posts, setPosts] = useState([
    { 
      id: 1, 
      author: 'Alice Johnson', 
      college: 'Tech University',
      avatar: '/placeholder.svg',
      content: `Has anyone used the new CS textbook? I'm considering buying it for next semester.`, 
      upvotes: 5, 
      downvotes: 1, 
      comments: 2 
    },
    // Add more sample posts...
  ])

  const [newPost, setNewPost] = useState('')
  const currentUser = { name: 'John Doe', college: 'Your College', avatar: '/placeholder.svg' }

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPost.trim()) {
      setPosts([
        { 
          id: posts.length + 1, 
          author: currentUser.name, 
          college: currentUser.college,
          avatar: currentUser.avatar,
          content: newPost, 
          upvotes: 0, 
          downvotes: 0, 
          comments: 0 
        },
        ...posts,
      ])
      setNewPost('')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Community</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm text-gray-500">{currentUser.college}</p>
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
            <Button type="submit" className="rounded-full">Post</Button>
          </CardFooter>
        </form>
      </Card>
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={post.avatar} alt={post.author} />
                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.author}</p>
                    <p className="text-sm text-gray-500">{post.college}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Report</DropdownMenuItem>
                    {post.author === currentUser.name && (
                      <>
                        <EditPostDialog post={post} />
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{post.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="rounded-full">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {post.upvotes}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  {post.downvotes}
                </Button>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                {post.comments} Comments
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

