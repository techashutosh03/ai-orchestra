const Provider = require('./provider');

class DeepSeek extends Provider {
	static webviewId = 'webviewDeepSeek';
	static fullName = 'DeepSeek Chat';
	static shortName = 'DeepSeek';

	static url = 'https://chat.deepseek.com/';

	static handleInput(input) {
		const webview = this.getWebview();
		if (!webview) return;
		try {
			webview.getWebContentsId();
		} catch (e) {
			return;
		}
		webview.executeJavaScript(`{
			var inputElement = document.querySelector('textarea#chat-input') || document.querySelector('textarea');
			if (inputElement) {
				inputElement.focus();
				var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
				if (nativeTextAreaValueSetter) {
					nativeTextAreaValueSetter.call(inputElement, \`${input}\`);
				} else {
					inputElement.value = \`${input}\`;
				}
				inputElement.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}`).catch(() => {});
	}

	static handleSubmit() {
		const webview = this.getWebview();
		if (!webview) return;
		webview.executeJavaScript(`{
			var btn = document.querySelector('div[aria-label="Send"]') ||
			          document.querySelector('div[role="button"]:has(svg)') ||
			          document.querySelector('button[type="submit"]');
			if (btn) {
				btn.click();
			}
		}`).catch(() => {});
	}

	static handleCss() {
		this.getWebview().addEventListener('dom-ready', () => {
			this.getWebview().insertCSS(`
				/* Hide sidebar and banners */
				[class*="sidebar"] {
					display: none !important;
				}
			`);
		});
	}

	static isEnabled() {
		return window.electron.electronStore.get(`${this.webviewId}Enabled`, false);
	}
}

module.exports = DeepSeek;
