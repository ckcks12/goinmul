import vscode from 'vscode'
import ACMICPCCommands from './lib/acmicpc.net/commands'




export function activate(context: vscode.ExtensionContext) {
    ACMICPCCommands.forEach((command) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(`goinmul.baekjoon.${command.command}`, command.callback)
        )
    })
}

export function deactivate() {}