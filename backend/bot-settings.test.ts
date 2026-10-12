import assert from "node:assert/strict";
import test from "node:test";
import { newUserMenu, profileKeyboard, returningCustomerMenu, settingsMenu, supportKeyboard } from "./bot/index";
import { checkPreferredName } from "./validate";

type Keyboard = { inline_keyboard: { text: string }[][] };

function buttonLabels(menu: unknown): string[] {
  return (menu as Keyboard).inline_keyboard.flat().map((button) => button.text);
}

// The bot shows one main menu to everyone (mainMenuKeyboard in bot/index.ts);
// newUserMenu and returningCustomerMenu are aliases of it.
const MAIN_MENU = ["Trade", "Rate", "Track ID", "View profile", "Customer Support"];

test("new users get the full main menu", () => {
  assert.deepEqual(buttonLabels(newUserMenu()), MAIN_MENU);
});

test("returning customers get the same main menu", () => {
  assert.deepEqual(buttonLabels(returningCustomerMenu()), MAIN_MENU);
});

test("the profile leads to edit details, support and back", () => {
  assert.deepEqual(buttonLabels(profileKeyboard()), ["Edit details", "Customer Support", "Back"]);
});

test("customer support offers five reasons, Other and back, each with a drafted message", () => {
  const menu = supportKeyboard() as unknown as { inline_keyboard: { text: string; url?: string }[][] };
  const buttons = menu.inline_keyboard.flat();
  assert.equal(buttons.length, 7);
  assert.deepEqual(buttons.slice(-2).map((b) => b.text), ["Other", "Back"]);
  for (const button of buttons.slice(0, 6)) {
    assert.match(button.url ?? "", /^https:\/\/wa\.me\/\d+\?text=Hello%20ORBITAL%20Support/);
  }
});

test("edit details offers name change, bank and address removal, and back", () => {
  assert.deepEqual(buttonLabels(settingsMenu()), [
    "Change my name",
    "Remove a bank account",
    "Remove an address",
    "Back",
  ]);
});

test("preferred names accept single-letter and international names", () => {
  assert.deepEqual(checkPreferredName("A"), { ok: true, value: "A" });
  assert.deepEqual(checkPreferredName("  O'Connor  "), { ok: true, value: "O'Connor" });
  assert.deepEqual(checkPreferredName("Élodie"), { ok: true, value: "Élodie" });
  assert.deepEqual(checkPreferredName("李明"), { ok: true, value: "李明" });
});

test("preferred names reject empty, non-letter, and overlong input", () => {
  assert.equal(checkPreferredName("").ok, false);
  assert.equal(checkPreferredName("123").ok, false);
  assert.equal(checkPreferredName("A".repeat(61)).ok, false);
});
