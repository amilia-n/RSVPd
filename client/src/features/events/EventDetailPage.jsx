import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useMe();
  const [selectedTickets, setSelectedTickets] = useState({});
  const [cartTotal, setCartTotal] = useState(0);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
  });

  // Fetch ticket types
  const { data: ticketTypes, isLoading: ticketTypesLoading } = useQuery({
    queryKey: queryKeys.ticketTypes.listForEvent(id),
    queryFn: () => ticketTypesApi.listForEvent(id),
    enabled: !!id,
  });

  // Fetch availability for each ticket type
  const availabilityQueries = (ticketTypes?.rows || []).map((tt) =>
    useQuery({
      queryKey: queryKeys.ticketTypes.availability(tt.id),
      queryFn: () => ticketTypesApi.availability(tt.id),
      enabled: !!tt.id,
    })
  );

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: (order) => {
      navigate(`${PATHS.checkout}?orderId=${order.id}&eventId=${id}`);
    },
  });

  const handleQuantityChange = (ticketTypeId, quantity) => {
    const qty = parseInt(quantity) || 0;
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
      .filter(([_, qty]) => qty > 0)
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

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!event) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Event not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl">{event.title}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {event.summary || "No description available"}
              </CardDescription>
            </div>
            <Badge variant={event.status === "PUBLISHED" ? "default" : "outline"}>
              {event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.start_at && (
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-muted-foreground" />
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
          )}
          {event.venue_name && (
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-muted-foreground" />
              <span>{event.venue_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>Select tickets to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          {ticketTypesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : ticketTypes?.rows && ticketTypes.rows.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketTypes.rows.map((ticketType) => {
                    const availability =
                      availabilityQueries.find((q) =>
                        q.queryKey.includes(ticketType.id)
                      )?.data;
                    const available =
                      availability?.available ?? ticketType.quantity_total ?? 0;
                    const selectedQty = selectedTickets[ticketType.id] || 0;

                    return (
                      <TableRow key={ticketType.id}>
                        <TableCell className="font-medium">
                          {ticketType.name}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(ticketType.price_cents / 100)}
                        </TableCell>
                        <TableCell>
                          {available > 0 ? (
                            <Badge variant="outline">{available} left</Badge>
                          ) : (
                            <Badge variant="destructive">Sold Out</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={available}
                            value={selectedQty}
                            onChange={(e) =>
                              handleQuantityChange(ticketType.id, e.target.value)
                            }
                            className="w-20"
                            disabled={available === 0}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(
                            (ticketType.price_cents * selectedQty) / 100
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {cartTotal > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-lg font-semibold">Total</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(cartTotal / 100)}
                  </div>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={cartTotal === 0 || createOrderMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createOrderMutation.isPending ? (
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
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tickets available for this event
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}