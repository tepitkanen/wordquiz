import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

it("offers both directions, Suomi → English first", () => {
  render(<Home />);
  const links = screen.getAllByRole("link");
  expect(links.map((l) => l.textContent)).toEqual(["Suomi → English", "English → Suomi"]);
  expect(links[0]).toHaveAttribute("href", "/quiz/fi-en");
  expect(links[1]).toHaveAttribute("href", "/quiz/en-fi");
});

it("shows the logo with the app name as the main heading", () => {
  const { container } = render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sanavisa");
  // The icon is decorative, so screen readers skip it and read the wordmark.
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});

it("groups the direction links for screen readers", () => {
  render(<Home />);
  expect(screen.getByRole("navigation", { name: "Suunta / Direction" })).toBeInTheDocument();
  expect(screen.getAllByRole("heading")).toHaveLength(1);
});
