import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/features/users/useMe";
import { Building2, Calendar, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import usersApi from "@/features/users/users.api";
import eventsApi from "@/features/events/events.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";

export default function VendorDashboardPage() {
  const { user } = useMe();

  // Fetch user's organizations (where vendor has VENDOR role)
  const { data: orgs } = useQuery({
    queryKey: queryKeys.users.orgs.list(),
    queryFn: () => usersApi.listOrgs(),
  });

  // Get all org IDs where user is a vendor
  const vendorOrgIds = orgs?.rows?.map((org) => org.id) || [];

  // Fetch events for all organizations where vendor is a member
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events.listForOrg(vendorOrgIds[0]),
    queryFn: () => eventsApi.listForOrg(vendorOrgIds[0]),
    enabled: vendorOrgIds.length > 0,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View your vendor information and events you've served
        </p>
      </div>

      {/* Vendor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
          <CardDescription>Your business details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Business Name</div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                {user?.first_name && user?.last_name
                  ? `${user.first_name}'s ${user.last_name}`
                  : "Vendor Business"}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Contact Email</div>
              <div className="text-lg flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                {user?.email || "N/A"}
              </div>
            </div>

            {user?.phone && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Phone Number</div>
                <div className="text-lg flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  {user.phone}
                </div>
              </div>
            )}

            {orgs?.rows && orgs.rows.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Organizations</div>
                <div className="flex flex-wrap gap-2">
                  {orgs.rows.map((org) => (
                    <Badge key={org.id} variant="outline">
                      {org.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Served */}
      <Card>
        <CardHeader>
          <CardTitle>Events You've Served</CardTitle>
          <CardDescription>
            All events from organizations where you are a vendor
          </CardDescription>
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
                  <TableHead>Event Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.rows.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {orgs?.rows?.find((org) => org.id === event.org_id)?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge>{event.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        {new Date(event.start_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={PATHS.eventDetail(event.id)}>View Event</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="size-12 mx-auto mb-4 opacity-50" />
              <p>No events found for your organizations</p>
              <p className="text-sm mt-2">
                Contact your organization to be assigned to events
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Common actions and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link to={PATHS.checkinsScan}>Scan Tickets</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={PATHS.home}>Browse All Events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}