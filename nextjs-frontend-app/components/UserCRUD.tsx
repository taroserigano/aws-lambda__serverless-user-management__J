"use client";

import { createContext, useContext, useState } from "react";
import { UserForm } from "./UserForm";
import { UserList } from "./UserList";
import { UserStats } from "./UserStats";
import { UserSearch } from "./UserSearch";
import { BulkActions } from "./BulkActions";

// Create a context for sharing user state
const UserContext = createContext<{
  refreshUsers: () => void;
} | null>(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

export function UserCRUD() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshUsers = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <UserContext.Provider value={{ refreshUsers }}>
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Management System
          </h1>
          <p className="text-gray-600">
            Create and manage users with our enhanced CRUD application
          </p>
        </div>

        {/* Statistics Section */}
        <div className="max-w-4xl mx-auto">
          <UserStats key={refreshKey} />
        </div>

        {/* Bulk Actions Section */}
        <div className="max-w-4xl mx-auto">
          <BulkActions />
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto">
          <UserSearch />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UserForm />
          </div>

          <div className="lg:col-span-2">
            <UserList key={refreshKey} />
          </div>
        </div>
      </div>
    </UserContext.Provider>
  );
}
