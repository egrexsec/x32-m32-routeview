import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { resolveRoute } from "./lib/app-routing.ts";

const App = () => {
  const route = resolveRoute(window.location.pathname);

  return (
    <TooltipProvider>
      <Sonner />
      {route === "index" ? <Index /> : <NotFound />}
    </TooltipProvider>
  );
};

export default App;
