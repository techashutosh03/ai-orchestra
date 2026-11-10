const Provider = require('./provider');

class OpenAI extends Provider {
	static webviewId = 'webviewOAI';
	static fullName = 'OpenAI ChatGPT';
	static shortName = 'ChatGPT';

	static url = 'https://chatgpt.com/';

	static handleInput(input) {
		const webview = this.getWebview();
		if (!webview) return;
		try {
			webview.getWebContentsId();
		} catch (e) {
			return;
		}
		webview.executeJavaScript(`{
        var inputElement = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
        if (inputElement) {
          if (inputElement.tagName === 'TEXTAREA') {
            inputElement.value = \`${input}\`;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            inputElement.textContent = \`${input}\`;
            inputElement.dispatchEvent(new InputEvent('input', { bubbles: true }));
          }
        }
      }`).catch(() => {});
	}

	static handleSubmit() {
		const webview = this.getWebview();
		if (!webview) return;
		webview.executeJavaScript(`{
        var btn = document.querySelector('button[data-testid="send-button"]') ||
                  document.querySelector('button[aria-label="Send prompt"]') ||
                  document.querySelector('button[data-testid="fruitjuice-send-button"]');
        if (btn) {
            btn.focus();
            btn.disabled = false;
            btn.click();
        }
    }`).catch(() => {});
	}

	static handleCss() {
		this.getWebview().addEventListener('dom-ready', () => {
			// hide message below text input, sidebar, suggestions on new chat
			this.getWebview().insertCSS(`
        body {
          scrollbar-width: none;
        }
        .text-xs.text-center {
            opacity: 0;
            height: 0;
            margin-bottom: -10px;
          }

          [class*="shared__Wrapper"] {
            align-items: center;
            justify-content: center;
            text-align: center;
            margin-top: 15vh;
          }

          [class*="shared__Wrapper"] h3 {
            margin-top: -40px;
            font-size: 20px;
          }


        `);
		});
	}

	static isEnabled() {
		return window.electron.electronStore.get(`${this.webviewId}Enabled`, true);
	}
}

module.exports = OpenAI;
