import vscode from "vscode";
import { convertErrorToString } from "../utils/convertError";
import { isValidEditorContext } from "../utils/isValidEditorContext";

export function createOpenReferencesCommand(viewCommand: string): () => Promise<void> {
  return async () => {
    const editor = vscode.window.activeTextEditor;

    if (!isValidEditorContext(editor)) {
      return;
    }

    try {
      const references = await findReferences(editor.document, editor.selection.active);

      if (!references) {
        vscode.window.showInformationMessage("No references found");
        return;
      }

      await vscode.commands.executeCommand(
        viewCommand,
        editor.document.uri,
        editor.selection.active,
        references,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error while finding references: ${convertErrorToString(error)}`,
      );
    }
  };
}

async function findReferences(
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<vscode.Location[] | undefined> {
  const defaultReferences = await vscode.commands.executeCommand<vscode.Location[]>(
    "vscode.executeReferenceProvider",
    document.uri,
    position,
  );

  const nonMagicDefaultReferences = defaultReferences.filter(
    (ref) => !ref.uri.path.includes(".nuxt"),
  );

  // Return the references from the reference provider if they can be inferred
  if (nonMagicDefaultReferences.length === defaultReferences.length) {
    return nonMagicDefaultReferences;
  }

  const symbolText = await getSymbolDefinitionUnderCursor(document, position);

  if (!symbolText) {
    vscode.window.showInformationMessage("No symbol selected");
    return;
  }

  const nuxtImportDefinitionFiles = await vscode.workspace.findFiles(
    "**/.nuxt/{types/imports.d.ts,components.d.ts}",
  );

  if (!nuxtImportDefinitionFiles || nuxtImportDefinitionFiles.length === 0) {
    vscode.window.showErrorMessage(
      "Could not find Nuxt import definitions. Make sure the `.nuxt` folder was generated. (hint: run `nuxt prepare` or `nuxt dev`)",
    );
    return;
  }

  const magicReferences = await findReferencesForDefinitionFiles(
    nuxtImportDefinitionFiles,
    symbolText,
  );

  return getUniqueReferences(magicReferences, nonMagicDefaultReferences);
}

async function getSymbolDefinitionUnderCursor(
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<string | undefined> {
  const definitions = await vscode.commands.executeCommand<vscode.LocationLink[]>(
    "vscode.executeDefinitionProvider",
    document.uri,
    position,
  );

  if (!definitions || definitions.length === 0 || !definitions[0].targetSelectionRange) {
    return undefined;
  }

  const symbolDocument = await vscode.workspace.openTextDocument(definitions[0].targetUri);
  return symbolDocument.getText(definitions[0].targetSelectionRange);
}

async function findReferencesForDefinitionFiles(
  nuxtImportDefinitionFiles: vscode.Uri[],
  symbolText: string,
): Promise<vscode.Location[]> {
  const references = [];

  for (const file of nuxtImportDefinitionFiles) {
    const vueSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      file,
    );

    if (!vueSymbols) {
      continue;
    }

    const definitionSymbols = filterSymbolsByName(vueSymbols, symbolText);

    for (const symbol of definitionSymbols) {
      references.push(
        ...(await vscode.commands.executeCommand<vscode.Location[]>(
          "vscode.executeReferenceProvider",
          file,
          symbol.selectionRange.start,
        )),
      );
    }
  }

  return references.filter((ref) => !ref.uri.path.includes(".nuxt"));
}

function filterSymbolsByName(
  symbols: vscode.DocumentSymbol[],
  name: string,
): vscode.DocumentSymbol[] {
  const found = [];

  for (const s of symbols) {
    if (s.name === name) {
      found.push(s);
      // Don't bother about children if the symbol is found
      continue;
    }

    if (s.children.length > 0) {
      found.push(...filterSymbolsByName(s.children, name));
    }
  }

  return found;
}

function getUniqueReferences(refsA: vscode.Location[], refsB: vscode.Location[]) {
  const uniqueReferencesMap = new Map<string, vscode.Location>();

  const keyForRef = (ref: vscode.Location) =>
    `${ref.uri.path}:${ref.range.start.line}:${ref.range.start.character}`;

  refsA.forEach((ref) => {
    uniqueReferencesMap.set(keyForRef(ref), ref);
  });

  refsB.forEach((ref) => {
    uniqueReferencesMap.set(keyForRef(ref), ref);
  });

  return Array.from(uniqueReferencesMap.values());
}
