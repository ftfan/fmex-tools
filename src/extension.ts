// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { link } from 'fs';
import open = require('open');
import * as vscode from 'vscode';
import { FCoin } from './FCoin';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration();
	const watchList: string[] = config.get('fmex-tools.symbol') || ['btcusdt'];
	const fullList = [...watchList];
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		const config = vscode.workspace.getConfiguration();
		const newList: string[] = config.get('fmex-tools.symbol') || ['btcusdt'];
		watchList.splice(0, watchList.length, ...newList);
		watchList.forEach(item => {
			if (fullList.includes(item)) {return;}
			fullList.push(item);
		});
		WatchTicker();
	}));
	const ws = new FCoin.Ws();
	const WatchMap: Record<string, { bar: vscode.StatusBarItem; handler: any }> = {};

	function WatchTicker(){
		fullList.forEach(symbol => {
			if (!WatchMap[symbol]) {
				WatchMap[symbol] = {
					bar: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left),
					handler: ws.sub('ticker', symbol),
				};
			}
			const item = WatchMap[symbol];

			// 不需要了
			if (!watchList.includes(symbol)) {
				item.bar.dispose();
				item.handler.close();
				delete WatchMap[symbol];
				return;
			}
			const symbolText = `${symbol.toLocaleUpperCase().replace(/USDT/, '')}: `;
			item.bar.text = `${symbolText}初始化...`;
			item.bar.show();
			item.bar.command = {
				command: 'symbol.focus',
				title: symbol,
				arguments: [`https://exchange.fcoin.pro/ex/spot/main/${symbol.toLocaleLowerCase().replace('usdt', '')}/usdt`],
			};
			item.handler.ondata((data: FCoin.WsTickerRes) => {
				 // 不需要了
				if (!watchList.includes(symbol)) {
					return;
				}
				item.bar.text = symbolText + data.ticker[0].toString();
				// item.bar.tooltip = `${symbol.toLocaleUpperCase()}: ${data.ticker[0]} (${DateFormat(data.seq * 1000, 'hh:mm:ss')})`;
				// console.log(symbol, JSON.stringify(data));
			});
		});

		context.subscriptions.push(vscode.commands.registerCommand('symbol.focus', (link) => {
			open(link);
		}));
	}

	WatchTicker();
	// vscode.window.showInformationMessage('Hello World from fmex-tools!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
