import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, ArrowUpDown, Filter, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import eventsApi from "./events.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";
import { US_STATES, EVENT_TYPES, EVENT_TYPE_COLORS } from "@/constants/usStates";

export default function EventsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("alpha-asc");
  const [filterTiming, setFilterTiming] = useState("all");
  const [selectedStates, setSelectedStates] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);
  const filterRef = useRef(null);

  // Fetch upcoming public events
  const { data: events, isLoading } = useQuery({
    queryKey: queryKeys.events.publicUpcoming({ search: searchQuery }),
    queryFn: () => eventsApi.upcomingPublic({ search: searchQuery, limit: 100, offset: 0 }),
    enabled: !searchQuery || searchQuery.length === 0,
  });

  // Search events
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: queryKeys.events.publicSearch(searchQuery),
    queryFn: () => eventsApi.searchPublic({ q: searchQuery, limit: 100, offset: 0 }),
    enabled: searchQuery.length > 0,
  });

  // Fuzzy search helper
  const fuzzyMatch = (text, query) => {
    if (!text || !query) return false;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    const textWords = textLower.split(/\s+/);
    return queryWords.every(qWord => 
      textWords.some(tWord => tWord.includes(qWord)) || textLower.includes(qWord)
    );
  };

  // Get suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const allEvents = events?.rows || [];
    return allEvents
      .filter((event) => 
        fuzzyMatch(event.title, searchQuery) ||
        fuzzyMatch(event.venue_name, searchQuery) ||
        fuzzyMatch(event.city, searchQuery) ||
        fuzzyMatch(event.org_name, searchQuery) ||
        fuzzyMatch(event.state_code, searchQuery)
      )
      .slice(0, 5);
  }, [searchQuery, events?.rows]);

  // Apply filtering and sorting
  const displayEvents = useMemo(() => {
    let filtered = searchQuery ? searchResults?.rows : events?.rows;
    if (!filtered) return [];

    const now = new Date();

    // Filter by timing
    if (filterTiming === "upcoming") {
      filtered = filtered.filter((event) => new Date(event.start_at) >= now);
    } else if (filterTiming === "past") {
      filtered = filtered.filter((event) => new Date(event.start_at) < now);
    }

    // Filter by states
    if (selectedStates.length > 0) {
      filtered = filtered.filter((event) => selectedStates.includes(event.state_code));
    }

    // Sort events
    const sorted = [...filtered];
    switch (sortBy) {
      case "date-asc":
        sorted.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
        break;
      case "date-desc":
        sorted.sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
        break;
      case "alpha-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alpha-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    return sorted;
  }, [searchQuery, searchResults?.rows, events?.rows, sortBy, filterTiming, selectedStates]);

  const loading = searchQuery ? searchLoading : isLoading;

  // Get unique states
  const availableStates = useMemo(() => {
    const allEvents = events?.rows || [];
    const states = [...new Set(allEvents.map(e => e.state_code).filter(Boolean))];
    return US_STATES.filter(state => states.includes(state.code));
  }, [events?.rows]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (eventId) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(PATHS.eventDetail(eventId));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.length >= 2);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const toggleState = (stateCode) => {
    setSelectedStates(prev => 
      prev.includes(stateCode) 
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
    );
  };

  const clearFilters = () => {
    setFilterTiming("all");
    setSelectedStates([]);
  };

  const hasActiveFilters = filterTiming !== "all" || selectedStates.length > 0;
  const activeFilterCount = (filterTiming !== "all" ? 1 : 0) + selectedStates.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discover Events</h1>
        <p className="text-muted-foreground mt-2">
          Browse upcoming events and find your next experience
        </p>
      </div>

      {/* ONE LINE: Search + Sort + Filters */}
      <Card>
        <CardContent className="pt-2">
          <div className="flex gap-3">
            {/* Search with Suggestions */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by name, venue, or location..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="pl-10 placeholder:text-[11px] placeholder:leading-4"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {suggestions.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleSuggestionClick(event.id)}
                      className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm line-clamp-1">{event.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        {event.venue_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {event.venue_name}
                          </span>
                        )}
                        {event.city && event.state_code && (
                          <span>• {event.city}, {event.state_code}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="w-35">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="size-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha-asc">Name: A-Z</SelectItem>
                  <SelectItem value="alpha-desc">Name: Z-A</SelectItem>
                  <SelectItem value="date-asc">Date: Recent</SelectItem>
                  <SelectItem value="date-desc">Date: Latest</SelectItem>

                </SelectContent>
              </Select>
            </div>

            {/* Filters Button with Popover */}
            <div className="relative" ref={filterRef}>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="size-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5 min-w-5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {/* Filters Popover */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-md shadow-lg z-50">
                  <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="font-semibold">Filters</h3>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-auto py-1 px-2 text-xs"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Timing Filter */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Timing</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="timing"
                            checked={filterTiming === "all"}
                            onChange={() => setFilterTiming("all")}
                            className="size-4"
                          />
                          <span className="text-sm">All Events</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="timing"
                            checked={filterTiming === "upcoming"}
                            onChange={() => setFilterTiming("upcoming")}
                            className="size-4"
                          />
                          <span className="text-sm">Upcoming Only</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="timing"
                            checked={filterTiming === "past"}
                            onChange={() => setFilterTiming("past")}
                            className="size-4"
                          />
                          <span className="text-sm">Past Events</span>
                        </label>
                      </div>
                    </div>

                    {/* State Filter */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">States</h4>
                        {selectedStates.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {selectedStates.length} selected
                          </span>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {availableStates.map((state) => (
                          <label
                            key={state.code}
                            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStates.includes(state.code)}
                              onChange={() => toggleState(state.code)}
                              className="size-4"
                            />
                            <span className="text-sm">{state.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : displayEvents && displayEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {displayEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <CardTitle className="line-clamp-2 flex-1">{event.title}</CardTitle>
                  {event.event_type && (
                    <Badge variant={EVENT_TYPE_COLORS[event.event_type] || "outline"}>
                      {EVENT_TYPES[event.event_type] || event.event_type}
                    </Badge>
                  )}
                </div>
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
                  {(event.venue_name || event.address1) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="size-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        {event.venue_name && (
                          <span className="font-medium text-foreground">{event.venue_name}</span>
                        )}
                        {event.address1 && (
                          <span className="text-sm">
                            {event.address1}
                            {event.address2 && `, ${event.address2}`}
                            {event.city && (
                              <>
                                <br />
                                {event.city}{event.state_code && `, ${event.state_code}`}{event.postal_code && ` ${event.postal_code}`}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {event.org_name && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">By:</span> {event.org_name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div></div>
                  <Button variant="default" size="sm" asChild>
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
                : "No events found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}