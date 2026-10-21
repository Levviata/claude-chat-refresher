# Claude Chat Availability Refresher

A small Opera (maybe works in other Chromiums) extension that automatically resumes a Claude conversation when its 5-hour message limit expires.

The extension reads the reset time shown by Claude, waits until that time, and then checks the conversation for the `Continuar` button. If Claude has enabled it, the extension clicks it automatically.

yes it's in spanish, use that language or change the code.

## How it works

1. Open a Claude conversation and leave the tab open.
2. Claude reaches the message limit and shows the time when access will return.
3. The extension detects that time and waits for it.
4. When the reset time is reached, it checks the Claude tab.
5. If `Continuar` is enabled, it clicks it.
6. You can keep using another tab, such as YouTube, without being interrupted.

The extension does not bypass or modify Claude's message limit. It only automates the normal UI action that becomes available after the limit expires.

## Installation

1. Download and extract the extension.
2. Open `opera://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted extension folder.
6. Open or reload `claude.ai`.

## Usage

Once installed, leave the Claude conversation open in a background tab.

You don't need to keep the Claude tab active or manually return to it when the timer expires. The extension handles the check automatically.

The popup shows the current state and the reset time detected from Claude.

## Important

Opera must remain running and the Claude conversation must remain open in a tab.

Claude can change its website UI at any time. If the extension stops detecting the reset time or `Continuar` button after a Claude update, its selectors may need to be updated.

no promise it works.

## Privacy

The extension only runs on `claude.ai`.

It does not send your conversations, prompts, or account information anywhere. It only observes the relevant Claude UI and interacts with the `Continuar` control when it becomes available.

## AI Disclaimer

This project was created with the assistance of AI. Review and test the code before using it. No guarantee is made that it will continue working with future changes to Claude or Opera.