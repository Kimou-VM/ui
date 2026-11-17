import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "../fixtures"

async function audit(page: import("@playwright/test").Page) {
  // Page structure rules are about the fixture page, not the component.
  const results = await new AxeBuilder({ page })
    .include('[data-slot="image-cropper"]')
    .disableRules(["region", "landmark-one-main", "page-has-heading-one"])
    .analyze()
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help}`
  )
}

test("no axe violations with the crop and its handles shown", async ({
  page,
  open,
}) => {
  await open("image-cropper")
  await expect(
    page.getByRole("slider", { name: "Bottom right corner" })
  ).toBeVisible()
  expect(await audit(page)).toEqual([])
})
