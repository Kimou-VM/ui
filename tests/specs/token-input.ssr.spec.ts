import type { Page } from "@playwright/test"
import { expect, test } from "../fixtures"

// Only *-ssr projects render on the server first.
test.beforeEach(({ framework }) => {
  test.skip(!framework.endsWith("-ssr"), "Only for server-rendered fixtures.")
})

const hydrationErrors = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __hydrationErrors: string[] }).__hydrationErrors
  )

test("a value with tokens shows in the server markup and hydrates without mismatches", async ({
  page,
  open,
}) => {
  await open("token-input", {
    value: "Summarize [@a.ts](file:src/a.ts) please",
  })
  const editor = page.getByRole("textbox", { name: "Prompt" })
  await expect(editor).toContainText("Summarize")
  await expect(page.locator("[data-slot='token-input-token']")).toHaveText([
    "a.ts ×",
  ])
  await editor.focus()
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.type(" @b")
  await page.keyboard.press("Enter")
  await expect(page.locator("[data-slot='token-input-token']")).toHaveCount(2)
  expect(await hydrationErrors(page)).toEqual([])
})

test("text typed before hydration stays, beside the tokens", async ({
  page,
  open,
}) => {
  await open("token-input", {
    value: "Summarize [@a.ts](file:src/a.ts)",
    hydrate: "manual",
  })
  const editor = page.getByRole("textbox", { name: "Prompt" })
  await editor.focus()
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.type(" please")
  await page.evaluate(() =>
    (window as unknown as { hydrate: () => void }).hydrate()
  )
  await expect(page.locator("[data-slot='token-input-token']")).toHaveText([
    "a.ts ×",
  ])
  await expect(editor).toContainText("please")
  await page.keyboard.type(" now")
  await expect(editor).toContainText("please now")
  expect(await hydrationErrors(page)).toEqual([])
})
