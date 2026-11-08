/** Accept only same-origin relative return paths to prevent open redirects. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) {
    return "/dashboard";
  }
  return value;
}
