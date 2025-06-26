
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center text-center px-4">
        <div className="max-w-md">
            <h1 className="text-9xl font-extrabold text-primary">404</h1>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Page Not Found</h2>
            <p className="mt-4 text-lg text-muted-foreground">
                Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or maybe it never existed.
            </p>
            <Button asChild className="mt-8">
                <Link href="/">Go Back Home</Link>
            </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
