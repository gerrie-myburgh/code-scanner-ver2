import {
	App,
	FileSystemAdapter,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	Modal,
} from "obsidian";
import { spawn } from "child_process";
import { existsSync } from "fs";

// Remember to rename these classes and interfaces!

interface CodeScannerSettings {
	dir: string;
	work: string;
	start: string;
	path: string;
	extension: string;
	destExtension: string;
}

const DEFAULT_SETTINGS: CodeScannerSettings = {
	dir: "UNKNOWN",
	work: "UNKNOWN",
	start: "UNKNOWN",
	path: "UNKNOWN",
	extension: "UNKNOWN",
	destExtension: "UNKNOWN",
};

export default class CodeScanner extends Plugin {
	settings: CodeScannerSettings;
	app: App;

	private async triggerScan() {
		if (this.settings.dir == "UNKNOWN") {
			new InfoModal(
				this.app,
				"Configuration Required",
				"Please configure plugin before using",
			).open();
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
			"-dest",
			this.settings.destExtension,
		];

		if (adapter instanceof FileSystemAdapter) {
			let executablePath = "";
			let workFolder = "";

			if (platform === "win32") {
				const basePath =
					adapter.getBasePath() +
					"\\" +
					this.app.vault.configDir +
					"\\plugins\\code-scanner-ver2";
				executablePath = basePath + "\\get-comments.exe";
				if (this.settings.work.startsWith("\\")) {
					workFolder = this.settings.work;
				} else {
					workFolder = "\\" + this.settings.work;
				}
			} else if (platform === "darwin") {
				const basePath =
					adapter.getBasePath() +
					"/" +
					this.app.vault.configDir +
					"/plugins/code-scanner-ver2";
				executablePath = basePath + "/get-comments-macos";
				if (this.settings.work.startsWith("/")) {
					workFolder = this.settings.work;
				} else {
					workFolder = "/" + this.settings.work;
				}
			} else if (platform === "linux") {
				const basePath =
					adapter.getBasePath() +
					"/" +
					this.app.vault.configDir +
					"/plugins/code-scanner-ver2";
				executablePath = basePath + "/get-comments-linux";
				if (this.settings.work.startsWith("/")) {
					workFolder = this.settings.work;
				} else {
					workFolder = "/" + this.settings.work;
				}
			} else {
				new InfoModal(
					this.app,
					"Unsupported Platform",
					`Unsupported platform: ${platform}`,
				).open();
				return;
			}

			// Check if executable exists
			if (!existsSync(executablePath)) {
				new InfoModal(
					this.app,
					"Executable Not Found",
					`Executable not found: ${executablePath}`,
				).open();
				console.error(`Executable not found: ${executablePath}`);
				return;
			}

			// Now spawn the process
			const workPath = adapter.getBasePath() + workFolder;
			const child = spawn(
				executablePath,
				parameters.concat(["-work", workPath]),
			);

			child.stdout.on("data", (data) => {
				new InfoModal(
					this.app,
					"Process Error",
					`Error: ${data}`,
				).open();
			});

			child.stderr.on("data", (data) => {
				console.error(`stderr: ${data}`);
				new InfoModal(
					this.app,
					"Process Error",
					`Error: ${data}`,
				).open();
			});

			child.on("error", (error) => {
				console.error(`Failed to start process: ${error}`);
				new InfoModal(
					this.app,
					"Process Failed",
					`Failed to start process: ${error.message}`,
				).open();
			});

			child.on("close", (code) => {
				console.log(`Process exited with code ${code}`);
				if (code === 0) {
					new InfoModal(
						this.app,
						"Scan Complete",
						"Scan completed successfully",
					).open();
				} else {
					new InfoModal(
						this.app,
						"Scan Failed",
						`Scan failed with exit code ${code}`,
					).open();
				}
			});
		}
	}

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"eye",
			"Scan text files for comment lines",
			(_evt: MouseEvent) => {
				this.triggerScan();
			},
		);

		// Add a command to trigger the scan from keyboard
		this.addCommand({
			id: "scan-text-files",
			name: "Scan text files for comment lines",
			callback: () => {
				this.triggerScan();
			},
		});

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

class InfoModal extends Modal {
	constructor(
		app: App,
		public title: string,
		public message: string,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		// Add title
		contentEl.createEl("h2", { text: this.title });

		// Add message
		contentEl.createEl("p", { text: this.message });

		// Add OK button
		const buttonContainer = contentEl.createDiv({
			cls: "modal-button-container",
		});
		const okButton = buttonContainer.createEl("button", { text: "OK" });
		okButton.addEventListener("click", () => {
			this.close();
		});

		// Close on Enter key
		this.scope.register([], "Enter", () => {
			this.close();
			return false;
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
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
			.setName("Folder structure")
			.setDesc("The folder structure definition")
			.addText((text) =>
				text
					.setPlaceholder(
						"Enter your dot separated folder structure definition",
					)
					.setValue(this.plugin.settings.path)
					.onChange(async (value) => {
						this.plugin.settings.path = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Extension")
			.setDesc("Extension of the source text files to scan")
			.addText((text) =>
				text
					.setPlaceholder("Enter your text file extension")
					.setValue(this.plugin.settings.extension)
					.onChange(async (value) => {
						this.plugin.settings.extension = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName("Destination file extension")
			.setDesc(
				"Extension of the destination files into which extracted text goes",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your destination file extension")
					.setValue(this.plugin.settings.destExtension)
					.onChange(async (value) => {
						this.plugin.settings.destExtension = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
