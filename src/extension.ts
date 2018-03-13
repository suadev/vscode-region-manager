"use strict";
import {
  window,
  commands,
  ExtensionContext,
  WorkspaceEdit,
  workspace,
  Range,
  TextEditor,
  Selection,
  Uri
} from "vscode";

export function activate(context: ExtensionContext) {
  let moveIntoRegionCommand = commands.registerCommand(
    "extension.moveIntoRegion",
    async () => {
      var editor = window.activeTextEditor;
      if (!editor) {
        return;
      }

      let selection = editor.selection;
      let uri = editor.document.uri;
      var cursorLineText = editor.document.lineAt(selection.start);

      if (cursorLineText.text.indexOf("#region") > -1) {
        return RemoveRegion(editor, selection, uri);
      }

      let regionName = await getRegionName();
      if (!regionName) {
        return;
      }

      InsertRegion(uri, selection, regionName);
      commands.executeCommand("editor.foldAllMarkerRegions");
      commands.executeCommand("workbench.action.files.save");
    }
  );

  let removeAllRegionsCommand = commands.registerCommand(
    "extension.removeAllRegions",
    () => {
      var editor = window.activeTextEditor;
      if (!editor) {
        return;
      }

      // commands.executeCommand("editor.action.replaceAll", [
      //   "#region",
      //   ""
      // ]);

      //todo
      //   let filtered = editor.document
      //     .getText()
      //     .replace("^[ \t]*#[ \t]*(region|endregion).*\n", "");
    }
  );

  context.subscriptions.push(moveIntoRegionCommand);
  context.subscriptions.push(removeAllRegionsCommand);
}

function InsertRegion(uri: Uri, selection: Selection, regionName: string) {
  let editWs = new WorkspaceEdit();
  editWs.insert(uri, selection.start, "#region " + regionName + " \n");
  editWs.insert(uri, selection.end, "\n #endregion");
  workspace.applyEdit(editWs);
}

function RemoveRegion(editor: TextEditor, selection: Selection, uri: Uri) {
  let removeWs = new WorkspaceEdit();
  //region start
  removeWs.delete(uri, editor.document.lineAt(selection.start).range);

  //region end
  let offset = editor.document.offsetAt(selection.active);
  let endRegionLine = editor.document.getText().indexOf("#endregion", offset);
  removeWs.replace(
    uri,
    new Range(
      editor.document.positionAt(endRegionLine),
      editor.document.positionAt(endRegionLine + 10)
    ),
    ""
  );
  workspace.applyEdit(removeWs);
  return;
}

function getRegionName() {
  return window.showInputBox({
    prompt: "Region Name",
    value: "newregion"
  });
}
