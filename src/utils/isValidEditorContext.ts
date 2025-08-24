import vscode from "vscode";

export function isValidEditorContext(editor?: vscode.TextEditor): editor is vscode.TextEditor {
  if (!editor) {
    vscode.window.showInformationMessage("No active editor");
    return false;
  }

  if (!["typescript", "javascript", "vue"].includes(editor.document.languageId)) {
    vscode.window.showInformationMessage("Not a Nuxt file");
    return false;
  }

  return true;
}
