"use client";

import { useState } from "react";
import { faker } from "@faker-js/faker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUsers } from "@/hooks/useUsers";
import { useUserContext } from "./UserCRUD";
import { CreateUserRequest } from "@/lib/types";
import { userApi } from "@/lib/api";
import { Users } from "lucide-react";

export function UserForm() {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: "",
    email: "",
  });
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { createUser, createUserStatus } = useUsers();
  const { refreshUsers } = useUserContext();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateRandomUser = () => {
    const randomName = faker.person.fullName();
    const randomEmail = faker.internet.email({
      firstName: randomName.split(" ")[0],
      lastName: randomName.split(" ")[1],
    });

    setFormData({
      name: randomName,
      email: randomEmail,
    });
  };

  const handleBulkCreate = async () => {
    try {
      setBulkLoading(true);
      await userApi.bulkCreateUsers(bulkCount);
      refreshUsers();
    } catch (error) {
      console.error("Bulk create error:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setFormData({ name: "", email: "" });
      refreshUsers();
    } catch (err) {
      console.error(err);
      // error handled by React Query
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter user name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter user email"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomUser}
                className="flex-1"
              >
                Generate Random User
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createUserStatus === "pending"}
              >
                {createUserStatus === "pending" ? "Creating..." : "Create User"}
              </Button>
            </div>

            {createUserStatus === "error" && (
              <div className="text-red-500 text-sm">
                Failed to create user. Please try again.
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Create Users
          </CardTitle>
          <CardDescription>
            Generate multiple random users at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkCount">Number of Users (1-25)</Label>
              <Input
                id="bulkCount"
                type="number"
                min="1"
                max="25"
                value={bulkCount}
                onChange={(e) =>
                  setBulkCount(
                    Math.min(25, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
              />
            </div>
            <Button
              onClick={handleBulkCreate}
              disabled={bulkLoading}
              className="w-full"
              variant="secondary"
            >
              {bulkLoading
                ? `Creating ${bulkCount} users...`
                : `Create ${bulkCount} Random Users`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
