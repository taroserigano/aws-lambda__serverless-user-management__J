// Import axios HTTP client for making API requests
import axios from "axios";

// Import TypeScript interfaces for type safety
import { User, CreateUserRequest, UserStats } from "./types";

// Import axios error type checker for better error handling
import { isAxiosError } from "axios";

/**
 * API Gateway endpoint URL from AWS CDK deployment
 * This should match the output from: `cdk deploy UsersApiStack`
 * Replace this with your own API Gateway URL after deployment
 */
const API_URL = "https://vszofutd55.execute-api.us-east-2.amazonaws.com";

/**
 * Create a configured axios instance with base URL and default headers
 * This instance will be used for all API calls to ensure consistency
 */
const api = axios.create({
  baseURL: API_URL,              // Prepend this to all request URLs
  headers: {
    "Content-Type": "application/json",  // All requests send JSON data
  },
});

/**
 * User API client object containing all user-related API methods
 * Each method handles a specific API endpoint and returns typed data
 */
export const userApi = {
  /**
   * Fetch all users from the database
   * Makes GET request to /users endpoint
   * 
   * @returns Promise<User[]> - Array of all users
   * @throws Error if request fails
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      // Make GET request to /users endpoint
      const response = await api.get("/users");
      
      // Handle different response formats for flexibility
      // API might return data as plain array or wrapped in an object
      
      if (Array.isArray(response.data)) {
        // Direct array response: [{ id: "1", name: "John", ... }, ...]
        return response.data;
      }
      
      if (response.data.users && Array.isArray(response.data.users)) {
        // Wrapped in 'users' property: { users: [...] }
        return response.data.users;
      }
      
      if (Array.isArray(response.data.data)) {
        // Wrapped in 'data' property: { data: [...] }
        return response.data.data;
      }
      
      // If no recognized format, return empty array
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error; // Re-throw to allow calling code to handle
    }
  },

  /**
   * Create a new user with provided name and email
   * Makes POST request to /users endpoint
   * 
   * @param userData - Object containing name and email
   * @returns Promise<User> - The created user object with generated ID
   * @throws Error if request fails or validation error occurs
   */
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    try {
      // Make POST request with user data in body
      const response = await api.post("/users", userData);
      
      // Handle different response formats
      
      if (response.data && response.data.id) {
        // Direct user object with ID: { id: "123", name: "John", ... }
        return response.data;
      }
      
      if (response.data.data) {
        // Wrapped in 'data' property: { data: { id: "123", ... } }
        return response.data.data;
      }
      
      // Default: return raw response data
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  /**
   * Bulk create multiple random users with fake data
   * Makes POST request to /users/bulk endpoint
   * Backend uses Faker.js to generate realistic user data
   * 
   * @param count - Number of users to create (default: 5, max: 100)
   * @returns Promise<User[]> - Array of created users
   * @throws Error if request fails
   */
  bulkCreateUsers: async (count: number = 5): Promise<User[]> => {
    try {
      // Make POST request with count in body
      const response = await api.post("/users/bulk", { count });
      
      // Extract users array from response
      if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      
      return [];
    } catch (error) {
      console.error("Error bulk creating users:", error);
      throw error;
    }
  },

  /**
   * Search users by name or email using partial, case-insensitive matching
   * Makes GET request to /users/search endpoint with query parameter
   * 
   * @param query - Search term to match against name or email
   * @returns Promise<User[]> - Array of matching users
   * @throws Error if request fails
   */
  searchUsers: async (query: string): Promise<User[]> => {
    try {
      // URL encode query to handle special characters safely
      const response = await api.get(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      
      // Extract results array from response
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      return [];
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  /**
   * Get user statistics including counts and recent users
   * Makes GET request to /users/stats endpoint
   * 
   * @returns Promise<UserStats> - Statistics object with user metrics
   * @throws Error if request fails
   */
  getUserStats: async (): Promise<UserStats> => {
    try {
      // Make GET request to stats endpoint
      const response = await api.get("/users/stats");
      
      // Return the stats object directly
      // Expected format: { totalUsers, usersCreatedToday, recentUsers, lastUpdated }
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },

  /**
   * Export all users as a downloadable JSON file
   * Makes GET request to /users/export endpoint
   * Backend returns formatted JSON with download headers
   * 
   * @returns Promise<User[]> - Array of all users
   * @throws Error if request fails
   */
  exportUsers: async (): Promise<User[]> => {
    try {
      // Make GET request to export endpoint
      const response = await api.get("/users/export");
      
      // Return the users array
      // Backend sends this as a direct array
      return response.data;
    } catch (error) {
      console.error("Error exporting users:", error);
      throw error;
    }
  },

  /**
   * Get a single user by their unique ID
   * Makes GET request to /users/{id} endpoint
   * 
   * @param id - The unique identifier of the user
   * @returns Promise<User> - The user object
   * @throws Error if user not found or request fails
   */
  getUserById: async (id: string): Promise<User> => {
    try {
      // Make GET request to user-specific endpoint
      const response = await api.get(`/users/${id}`);
      
      // Check if response is a plain user object (most common case)
      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        return response.data;
      }
      
      // Handle wrapped response (rare, but for API flexibility)
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If data format is unexpected, throw error
      throw new Error("User not found");
    } catch (error) {
      // Enhanced error logging for debugging
      if (isAxiosError(error)) {
        // Log axios-specific error details including response data
        console.error("Error fetching user:", error, id, error.response?.data);
      } else {
        // Log generic error
        console.error("Error fetching user:", error, id);
      }
      throw error;
    }
  },

  /**
   * Update an existing user's information
   * Makes PUT request to /users/{id} endpoint
   * Only provided fields will be updated (partial update supported)
   * 
   * @param id - The unique identifier of the user to update
   * @param userData - Object containing fields to update (name, email)
   * @returns Promise<User> - The updated user object
   * @throws Error if user not found or request fails
   */
  updateUser: async (
    id: string,
    userData: Partial<CreateUserRequest>  // Partial allows updating only some fields
  ): Promise<User> => {
    try {
      // Make PUT request with updated data in body
      const response = await api.put(`/users/${id}`, userData);
      
      // Handle direct user object response
      if (response.data && response.data.id) {
        return response.data;
      }
      
      // Handle wrapped response
      if (response.data.data) {
        return response.data.data;
      }
      
      // Default: return raw response data
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  /**
   * Delete a user permanently from the database
   * Makes DELETE request to /users/{id} endpoint
   * This action cannot be undone
   * 
   * @param id - The unique identifier of the user to delete
   * @returns Promise<void> - No return value on success
   * @throws Error if user not found or request fails
   */
  deleteUser: async (id: string): Promise<void> => {
    try {
      // Make DELETE request to remove user
      await api.delete(`/users/${id}`);
      // No return value needed for delete operation
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
