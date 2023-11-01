import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.window.registerCustomEditorProvider(
    'pickleViewer',
    new PickleViewerProvider(),
    {
      webviewOptions: {
        retainContextWhenHidden: true
      }
    }
  ));
}

class PickleViewerProvider implements vscode.CustomReadonlyEditorProvider {
  openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: () => {} };
  }

  resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel): void | Thenable<void> {
    exec(`python3 -c "import pickle; import pprint; pprint.pprint(pickle.load(open('${document.uri.fsPath}', 'rb')))"`,
      (err, stdout, stderr) => {
        if (err) {
          vscode.window.showErrorMessage(`Error: ${stderr}`);
          return;
        }
        webviewPanel.webview.html = this.getWebviewContent(linebreaksToBr(stdout));
      }
    );
  }

  private getWebviewContent(content: string): string {
    const config = vscode.workspace.getConfiguration('editor');
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            code {
              font-family: ${config.get('fontFamily')};
              font-size: ${config.get('fontSize')}px;
              font-weight: ${config.get('fontWeight')};
            }
          </style>
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://cdnjs.cloudflare.com; script-src 'unsafe-inline' https://cdnjs.cloudflare.com;">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/default.min.css">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/highlight.min.js"></script>
          <script>
            document.addEventListener('DOMContentLoaded', (event) => {
              document.querySelectorAll('pre code').forEach((el) => {
                hljs.highlightElement(el);
              });
            });
          </script>
          <title>Pickle Viewer</title>
        </head>
        <body>
          <pre><code class="language-python">${content}</code></pre>
        </body>
      </html>
    `;
  }
}

function linebreaksToBr(text: string): string {
  return text.replace(/\r\n|\r|\n/g, '<br>');
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// This method is called when your extension is deactivated
export function deactivate() {}
