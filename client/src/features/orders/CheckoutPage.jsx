import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ordersApi from "./orders.api";
import paymentsApi from "@/features/payments/payments.api";
import { queryKeys } from "@/utils/queryKeys";
import { formatCurrency } from "@/lib/utils";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const eventId = searchParams.get("eventId");

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => ordersApi.get(orderId),
    enabled: !!orderId,
  });

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => import("@/features/events/events.api").then(m => m.eventsApi.get(eventId)),
    enabled: !!eventId,
  });

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order found");
      
      // Update order with customer info first
      await ordersApi.updateTotals(order.id, {
        customer_address_line1: formData.addressLine1,
        customer_address_line2: formData.addressLine2,
        customer_city: formData.city,
        customer_state_code: formData.state,
        customer_postal_code: formData.postalCode,
        customer_country_code: formData.country,
      });

      // Create Stripe checkout session
      const session = await paymentsApi.createCheckoutSession({
        order_id: order.id,
      });

      return session;
    },
    onSuccess: async (session) => {
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && session.checkout_url) {
        window.location.href = session.checkout_url;
      }
    },
    onError: (error) => {
      console.error("Checkout error:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.lastName) {
      alert("Please fill in required fields");
      return;
    }
    checkoutMutation.mutate();
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Order not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Checkout</h1>
        {event && (
          <p className="text-muted-foreground mt-2">
            {event.title}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal_cents / 100)}</span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_cents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Fees</span>
                <span>{formatCurrency(order.fees_cents / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_cents / 100)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total_cents / 100)}</span>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.ticket_type_name} x {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total_cents / 100)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter your details to complete the purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine1: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine2: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatCurrency(order.total_cents / 100)}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}