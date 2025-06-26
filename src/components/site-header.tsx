
"use client";

import * as React from "react";
import Link from "next/link";
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
import { startLoader } from "@/lib/loader-events";
import { BrainCircuit } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

const navLinks = [
    { href: "/news", label: "News", icon: <Icons.news className="h-5 w-5" /> },
    { href: "/insights", label: "Insights", icon: <Icons.insights className="h-5 w-5" /> },
    { href: "/feed", label: "Feed", icon: <Icons.feed className="h-5 w-5" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Icons.trophy className="h-5 w-5" /> },
    { href: "/analysis", label: "Analysis", icon: <BrainCircuit className="h-5 w-5" /> },
];

const NavLinkItems = ({ isMobile = false, closeSheet }: { isMobile?: boolean, closeSheet?: () => void }) => {
    const pathname = usePathname();
    const handleLinkClick = (href: string) => {
        if (pathname !== href) {
            startLoader();
        }
        if (isMobile && closeSheet) {
            closeSheet();
        }
    };
    return (
        <>
            {navLinks.map((link) => {
                const linkComponent = (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => handleLinkClick(link.href)}
                        className={cn(
                            "flex items-center gap-2 transition-colors hover:text-primary",
                            pathname === link.href ? "text-primary font-semibold" : "text-foreground/70",
                            isMobile && "text-lg w-full p-4 rounded-lg hover:bg-muted"
                        )}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </Link>
                );
                return isMobile ? <div key={link.href}>{linkComponent}</div> : linkComponent;
            })}
        </>
    );
};

export function SiteHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);


  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }
  
  const UserActions = () => {
      if (!user) {
          return (
               <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login" onClick={() => pathname !== '/login' && startLoader()}>Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup" onClick={() => pathname !== '/signup' && startLoader()}>Sign Up</Link>
                    </Button>
                </div>
          )
      }
      return (
           <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Icons.pen className="h-4 w-4" />
                <span>{profile?.points ?? 0}</span>
                </div>
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
                        <Link href="/settings" onClick={() => pathname !== '/settings' && startLoader()}>
                            <Icons.cog className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
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
            <Link href="/" className="flex items-center gap-2" onClick={() => pathname !== '/' && startLoader()}>
                <Icons.logo />
            </Link>
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
                    <Link href="/" className="flex items-center gap-2" onClick={() => {if(pathname !== '/') startLoader(); setIsMobileSheetOpen(false);}}>
                        <Icons.logo />
                    </Link>
                  </div>
                  <ScrollArea className="flex-1">
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
                                <div className="flex items-center gap-2 text-lg font-semibold text-primary p-4 rounded-lg bg-muted">
                                    <Icons.pen className="h-5 w-5" />
                                    <span>{profile?.points ?? 0} Ink Points</span>
                                </div>
                                 <SheetClose asChild>
                                    <Button variant="secondary" asChild className="w-full justify-start text-base p-4">
                                        <Link href="/settings" onClick={() => pathname !== '/settings' && startLoader()}><Icons.cog className="mr-2 h-5 w-5" />Settings</Link>
                                    </Button>
                                </SheetClose>
                                 <SheetClose asChild>
                                    <Button onClick={handleSignOut} variant="outline" className="w-full justify-start text-base p-4"><Icons.logout className="mr-2 h-5 w-5" />Log out</Button>
                                </SheetClose>
                            </div>
                         ) : (
                            <div className="grid gap-2">
                                <SheetClose asChild>
                                    <Button variant="outline" asChild><Link href="/login">Login</Link></Button>
                                </SheetClose>
                                 <SheetClose asChild>
                                    <Button asChild><Link href="/signup">Sign Up</Link></Button>
                                </SheetClose>
                            </div>
                         )}
                        </div>
                  </ScrollArea>
                    <div className="mt-auto flex flex-col items-center gap-4 p-6 border-t">
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
