import axios from "axios";
import { User, CreateUserRequest, UserStats } from "./types";
import { isAxiosError } from "axios";

// API Gateway endpoint from CDK deployment
const API_URL = "https://vszofutd55.execute-api.us-east-2.amazonaws.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const userApi = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/users");
      // Handle both plain array and wrapped object with users array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Create a new user
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    try {
      const response = await api.post("/users", userData);
      // Handle direct user object response
      if (response.data && response.data.id) {
        return response.data;
      }
      if (response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Bulk create random users
  bulkCreateUsers: async (count: number = 5): Promise<User[]> => {
    try {
      const response = await api.post("/users/bulk", { count });
      if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      return [];
    } catch (error) {
      console.error("Error bulk creating users:", error);
      throw error;
    }
  },

  // Search users by name or email
  searchUsers: async (query: string): Promise<User[]> => {
    try {
      const response = await api.get(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      return [];
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    try {
      const response = await api.get("/users/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },

  // Export all users as JSON
  exportUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/users/export");
      return response.data;
    } catch (error) {
      console.error("Error exporting users:", error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      // If the response is a plain object, just return it
      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        return response.data;
      }
      // If the response is wrapped (rare in your case), handle that too
      if (response.data && response.data.data) {
        return response.data.data;
      }
      throw new Error("User not found");
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error fetching user:", error, id, error.response?.data);
      } else {
        console.error("Error fetching user:", error, id);
      }
      throw error;
    }
  },

  // Update user
  updateUser: async (
    id: string,
    userData: Partial<CreateUserRequest>
  ): Promise<User> => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      // Handle direct response
      if (response.data && response.data.id) {
        return response.data;
      }
      if (response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
