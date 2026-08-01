export const ROUTEVIEW = {
  name: "RouteView",
  productionUrl: "https://routeview.mell0wx.tech",
  localUrl: "http://localhost:8080",
  portfolioUrl: "https://mell0wx.tech",
  repositoryUrl: "https://github.com/egrexsec/x32-m32-routeview",
  description:
    "Turn Behringer X32 and Midas M32 scene files into readable routing documentation and production handoff guides.",
} as const;

export function resolveSiteUrl(value: string | undefined, fallback: string = ROUTEVIEW.localUrl) {
  if (!value) return fallback;

  try {
    const url = new URL(value);
    const isHttpOrigin = url.protocol === "http:" || url.protocol === "https:";
    const hasOnlyOrigin =
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;

    if (!isHttpOrigin || !hasOnlyOrigin) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

export function injectSiteUrl(template: string, siteUrl: string) {
  return template.split("__ROUTEVIEW_SITE_URL__").join(resolveSiteUrl(siteUrl));
}
