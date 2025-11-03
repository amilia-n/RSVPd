import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import usersApi from "@/features/users/users.api";
import eventsApi from "@/features/events/events.api";
import { queryKeys } from "@/utils/queryKeys";

export default function OrgAnalyticsPage() {
  const { orgSlug } = useParams();

  // Fetch org by slug
  const { data: org } = useQuery({
    queryKey: queryKeys.users.orgs.bySlug(orgSlug),
    queryFn: () => usersApi.getOrgBySlug(orgSlug),
    enabled: !!orgSlug,
  });

  // Fetch org events
  const { data: events } = useQuery({
    queryKey: queryKeys.events.listForOrg(org?.id),
    queryFn: () => eventsApi.listForOrg(org?.id),
    enabled: !!org?.id,
  });

  // Calculate stats
  const totalEvents = events?.rows?.length || 0;
  const publishedEvents =
    events?.rows?.filter((e) => e.status === "PUBLISHED").length || 0;
  const upcomingEvents =
    events?.rows?.filter((e) => new Date(e.start_at) > new Date()).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {org?.name || "Organization"} Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Organization performance overview
        </p>
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
            <Building2 className="size-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}