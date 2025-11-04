import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  ShoppingCart,
  X,
  User,
  Building2,
  Users,
  Mic,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import eventsApi from "./events.api";
import ticketTypesApi from "@/features/ticketTypes/ticketTypes.api";
import ordersApi from "@/features/orders/orders.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";
import { formatCurrency } from "@/lib/utils";
import { useMe } from "@/features/users/useMe";
import usersApi from "@/features/users/users.api";

// Cart Side Panel Component
function CartPanel({
  ticketTypes,
  selectedTickets,
  onQuantityChange,
  cartTotal,
  onCheckout,
  isOpen,
  onClose,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Cart</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>

          {/* Cart Items */}
          {ticketTypes?.rows && ticketTypes.rows.length > 0 ? (
            <div className="space-y-4">
              {ticketTypes.rows.map((ticketType) => {
                const selectedQty = selectedTickets[ticketType.id] || 0;
                const maxQty =
                  ticketType.per_user_limit || ticketType.per_order_limit || 10;

                return (
                  <div
                    key={ticketType.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{ticketType.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(ticketType.price_cents / 100)}
                        </p>
                        {(ticketType.per_user_limit ||
                          ticketType.per_order_limit) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {ticketType.per_user_limit &&
                              `Max ${ticketType.per_user_limit} per person`}
                            {ticketType.per_user_limit &&
                              ticketType.per_order_limit &&
                              " • "}
                            {ticketType.per_order_limit &&
                              `Max ${ticketType.per_order_limit} per order`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            onQuantityChange(
                              ticketType.id,
                              Math.max(0, selectedQty - 1)
                            )
                          }
                          disabled={selectedQty === 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={maxQty}
                          value={selectedQty}
                          onChange={(e) =>
                            onQuantityChange(
                              ticketType.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            onQuantityChange(
                              ticketType.id,
                              Math.min(maxQty, selectedQty + 1)
                            )
                          }
                          disabled={selectedQty >= maxQty}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              {cartTotal > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal / 100)}</span>
                  </div>
                  <Button
                    onClick={onCheckout}
                    disabled={cartTotal === 0 || isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="size-4 mr-2" />
                        Checkout
                      </>
                    )}
                  </Button>
                </div>
              )}

              {cartTotal === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Add tickets to your cart
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tickets available for this event
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useMe();
  const [selectedTickets, setSelectedTickets] = useState({});
  const [cartTotal, setCartTotal] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editIsVirtual, setEditIsVirtual] = useState(false);

  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
  });

  // Fetch ticket types (only if logged in)
  const { data: ticketTypes } = useQuery({
    queryKey: queryKeys.ticketTypes.listForEvent(id),
    queryFn: () => ticketTypesApi.listForEvent(id),
    enabled: !!id && !!user,
  });
  const { data: userOrgs } = useQuery({
    queryKey: queryKeys.users.orgs.my(),
    queryFn: () => usersApi.listMyOrgs(),
    enabled: !!user,
  });
const queryClient = useQueryClient();
  const updateEventMutation = useMutation({
    mutationFn: async (data) => {
      return await eventsApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.events.detail(id));
      setShowEditDialog(false);
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      // Create the order
      const orderResponse = await ordersApi.create(data);
      const orderId = orderResponse?.order?.id;

      if (!orderId) {
        throw new Error("No order ID returned from server");
      }

      // Add items to the order
      const items = Object.entries(selectedTickets)
        .filter(([, qty]) => qty > 0)
        .map(([ticketTypeId, quantity]) => {
          const ticketType = ticketTypes?.rows?.find(
            (t) => t.id === ticketTypeId
          );
          return {
            order_id: orderId,
            event_id: id,
            ticket_type_id: ticketTypeId,
            quantity,
            unit_price_cents: ticketType?.price_cents || 0,
            total_cents: (ticketType?.price_cents || 0) * quantity,
          };
        });

      // Add each item to the order
      for (const item of items) {
        await ordersApi.addItem(orderId, item);
      }

      // Calculate and update order totals
      const subtotal = items.reduce((sum, item) => sum + item.total_cents, 0);
      await ordersApi.updateTotals(orderId, {
        subtotal_cents: subtotal,
        discount_cents: 0,
        fees_cents: 0,
        tax_cents: 0,
        total_cents: subtotal,
      });

      return orderResponse;
    },
    onSuccess: (response) => {
      const orderId = response?.order?.id;
      navigate(`${PATHS.checkout}?orderId=${orderId}&eventId=${id}`);
    },
  });

  const handleQuantityChange = (ticketTypeId, quantity) => {
    const qty = Math.max(0, Math.min(quantity, 100));
    const updated = { ...selectedTickets, [ticketTypeId]: qty };
    setSelectedTickets(updated);

    // Calculate total
    const total = Object.entries(updated).reduce((sum, [ttId, q]) => {
      const tt = ticketTypes?.rows?.find((t) => t.id === ttId);
      return sum + (tt ? tt.price_cents * q : 0);
    }, 0);
    setCartTotal(total);
  };

  const handleCheckout = () => {
    if (!user) {
      navigate(PATHS.login);
      return;
    }

    const items = Object.entries(selectedTickets)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({
        ticket_type_id: ticketTypeId,
        quantity,
      }));

    if (items.length === 0) {
      alert("Please select at least one ticket");
      return;
    }

    createOrderMutation.mutate({
      event_id: id,
      purchaser_user_id: user.id,
      purchaser_email: user.email,
      currency: "USD",
    });
  };

  // Loading states - MUST come before any JSX that uses event
  if (eventLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  // Extract event from response - API returns { event: {...} }
  const event = eventData?.event || eventData;

  // Error state - check if event exists
  if (!event) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Event not found</AlertDescription>
      </Alert>
    );
  }

  const vendors = event.vendors || [];
  const speakers = event.speakers || [];

  const isOrganizer = userOrgs?.rows?.some(
    (org) => org.id === event.org_id && org.role_name === "ORGANIZER"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Cart Panel for logged-in users */}
      {user && !isOrganizer && (
        <CartPanel
          ticketTypes={ticketTypes}
          selectedTickets={selectedTickets}
          onQuantityChange={handleQuantityChange}
          cartTotal={cartTotal}
          onCheckout={handleCheckout}
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          isLoading={createOrderMutation.isPending}
        />
      )}

      {/* Event Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-5">{event.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={event.status === "PUBLISHED" ? "default" : "outline"}
                >
                  {event.event_type}
                </Badge>
                <Badge variant="outline">{event.status}</Badge>
              </div>
            </div>
            {/* Cart Toggle Button for logged-in users */}
            {user && !isOrganizer && (
              <Button
                variant="outline"
                onClick={() => setCartOpen(!cartOpen)}
                className="relative"
              >
                <ShoppingCart className="size-4 mr-2" />
                Cart
                {Object.values(selectedTickets).reduce(
                  (sum, qty) => sum + qty,
                  0
                ) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full size-5 flex items-center justify-center text-xs">
                    {Object.values(selectedTickets).reduce(
                      (sum, qty) => sum + qty,
                      0
                    )}
                  </span>
                )}
              </Button>
            )}
            {user && isOrganizer && (
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                Edit Event
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organizer */}
          {event.org_name && (
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">
                  Organizer:
                </span>{" "}
                <span className="font-medium">{event.org_name}</span>
              </div>
            </div>
          )}

          {/* Date & Time */}
          {event.start_at && (
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-muted-foreground" />
              <div>
                <span>
                  {new Date(event.start_at).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {event.end_at && (
                    <>
                      {" - "}
                      {new Date(event.end_at).toLocaleString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Venue & Location */}
          {event.venue_name && (
            <div className="flex items-start gap-2">
              <MapPin className="size-5 text-muted-foreground mt-1" />
              <div>
                <div className="font-medium">{event.venue_name}</div>
                {event.address1 && (
                  <div className="text-sm text-muted-foreground">
                    {event.address1}
                    {event.address2 && `, ${event.address2}`}
                    {event.city && `, ${event.city}`}
                    {event.state_code && `, ${event.state_code}`}
                    {event.postal_code && ` ${event.postal_code}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description_md && (
            <Card>
              <CardHeader>
                <CardTitle>About this event</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base whitespace-pre-line leading-relaxed">
                  {event.description_md}
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {/* Speakers */}
          {speakers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Mic className="size-5" />
                Speakers
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {speakers.map((speaker) => (
                  <Card key={speaker.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {speaker.headshot_url && (
                          <img
                            src={speaker.headshot_url}
                            alt={speaker.full_name}
                            className="size-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{speaker.full_name}</div>
                          {speaker.title && (
                            <div className="text-sm text-muted-foreground">
                              {speaker.title}
                              {speaker.company && ` at ${speaker.company}`}
                            </div>
                          )}
                          {speaker.bio_md && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {speaker.bio_md}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {vendors.length > 0 && (
            <div className="space-y-2">
              <h3 className="ml-4 font-semibold flex items-center gap-2">
                <Users className="size-5" />
                Vendors
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {vendors.map((vendor) => (
                  <Card key={vendor.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <User className="size-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.email && (
                            <div className="text-sm text-muted-foreground">
                              {vendor.email}
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="text-sm text-muted-foreground">
                              {vendor.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Book Tickets Button (Public View - Not Logged In) */}
          {!user && !isOrganizer && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => navigate(PATHS.login)}
                size="lg"
                className="w-full"
              >
                <ShoppingCart className="size-4 mr-2" />
                Book Tickets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Edit Dialog for Organizers */}
      {user && isOrganizer && (
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          setShowEditDialog(open);
          if (open) {
            setEditIsVirtual(event.is_online || false);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                updateEventMutation.mutate({
                  title: formData.get("title"),
                  slug: formData.get("slug"),
                  summary: formData.get("summary"),
                  description_md: formData.get("description"),
                  event_type: formData.get("event_type"),
                  visibility: formData.get("visibility"),
                  status: formData.get("status"),
                  start_at: formData.get("start_at"),
                  end_at: formData.get("end_at"),
                  is_online: editIsVirtual,
                  stream_url: editIsVirtual ? formData.get("stream_url") : null,
                  cover_image_url: formData.get("cover_image_url"),
                });
              }}
              className="space-y-6"
            >
              {/* Basic Info */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Event Title *</Label>
                    <Input
                      id="edit-title"
                      name="title"
                      defaultValue={event.title}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-event_type">Event Type *</Label>
                    <Select name="event_type" defaultValue={event.event_type}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFERENCE">Conference</SelectItem>
                        <SelectItem value="MEETUP">Meetup</SelectItem>
                        <SelectItem value="WORKSHOP">Workshop</SelectItem>
                        <SelectItem value="WEBINAR">Webinar</SelectItem>
                        <SelectItem value="LIVE">Live Event</SelectItem>
                        <SelectItem value="PERFORMANCE">Performance</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-slug">URL Slug *</Label>
                    <Input
                      id="edit-slug"
                      name="slug"
                      defaultValue={event.slug}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-visibility">Visibility *</Label>
                    <Select name="visibility" defaultValue={event.visibility}>
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
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select name="status" defaultValue={event.status}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-summary">Summary</Label>
                  <Input
                    id="edit-summary"
                    name="summary"
                    defaultValue={event.summary}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Full Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={event.description_md}
                    rows={4}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-lg">Date & Time</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start">Start Date/Time *</Label>
                    <Input
                      id="edit-start"
                      name="start_at"
                      type="datetime-local"
                      defaultValue={event.start_at?.slice(0, 16)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end">End Date/Time *</Label>
                    <Input
                      id="edit-end"
                      name="end_at"
                      type="datetime-local"
                      defaultValue={event.end_at?.slice(0, 16)}
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
                      checked={editIsVirtual}
                      onChange={(e) => setEditIsVirtual(e.target.checked)}
                      className="size-4"
                    />
                    <span className="text-sm font-medium">Virtual Event</span>
                  </label>
                </div>

                {editIsVirtual ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-stream_url">Stream URL *</Label>
                    <Input
                      id="edit-stream_url"
                      name="stream_url"
                      type="url"
                      defaultValue={event.stream_url}
                      placeholder="https://zoom.us/j/123456789"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your Zoom, YouTube Live, or other streaming platform URL
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Venue: {event.venue_name || "Not set"}
                    <p className="mt-1">
                      Venue changes must be done through the organizer dashboard
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Additional Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-cover_image_url">Cover Image URL</Label>
                  <Input
                    id="edit-cover_image_url"
                    name="cover_image_url"
                    type="url"
                    defaultValue={event.cover_image_url}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
