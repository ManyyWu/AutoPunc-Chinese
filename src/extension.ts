'use strict';
import * as path from 'path';
import * as vscode from 'vscode';
import { getPuncpairs } from './helpers';

let puncpairs: any;
let correction: boolean;
correction = true;
let myStatusBarItem: vscode.StatusBarItem;

const hs = vscode.extensions.getExtension('draivin.hscopes');
let hsAPI: any;
hs?.activate().then(
  (ext) => {
    hsAPI = ext;
  }
);
  
export function activate({ subscriptions }: vscode.ExtensionContext) {
  const myCommandId = 'autopunc.toggleCorrect';
  subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
    correction = !correction;
    if (correction) {
      myStatusBarItem.text = '$(check) 标点自动转换';
    } else {
      myStatusBarItem.text = '$(chrome-close) 标点自动转换';
    }
  }));
  
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 300);
  myStatusBarItem.text = '$(check) 标点自动转换';
  myStatusBarItem.show();
  myStatusBarItem.command = myCommandId;
  subscriptions.push(myStatusBarItem);

  puncpairs = puncpairs || getPuncpairs();
  vscode.workspace.onDidOpenTextDocument(() => {
    puncpairs = puncpairs || getPuncpairs();
  });
  vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document.fileName === "git\\scm0\\input") { return; }
    puncpairs = puncpairs || getPuncpairs();
    if (correction && isExtensionEnabled(event.document)) {
      correctPunc(event);
    }
  });
}

function isExtensionEnabled(document: vscode.TextDocument): boolean {
  const ext = path.extname(document.fileName).replace(/^\./, '');
  if (!ext) {
    return false;
  }

  const config = vscode.workspace.getConfiguration('autopunc', document.uri);
  const extensions = config.get<{ [key: string]: boolean }>('extensions', {});

  if (extensions && typeof extensions === 'object' && Object.prototype.hasOwnProperty.call(extensions, ext)) {
    return Boolean(extensions[ext]);
  }

  // 默认启用，如果 autopunc.extensions 中未配置该后缀
  return true;
}


// this method is called when your extension is deactivated
export function deactivate() {}

function correctPunc(event: vscode.TextDocumentChangeEvent): void {
  if (!event.contentChanges.length) {
    return;
  }

  let lastChr = event.contentChanges[0].text;
  console.log(lastChr);
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const keys = Object.keys(puncpairs);

  if (keys.includes(lastChr) && lastChr !== puncpairs[lastChr]) {
    editor.edit(
      editBuilder => {
        const contentChangeRange = event.contentChanges[0].range;
        const startLine = contentChangeRange.start.line;
        const startCharacter = contentChangeRange.start.character;
        let start: vscode.Position;
        let end: vscode.Position;
        start = new vscode.Position(startLine, startCharacter);

        if (lastChr === '……' || lastChr === '——') {
            end = new vscode.Position(startLine, startCharacter + 2);
        } else {
            end = new vscode.Position(startLine, startCharacter + 1);
        }

        if (hsAPI) {
          const token = hsAPI.getScopeAt(event.document, start);
          if (token) {
            for (let item of token.scopes) {
              if (item.match(/comment/) && !item.match(/json/)) throw new Error("注释中不转换");
            }
          }
        }

        editBuilder.delete(new vscode.Range(start, end));
        editBuilder.insert(start, puncpairs[lastChr]);
      },
      {
        undoStopAfter: false,
        undoStopBefore: false,
      }
    ).then(
      () => {
      }
    );    
  }
}