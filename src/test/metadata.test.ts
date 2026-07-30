import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import readme from "../../README.md?raw";
import deployment from "../../docs/deployment.md?raw";
import { injectSiteUrl, resolveSiteUrl, ROUTEVIEW } from "@/lib/siteConfig";

describe("public metadata", () => {
  it("uses correctly encoded title text", () => {
    expect(html).toContain("RouteView — X32/M32 Scene Routing Documentation");
    expect(html).not.toContain("â€”");
  });

  it("renders valid production JSON-LD and canonical metadata", () => {
    const rendered = injectSiteUrl(html, ROUTEVIEW.productionUrl);
    const jsonLdBlock = rendered.match(
      /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i,
    );

    expect(jsonLdBlock).not.toBeNull();
    const metadata = JSON.parse(jsonLdBlock![1]);

    expect(metadata["@context"]).toBe("https://schema.org/");
    expect(metadata["@type"]).toBe("SoftwareApplication");
    expect(metadata.name).toBe("RouteView");
    expect(metadata.url).toBe(`${ROUTEVIEW.productionUrl}/`);
    expect(rendered).toContain(`<link rel="canonical" href="${ROUTEVIEW.productionUrl}/" />`);
    expect(rendered).toContain(`<meta property="og:url" content="${ROUTEVIEW.productionUrl}/" />`);
  });

  it("uses safe public URL defaults and rejects values that are not origins", () => {
    expect(resolveSiteUrl(undefined)).toBe(ROUTEVIEW.localUrl);
    expect(resolveSiteUrl("javascript:alert(1)", ROUTEVIEW.productionUrl)).toBe(ROUTEVIEW.productionUrl);
    expect(resolveSiteUrl("https://example.com/")).toBe("https://example.com");
    expect(resolveSiteUrl("https://example.com/path", ROUTEVIEW.productionUrl)).toBe(ROUTEVIEW.productionUrl);
    expect(resolveSiteUrl("https://example.com/?preview=1", ROUTEVIEW.productionUrl)).toBe(ROUTEVIEW.productionUrl);
    expect(resolveSiteUrl("https://example.com/#preview", ROUTEVIEW.productionUrl)).toBe(ROUTEVIEW.productionUrl);
    expect(resolveSiteUrl("https://user:pass@example.com", ROUTEVIEW.productionUrl)).toBe(ROUTEVIEW.productionUrl);
  });

  it("documents the branded production origin and Vercel configuration", () => {
    expect(readme).toContain(ROUTEVIEW.productionUrl);
    expect(deployment).toContain(`VITE_SITE_URL=${ROUTEVIEW.productionUrl}`);
    expect(deployment).toContain("generated `*.vercel.app` hostname");
  });
});
