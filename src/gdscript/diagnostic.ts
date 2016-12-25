import requestGodot from "../request";
import * as vscode from 'vscode';
import {DiagnosticCollection, DiagnosticSeverity} from 'vscode';
import config from '../config';

interface GDParseError {
  message: string,
  column: number,
  row: number
}

interface GDScript {
  members: {
    constants: {},
    functions: {},
    variables: {},
    signals: {}
  },
  base: string,
  errors: GDParseError[],
  valid: boolean,
  is_tool: boolean,
  native: string
}

interface ParseRequest {
  text: string,
  path: string
}



class GDScriptDiagnosticSeverity {
  private _subscription: DiagnosticCollection;
  
  constructor() {
    this._subscription = vscode.languages.createDiagnosticCollection("gdscript")
  }

  dispose() {
    this._subscription.dispose()
  }

  validateScript(doc: vscode.TextDocument, script: any) {
    if(doc.languageId == 'gdscript') {
      if(script) {
        
        let diagnostics = [
          ...(this.validateExpression(doc)),
          ...(this.validateUnusedSymbols(doc, script)),
        ];
        // Update diagnostics
        this._subscription.set(doc.uri, diagnostics);
      }
    }
  }

  private validateUnusedSymbols(doc: vscode.TextDocument,script) {
    let diagnostics = [];
    const text = doc.getText();

    const check = (name:string, range: vscode.Range) => {
      const pattern = `[\\s\\+\\-\\*/%\\^\\(\\[\\{]${name}[^0-9A-Za-z_]\\s*`;
      var matchs = text.match(new RegExp(pattern, 'g'));
      if(matchs.length <= 1)
        diagnostics.push(new vscode.Diagnostic(range, `${name} is never used.`, DiagnosticSeverity.Warning));
    };
    // Unused variables
    for (let key of Object.keys(script.variables))
      check(key, script.variables[key]);
    for (let key of Object.keys(script.constants))
      check(key, script.variables[key]);
    return diagnostics;    
  }

  private validateExpression(doc: vscode.TextDocument) {
    let diagnostics = [];
    const text = doc.getText();
    const lines = text.split(/\r?\n/);
    lines.map((line:string, i: number) =>{
      const semicolonIndex = line.indexOf(';');
      if(semicolonIndex != -1) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, semicolonIndex, i, semicolonIndex+1), "Statement ends with a semicolon.", DiagnosticSeverity.Warning));
      }
      if(line.match(/if|elif|else|for|while|func|class/g) && line.indexOf(":") == -1) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, line.length), "':' expected at end of the line.", DiagnosticSeverity.Error));
      }
    });
    return diagnostics;
  }
  
}

export default GDScriptDiagnosticSeverity;