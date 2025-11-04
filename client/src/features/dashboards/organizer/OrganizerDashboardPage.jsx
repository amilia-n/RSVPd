import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar,
  Ticket,
  TrendingUp,
  Eye,
  Plus,
  X,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import surveysApi from "@/features/surveys/surveys.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import eventsApi from "@/features/events/events.api";
import usersApi from "@/features/users/users.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";

// US States for venue address
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

export default function OrganizerDashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isVirtual, setIsVirtual] = useState(false);
  const [ticketTypes, setTicketTypes] = useState([
    { name: "General Admission", price: 0, quantity: 100, kind: "GENERAL" },
  ]);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [selectedEventForSurvey, setSelectedEventForSurvey] = useState(null);
  const [surveyQuestions, setSurveyQuestions] = useState([
    { question_text: "" },
  ]);

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: queryKeys.users.orgs.my(),
    queryFn: () => usersApi.listMyOrgs(),
  });

  const firstOrgId = orgs?.rows?.[0]?.id;

  const { data: surveys } = useQuery({
    queryKey: ["surveys", firstOrgId],
    queryFn: () => surveysApi.listForOrg(firstOrgId),
    enabled: !!firstOrgId,
  });

  const { data: members } = useQuery({
    queryKey: ["orgMembers", firstOrgId],
    queryFn: () => usersApi.listOrgMembers(firstOrgId),
    enabled: !!firstOrgId,
  });

  // Fetch speakers
  const { data: speakers } = useQuery({
    queryKey: ["speakers", firstOrgId],
    queryFn: () => eventsApi.listSpeakersForOrg(firstOrgId),
    enabled: !!firstOrgId,
  });

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
      // Reset form
      setIsVirtual(false);
      setTicketTypes([
        { name: "General Admission", price: 0, quantity: 100, kind: "GENERAL" },
      ]);
      setTags([]);
    },
  });

  // Create survey mutation
  const createSurveyMutation = useMutation({
    mutationFn: (data) => surveysApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      setShowSurveyDialog(false);
      setSurveyQuestions([{ question_text: "" }]);
      setSelectedEventForSurvey(null);
    },
  });

  // Send survey mutation
  const sendSurveyMutation = useMutation({
    mutationFn: (survey_id) => surveysApi.send({ survey_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
  const handleCreateEvent = (e) => {
    e.preventDefault();

    if (!firstOrgId) {
      alert("No organization found. Please contact support.");
      return;
    }

    const formData = new FormData(e.target);

    // Convert datetime-local to ISO format
    const startAt = new Date(formData.get("start_at")).toISOString();
    const endAt = new Date(formData.get("end_at")).toISOString();

    // Prepare venue data (only if NOT virtual)
    const venueData =
      !isVirtual && formData.get("venue_name")
        ? {
            name: formData.get("venue_name"),
            address1: formData.get("venue_address1"),
            address2: formData.get("venue_address2") || null,
            city: formData.get("venue_city"),
            state_code: formData.get("venue_state"),
            postal_code: formData.get("venue_postal_code"),
            capacity: formData.get("venue_capacity")
              ? parseInt(formData.get("venue_capacity"))
              : null,
          }
        : null;

    createEventMutation.mutate({
      org_id: firstOrgId,
      venue: venueData,
      title: formData.get("title"),
      slug: formData.get("slug"),
      summary: formData.get("summary") || null,
      description_md: formData.get("description") || null,
      status: "DRAFT",
      visibility: formData.get("visibility") || "PRIVATE",
      event_type: formData.get("event_type") || "CONFERENCE",
      capacity: formData.get("capacity")
        ? parseInt(formData.get("capacity"))
        : null,
      start_at: startAt,
      end_at: endAt,
      is_online: isVirtual,
      stream_url: isVirtual ? formData.get("stream_url") : null,
      cover_image_url: formData.get("cover_image_url") || null,
      tags: tags,
      ticket_types: ticketTypes,
      speaker_ids: Array.from(formData.getAll("speakers")),
      vendor_ids: Array.from(formData.getAll("vendors")),
    });
  };

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      { name: "", price: 0, quantity: 100, kind: "GENERAL" },
    ]);
  };

  const removeTicketType = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const updateTicketType = (index, field, value) => {
    const updated = [...ticketTypes];
    updated[index][field] = value;
    setTicketTypes(updated);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };
  const handleCreateSurvey = (e) => {
    e.preventDefault();

    if (!firstOrgId || !selectedEventForSurvey) {
      alert("No organization or event selected");
      return;
    }

    const formData = new FormData(e.target);

    // Filter out empty questions and limit to 5
    const validQuestions = surveyQuestions
      .filter((q) => q.question_text.trim() !== "")
      .slice(0, 5);

    if (validQuestions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    createSurveyMutation.mutate({
      org_id: firstOrgId,
      event_id: selectedEventForSurvey,
      title: formData.get("title"),
      description_md: formData.get("description") || null,
      questions: validQuestions,
    });
  };

  const addSurveyQuestion = () => {
    if (surveyQuestions.length < 5) {
      setSurveyQuestions([...surveyQuestions, { question_text: "" }]);
    }
  };

  const removeSurveyQuestion = (index) => {
    setSurveyQuestions(surveyQuestions.filter((_, i) => i !== index));
  };

  const updateSurveyQuestion = (index, value) => {
    const updated = [...surveyQuestions];
    updated[index].question_text = value;
    setSurveyQuestions(updated);
  };

  const handleSendSurvey = (surveyId) => {
    if (
      confirm("Are you sure you want to send this survey to all attendees?")
    ) {
      sendSurveyMutation.mutate(surveyId);
    }
  };
  // Calculate stats
  const totalEvents = events?.rows?.length || 0;
  const publishedEvents =
    events?.rows?.filter((e) => e.status === "PUBLISHED").length || 0;
  const upcomingEvents =
    events?.rows?.filter((e) => new Date(e.start_at) > new Date()).length || 0;

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  const vendors = members?.rows?.filter((m) => m.role_name === "VENDOR") || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your events and track performance
          </p>
          {orgs?.rows && orgs.rows.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Organization:{" "}
              <span className="font-medium">{orgs.rows[0].name}</span>
            </p>
          )}
        </div>

        {!firstOrgId ? (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              No organization found. You need to be assigned to an organization.
            </AlertDescription>
          </Alert>
        ) : (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill in all required details to create your event
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        required
                        placeholder="Super Cool Event"
                        className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_type">Event Type *</Label>
                      <Select name="event_type" defaultValue="CONFERENCE">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONFERENCE">Conference</SelectItem>
                          <SelectItem value="MEETUP">Meetup</SelectItem>
                          <SelectItem value="WORKSHOP">Workshop</SelectItem>
                          <SelectItem value="WEBINAR">Webinar</SelectItem>
                          <SelectItem value="LIVE">Live Event</SelectItem>
                          <SelectItem value="PERFORMANCE">
                            Performance
                          </SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug *</Label>
                      <Input
                        id="slug"
                        name="slug"
                        required
                        placeholder="tech-conference-2025"
                        className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility *</Label>
                      <Select name="visibility" defaultValue="PRIVATE">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Input
                      id="summary"
                      name="summary"
                      placeholder="A brief description"
                      className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      placeholder="Detailed event information..."
                      className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-lg">Date & Time</h3>
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
                </div>

                {/* Venue & Location */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Venue & Location</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVirtual}
                        onChange={(e) => setIsVirtual(e.target.checked)}
                        className="size-4"
                      />
                      <span className="text-sm font-medium">Virtual Event</span>
                    </label>
                  </div>

                  {isVirtual ? (
                    // Virtual Event - Stream URL
                    <div className="space-y-2">
                      <Label htmlFor="stream_url">Stream URL *</Label>
                      <Input
                        id="stream_url"
                        name="stream_url"
                        type="url"
                        required
                        placeholder="https://zoom.us/j/123456789"
                        className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your Zoom, YouTube Live, or other streaming
                        platform URL
                      </p>
                    </div>
                  ) : (
                    // In-Person Event - Venue Address
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="venue_name">Venue Name *</Label>
                        <Input
                          id="venue_name"
                          name="venue_name"
                          required
                          placeholder="Convention Center"
                          className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venue_address1">Street Address *</Label>
                        <Input
                          id="venue_address1"
                          name="venue_address1"
                          required
                          placeholder="123 Main St"
                          className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venue_address2">Address Line 2</Label>
                        <Input
                          id="venue_address2"
                          name="venue_address2"
                          placeholder="Suite 100"
                          className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="venue_city">City *</Label>
                          <Input
                            id="venue_city"
                            name="venue_city"
                            required
                            placeholder="New York"
                            className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="venue_state">State *</Label>
                          <Select name="venue_state" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="venue_postal_code">ZIP Code *</Label>
                          <Input
                            id="venue_postal_code"
                            name="venue_postal_code"
                            required
                            placeholder="10001"
                            className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="venue_capacity">Venue Capacity</Label>
                          <Input
                            id="venue_capacity"
                            name="venue_capacity"
                            type="number"
                            placeholder="500"
                            className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Event Capacity</Label>
                          <Input
                            id="capacity"
                            name="capacity"
                            type="number"
                            placeholder="400"
                            className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Ticket Types */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Ticket Types</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTicketType}
                    >
                      <Plus className="size-4 mr-1" /> Add Ticket
                    </Button>
                  </div>
                  {ticketTypes.map((ticket, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Ticket {index + 1}</Label>
                            {ticketTypes.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTicketType(index)}
                              >
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <div className="space-y-2">
                              <Label>Name *</Label>
                              <Input
                                value={ticket.name}
                                onChange={(e) =>
                                  updateTicketType(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="General Admission"
                                required
                                className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={ticket.kind}
                                onValueChange={(val) =>
                                  updateTicketType(index, "kind", val)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GENERAL">
                                    General
                                  </SelectItem>
                                  <SelectItem value="VIP">VIP</SelectItem>
                                  <SelectItem value="EARLY_BIRD">
                                    Early Bird
                                  </SelectItem>
                                  <SelectItem value="STUDENT">
                                    Student
                                  </SelectItem>
                                  <SelectItem value="WORKSHOP">
                                    Workshop
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Price ($) *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ticket.price}
                                onChange={(e) =>
                                  updateTicketType(
                                    index,
                                    "price",
                                    parseFloat(e.target.value)
                                  )
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={ticket.quantity}
                                onChange={(e) =>
                                  updateTicketType(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value)
                                  )
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Speakers */}
                {speakers?.rows && speakers.rows.length > 0 && (
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-semibold text-lg">
                      Speakers (Optional)
                    </h3>
                    <div className="space-y-2">
                      {speakers.rows.map((speaker) => (
                        <label
                          key={speaker.id}
                          className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name="speakers"
                            value={speaker.id}
                            className="size-4"
                          />
                          <span className="text-sm">
                            {speaker.full_name}{" "}
                            {speaker.title && `- ${speaker.title}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendors */}
                {vendors.length > 0 && (
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-semibold text-lg">
                      Vendors (Optional)
                    </h3>
                    <div className="space-y-2">
                      {vendors.map((vendor) => (
                        <label
                          key={vendor.user_id}
                          className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name="vendors"
                            value={vendor.user_id}
                            className="size-4"
                          />
                          <span className="text-sm">
                            {vendor.first_name} {vendor.last_name} (
                            {vendor.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags & Media */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Additional Details</h3>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
                        placeholder="Add a tag..."
                        className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}>
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_image_url">Cover Image URL</Label>
                    <Input
                      id="cover_image_url"
                      name="cover_image_url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="placeholder:text-muted-foreground/60 focus:placeholder:text-transparent"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEventMutation.isPending}
                  >
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
        )}
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
            <Eye className="size-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : events?.rows && events.rows.length > 0 ? (
            <div className="space-y-4">
              {events.rows.map((event) => (
                <Link
                  key={event.id}
                  to={PATHS.eventDetail(event.id)}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(event.start_at).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          event.status === "PUBLISHED" ? "default" : "outline"
                        }
                      >
                        {event.status}
                      </Badge>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No events yet. Create your first event!</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Survey Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Post-Event Surveys</CardTitle>
            <Dialog open={showSurveyDialog} onOpenChange={setShowSurveyDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FileText className="size-4 mr-2" />
                  Create Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Post-Event Survey</DialogTitle>
                  <DialogDescription>
                    Create a survey with up to 5 questions (1-5 rating scale)
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSurvey} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="survey_event">Select Event *</Label>
                    <Select
                      value={selectedEventForSurvey || ""}
                      onValueChange={setSelectedEventForSurvey}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event..." />
                      </SelectTrigger>
                      <SelectContent>
                        {events?.rows?.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} (
                            {new Date(event.start_at).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Survey Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder="Post-Event Feedback"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="Please share your thoughts about the event..."
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>
                        Questions (1-5 rating: Strongly Disagree to Strongly
                        Agree)
                      </Label>
                      {surveyQuestions.length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSurveyQuestion}
                        >
                          <Plus className="size-4 mr-1" /> Add Question
                        </Button>
                      )}
                    </div>
                    {surveyQuestions.map((q, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={q.question_text}
                          onChange={(e) =>
                            updateSurveyQuestion(index, e.target.value)
                          }
                          placeholder={`Question ${index + 1}`}
                          required
                        />
                        {surveyQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSurveyQuestion(index)}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSurveyDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createSurveyMutation.isPending}
                    >
                      {createSurveyMutation.isPending ? (
                        <>
                          <Spinner className="mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create Survey"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {surveys?.rows && surveys.rows.length > 0 ? (
            <div className="space-y-4">
              {surveys.rows.map((survey) => (
                <div
                  key={survey.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{survey.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Event: {survey.event_title}
                      </p>
                      {survey.sent_at && (
                        <Badge variant="secondary" className="mt-2">
                          Sent: {new Date(survey.sent_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!survey.sent_at && (
                        <Button
                          size="sm"
                          onClick={() => handleSendSurvey(survey.id)}
                          disabled={sendSurveyMutation.isPending}
                        >
                          Send Survey
                        </Button>
                      )}
                      <Link to={`/surveys/${survey.id}/results`}>
                        <Button size="sm" variant="outline">
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-2 opacity-50" />
              <p>No surveys yet. Create one to gather post-event feedback!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
