import vscode from "vscode";

export function showLoadingIndicator(text: string, fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const loadingStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );

    try {
      loadingStatusBarItem.text = `$(sync~spin) ${text}`;
      loadingStatusBarItem.show();

      await fn();
    } finally {
      loadingStatusBarItem.hide();
      loadingStatusBarItem.dispose();
    }
  };
}
