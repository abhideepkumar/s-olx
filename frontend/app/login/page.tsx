"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/login`, formData);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.data.data.user._id);
        localStorage.setItem("email", response.data.data.user.email);
        localStorage.setItem("name", response.data.data.user.name);
        localStorage.setItem("profile_url", response.data.data.user.profile_url);
        localStorage.setItem("clg_name", response.data.data.user.clg_name);
        localStorage.setItem("usn", response.data.data.user.usn);
        localStorage.setItem("branch", response.data.data.user.branch);
        localStorage.setItem("phone", response.data.data.user.phone);
        localStorage.setItem("accessToken", response.data.data.accessToken)
        localStorage.setItem("refreshToken", response.data.data.refreshToken)
      }
      toast.success(response.data.message);
      window.location.href = "/";
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  // TODO: Implement Google OAuth login
  // const handleGoogleLogin = () => {
  //   console.log("Google login clicked");
  //   toast.error("Google login is not implemented yet");
  // };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold mb-6">Log in to S-OLX</h1>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <Link href="/register" className="text-muted-foreground text-sm hover:text-primary transition-colors">Don&rsquo;t have an account? Register</Link>
        <Button type="submit" className="w-full">
          Log in
        </Button>
        {/* to add */}
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div> */}

        {/* <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="mr-2 h-4 w-4" />
          Google
        </Button> */}
      </form>
    </div>
  );
}
