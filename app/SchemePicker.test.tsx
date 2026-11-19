import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SCHEME_INIT_SCRIPT, SCHEME_STORAGE_KEY } from "@/lib/schemes";
import { SchemePicker } from "./SchemePicker";

const root = document.documentElement;
const picker = () => screen.getByRole("combobox", { name: /Colour scheme/ });

afterEach(() => {
  delete root.dataset.scheme;
  localStorage.clear();
});

describe("SchemePicker", () => {
  it("offers the three schemes, blue by default", () => {
    render(<SchemePicker />);
    const options = within(picker()).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Sininen / Blue",
      "Vihreä / Green",
      "Violetti / Purple",
    ]);
    expect(picker()).toHaveValue("blue");
  });

  it("applies and saves the chosen scheme", async () => {
    const user = userEvent.setup();
    render(<SchemePicker />);
    await user.selectOptions(picker(), "green");
    expect(root.dataset.scheme).toBe("green");
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("green");
    expect(picker()).toHaveValue("green");

    await user.selectOptions(picker(), "blue");
    expect(root.dataset.scheme).toBeUndefined();
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("blue");
  });

  it("shows the scheme already applied to the page", () => {
    root.dataset.scheme = "purple";
    render(<SchemePicker />);
    expect(picker()).toHaveValue("purple");
  });
});

describe("SCHEME_INIT_SCRIPT", () => {
  const runInit = () => new Function(SCHEME_INIT_SCRIPT)();

  it("applies a saved scheme", () => {
    localStorage.setItem(SCHEME_STORAGE_KEY, "purple");
    runInit();
    expect(root.dataset.scheme).toBe("purple");
  });

  it("ignores unknown or default values", () => {
    localStorage.setItem(SCHEME_STORAGE_KEY, "red\"><script>");
    runInit();
    expect(root.dataset.scheme).toBeUndefined();
    localStorage.setItem(SCHEME_STORAGE_KEY, "blue");
    runInit();
    expect(root.dataset.scheme).toBeUndefined();
  });
});
