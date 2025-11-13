import {
	App,
	FileSystemAdapter,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { spawn } from "child_process";

// Remember to rename these classes and interfaces!

interface CodeScannerSettings {
	dir: string;
	work: string;
	start: string;
	path: string;
	extension: string;
}

const DEFAULT_SETTINGS: CodeScannerSettings = {
	dir: "UNKNOWN",
	work: "UNKNOWN",
	start: "UNKNOWN",
	path: "UNKNOWN",
	extension: "UNKNOWN",
};

export default class CodeScanner extends Plugin {
	settings: CodeScannerSettings;
	app: App;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"eye",
			"Scan text files for comment lines",
			(_evt: MouseEvent) => {
				if (this.settings.dir == "UNKNOWN") {
					new Notice("Please configure plugin before using");
					return;
				}
				const platform = process.platform; // e.g., 'darwin', 'win32', 'linux'
				const adapter = this.app.vault.adapter;
				const parameters = [
					"-dir",
					this.settings.dir,
					"-start",
					this.settings.start,
					"-path",
					this.settings.path,
					"-ext",
					this.settings.extension,
				];
				if (adapter instanceof FileSystemAdapter) {
					if (platform === "win32") {
						const basePath =
							adapter.getBasePath() +
							this.app.vault.configDir +
							"/plugins/code-scanner-ver2";
						let workFolder = "";
						if (this.settings.work.startsWith("\\")) {
							workFolder = this.settings.work;
						} else {
							workFolder = "\\" + this.settings.work;
						}
						const child = spawn(
							basePath + "\\get-comments.exe",
							parameters.concat([
								"-work",
								adapter.getBasePath() + workFolder,
							]),
						);

						child.stdout.on("data", (data) => {
							new Notice(`stdout: ${data}`);
						});

						child.stderr.on("data", (data) => {
							console.error(`stderr: ${data}`);
						});
					} else if (platform === "darwin") {
						const basePath =
							adapter.getBasePath() +
							this.app.vault.configDir +
							"/plugins/code-scanner-ver2";
						let workFolder = "";
						if (this.settings.work.startsWith("/")) {
							workFolder = this.settings.work;
						} else {
							workFolder = "/" + this.settings.work;
						}
						const child = spawn(
							basePath + "/get-comments-macos",
							parameters.concat([
								"-work",
								adapter.getBasePath() + workFolder,
							]),
						);

						child.stdout.on("data", (data) => {
							new Notice(`stdout: ${data}`);
						});

						child.stderr.on("data", (data) => {
							console.error(`stderr: ${data}`);
						});
					} else if (platform === "linux") {
						const basePath =
							adapter.getBasePath() +
							this.app.vault.configDir +
							"/plugins/code-scanner-ver2";
						let workFolder = "";
						if (this.settings.work.startsWith("/")) {
							workFolder = this.settings.work;
						} else {
							workFolder = "/" + this.settings.work;
						}
						const child = spawn(
							basePath + "/get-comments-linux",
							parameters.concat([
								"-work",
								adapter.getBasePath() + workFolder,
							]),
						);

						child.stdout.on("data", (data) => {
							new Notice(`stdout: ${data}`);
						});

						child.stderr.on("data", (data) => {
							console.error(`stderr: ${data}`);
						});
					}
				}
				// Called when the user clicks the icon.
			},
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CodeScannerTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CodeScannerTab extends PluginSettingTab {
	plugin: CodeScanner;

	constructor(app: App, plugin: CodeScanner) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Folder")
			.setDesc("Location of text file to scan")
			.addText((text) =>
				text
					.setPlaceholder("Enter your text file start folder")
					.setValue(this.plugin.settings.dir)
					.onChange(async (value) => {
						this.plugin.settings.dir = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Working folder")
			.setDesc("Location of md files")
			.addText((text) =>
				text
					.setPlaceholder("Enter your working folder name")
					.setValue(this.plugin.settings.work)
					.onChange(async (value) => {
						this.plugin.settings.work = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Start")
			.setDesc("The start of line to extract to md file")
			.addText((text) =>
				text
					.setPlaceholder("Enter your start string")
					.setValue(this.plugin.settings.start)
					.onChange(async (value) => {
						this.plugin.settings.start = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("The markdown file path")
			.setDesc("The folder structure definition")
			.addText((text) =>
				text
					.setPlaceholder(
						"Enter your dot seperated folder structure definition",
					)
					.setValue(this.plugin.settings.path)
					.onChange(async (value) => {
						this.plugin.settings.path = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Extension")
			.setDesc("Extension of the text files to scan")
			.addText((text) =>
				text
					.setPlaceholder("Enter your text file extension")
					.setValue(this.plugin.settings.extension)
					.onChange(async (value) => {
						this.plugin.settings.extension = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
