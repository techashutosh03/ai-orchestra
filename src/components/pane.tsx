import { Button } from 'renderer/components/ui/button';
import {
	Dialog,
	DialogXContent,
	DialogHeader,
	DialogTitle,
} from 'renderer/components/ui/dialog';
import { ProviderInterface } from 'lib/types';
import { CmdOrCtrlKey } from 'lib/utils';
import React from 'react';
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ReloadIcon,
	ResetIcon,
	ZoomInIcon,
	ZoomOutIcon,
	MagnifyingGlassIcon,
	EnterFullScreenIcon,
	Cross2Icon,
} from '@radix-ui/react-icons';
import { Input } from 'renderer/components/ui/input';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from 'renderer/components/ui/tooltip';

export default function Pane({
	provider,
	number,
	currentlyOpenPreviewPane,
	setOpenPreviewPane,
	onClose,
	onFocus,
}: {
	provider: ProviderInterface;
	number: number;
	currentlyOpenPreviewPane: number;
	setOpenPreviewPane: (num: number) => void;
	onClose?: () => void;
	onFocus?: () => void;
}) {
	const isPreviewOpen = currentlyOpenPreviewPane === number;
	const contentRef = React.useRef<HTMLDivElement>(null);

	const [shownUrl, setShownUrl] = React.useState(null);

	React.useEffect(() => {
		const interval = setInterval(() => {
			const newUrl = (provider.getWebview() as any)?.src;
			if (newUrl && newUrl !== shownUrl) setShownUrl(newUrl);
		}, 1500);
		return () => clearInterval(interval);
	}, [shownUrl, provider]);

	// this did not work not sure why
	// // set a timer effect every second to check if the webview is can go back
	// const [canGoBack, setCanGoBack] = React.useState(false);
	// const [canGoFwd, setCanGoFwd] = React.useState(false);
	// React.useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		console.log(
	// 			'provider.getWebview()?.canGoBack()',
	// 			provider.getWebview(),
	// 			provider.getWebview()?.canGoBack()
	// 		);
	// 		// @ts-ignore
	// 		if (provider.getWebview()?.canGoBack()) {
	// 			setCanGoBack(true);
	// 		} else {
	// 			setCanGoBack(false);
	// 		}
	// 		// @ts-ignore
	// 		if (provider.getWebview()?.canGoForward()) {
	// 			setCanGoFwd(true);
	// 		} else {
	// 			setCanGoFwd(true);
	// 		}
	// 	}, 1000);
	// 	return () => clearInterval(interval);
	// });

	function XButton({ children, tooltip, onClick, className = '' }: any) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							className={`hover:bg-gray-200 ${className}`}
							onClick={onClick}
						>
							{children}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right" className="text-white bg-black">
						<p>{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<div key={provider.paneId()} className="page darwin group flex flex-col h-full bg-slate-900 border-r border-slate-800 last:border-r-0">
			{/* Dedicated Pane Header */}
			<div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-850 bg-slate-900 border-b border-slate-700/60 text-slate-200 select-none z-10 shrink-0">
				<div className="flex items-center space-x-2 min-w-0">
					<span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
					<button
						onClick={onFocus}
						className="font-semibold text-xs text-slate-200 hover:text-blue-400 transition flex items-center space-x-1 truncate text-left"
						title={`Focus on ${provider.shortName} (Cmd+${number})`}
					>
						<span className="truncate">{provider.fullName || provider.shortName}</span>
						<span className="text-slate-400 font-mono text-[10px] shrink-0">
							({CmdOrCtrlKey}+{number})
						</span>
					</button>
				</div>
				<div className="flex items-center space-x-0.5 shrink-0">
					<button
						onClick={() => {
							const webview = provider.getWebview() as any;
							if (typeof webview?.refresh === 'function') webview.refresh();
							else webview?.reload();
						}}
						title="Reload this chat"
						className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
					>
						<ReloadIcon className="w-3.5 h-3.5" />
					</button>
					<button
						onClick={() => {
							const webview = provider.getWebview() as any;
							if (webview?.getZoomLevel) webview.setZoomLevel(webview.getZoomLevel() + 1);
						}}
						title="Zoom In"
						className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
					>
						<ZoomInIcon className="w-3.5 h-3.5" />
					</button>
					<button
						onClick={() => {
							const webview = provider.getWebview() as any;
							if (webview?.getZoomLevel) webview.setZoomLevel(webview.getZoomLevel() - 1);
						}}
						title="Zoom Out"
						className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
					>
						<ZoomOutIcon className="w-3.5 h-3.5" />
					</button>
					<button
						onClick={() => setOpenPreviewPane(number)}
						title="Full Screen Focus"
						className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
					>
						<EnterFullScreenIcon className="w-3.5 h-3.5" />
					</button>
					{onClose && (
						<button
							onClick={onClose}
							title={`Close ${provider.shortName}`}
							className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition ml-0.5"
						>
							<Cross2Icon className="w-3.5 h-3.5" />
						</button>
					)}
				</div>
			</div>

			<Dialog
				open={isPreviewOpen}
				onOpenChange={() => {
					setOpenPreviewPane(0);
					// zoom out when dropping out of preview
					const webview = provider.getWebview() as any;
					if (webview?.getZoomLevel) {
						webview.setZoomLevel(webview.getZoomLevel() - 2);
					}
				}}
			>
				<DialogXContent
					className="bg-white pointer-events-none"
					ref={contentRef}
				>
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between pr-8">
							{provider.fullName}
							<div className="flex">
								<XButton
									tooltip={`Zoom in`}
									onClick={() => {
										const webview = provider.getWebview() as any;
										if (webview?.getZoomLevel) webview.setZoomLevel(webview.getZoomLevel() + 1);
									}}
								>
									<ZoomInIcon />
								</XButton>
								<XButton
									tooltip={`Zoom out`}
									onClick={() => {
										const webview = provider.getWebview() as any;
										if (webview?.getZoomLevel) webview.setZoomLevel(webview.getZoomLevel() - 1);
									}}
								>
									<ZoomOutIcon />
								</XButton>
								<XButton
									tooltip={`Reset Zoom`}
									onClick={() => {
										const webview = provider.getWebview() as any;
										if (webview?.setZoomLevel) webview.setZoomLevel(0);
									}}
								>
									<MagnifyingGlassIcon />
								</XButton>
							</div>
							<Input type="url" value={shownUrl || ''} readOnly={true} />
							<div className="flex">
								<XButton
									tooltip={`Reload window`}
									className="mr-4"
									onClick={() => {
										const webview = provider.getWebview() as any;
										if (typeof webview?.refresh === 'function') {
											webview?.refresh();
										} else {
											webview?.reload();
										}
									}}
								>
									<ReloadIcon />
								</XButton>
								<XButton
									tooltip={`Go Back`}
									onClick={() => {
										(provider.getWebview() as any)?.goBack();
									}}
								>
									<ArrowLeftIcon />
								</XButton>
								<XButton
									tooltip={`Go forward`}
									onClick={() => {
										(provider.getWebview() as any)?.goForward();
									}}
								>
									<ArrowRightIcon />
								</XButton>
								{provider.clearCookies && (
									<XButton
										tooltip={`Clear Cookies`}
										onClick={() => {
											provider.clearCookies();
										}}
									>
										<ResetIcon className="mr-1" /> Clear Cookies
									</XButton>
								)}
							</div>
						</DialogTitle>
					</DialogHeader>
				</DialogXContent>
			</Dialog>
			<div className="relative flex-1 w-full h-full overflow-hidden">
				<webview
					// @ts-ignore
					allowpopups="true"
					id={provider.webviewId}
					src={provider.url}
					className={
						isPreviewOpen
							? 'fixed pointer-events-auto left-[5%] top-[10%] z-[100] grid w-10/12 gap-4 p-2 duration-200 sm:rounded-lg rounded-xl h-[85vh] bg-white shadow-2xl'
							: 'absolute inset-0 w-full h-full'
					}
					useragent={
						provider.getUserAgent() ? provider.getUserAgent() : undefined
					}
				/>
			</div>
		</div>
	);
}
