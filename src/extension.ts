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
    context.subscriptions.push(registerMoveIntoRegion());
    context.subscriptions.push(registerRemoveAllRegions());
}

const extensionPrefix: string = 'csharp-region-manager';
const enum configurationSettings {
    nameOnEndRegion = 'nameOnEndRegion',
    innerSpacing = 'innerSpacing'
}

function registerRemoveAllRegions() {
    return commands.registerCommand("extension.removeAllRegions", () => {
        var editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        let document = editor.document;
        let allText = document.getText();
        let cleanedText = allText.replace(
            new RegExp(/#(region|endregion).*\r\n/, "g"),
            ""
        );
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
    });
}

function InsertRegion(uri: Uri, selection: Selection, regionName: string) {
    let editWs = new WorkspaceEdit();
    const nameOnEndRegion: string | undefined = workspace.getConfiguration(extensionPrefix).get(configurationSettings.nameOnEndRegion);
    const innerSpacing: string | undefined = workspace.getConfiguration(extensionPrefix).get(configurationSettings.innerSpacing);

    editWs.insert(uri, selection.start, innerSpacing ? "#region " + regionName + " \n\n" : "#region " + regionName + " \n");

    let endRegionText: string = nameOnEndRegion ? `#endregion ${regionName}` : '#endregion';

    editWs.insert(uri, selection.end, innerSpacing ? "\n\n" + endRegionText : "\n" + endRegionText);
    workspace.applyEdit(editWs);
}

function RemoveRegion(editor: TextEditor, selection: Selection, uri: Uri) {
    let removeWs = new WorkspaceEdit();
    //region start
    removeWs.delete(
        uri,
        editor.document.lineAt(selection.start).rangeIncludingLineBreak
    );
    // removeWs.replace(uri, new Range(selection.start, selection.start), "");

    //region end
    let offset = editor.document.offsetAt(selection.active);
    let endRegionLine = editor.document.getText().indexOf("#endregion", offset);
    removeWs.replace(
        uri,
        new Range(
            editor.document.positionAt(endRegionLine),
            editor.document.positionAt(endRegionLine + 12)
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
