'use strict';
import * as vscode from 'vscode';
import { getPuncpairs } from './helpers';

let puncpairs: any;
let correction: boolean;
correction = true;
let myStatusBarItem: vscode.StatusBarItem;

const hs = vscode.extensions.getExtension('draivin.hscopes');
// console.log(hs);
let hsAPI: any;
hs?.activate().then(
  (ext) => {
    // console.log(ext);
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

//   try {
    puncpairs = puncpairs || getPuncpairs();
    vscode.workspace.onDidOpenTextDocument(() => {
      puncpairs = puncpairs || getPuncpairs();
    });
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.fileName === "git\\scm0\\input") { return; } // 解决 https://gitee.com/laowu2019_admin/autopunc/issues/I4SMS3
      puncpairs = puncpairs || getPuncpairs();
      if (correction) {
        correctPunc(event);
        // 把中文省略号 …… / —— 转换的两个 ^^ /__ 去掉一个
        // correctDup(event);
      }
    });
//   } catch (error) {
//     console.log(error);      
//   }
  
  // vscode.workspace.onDidChangeConfiguration(e => {
  //   if (e.affectsConfiguration('auto-correct')) {
  //     config = getConfig();
  //   }
  // });
}

// this method is called when your extension is deactivated
export function deactivate() {}

function correctPunc(event: vscode.TextDocumentChangeEvent): void {
  if (!event.contentChanges.length) {
    return;
  }

  let lastChr = event.contentChanges[0].text;
//   console.log(lastChr);
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const keys = Object.keys(puncpairs);

  if (keys.includes(lastChr) && lastChr !== puncpairs[lastChr]) { // #I4RIQ5；有了后一判断条件，用户自定义配置时可以取消某些中文标点的转换。
    editor.edit(
      editBuilder => {
        const contentChangeRange = event.contentChanges[0].range;
        const startLine = contentChangeRange.start.line;
        const startCharacter = contentChangeRange.start.character;
        let start: vscode.Position;
        let end: vscode.Position;
        // if (lastChr === '…' || lastChr === '—') {
        //   start = new vscode.Position(startLine, startCharacter - 1);
        // } else {
          start = new vscode.Position(startLine, startCharacter);
        // }
        if (lastChr === '……' || lastChr === '——') {
            end = new vscode.Position(startLine, startCharacter + 2);
        } else {
            end = new vscode.Position(startLine, startCharacter + 1);
        }

        // 使用 vscode.proposed.tokenInformation.d.ts API 的代价太大，未进行 tokenization
        // vscode.languages.getTokenInformationAtPosition(event.document, start).then(
        //   (tokenInfo) => {
        //     console.log(tokenInfo.range, tokenInfo.type);            
        //     if (tokenInfo.type === vscode.StandardTokenType.Other) return;
        //   }
        // );
        if (hsAPI) {
          const token = hsAPI.getScopeAt(event.document, start);
          // console.log(token);
          // console.log(token.scopes);
          if (token) {
            for (let item of token.scopes) {
              // if (item.match(/comment|string/) && !item.match(/regex/)) throw new Error("注释或字符串中不转换");
              if (item.match(/comment/) && !item.match(/json/)) throw new Error("注释中不转换"); // json 文件的 scope 都带 comment？
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
        // vscode.commands.executeCommand("type", { text: puncpairs[lastChr] }).then(() => {
          // 删除多余的字符
        //   const change = event.contentChanges[0];
        //   const deletePosition = new vscode.Position(change.range.start.line, change.range.start.character + 1);
        //   editor.edit(editBuilder => {
        //     editBuilder.delete(new vscode.Range(deletePosition, deletePosition.translate(0, 1)));
        //   });
        // });
      }
    );    
  }
}

// function correctDup(event: vscode.TextDocumentChangeEvent): void {
//   if (!event.contentChanges.length) {
//     return;
//   }

//   const editor = vscode.window.activeTextEditor;
//   if (!editor) {
//     return;
//   }

//   const contentChangeRange = event.contentChanges[0].range;
//   const startLine = contentChangeRange.start.line;
//   const startCharacter = contentChangeRange.start.character;
//   const start = new vscode.Position(startLine, Math.max(0, startCharacter - 1));
//   const end = new vscode.Position(startLine, startCharacter + 1);
//   const text = editor.document.getText(
//     new vscode.Range(start, end)
//   );
//   // console.log(text);

//   if (text === '^^'/*  || text === '__' */) { // https://gitee.com/laowu2019_admin/autopunc/issues/I4SMS3
//     editor.edit(
//       editBuilder => {
//         const newStart = new vscode.Position(startLine, startCharacter);
//         if (startCharacter) {
//           editBuilder.delete(new vscode.Range(newStart, end));
//         }
//       },
//       {
//         undoStopAfter: false,
//         undoStopBefore: false,
//       }
//     );    
//   }
// }
