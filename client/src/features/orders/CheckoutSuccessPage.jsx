import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Ticket, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import ticketsApi from "@/features/tickets/tickets.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tickets for order
  const { data: orderTickets } = useQuery({
    queryKey: queryKeys.tickets.listForOrder(orderId),
    queryFn: () => ticketsApi.listForOrder(orderId),
    enabled: !!orderId,
    refetchInterval: 2000, // Poll for tickets until they're issued
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (orderTickets && orderTickets.length > 0) {
      setTickets(orderTickets);
      setLoading(false);
    }
  }, [orderTickets]);

  if (loading && !tickets.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner className="size-8 mb-4" />
            <p className="text-muted-foreground">
              Processing your order... Your tickets will appear shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Alert>
        <CheckCircle2 className="size-4 text-green-600" />
        <AlertDescription className="text-green-600">
          Payment successful! Your tickets have been issued.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Order Confirmation</CardTitle>
          <CardDescription>
            Your tickets are ready. You can view or download them below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="border-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Ticket className="size-8 text-primary" />
                  <div>
                    <p className="font-semibold">Ticket #{ticket.short_code}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.ticket_type_name || "General Admission"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={PATHS.ticketDetail(ticket.id)}>
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Download QR code
                      window.open(`/api/tickets/${ticket.id}/qr`, "_blank");
                    }}
                  >
                    <Download className="size-4 mr-2" />
                    QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="pt-4 border-t flex gap-2">
            <Button asChild>
              <Link to={PATHS.attendee}>Go to My Tickets</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={PATHS.home}>Browse More Events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}