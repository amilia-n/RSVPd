import { useQuery } from "@tanstack/react-query";
import {
  Ticket,
  ShoppingBag,
  Calendar,
  Bell,
  FileText,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import ticketsApi from "@/features/tickets/tickets.api";
import ordersApi from "@/features/orders/orders.api";
import surveysApi from "@/features/surveys/surveys.api";
import notificationsApi from "@/features/notifications/notifications.api";
import { queryKeys } from "@/utils/queryKeys";
import { PATHS } from "@/routes/paths";
import { Link } from "react-router-dom";

export default function AttendeeDashboardPage() {
  // Fetch user's tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: queryKeys.tickets.listForUser(),
    queryFn: () => ticketsApi.listForUser(),
  });

  // Fetch user's orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: queryKeys.orders.listForUser(),
    queryFn: () => ordersApi.listForUser(),
  });
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: () => notificationsApi.listForUser({ limit: 10 }),
  });

  // Fetch user's surveys
  const { data: mySurveys } = useQuery({
    queryKey: ["surveys", "me"],
    queryFn: () => surveysApi.listForUser(),
  });
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your tickets and orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Tickets</CardTitle>
            <Ticket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="text-2xl font-bold">
                {tickets?.rows?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Spinner className="size-4" />
            ) : (
              <div className="text-2xl font-bold">
                {orders?.rows?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets?.rows?.filter(
                (t) => new Date(t.event_start) > new Date()
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Inbox / Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-5" />
            <CardTitle>Inbox & Notifications</CardTitle>
          </div>
          <CardDescription>
            Messages and surveys from event organizers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Surveys */}
            {mySurveys?.rows && mySurveys.rows.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="size-4" />
                  Surveys (
                  {
                    mySurveys.rows.filter(
                      (s) => s.recipient_status !== "SUBMITTED"
                    ).length
                  }{" "}
                  pending)
                </h3>
                {mySurveys.rows.map((survey) => (
                  <div
                    key={survey.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{survey.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {survey.event_title}
                        </p>
                        <Badge
                          variant={
                            survey.recipient_status === "SUBMITTED"
                              ? "default"
                              : survey.recipient_status === "DRAFT"
                              ? "secondary"
                              : "outline"
                          }
                          className="mt-2"
                        >
                          {survey.recipient_status}
                        </Badge>
                      </div>
                      {survey.recipient_status !== "SUBMITTED" && (
                        <Link to={`/surveys/${survey.id}/respond`}>
                          <Button size="sm" variant="outline">
                            {survey.recipient_status === "DRAFT"
                              ? "Continue"
                              : "Start Survey"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications */}
            {notifications?.rows && notifications.rows.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Bell className="size-4" />
                  Recent Notifications
                </h3>
                {notifications.rows.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="p-3 border rounded-lg text-sm">
                    <p className="font-medium">{notif.title}</p>
                    {notif.body_md && (
                      <p className="text-muted-foreground mt-1">
                        {notif.body_md}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(!mySurveys?.rows || mySurveys.rows.length === 0) &&
              (!notifications?.rows || notifications.rows.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications or surveys</p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Your event tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : tickets?.rows && tickets.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Ticket Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.rows.slice(0, 5).map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.event_title || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.short_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.event_start
                        ? new Date(ticket.event_start).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={PATHS.ticketDetail(ticket.id)}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tickets yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your purchase history</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : orders?.rows && orders.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.rows.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      ${(order.total_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={PATHS.orderDetail(order.id)}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No orders yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
