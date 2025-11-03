import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Ticket, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import ticketsApi from "./tickets.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";

export default function MyTicketsPage() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: queryKeys.tickets.listForUser(),
    queryFn: () => ticketsApi.listForUser(),
  });

  const upcomingTickets =
    tickets?.rows?.filter((t) => new Date(t.event_start) > new Date()) || [];
  const pastTickets =
    tickets?.rows?.filter((t) => new Date(t.event_start) <= new Date()) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground mt-2">
          Manage your event tickets
        </p>
      </div>

      {/* Upcoming Tickets */}
      {upcomingTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Ticket Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.event_title || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.short_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.event_start
                        ? new Date(ticket.event_start).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={PATHS.ticketDetail(ticket.id)}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Past Tickets */}
      {pastTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Ticket Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.event_title || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.short_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.event_start
                        ? new Date(ticket.event_start).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={PATHS.ticketDetail(ticket.id)}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : (!tickets?.rows || tickets.rows.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="size-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              You don't have any tickets yet
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to={PATHS.home}>Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}