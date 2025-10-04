"use client";

import { useState } from "react";
import { userApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Download, Loader2 } from "lucide-react";
import { useUserContext } from "./UserCRUD";

export function BulkActions() {
  const [bulkCreating, setBulkCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { refreshUsers } = useUserContext();

  const handleBulkCreate = async () => {
    try {
      setBulkCreating(true);
      await userApi.bulkCreateUsers(10);
      refreshUsers();
    } catch (error) {
      console.error("Error bulk creating users:", error);
      alert("Failed to create users");
    } finally {
      setBulkCreating(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const users = await userApi.exportUsers();

      // Create a blob from the data and trigger download
      const blob = new Blob([JSON.stringify(users, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting users:", error);
      alert("Failed to export users");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            onClick={handleBulkCreate}
            disabled={bulkCreating}
            className="flex-1"
          >
            {bulkCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create 10 Random Users
              </>
            )}
          </Button>

          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="flex-1"
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export All Users
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
