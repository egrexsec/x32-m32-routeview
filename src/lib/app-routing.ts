export type AppRoute = "index" | "not-found";

export const resolveRoute = (pathname: string): AppRoute => (pathname === "/" ? "index" : "not-found");
