export function convertErrorToString(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}
