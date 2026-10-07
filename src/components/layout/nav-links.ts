/** "/" is the projects home, so project detail pages keep it highlighted. */
export function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/projects");
  return pathname === href || pathname.startsWith(`${href}/`);
}
