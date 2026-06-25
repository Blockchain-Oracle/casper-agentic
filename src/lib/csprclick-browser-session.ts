import type {
  CSPRClickAccountEvent,
  CSPRClickBrowserWindow,
  CSPRClickClient,
  CSPRClickEventName,
} from "./csprclick-browser";

const ACCOUNT_EVENTS: CSPRClickEventName[] = [
  "csprclick:signed_in",
  "csprclick:switched_account",
  "csprclick:signed_out",
  "csprclick:disconnected",
];

export function bindCSPRClickAccountEvents(
  windowLike: Pick<CSPRClickBrowserWindow, "addEventListener" | "csprclick" | "removeEventListener">,
  onChange: () => void,
) {
  let bound = false;
  const bind = () => {
    if (bound) return;
    const client = windowLike.csprclick;
    if (!client?.on) return;
    for (const eventName of ACCOUNT_EVENTS) client.on(eventName, onChange);
    client.on("csprclick:unsolicited_account_change", signInWithChangedAccount);
    bound = true;
    onChange();
  };
  const unbind = () => {
    if (!bound) return;
    for (const eventName of ACCOUNT_EVENTS) windowLike.csprclick?.off?.(eventName, onChange);
    windowLike.csprclick?.off?.("csprclick:unsolicited_account_change", signInWithChangedAccount);
    bound = false;
  };
  bind();
  windowLike.addEventListener?.("csprclick:loaded", bind);
  return () => {
    windowLike.removeEventListener?.("csprclick:loaded", bind);
    unbind();
  };

  function signInWithChangedAccount(event?: CSPRClickAccountEvent) {
    if (event?.account) windowLike.csprclick?.signInWithAccount?.(event.account);
    onChange();
  }
}

export function requestCSPRClickSignIn(client: CSPRClickClient | null | undefined) {
  if (!client?.signIn) return { message: "CSPR.click sign-in is unavailable", status: "unavailable" as const };
  client.signIn();
  return { message: "CSPR.click sign-in requested", status: "requested" as const };
}
