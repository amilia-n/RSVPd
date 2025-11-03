import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ticketsApi from "./tickets.api";
import { queryKeys } from "@/utils/queryKeys";

export default function TicketQRCode({ ticketId }) {
  const { data: qrDataURL, isLoading, error } = useQuery({
    queryKey: queryKeys.tickets.qr(ticketId),
    queryFn: () => ticketsApi.qrDataURL(ticketId),
    enabled: !!ticketId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !qrDataURL) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load QR code</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg">
      <img
        src={qrDataURL}
        alt="Ticket QR Code"
        className="w-64 h-64 mx-auto"
      />
    </div>
  );
}