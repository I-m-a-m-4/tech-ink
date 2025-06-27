
"use client";

import * as React from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "./ui/separator";
import { BackgroundSwitcher } from "./background-switcher";
import { useRouter } from "next/navigation";
import { Shield } from 'lucide-react';
import { ClientLink } from "./client-link";
import { Skeleton } from "./ui/skeleton";

const navLinks = [
    { href: "/news", label: "News", icon: <Icons.news className="h-5 w-5" /> },
    { href: "/insights", label: "Insights", icon: <Icons.insights className="h-5 w-5" /> },
    { href: "/feed", label: "Feed", icon: <Icons.feed className="h-5 w-5" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Icons.trophy className="h-5 w-5" /> },
];

const NavLinkItems = ({ isMobile = false, closeSheet }: { isMobile?: boolean, closeSheet?: () => void }) => {
    const pathname = usePathname();

    const linkContent = (link: typeof navLinks[0]) => (
         <ClientLink
            href={link.href}
            onClick={isMobile ? closeSheet : undefined}
            className={cn(
                "flex items-center gap-2 transition-colors hover:text-primary",
                pathname === link.href ? "text-primary font-semibold" : "text-foreground/70",
                isMobile && "text-lg w-full p-4 rounded-lg hover:bg-muted"
            )}
        >
            {link.icon}
            <span>{link.label}</span>
        </ClientLink>
    );

    return (
        <>
            {navLinks.map((link) => {
                if (isMobile) {
                    return (
                        <SheetClose asChild key={link.href}>
                           {linkContent(link)}
                        </SheetClose>
                    );
                }
                return <React.Fragment key={link.href}>{linkContent(link)}</React.Fragment>;
            })}
        </>
    );
};


export function SiteHeader() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const isAdmin = user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "bimex4@gmail.com").toLowerCase();


  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }
  
  const UserActions = () => {
      if (authLoading) {
          return (
              <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-9 w-9 rounded-full" />
              </div>
          )
      }

      if (!user) {
          return (
               <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <ClientLink href="/login">Login</ClientLink>
                    </Button>
                    <Button asChild>
                        <ClientLink href="/signup">Sign Up</ClientLink>
                    </Button>
                </div>
          )
      }
      return (
           <div className="flex items-center gap-4">
                {isAdmin ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Icons.pen className="h-4 w-4" />
                        <span>{profile?.points ?? 0}</span>
                    </div>
                )}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
                        <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                        {user.displayName ?? 'Welcome'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <ClientLink href="/settings">
                            <Icons.cog className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </ClientLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                    <Icons.logout className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
      )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <div className="flex-1 flex justify-start">
            <ClientLink href="/" className="flex items-center gap-2">
                <Icons.logo />
            </ClientLink>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
           <NavLinkItems />
        </nav>

        <div className="flex flex-1 justify-end items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <UserActions />
              <Separator orientation="vertical" className="h-6" />
              <BackgroundSwitcher />
            </div>

            <div className="flex md:hidden">
               <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Icons.menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] p-0 flex flex-col">
                  <div className="p-6 border-b">
                    <SheetClose asChild>
                        <ClientLink href="/" className="flex items-center gap-2">
                            <Icons.logo />
                        </ClientLink>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-2 p-4">
                      <NavLinkItems isMobile={true} closeSheet={() => setIsMobileSheetOpen(false)} />
                  </nav>
                  <Separator />
                   <div className="p-4">
                     {user ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
                                    <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium leading-none">{user.displayName ?? 'Welcome'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                             {isAdmin ? (
                                <div className="flex items-center gap-2 text-lg font-semibold text-amber-400 p-4 rounded-lg bg-muted">
                                    <Shield className="h-5 w-5" />
                                    <span>Admin Account</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-lg font-semibold text-primary p-4 rounded-lg bg-muted">
                                    <Icons.pen className="h-5 w-5" />
                                    <span>{profile?.points ?? 0} Insight Points</span>
                                </div>
                            )}
                             <SheetClose asChild>
                                <Button onClick={handleSignOut} variant="outline" className="w-full">Log out</Button>
                            </SheetClose>
                        </div>
                     ) : (
                        <div className="grid gap-2">
                            <SheetClose asChild>
                                <Button variant="outline" asChild><ClientLink href="/login">Login</ClientLink></Button>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild><ClientLink href="/signup">Sign Up</ClientLink></Button>
                            </SheetClose>
                        </div>
                     )}
                    </div>
                    <div className="mt-auto flex flex-col items-center gap-4 p-6 border-t">
                        <SheetClose asChild>
                            <Button variant="secondary" asChild className="w-full">
                                <ClientLink href="/settings">Settings</ClientLink>
                            </Button>
                        </SheetClose>
                      <BackgroundSwitcher />
                      <div className="text-center text-xs text-muted-foreground">
                          &copy; {new Date().getFullYear()} Tech Ink Insights
                      </div>
                    </div>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
