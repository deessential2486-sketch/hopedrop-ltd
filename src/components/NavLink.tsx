import { Link } from "@tanstack/react-router";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type NavLinkCompatProps = Omit<ComponentProps<"a">, "href"> & {
  to: string;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    const LinkAny = Link as unknown as React.ComponentType<Record<string, unknown>>;
    return (
      <LinkAny
        ref={ref}
        to={to}
        className={cn(className)}
        activeProps={{ className: cn(className, activeClassName) }}
        inactiveProps={{ className: cn(className) }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
