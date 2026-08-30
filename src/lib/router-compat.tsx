/**
 * Thin compatibility layer so the app's pages can keep their familiar
 * router API while the project runs on TanStack Router.
 */
import { forwardRef } from "react";
import {
  Link as TanStackLink,
  useNavigate as useTanStackNavigate,
  useLocation as useTanStackLocation,
  useRouter,
} from "@tanstack/react-router";

type AnyProps = Record<string, unknown>;

export const Link = forwardRef<HTMLAnchorElement, { to: string } & AnyProps>(
  ({ to, ...props }, ref) => {
    const LinkAny = TanStackLink as unknown as React.ComponentType<AnyProps>;
    return <LinkAny ref={ref} to={to} {...props} />;
  },
);
Link.displayName = "Link";

export const NavLink = Link;

export function useLocation() {
  const location = useTanStackLocation();
  return {
    pathname: location.pathname,
    search: location.searchStr,
    hash: location.hash,
    state: location.state,
  };
}

export function useNavigate() {
  const navigate = useTanStackNavigate();
  const router = useRouter();

  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      router.history.go(to);
      return;
    }
    navigate({ to, replace: options?.replace } as never);
  };
}
