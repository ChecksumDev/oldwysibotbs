export function dysi(input: string): boolean {
    const sanitizedInput = input.replace(".", "");
    return sanitizedInput.includes("727");
}
