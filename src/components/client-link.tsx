
"use client";

import Link, { type LinkProps } from "next/link";
import { startLoader } from "@/lib/loader-events";
import { usePathname } from "next/navigation";
import React from "react";

type ClientLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children?: React.ReactNode;
  } & {
    startLoaderOnClick?: boolean;
};

export const ClientLink = React.forwardRef<HTMLAnchorElement, ClientLinkProps>(({ 
    children, 
    className, 
    href, 
    onClick, 
    startLoaderOnClick = true, 
    ...props 
}, ref) => {
    const pathname = usePathname();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (startLoaderOnClick && pathname !== href.toString()) {
            startLoader();
        }
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <Link href={href} onClick={handleClick} className={className} ref={ref} {...props}>
            {children}
        </Link>
    );
});
ClientLink.displayName = "ClientLink";
