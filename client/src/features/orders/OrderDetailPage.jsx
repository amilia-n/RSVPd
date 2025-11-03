import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ordersApi from "./orders.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";

export default function OrderDetailPage() {
  const { id } = useParams();

  // Fetch order details
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });

  const order = data?.order;

  if (isLoading) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={PATHS.attendee}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Order Details</h1>
        <p className="text-muted-foreground mt-2">
          Order information and items
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="text-lg font-mono">
                {order.id.slice(0, 8)}...
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className="mt-1">{order.status}</Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">
                ${(order.total_cents / 100).toFixed(2)}
              </div>
            </div>

            {order.subtotal_cents > 0 && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-green-600">-${(order.discount_cents / 100).toFixed(2)}</span>
                  </div>
                )}
                {order.fees_cents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees:</span>
                    <span>${(order.fees_cents / 100).toFixed(2)}</span>
                  </div>
                )}
                {order.tax_cents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>${(order.tax_cents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="size-4" />
                Order Date
              </div>
              <div className="text-sm">
                {new Date(order.created_at).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Purchaser Email</div>
              <div className="text-sm">{order.purchaser_email}</div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            {order.items && order.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.ticket_type_name}
                        {item.ticket_type_kind && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {item.ticket_type_kind}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.unit_price_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(item.total_cents / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No items in this order
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Tickets Button */}
      {order.status === 'PAID' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Your Tickets</h3>
                <p className="text-sm text-muted-foreground">
                  View and download your tickets for this order
                </p>
              </div>
              <Button asChild>
                <Link to={PATHS.attendee}>
                  View My Tickets
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
