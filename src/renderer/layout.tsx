import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
// import icon from '../../assets/icon.svg';
// https://electron-react-boilerplate.js.org/docs/styling#tailwind-integration
import Pane from 'components/pane';
import { allProviders } from 'lib/constants';
import React from 'react';
import Split from 'react-split';
import 'tailwindcss/tailwind.css';
import { CmdOrCtrlKey, getEnabledProviders } from 'lib/utils';
import './App.css';
import { BrowserPane } from './browserPane';
import { ProviderInterface } from 'lib/types';
import { TopNav } from './TopNav';
import SettingsMenu from './components/settings';

// @ts-ignore
export type paneInfo = { webviewId: string; shortName: string };
const defaultPaneList: paneInfo[] = [
	{ webviewId: 'webviewOAI', shortName: 'ChatGPT' },
	{ webviewId: 'webviewCLAUDE2', shortName: 'Claude' },
];

const storedPaneList: paneInfo[] = window.electron.electronStore.get(
	'paneList',
	defaultPaneList,
);

// If user has 5 crammed panes saved from before, default to Duo so it's spacious
const initialPaneList = storedPaneList.length > 3 ? defaultPaneList : storedPaneList;

export default function Layout() {
	const [superprompt, setSuperprompt] = React.useState('');
	const [paneList, setPaneList] = React.useState(initialPaneList);
	const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
	const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

	const originalAlwaysOnTop = window.electron.browserWindow.getAlwaysOnTop();
	const [isAlwaysOnTop, setisAlwaysOnTop] = React.useState(originalAlwaysOnTop);
	const toggleIsAlwaysOnTop = () => {
		const newstate = window.electron.browserWindow.getAlwaysOnTop();
		setisAlwaysOnTop(!newstate);
		window.electron.browserWindow.setAlwaysOnTop(!newstate);
	};

	const enabledProviders = paneList.map(
		(x) => allProviders.find((y) => y.webviewId === (x.webviewId || x.id))!,
	).filter(Boolean);

	const [sizes, setSizes] = React.useState(updateSplitSizes(enabledProviders, focusedIndex));

	React.useEffect(() => {
		setSizes(updateSplitSizes(enabledProviders, focusedIndex));
	}, [focusedIndex, paneList]);

	React.useEffect(() => {
		window.electron.electronStore.set('paneList', paneList);
	}, [paneList]);

	const resetPaneList = () => setPaneList(defaultPaneList);

	const nonEnabledProviders: ProviderInterface[] = allProviders.filter(
		(x) => !enabledProviders.includes(x),
	);

	const superpromptRef = React.useRef(superprompt);
	superpromptRef.current = superprompt;

	/*
	 * Apply provider-specific CSS and custom paste behavior
	 */
	React.useEffect(() => {
		const domReadyCleanups: Array<() => void> = [];
		enabledProviders.forEach((provider) => {
			provider.handleCss();
			provider.setupCustomPasteBehavior();

			const webview = provider.getWebview() as any;
			if (webview) {
				const onDomReady = () => {
					if (superpromptRef.current) {
						try {
							provider.handleInput(superpromptRef.current.replace(/`/g, '\\`'));
						} catch (err) {
							// ignore
						}
					}
				};
				webview.addEventListener('dom-ready', onDomReady);
				domReadyCleanups.push(() => {
					webview.removeEventListener('dom-ready', onDomReady);
				});
			}
		});
		return () => {
			domReadyCleanups.forEach((cleanup) => cleanup());
		};
	}, [enabledProviders]);

	React.useEffect(() => {
		if (!superprompt) return;
		enabledProviders.forEach((provider) => {
			// Call provider-specific CSS handling and custom paste setup
			try {
				const webview = provider.getWebview() as any;
				if (!webview) return;
				try {
					webview.getWebContentsId();
				} catch (e) {
					// Webview is not ready yet; onDomReady listener will deliver the input when ready
					return;
				}
				// regex to sanitize superprompt from backticks since we will put it into a template string
				// solves https://github.com/smol-ai/GodMode/issues/218
				provider.handleInput(superprompt.replace(/`/g, '\\`'));
			} catch (err) {
				console.error('error settling ' + provider.paneId(), err);
			}
		});
	}, [enabledProviders, superprompt]);

	const formRef = React.useRef<HTMLDivElement>(null); // don't actually use a <form> because it will just reload on submit even if you preventdefault
	const SuperPromptEnterKey = window.electron.electronStore.get(
		'SuperPromptEnterKey',
		false,
	);

	function submitProviders() {
		enabledProviders.forEach((provider) => {
			provider.handleSubmit(superprompt);
		});
	}

	function enterKeyHandler(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		const isCmdOrCtrl = event.metaKey || event.ctrlKey;
		const isEnter = event.key === 'Enter';

		if ((SuperPromptEnterKey && isEnter) || (isCmdOrCtrl && isEnter)) {
			event.preventDefault();
			submitProviders();
		}
	}

	const windowRef = React.useRef<HTMLDivElement>(null);

	function updateSplitSizes(panes: any[], focalIndex: number | null = null) {
		// const clientWidth = windowRef.current?.clientWidth!;
		// const remainingWidth = ((clientWidth - 100) / clientWidth) * 100;
		const remainingWidth = 100;
		// Handle specific pane focus
		if (focalIndex !== null || focalIndex === 'A') {
			let sizes = new Array(panes.length).fill(0);
			sizes[focalIndex] = remainingWidth;
			return sizes;
		} else {
			// Evenly distribute remaining space among all panes
			let remainingPercentage = remainingWidth / panes.length;
			let sizes = new Array(panes.length).fill(remainingPercentage);
			return sizes;
		}
	}

	const paneShortcutKeys: Record<string, number | null> = {};
	for (let i = 0; i < enabledProviders.length; i++) {
		paneShortcutKeys[`${i + 1}`] = i;
	}

	console.warn('paneShortcutKeys', paneShortcutKeys);

	const [currentlyOpenPreviewPane, setOpenPreviewPane] = React.useState(0);

	function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		const isCmdOrCtrl = event.metaKey || event.ctrlKey;
		const isShift = event.shiftKey;
		console.debug('keydown', event.key, isCmdOrCtrl, event);
		if (
			isCmdOrCtrl &&
			(event.key in paneShortcutKeys ||
				(event.code.match(/Digit[1-9]/) &&
					event.code[event.code.length - 1] in paneShortcutKeys))
		) {
			const digit = +event.key || +event.code[event.code.length - 1];
			const targetIdx = digit - 1;
			if (targetIdx >= 0 && targetIdx < enabledProviders.length) {
				event.preventDefault();
				setFocusedIndex(focusedIndex === targetIdx ? null : targetIdx);
			}
		} else if (isCmdOrCtrl && isShift && event.key.toLowerCase() === 'a') {
			event.preventDefault();
			setFocusedIndex(null);
		} else if (
			(isCmdOrCtrl && event.key === '+') ||
			(isCmdOrCtrl && event.key === '=')
		) {
			// Increase zoom level with Cmd/Ctrl + '+' or '='
			enabledProviders.forEach((provider) => {
				// @ts-ignore
				provider
					.getWebview()
					// @ts-ignore
					.setZoomLevel(provider.getWebview().getZoomLevel() + 1);
			});
		} else if (isCmdOrCtrl && event.key === '0') {
			// reset zoomlevel
			enabledProviders.forEach((provider) => {
				// @ts-ignore
				provider
					.getWebview()
					// @ts-ignore
					.setZoomLevel(0);
			});
		} else if (isCmdOrCtrl && event.key === '-') {
			// Decrease zoom level with Cmd/Ctrl + '-'
			enabledProviders.forEach((provider) => {
				// @ts-ignore
				provider
					.getWebview()
					// @ts-ignore
					.setZoomLevel(provider.getWebview().getZoomLevel() - 1);
			});
		} else if (isCmdOrCtrl && event.key === 'p') {
			toggleIsAlwaysOnTop();
		} else if (
			event.shiftKey &&
			event.metaKey &&
			(event.key === 'L' || event.key === 'l')
		) {
			// Toggle dark mode with Cmd/Ctrl + Shift + L
			let isDarkMode = window.electron.electronStore.get('isDarkMode', false);
			isDarkMode = !isDarkMode;
			window.electron.electronStore.set('isDarkMode', isDarkMode);

			enabledProviders.forEach((provider) => {
				provider.handleDarkMode(isDarkMode);
			});
		}

		enterKeyHandler(event);
	}

	return (
		<div id="windowRef" className="flex flex-col h-screen overflow-hidden bg-slate-950" ref={windowRef}>
			<TopNav
				paneList={paneList}
				setPaneList={setPaneList}
				allProviders={allProviders as ProviderInterface[]}
				focusedIndex={focusedIndex}
				setFocusedIndex={setFocusedIndex}
				isAlwaysOnTop={isAlwaysOnTop}
				toggleIsAlwaysOnTop={toggleIsAlwaysOnTop}
				openSettings={() => setIsSettingsOpen(true)}
			/>
			<SettingsMenu
				open={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
			<Split
				sizes={sizes}
				minSize={focusedIndex !== null ? 0 : 200}
				expandToMin={false}
				gutterSize={focusedIndex !== null ? 0 : 3}
				gutterAlign="center"
				dragInterval={1}
				direction="horizontal"
				className="flex flex-1 overflow-hidden"
			>
				{enabledProviders.map((provider, index) => (
					<Pane
						provider={provider as ProviderInterface}
						number={index + 1}
						currentlyOpenPreviewPane={currentlyOpenPreviewPane}
						setOpenPreviewPane={setOpenPreviewPane}
						onClose={
							paneList.length > 1
								? () => {
										const next = paneList.filter(
											(p) => p.webviewId !== provider.webviewId,
										);
										setPaneList(next);
										if (focusedIndex !== null && focusedIndex >= next.length) {
											setFocusedIndex(next.length - 1);
										}
								  }
								: undefined
						}
						onFocus={() => {
							setFocusedIndex(focusedIndex === index ? null : index);
						}}
						key={provider.webviewId}
					/>
				))}
			</Split>
			<div
				ref={formRef}
				id="form"
				className="border-t border-slate-800 bg-slate-900 shadow-2xl shrink-0"
			>
				<div id="form-wrapper" className="flex w-full items-center px-4 py-2 space-x-3">
					<textarea
						rows={2}
						className="resize-none flex-1 bg-slate-800/90 text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
						id="prompt"
						value={superprompt}
						onChange={(e) => setSuperprompt(e.target.value)}
						onKeyDown={onKeyDown}
						name="prompt"
						placeholder={`Ask all active models... (Press ${CmdOrCtrlKey}+Enter to send, ${CmdOrCtrlKey}+1/2 to focus a model)`}
					/>
					<div className="flex items-center space-x-2 shrink-0">
						<button
							className="flex items-center justify-center w-10 h-10 text-white transition bg-blue-600 rounded-lg shadow-md hover:bg-blue-500 active:scale-95"
							id="btn"
							onClick={submitProviders}
							type="submit"
							title={`Send to all active models (${CmdOrCtrlKey}+Enter)`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="2"
								stroke="currentColor"
								className="w-5 h-5 stroke-white"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
								/>
							</svg>
						</button>
						<BrowserPane
							{...{
								superprompt,
								setSuperprompt,
								paneList,
								setPaneList,
								resetPaneList,
								nonEnabledProviders,
								isAlwaysOnTop,
								toggleIsAlwaysOnTop,
								isSettingsOpen,
								setIsSettingsOpen,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
