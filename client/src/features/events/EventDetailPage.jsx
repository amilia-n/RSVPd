import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, MapPin, ShoppingCart, X, User, Building2, Users, Mic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import eventsApi from "./events.api";
import ticketTypesApi from "@/features/ticketTypes/ticketTypes.api";
import ordersApi from "@/features/orders/orders.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";
import { formatCurrency } from "@/lib/utils";
import { useMe } from "@/features/users/useMe";

// Cart Side Panel Component
function CartPanel({ ticketTypes, selectedTickets, onQuantityChange, cartTotal, onCheckout, isOpen, onClose, isLoading }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
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
                const maxQty = ticketType.per_user_limit || ticketType.per_order_limit || 10;

                return (
                  <div key={ticketType.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{ticketType.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(ticketType.price_cents / 100)}
                        </p>
                        {(ticketType.per_user_limit || ticketType.per_order_limit) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {ticketType.per_user_limit && `Max ${ticketType.per_user_limit} per person`}
                            {ticketType.per_user_limit && ticketType.per_order_limit && " • "}
                            {ticketType.per_order_limit && `Max ${ticketType.per_order_limit} per order`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onQuantityChange(ticketType.id, Math.max(0, selectedQty - 1))}
                          disabled={selectedQty === 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={maxQty}
                          value={selectedQty}
                          onChange={(e) => onQuantityChange(ticketType.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onQuantityChange(ticketType.id, Math.min(maxQty, selectedQty + 1))}
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

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      // Create the order
      const orderResponse = await ordersApi.create(data);
      const orderId = orderResponse?.order?.id;

      if (!orderId) {
        throw new Error('No order ID returned from server');
      }

      // Add items to the order
      const items = Object.entries(selectedTickets)
        .filter(([, qty]) => qty > 0)
        .map(([ticketTypeId, quantity]) => {
          const ticketType = ticketTypes?.rows?.find((t) => t.id === ticketTypeId);
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Cart Panel for logged-in users */}
      {user && (
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
              <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={event.status === "PUBLISHED" ? "default" : "outline"}>
                  {event.event_type}
                </Badge>
                <Badge variant="outline">{event.status}</Badge>
              </div>
            </div>
            {/* Cart Toggle Button for logged-in users */}
            {user && (
              <Button
                variant="outline"
                onClick={() => setCartOpen(!cartOpen)}
                className="relative"
              >
                <ShoppingCart className="size-4 mr-2" />
                Cart
                {Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full size-5 flex items-center justify-center text-xs">
                    {Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)}
                  </span>
                )}
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
                <span className="text-sm text-muted-foreground">Organizer:</span>{" "}
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
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="size-5" />
                Vendors
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vendors.map((vendor) => (
                  <Card key={vendor.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <User className="size-10 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.email && (
                            <div className="text-sm text-muted-foreground">{vendor.email}</div>
                          )}
                          {vendor.phone && (
                            <div className="text-sm text-muted-foreground">{vendor.phone}</div>
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
          {!user && (
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
    </div>
  );
}