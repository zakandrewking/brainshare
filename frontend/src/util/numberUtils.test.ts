import { roundUp100 } from "./numberUtils";

it("rounds up to 100", () => {
  expect(roundUp100(123)).toEqual(200);
});
