import vscode from "vscode";
import { convertErrorToString } from "../utils/convertError";
import { isValidEditorContext } from "../utils/isValidEditorContext";

export async function goToDefinition() {
  const editor = vscode.window.activeTextEditor;

  if (!isValidEditorContext(editor)) {
    return;
  }

  try {
    const definition = await findFirstDefinition(editor.document.uri, editor.selection.active);

    if (!definition) {
      vscode.window.showInformationMessage("No definition found");
      return;
    }

    if (definition.targetUri.path.includes(".nuxt")) {
      // This can take a long time when the file was not opened yet, since it needs to be indexed first by the language server (and vue/ts server is really slow...)
      const targetDefinition = await findFirstDefinition(
        definition.targetUri,
        new vscode.Position(
          definition.targetRange.end.line,
          definition.targetRange.end.character - 1,
        ),
      );

      if (!targetDefinition) {
        vscode.window.showInformationMessage("No definition found");
        return;
      }

      return await openDefinition(targetDefinition);
    }

    await openDefinition(definition);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error while going to definition: ${convertErrorToString(error)}`,
    );
  }
}

async function openDefinition(location: vscode.LocationLink) {
  const document = await vscode.workspace.openTextDocument(location.targetUri);
  const editor = await vscode.window.showTextDocument(document);

  const range = new vscode.Range(location.targetRange.start, location.targetRange.end);
  editor.selection = new vscode.Selection(range.start, range.start);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

async function findFirstDefinition(
  uri: vscode.Uri,
  position: vscode.Position,
): Promise<vscode.LocationLink | undefined> {
  return (
    await vscode.commands.executeCommand<vscode.LocationLink[]>(
      "vscode.executeDefinitionProvider",
      uri,
      position,
    )
  )[0];
}
