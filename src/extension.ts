import vscode from "vscode";
import { createOpenReferencesCommand } from "./commands/findReferences";
import { goToDefinition } from "./commands/goToDefinition";
import { showLoadingIndicator } from "./utils/showLoadingIndicator";
import { createToggleKeyBindingsCommand } from "./commands/toggleKeyBindings";

export function activate(context: vscode.ExtensionContext) {
  const findReferencesCommand = vscode.commands.registerCommand(
    "nuxt-navigator.open-references-view",
    showLoadingIndicator(
      "Loading References...",
      createOpenReferencesCommand("editor.action.showReferences"),
    ),
  );

  const peekReferencesCommand = vscode.commands.registerCommand(
    "nuxt-navigator.peek-references",
    showLoadingIndicator(
      "Loading References...",
      createOpenReferencesCommand("editor.action.peekLocations"),
    ),
  );

  const goToDefinitionCommand = vscode.commands.registerCommand(
    "nuxt-navigator.go-to-definition",
    showLoadingIndicator("Loading Definition...", goToDefinition),
  );

  const toggleKeyBindingsCommand = vscode.commands.registerCommand(
    "nuxt-navigator.toggle-key-bindings",
    createToggleKeyBindingsCommand(context),
  );

  context.subscriptions.push(findReferencesCommand);
  context.subscriptions.push(peekReferencesCommand);
  context.subscriptions.push(goToDefinitionCommand);
  context.subscriptions.push(toggleKeyBindingsCommand);
}

export function deactivate() {}
