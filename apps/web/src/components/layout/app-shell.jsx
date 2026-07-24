import { Car, Cog, FileText, LogOut, Moon, ParkingCircle, ReceiptText, Sun, User } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context.jsx";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "../ui/dropdown-menu.jsx";

const links = [
  { to: "/parking", label: "Parking", icon: ParkingCircle },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/reservations", label: "Reservations", icon: ReceiptText },
  { to: "/invoices", label: "Invoices", icon: FileText }
];

export function AppShell() {
  const { user, theme, setTheme, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-950 dark:bg-[#090909] dark:text-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <NavLink to="/parking" className="mr-3 flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-full bg-neutral-950 text-xs text-white dark:bg-white dark:text-neutral-950">P</span>
            <span>Parkwise</span>
          </NavLink>

          <nav className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  "relative flex h-16 shrink-0 items-center gap-2 px-3 text-sm font-medium text-neutral-500 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                  isActive && "text-neutral-950 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-neutral-950 dark:text-white dark:after:bg-white"
                )}
              >
                <Icon className="size-4 sm:hidden" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open profile menu" className="shrink-0 rounded-full">
                <Cog className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex items-center gap-3 p-2">
                <span className="grid size-10 place-items-center rounded-full bg-neutral-950 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="truncate text-xs text-neutral-500">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/profile")}><User className="size-4" />Profile</DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem onSelect={() => navigate("/admin/spaces")}><ParkingCircle className="size-4" />Manage spaces</DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut} className="text-red-600 focus:text-red-700">
                <LogOut className="size-4" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Outlet />
      </main>
    </div>
  );
}
