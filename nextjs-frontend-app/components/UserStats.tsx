"use client";

import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { UserStats as UserStatsType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, Clock } from "lucide-react";

export function UserStats() {
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await userApi.getUserStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          User Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <UserPlus className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Created Today</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.usersCreatedToday}
              </p>
            </div>
          </div>
        </div>

        {stats.recentUsers && stats.recentUsers.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700">
                Recent Users
              </h4>
            </div>
            <div className="space-y-2">
              {stats.recentUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="text-xs p-2 bg-gray-50 rounded">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
