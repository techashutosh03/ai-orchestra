import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
	ReloadIcon,
	Cross2Icon,
	PlusIcon,
	ViewVerticalIcon,
	SquareIcon,
	BookmarkIcon,
	GearIcon,
} from '@radix-ui/react-icons';
import { ProviderInterface } from 'lib/types';
import { paneInfo } from './layout';

const DUO_PRESET: paneInfo[] = [
	{ webviewId: 'webviewOAI', shortName: 'ChatGPT' },
	{ webviewId: 'webviewCLAUDE2', shortName: 'Claude' },
];

const TRIO_PRESET: paneInfo[] = [
	{ webviewId: 'webviewOAI', shortName: 'ChatGPT' },
	{ webviewId: 'webviewCLAUDE2', shortName: 'Claude' },
	{ webviewId: 'webviewPerplexity', shortName: 'Perplexity' },
];

interface TopNavProps {
	paneList: paneInfo[];
	setPaneList: (panes: paneInfo[]) => void;
	allProviders: ProviderInterface[];
	focusedIndex: number | null;
	setFocusedIndex: (idx: number | null) => void;
	isAlwaysOnTop: boolean;
	toggleIsAlwaysOnTop: () => void;
	openSettings: () => void;
}

export function TopNav({
	paneList,
	setPaneList,
	allProviders,
	focusedIndex,
	setFocusedIndex,
	isAlwaysOnTop,
	toggleIsAlwaysOnTop,
	openSettings,
}: TopNavProps) {
	const nonEnabledProviders = allProviders.filter(
		(p) => !paneList.some((item) => item.webviewId === p.webviewId),
	);

	const removePane = (webviewId: string) => {
		if (paneList.length <= 1) return;
		const nextList = paneList.filter((p) => p.webviewId !== webviewId);
		setPaneList(nextList);
		if (focusedIndex !== null && focusedIndex >= nextList.length) {
			setFocusedIndex(nextList.length - 1);
		}
	};

	const addProvider = (provider: ProviderInterface) => {
		if (paneList.some((p) => p.webviewId === provider.webviewId)) return;
		const nextList = [
			...paneList,
			{ webviewId: provider.webviewId, shortName: provider.shortName },
		];
		setPaneList(nextList);
		if (focusedIndex !== null) {
			setFocusedIndex(nextList.length - 1);
		}
	};

	return (
		<div className="flex flex-col bg-slate-900 border-b border-slate-800 text-slate-200 select-none">
			{/* Top Bar: Title & Controls */}
			<div className="flex items-center justify-between px-3 py-1.5 text-xs">
				<div className="flex items-center space-x-3">
					<span className="font-semibold tracking-wide text-slate-100 flex items-center space-x-1.5">
						<span>🎻</span>
						<span>AI Orchestra</span>
					</span>

					{/* Pin Always on Top */}
					<button
						onClick={toggleIsAlwaysOnTop}
						className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] transition ${
							isAlwaysOnTop
								? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
						}`}
						title="Toggle Always on Top"
					>
						<BookmarkIcon className="w-3 h-3" />
						<span>{isAlwaysOnTop ? 'Pinned' : 'Pin'}</span>
					</button>

					{/* View Mode Switcher */}
					<div className="flex items-center bg-slate-800/80 rounded p-0.5 border border-slate-700/50">
						<button
							onClick={() => setFocusedIndex(null)}
							className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
								focusedIndex === null
									? 'bg-blue-600 text-white shadow-sm'
									: 'text-slate-400 hover:text-slate-200'
							}`}
							title="Show all active models side-by-side"
						>
							<ViewVerticalIcon className="w-3 h-3" />
							<span>Split View</span>
						</button>
						<button
							onClick={() => setFocusedIndex(focusedIndex !== null ? focusedIndex : 0)}
							className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
								focusedIndex !== null
									? 'bg-blue-600 text-white shadow-sm'
									: 'text-slate-400 hover:text-slate-200'
							}`}
							title="Focus single model (full window width)"
						>
							<SquareIcon className="w-3 h-3" />
							<span>Single Focus</span>
						</button>
					</div>
				</div>

				{/* Right Side: Quick Presets & Add Model & Settings */}
				<div className="flex items-center space-x-2">
					<div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-400">
						<span>Preset:</span>
						<button
							onClick={() => {
								setPaneList(DUO_PRESET);
								setFocusedIndex(null);
							}}
							className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50"
							title="2 Models: ChatGPT + Claude (50% each)"
						>
							Duo (2x)
						</button>
						<button
							onClick={() => {
								setPaneList(TRIO_PRESET);
								setFocusedIndex(null);
							}}
							className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50"
							title="3 Models: ChatGPT + Claude + Perplexity (33% each)"
						>
							Trio (3x)
						</button>
					</div>

					{/* Add Model Dropdown */}
					{nonEnabledProviders.length > 0 && (
						<Menu as="div" className="relative inline-block text-left">
							<Menu.Button className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition">
								<PlusIcon className="w-3 h-3" />
								<span>Add Model</span>
							</Menu.Button>
							<Transition
								as={Fragment}
								enter="transition ease-out duration-100"
								enterFrom="transform opacity-0 scale-95"
								enterTo="transform opacity-100 scale-100"
								leave="transition ease-in duration-75"
								leaveFrom="transform opacity-100 scale-100"
								leaveTo="transform opacity-0 scale-95"
							>
								<Menu.Items className="absolute right-0 z-50 w-44 mt-1 origin-top-right bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 text-xs focus:outline-none max-h-60 overflow-y-auto">
									{nonEnabledProviders.map((provider) => (
										<Menu.Item key={provider.webviewId}>
											{({ active }) => (
												<button
													onClick={() => addProvider(provider)}
													className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
														active
															? 'bg-blue-600 text-white'
															: 'text-slate-200'
													}`}
												>
													<span>{provider.shortName}</span>
													<span className="text-[10px] text-slate-400">
														+ Add
													</span>
												</button>
											)}
										</Menu.Item>
									))}
								</Menu.Items>
							</Transition>
						</Menu>
					)}

					{/* Settings */}
					<button
						onClick={openSettings}
						className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
						title="Settings"
					>
						<GearIcon className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			{/* Second Row: Model Tabs */}
			<div className="flex items-center space-x-1 px-3 py-1 bg-slate-950/60 overflow-x-auto text-xs border-t border-slate-800/60">
				{paneList.map((item, idx) => {
					const isFocused = focusedIndex === idx;
					return (
						<div
							key={item.webviewId}
							className={`group flex items-center rounded border transition ${
								isFocused
									? 'bg-blue-600/90 text-white border-blue-500 shadow-sm'
									: focusedIndex === null
									? 'bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-700'
									: 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
							}`}
						>
							<button
								onClick={() => {
									if (focusedIndex === idx) {
										setFocusedIndex(null); // toggle back to split
									} else {
										setFocusedIndex(idx);
									}
								}}
								className="px-2.5 py-1 text-xs font-medium flex items-center space-x-1.5"
								title={`Click to view ${item.shortName} full-screen (Cmd+${idx + 1})`}
							>
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
								<span>{item.shortName}</span>
								{isFocused && (
									<span className="text-[10px] bg-blue-700 px-1 rounded text-blue-200">
										Active
									</span>
								)}
							</button>

							{paneList.length > 1 && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										removePane(item.webviewId);
									}}
									className="pr-1.5 pl-0.5 text-slate-400 hover:text-red-300 transition"
									title={`Close ${item.shortName}`}
								>
									<Cross2Icon className="w-3 h-3" />
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
