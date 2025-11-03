import { useQuery } from "@tanstack/react-query";
import { Calendar, Ticket, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import eventsApi from "@/features/events/events.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";
import usersApi from "@/features/users/users.api";

export default function OrganizerDashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch user's organizations
  const { data: orgs } = useQuery({
    queryKey: queryKeys.users.orgs.list(),
    queryFn: () => usersApi.listOrgs(),
  });

  const firstOrgId = orgs?.rows?.[0]?.id;

  // Fetch events for organization
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events.listForOrg(firstOrgId),
    queryFn: () => eventsApi.listForOrg(firstOrgId),
    enabled: !!firstOrgId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (data) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      setShowCreateDialog(false);
    },
  });

  const handleCreateEvent = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createEventMutation.mutate({
      org_id: firstOrgId,
      title: formData.get("title"),
      slug: formData.get("slug"),
      summary: formData.get("summary"),
      description_md: formData.get("description"),
      status: "DRAFT",
      visibility: "PRIVATE",
      event_type: "CONFERENCE",
      start_at: formData.get("start_at"),
      end_at: formData.get("end_at"),
    });
  };

  // Calculate stats
  const totalEvents = events?.rows?.length || 0;
  const publishedEvents =
    events?.rows?.filter((e) => e.status === "PUBLISHED").length || 0;
  const upcomingEvents =
    events?.rows?.filter((e) => new Date(e.start_at) > new Date()).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your events and track performance
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Create Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new event
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  placeholder="my-event-2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Input id="summary" name="summary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_at">Start Date/Time *</Label>
                  <Input
                    id="start_at"
                    name="start_at"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_at">End Date/Time *</Label>
                  <Input
                    id="end_at"
                    name="end_at"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Ticket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>My Events</CardTitle>
          <CardDescription>Manage and view all your events</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : events?.rows && events.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.rows.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge>{event.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(event.start_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={PATHS.eventDetail(event.id)}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={PATHS.eventAnalytics(event.id)}>
                            Analytics
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/checkins/live/${event.id}`}>
                            Live Check-Ins
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No events yet. Create your first event!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
