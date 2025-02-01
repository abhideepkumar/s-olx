"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    usn: "",
    email: "",
    password: "",
    branch: "",
    clg_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/register`, formData);
      if (response.status === 201) {
        console.log(response.data);
        toast.success(response.data.message);
        router.push("/login");
      } else {
        console.log(response.data);
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error?.response.data.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold mb-6">Register for S-OLX</h1>

        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="usn">USN</Label>
          <Input id="usn" name="usn" value={formData.usn} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="email">College Email</Label>
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

        <div>
          <Label htmlFor="branch">Branch</Label>
          <Select name="branch" onValueChange={(value) => setFormData({ ...formData, branch: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cs">Computer Science</SelectItem>
              <SelectItem value="ee">Electrical Engineering</SelectItem>
              <SelectItem value="me">Mechanical Engineering</SelectItem>
              {/* Add more branches as needed */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="clg_name">College Name</Label>
          <Input id="clg_name" name="clg_name" value={formData.clg_name} onChange={handleChange} required />
        </div>

        <Button type="submit" className="w-full">
          Register
        </Button>
      </form>
    </div>
  );
}
