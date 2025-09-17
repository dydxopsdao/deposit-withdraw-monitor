export * from "./constants";
export * from "./header";
export * from "./wallet";
export * from "./funds-dialog";
export * from "./deposit";
export * from "./withdraw";

import * as header from "./header";
import * as wallet from "./wallet";
import * as fundsDialog from "./funds-dialog";
import * as deposit from "./deposit";
import * as withdraw from "./withdraw";

export const dydxSelectors = {
  ...header,
  ...wallet,
  ...fundsDialog,
  ...deposit,
  ...withdraw,
};
