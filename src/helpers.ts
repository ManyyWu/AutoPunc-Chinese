'use strict';
import * as vscode from 'vscode';
// import Dictionary from './types/Dictionary';

export function getPuncpairs() {
  // const editor: any = vscode.window.activeTextEditor;
  const config = getConfig();
  const dictionary = config.get<{}>('dictionary', 
    { },
  );
  /* let globalPuncpairs: Object = {};
  let languagePuncpairs: Object = {};

  // TODO: move this outside this event
  dictionary.forEach(d => {
    const isGlobal = d.languages.length === 1 && d.languages[0] === '*';
    const isCurrentLanguage = d.languages.includes(editor.document.languageId);
    if (isGlobal) {
      globalPuncpairs = d.puncpairs;
    }
    if (isCurrentLanguage) {
      languagePuncpairs = d.puncpairs;
    }
  });

  const puncpairs = Object.assign({}, globalPuncpairs, languagePuncpairs); */
  return dictionary/* [0].puncpairs */;
}

export function getConfig() {
  // const editor: any = vscode.window.activeTextEditor;
  const config = vscode.workspace.getConfiguration(
    'autopunc'
    // editor.document.uri
  );
  return config;
}
