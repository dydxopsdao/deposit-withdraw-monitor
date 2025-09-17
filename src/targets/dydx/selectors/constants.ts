export const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const DYDX_ADDRESS_RE = /dydx1[a-z0-9]+(?:\u2026|\.\.\.)[a-z0-9]+/i;
