import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authClient } from "@/lib/auth-client";
import { AccountMenu } from "./AccountMenu";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: { social: vi.fn() },
    signOut: vi.fn(),
  },
}));

const useSession = vi.mocked(authClient.useSession);

function mockSession(session: { user: { name: string } } | null, isPending = false) {
  useSession.mockReturnValue({ data: session, isPending } as unknown as ReturnType<
    typeof authClient.useSession
  >);
}

beforeEach(() => vi.clearAllMocks());

describe("AccountMenu", () => {
  it("shows nothing clickable while the session loads", () => {
    mockSession(null, true);
    render(<AccountMenu />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("signs in with Google when signed out", async () => {
    const user = userEvent.setup();
    mockSession(null);
    render(<AccountMenu />);
    await user.click(screen.getByRole("button", { name: "Kirjaudu / Sign in" }));
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("shows the user's name and a sign-out menu when signed in", async () => {
    const user = userEvent.setup();
    mockSession({ user: { name: "Maija" } });
    render(<AccountMenu />);

    const toggle = screen.getByRole("button", { name: /Maija/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /Sign out/ })).toBeNull();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Kirjaudu ulos / Sign out" }));
    expect(authClient.signOut).toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus to Sign in after signing out", async () => {
    const user = userEvent.setup();
    mockSession({ user: { name: "Maija" } });
    const { rerender } = render(<AccountMenu />);
    await user.click(screen.getByRole("button", { name: /Maija/ }));
    await user.click(screen.getByRole("button", { name: "Kirjaudu ulos / Sign out" }));

    mockSession(null);
    rerender(<AccountMenu />);
    expect(screen.getByRole("button", { name: "Kirjaudu / Sign in" })).toHaveFocus();
  });

  it("closes the menu on Escape and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    mockSession({ user: { name: "Maija" } });
    render(<AccountMenu />);
    const toggle = screen.getByRole("button", { name: /Maija/ });

    await user.click(toggle);
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });
});
