
import { Icons } from "@/components/icons";
import Link from "next/link";

export function SiteFooter() {
  const footerLinks = [
      { href: "/news", label: "News" },
      { href: "/insights", label: "Insights" },
      { href: "/feed", label: "Feed" },
      { href: "/story", label: "Our Story" },
  ];

  return (
    <footer className="border-t py-8 md:py-12 bg-background/50 relative">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col gap-4 items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <Icons.logo />
                        </Link>
                        <p className="text-sm text-muted-foreground">Tech News 🔥 Data Talks</p>
                    </div>
                    <div className="flex flex-col gap-2 items-center">
                        <h3 className="font-bold text-lg">Quick Links</h3>
                        <nav className="flex flex-col gap-2 items-center">
                            {footerLinks.map((link) => (
                                <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2 items-center">
                         <h3 className="font-bold text-lg">Follow Us</h3>
                        <div className="flex gap-4 justify-center">
                            <a href="https://twitter.com/dev_bime" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Icons.twitter className="h-6 w-6" /></a>
                            <a href="https://youtube.com/bime_talks" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Icons.youtube className="h-6 w-6" /></a>
                            <a href="https://instagram.com/bime_tech" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Icons.instagram className="h-6 w-6" /></a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground space-y-2">
                     <p>&copy; {new Date().getFullYear()} Tech Ink Insights. All Rights Reserved.</p>
                     <p className="flex items-center justify-center gap-1.5">
                        Made with <Icons.heart className="h-4 w-4 text-red-500 fill-current" /> by Bime
                    </p>
                </div>
            </div>
        </div>
    </footer>
  );
}
