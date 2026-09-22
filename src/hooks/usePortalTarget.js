import { useState } from "react";

export function usePortalTarget(elementId) {
  const [portalTarget] = useState(() => document.getElementById(elementId));
  return portalTarget;
}
