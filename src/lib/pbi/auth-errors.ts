function errorBlob(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const o = error as { message?: unknown; code?: unknown; statusText?: unknown };
    return [o.message, o.code, o.statusText].filter((part) => part != null && part !== "").join(" ");
  }
  return String(error);
}

export function plainAuthError(error: unknown): string {
  const text = errorBlob(error).toLowerCase();
  if (!text) return "Something went wrong. Try again.";
  if (text.includes("already exists") || text.includes("user already")) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (text.includes("password") && (text.includes("short") || text.includes("least") || text.includes("weak"))) {
    return "Password is too short. Use at least 8 characters.";
  }
  if (
    text.includes("invalid email or password") ||
    text.includes("invalid_email_or_password") ||
    text.includes("invalid credentials") ||
    text.includes("invalid password") ||
    text.includes("user not found")
  ) {
    return "Wrong email or password.";
  }
  if (text.includes("invalid email") || text.includes("email is invalid") || text.includes("invalid_email")) {
    return "That email doesn’t look valid.";
  }
  return errorBlob(error);
}

export function clientPasswordIssue(password: string): string | null {
  if (password.length < 8) return "Password is too short. Use at least 8 characters.";
  return null;
}

export function clientEmailIssue(email: string): string | null {
  const v = email.trim();
  if (!v) return "That email doesn’t look valid.";
  const at = v.indexOf("@");
  if (at < 1 || at !== v.lastIndexOf("@")) return "That email doesn’t look valid.";
  const domain = v.slice(at + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return "That email doesn’t look valid.";
  }
  return null;
}
