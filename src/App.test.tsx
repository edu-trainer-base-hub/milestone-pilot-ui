import { render, screen } from "@testing-library/react";
import App from "./App";
import { expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

it("shows Home link", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(screen.getByText("menu.categories.all")).toBeInTheDocument();
});
