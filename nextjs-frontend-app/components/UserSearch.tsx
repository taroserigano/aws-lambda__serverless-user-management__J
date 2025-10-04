"use client";

import { useState } from "react";
import { userApi } from "@/lib/api";
import { User } from "@/lib/types";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setSearching(true);
      const users = await userApi.searchUsers(query);
      setResults(users);
      setSearched(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? "Searching..." : "Search"}
          </Button>
          {searched && (
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {searched && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Found {results.length} user{results.length !== 1 ? "s" : ""}
            </p>

            {results.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No users found matching &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
