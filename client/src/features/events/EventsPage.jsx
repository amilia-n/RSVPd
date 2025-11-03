import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Ticket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import eventsApi from "./events.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch upcoming public events
  const { data: events, isLoading } = useQuery({
    queryKey: queryKeys.events.publicUpcoming({ search: searchQuery }),
    queryFn: () => eventsApi.upcomingPublic({ search: searchQuery, limit: 20, offset: 0 }),
    enabled: !searchQuery || searchQuery.length === 0,
  });

  // Search events
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: queryKeys.events.publicSearch(searchQuery),
    queryFn: () => eventsApi.searchPublic({ q: searchQuery, limit: 20, offset: 0 }),
    enabled: searchQuery.length > 0,
  });

  const displayEvents = searchQuery ? searchResults?.rows : events?.rows;
  const loading = searchQuery ? searchLoading : isLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discover Events</h1>
        <p className="text-muted-foreground mt-2">
          Browse upcoming events and find your next experience
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : displayEvents && displayEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.summary || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {event.start_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        {new Date(event.start_at).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {event.venue_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-4" />
                      <span>{event.venue_name}</span>
                    </div>
                  )}
                  {event.org_name && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">By:</span> {event.org_name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={event.status === "PUBLISHED" ? "default" : "outline"}>
                    {event.status}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={PATHS.eventDetail(event.id)}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? `No events found for "${searchQuery}"`
                : "No upcoming events found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}