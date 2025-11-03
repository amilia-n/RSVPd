import { Link, useNavigate } from "react-router-dom";
import { useMe } from "@/features/users/useMe";
import { MagicBell } from "@magicbell/magicbell-react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { PATHS } from "@/routes/paths";
import { ROLES } from "@/constants/roles";
import authApi from "@/features/auth/auth.api";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/utils/queryKeys";

export default function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading } = useMe();

  // Fetch MagicBell HMAC for authenticated users
  const { data: magicBellAuth } = useQuery({
    queryKey: ['magicbell-hmac', user?.id],
    queryFn: async () => {
      const response = await authApi.getMagicBellHmac();
      return response.data;
    },
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 1000 * 60 * 5,
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false,
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
      queryClient.setQueryData(queryKeys.auth.me, null);
      navigate(PATHS.login);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={PATHS.home} className="flex items-center gap-2">
              <img src="/icon.png" alt="RSVP" className="size-6" />
              <span className="font-bold text-lg">RSVP</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-4">
                <Link to={PATHS.home}>
                  <Button variant="ghost" size="sm">
                    Events
                  </Button>
                </Link>
                {hasRole(ROLES.ADMIN) && (
                  <Link to={PATHS.admin}>
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                {(hasRole(ROLES.ORGANIZER) || hasRole(ROLES.ADMIN)) && (
                  <Link to={PATHS.organizer}>
                    <Button variant="ghost" size="sm">
                      Organizer
                    </Button>
                  </Link>
                )}
                {hasRole(ROLES.VENDOR) && (
                  <Link to={PATHS.vendor}>
                    <Button variant="ghost" size="sm">
                      Vendor
                    </Button>
                  </Link>
                )}
                {hasRole(ROLES.ATTENDEE) && (
                  <Link to={PATHS.attendee}>
                    <Button variant="ghost" size="sm">
                      My Tickets
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-20" />
            ) : user ? (
              <>
                {magicBellAuth && import.meta.env.VITE_MAGICBELL_API_KEY && (
                  <MagicBell
                    apiKey={import.meta.env.VITE_MAGICBELL_API_KEY}
                    userEmail={user.email}
                    userExternalId={magicBellAuth.userExternalId}
                    userHmac={magicBellAuth.userHmac}
                    locale="en"
                  />
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to={PATHS.login}>
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}