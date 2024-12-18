"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, MessageSquare, MoreVertical } from "lucide-react";
import useSWR, { mutate } from "swr";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditPostDialog } from "@/components/edit-post-dialog";
import axios from "axios";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CommunityPage() {
  const [newPost, setNewPost] = useState("");
  const name = typeof window !== "undefined" ? localStorage.getItem("name") : "";
  const college = typeof window !== "undefined" ? localStorage.getItem("clg_name") : "";
  const avatar = typeof window !== "undefined" ? localStorage.getItem("profile_url") : "";

  const {
    data: posts,
    error,
    isLoading,
  } = useSWR(`http://localhost:8000/api/v1/post/post-feed`, fetcher, {
    revalidateOnFocus: false, // Prevents refetching when the tab is refocused.
    revalidateOnReconnect: false, // Prevents refetching on reconnect.
  });
  console.log("Posts:", posts?.data[0]?.user);

  // Loading state
  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  // Error state
  if (error) {
    console.error("Error fetching posts:", error);
    return <div className="text-center py-8 text-red-500">Failed to load posts. Please try again later.</div>;
  }

  // No posts
  if (!posts || posts.data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No posts available at the moment.</div>;
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8000/api/v1/post/create`, {
        content: newPost,
        user: localStorage.getItem("token"),
      });
      toast.success(response.data.message);
      mutate(`http://localhost:8000/api/v1/post/post-feed`); // Revalidate the SWR cache.
      setNewPost(""); // Clear input.
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create post.");
    }
  };

  // const handleUpvote = useCallback(
  //   async (postId) => {
  //     try {
  //       const response = await axios.post(`http://localhost:8000/api/v1/post/upvote`, { postId });
  //       toast.success(response.data.message);
  //       mutate(`http://localhost:8000/api/v1/post/post-feed`, {
  //         optimisticData: {
  //           ...posts,
  //           data: posts.data.map((post) => (post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post)),
  //         },
  //         rollbackOnError: true,
  //       });
  //     } catch (error) {
  //       console.error(error);
  //       toast.error("Failed to upvote.");
  //     }
  //   },
  //   [posts]
  // );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Community</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-gray-500">{college}</p>
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
      <div className="space-y-6">
        {posts.data.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={post?.user?.profile_url || "/placeholder.svg"} alt={post?.user?.profile_url} />
                    <AvatarFallback>{post?.user?.profile_url}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post?.user?.name || "Deleted User"}</p>
                    <p className="text-sm text-gray-500">{post?.user?.clg_name}</p>
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
                    {post.name === name && (
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
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => console.log("Upvote")}>
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
  );
}
