import vscode from "vscode";

export function createToggleKeyBindingsCommand(context: vscode.ExtensionContext) {
  return async () => {
    const isEnabled = context.globalState.get<boolean>("nuxt-navigator.enabled", true);
    await context.globalState.update("nuxt-navigator.enabled", !isEnabled);

    vscode.commands.executeCommand("setContext", "nuxt-navigator.enabled", !isEnabled);
    vscode.window.showInformationMessage(`Keybindings ${!isEnabled ? "enabled" : "disabled"}`);
  };
}
