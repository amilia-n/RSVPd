import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import checkinsApi from "./checkins.api";
import { queryKeys } from "@/utils/queryKeys";

export default function LiveCheckinsPage() {
  const { eventId } = useParams();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch check-in stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.checkins.statsForEvent(eventId),
    queryFn: () => checkinsApi.statsForEvent(eventId),
    enabled: !!eventId,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Fetch check-in list
  const {
    data: checkins,
    isLoading: checkinsLoading,
    refetch: refetchCheckins,
  } = useQuery({
    queryKey: queryKeys.checkins.listForEvent(eventId),
    queryFn: () => checkinsApi.listForEvent(eventId),
    enabled: !!eventId,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchCheckins();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Check-Ins</h1>
          <p className="text-muted-foreground mt-2">
            Real-time attendance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={checkinsLoading}
          >
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? "On" : "Off"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Check-Ins</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.total_check_ins || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Tickets</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.unique_tickets_checked_in || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Hours</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.active_hours || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-In List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-Ins</CardTitle>
        </CardHeader>
        <CardContent>
          {checkinsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : checkins?.rows && checkins.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ticket Code</TableHead>
                  <TableHead>Scanned By</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkins.rows.map((checkin) => (
                  <TableRow key={checkin.id}>
                    <TableCell className="font-medium">
                      {checkin.attendee_name || "N/A"}
                    </TableCell>
                    <TableCell>{checkin.attendee_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{checkin.short_code}</Badge>
                    </TableCell>
                    <TableCell>{checkin.scanned_by_name || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(checkin.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No check-ins yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}