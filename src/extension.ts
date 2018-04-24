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
    Position,
    SymbolInformation
} from "vscode";

export function activate(context: ExtensionContext) {
    context.subscriptions.push(registerMoveIntoRegion());
    context.subscriptions.push(registerRemoveAllRegions());
    context.subscriptions.push(registerCreateAutoRegions());
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

    //region end
    let offset = editor.document.offsetAt(selection.active);
    let endRegionStartPosition = editor.document.getText().indexOf("#endregion", offset);

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

function registerCreateAutoRegions() {
    return commands.registerCommand("extension.createAutoRegions", async () => {


        const { activeTextEditor } = window;

        if (activeTextEditor && activeTextEditor.document.uri) {
            let symbols: Array<SymbolInformation> | undefined = await commands.executeCommand<Array<SymbolInformation>>(
                'vscode.executeDocumentSymbolProvider',
                activeTextEditor.document.uri
            );

            if (symbols && symbols.length > 0) {
                let filteredSymbols: Array<SymbolInformation>;

                filteredSymbols = symbols.filter(symbol => {
                    return symbol.kind >= 5 && symbol.kind <= 9;
                });

                let tabSize = 4; // need to get the actual tab size from settings
                let pattern = new RegExp(` {${tabSize}}| {0,${tabSize - 1}}\t`, "g");
                let blocks: Range[] = [];

                filteredSymbols.forEach(symbol => {
                    let startLineNumber: number = symbol.location.range.start.line;
                    let endLineNumber: number;

                    let text = activeTextEditor.document.lineAt(startLineNumber).text;
                    let lineMatch = text.match(pattern);

                    if (lineMatch && lineMatch.length > 0) {
                        let lineIndent = lineMatch.length;
                        switch (symbol.kind) {
                            case 5: // method
                                let nextLineNumber = startLineNumber + 2; // class opening brace should be on the next line, we can check for that later though
                                let currentText = activeTextEditor.document.lineAt(nextLineNumber).text;
                                let currentLineMatch = currentText.match(pattern);
                                if (currentLineMatch && currentLineMatch.length > 0) {
                                    let currentLineIndent = currentLineMatch.length;

                                    while (currentLineIndent > lineIndent) {
                                        nextLineNumber++;
                                        currentText = activeTextEditor.document.lineAt(nextLineNumber).text;
                                        currentLineMatch = currentText.match(pattern);
                                        if (currentLineMatch && currentLineMatch.length > 0) {
                                            currentLineIndent = currentLineMatch.length;
                                        }
                                    }

                                    endLineNumber = nextLineNumber;
                                    let blockRange: Range = new Range(startLineNumber, 0, endLineNumber, currentText.length);
                                    blocks.push(blockRange);
                                }
                                break;
                        }
                    }

                    if (blocks.length > 0) {
                        blocks.forEach(block => {
                            let textBlock = activeTextEditor.document.getText(block);
                            console.log(textBlock);
                        });
                    }
                });
            }
        }



    });
}

function getRegionName() {
    return window.showInputBox({
        prompt: "Region Name",
        value: "newregion"
    });
}
