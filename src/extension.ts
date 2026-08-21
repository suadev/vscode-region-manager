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
  Uri,
  Position
} from "vscode";

const extensionPrefix: string = "vscode-region-manager";
let regionStartKey: string;
let regionEndKey: string;
let regionRegex: RegExp;

const enum configurationSettings {
  nameOnEndRegion = "nameOnEndRegion",
  innerSpacing = "innerSpacing"
}

export function activate(context: ExtensionContext) {
  var editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  context.subscriptions.push(registerMoveIntoRegion());
  context.subscriptions.push(registerRemoveAllRegions());
}

function setLanguageSettings(langId: string) {
  if (langId === "csharp" || langId === "ruby") {
    regionStartKey = "#region";
    regionEndKey = "#endregion";
    regionRegex = /#(region|endregion).*\r\n/;
  }
  else if (langId === "javascript" || langId === "javascriptreact" || langId === "typescript") {
    regionStartKey = "//#region";
    regionEndKey = "//#endregion";
    regionRegex = /\/\/#(region|endregion).*\r\n/;
  }
  else if (langId === "vb") {
    regionStartKey = "#Region";
    regionEndKey = "#End Region";
    regionRegex = /#(Region|End Region).*\r\n/;
  }
  else {
    window.showErrorMessage(
      "VsCode Region Manager => Unsupported file => " + langId
    );
  }
}

function registerRemoveAllRegions() {
  return commands.registerCommand("extension.removeAllRegions", () => {
    var editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    setLanguageSettings(editor.document.languageId);

    let document = editor.document;
    let allText = document.getText();
    let cleanedText = allText.replace(new RegExp(regionRegex, "g"), "");

    const fullRange = new Range(
      document.positionAt(0),
      document.positionAt(allText.length)
    );
    let editWs = new WorkspaceEdit();
    editWs.replace(document.uri, fullRange, cleanedText);
    workspace.applyEdit(editWs);
    commands.executeCommand("workbench.action.files.save");
  });
}

function registerMoveIntoRegion() {
  return commands.registerCommand("extension.moveIntoRegion", async () => {
    var editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    setLanguageSettings(editor.document.languageId);

    let selection = editor.selection;
    let uri = editor.document.uri;
    var cursorLineText = editor.document.lineAt(selection.start);

    if (cursorLineText.text.indexOf(regionStartKey) > -1) {
      return RemoveRegion(editor, selection, uri);
    }
    let regionName = await getRegionName();
    if (!regionName) {
      return;
    }

    InsertRegion(uri, selection, regionName);
    commands.executeCommand("editor.foldAllMarkerRegions");
    commands.executeCommand("workbench.action.files.save");
  });
}

function InsertRegion(uri: Uri, selection: Selection, regionName: string) {
  let editWs = new WorkspaceEdit();
  const nameOnEndRegion: string | undefined = workspace
    .getConfiguration(extensionPrefix)
    .get(configurationSettings.nameOnEndRegion);
  const innerSpacing: string | undefined = workspace
    .getConfiguration(extensionPrefix)
    .get(configurationSettings.innerSpacing);

  editWs.insert(
    uri,
    selection.start,
    innerSpacing
      ? regionStartKey + " " + regionName + " \n\n"
      : regionStartKey + " " + regionName + " \n"
  );
  let endRegionText: string = nameOnEndRegion
    ? `${regionEndKey} ${regionName}`
    : regionEndKey;
  editWs.insert(
    uri,
    selection.end,
    innerSpacing ? "\n\n" + endRegionText : "\n" + endRegionText
  );
  workspace.applyEdit(editWs);
}

function RemoveRegion(editor: TextEditor, selection: Selection, uri: Uri) {
  let removeWs = new WorkspaceEdit();
  //region start
  removeWs.delete(
    uri,
    editor.document.lineAt(selection.start).rangeIncludingLineBreak
  );

  //region end
  let offset = editor.document.offsetAt(selection.active);
  let endRegionStartPosition = editor.document
    .getText()
    .indexOf(regionEndKey, offset);

  let endRegionLine = editor.document.positionAt(endRegionStartPosition).line;
  removeWs.replace(
    uri,
    new Range(
      new Position(endRegionLine, 0),
      new Position(endRegionLine + 1, 0)
    ),
    ""
  );
  workspace.applyEdit(removeWs);
  commands.executeCommand("workbench.action.files.save");
}

function getRegionName() {
  return window.showInputBox({
    prompt: "Region Name",
    value: "newregion"
  });
}
