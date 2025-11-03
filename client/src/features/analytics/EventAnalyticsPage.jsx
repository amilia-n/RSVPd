import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, DollarSign, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import analyticsApi from "./analytics.api";
import { queryKeys } from "@/utils/queryKeys";
import { formatCurrency } from "@/lib/utils";

export default function EventAnalyticsPage() {
  const { id } = useParams();

  const { data: analytics, isLoading } = useQuery({
    queryKey: queryKeys.events.analytics(id),
    queryFn: () => analyticsApi.eventAnalytics(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive event performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.total_revenue_for_event?.paid_revenue
                ? formatCurrency(analytics.total_revenue_for_event.paid_revenue / 100)
                : "$0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.event_performance_summary?.total_tickets_sold || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-Ins</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.event_performance_summary?.attendees_checked_in || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.event_performance_summary?.total_orders || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Ticket Type */}
      {analytics?.ticket_sales_by_type && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Ticket Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket Type</TableHead>
                  <TableHead>Tickets Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.ticket_sales_by_type.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.ticket_type_name}
                    </TableCell>
                    <TableCell>{item.tickets_sold || 0}</TableCell>
                    <TableCell>
                      {formatCurrency((item.revenue_cents || 0) / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}