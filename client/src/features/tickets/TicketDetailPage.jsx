import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Download, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ticketsApi from "./tickets.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";
import TicketQRCode from "./TicketQRCode";

export default function TicketDetailPage() {
  const { id } = useParams();

  // Fetch ticket details
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
  });

  const ticket = data?.ticket;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Ticket not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ticket Details</h1>
        <p className="text-muted-foreground mt-2">
          Your event ticket information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ticket Information */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Event</div>
              <div className="text-lg font-semibold">{ticket.event_title || "N/A"}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Ticket Code</div>
              <div className="text-lg font-mono">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {ticket.short_code}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Ticket Type</div>
              <div className="text-lg">{ticket.ticket_type_name || "General"}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge>{ticket.status}</Badge>
            </div>

            {ticket.event_start && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" />
                  Event Date
                </div>
                <div className="text-lg">
                  {new Date(ticket.event_start).toLocaleString()}
                </div>
              </div>
            )}

            {ticket.issued_at && (
              <div>
                <div className="text-sm text-muted-foreground">Issued At</div>
                <div className="text-sm">
                  {new Date(ticket.issued_at).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>
              Show this QR code at the event entrance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <TicketQRCode ticketId={ticket.id} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.open(`/api/tickets/${ticket.id}/qr`, "_blank");
                }}
              >
                <Download className="size-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}