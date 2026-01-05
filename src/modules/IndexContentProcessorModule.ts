import {App, MarkdownRenderChild, MarkdownRenderer, TAbstractFile, TFile} from "obsidian";
import FolderIndexPlugin from "../main";
import {MarkdownTextRenderer} from "../types/MarkdownTextRenderer";


export class IndexContentProcessorModule extends MarkdownRenderChild {
	private readonly blockSource: string;

	constructor(
		private readonly app: App,
		private readonly plugin: FolderIndexPlugin,
		private readonly filePath: string,
		private readonly container: HTMLElement,
		blockSource: string
	) {
		super(container)
		this.app = app
		this.plugin = plugin
		this.filePath = filePath
		this.container = container
		this.blockSource = blockSource
	}

	async onload() {
		await this.render()
		this.plugin.eventManager.on("settingsUpdate", this.triggerRerender.bind(this));
		this.plugin.registerEvent(this.app.vault.on("rename", this.triggerRerender.bind(this)))
		this.app.workspace.onLayoutReady(() => {
			this.plugin.registerEvent(this.app.vault.on("create", this.triggerRerender.bind(this)))
		})
		this.plugin.registerEvent(this.app.vault.on("delete", this.triggerRerender.bind(this)))
	}


	async onunload() {
		this.plugin.eventManager.off("settingsUpdate", this.onSettingsUpdate.bind(this))
	}

	public onSettingsUpdate() {
		this.render().then()
	}

	public triggerRerender() {
		this.render().then()
	}

	private async render() {
		this.container.empty()
		const folder: TAbstractFile | null = this.app.vault.getAbstractFileByPath(this.filePath)
		if (folder instanceof TFile) {
			const files = folder.parent?.children ?? []
			const config = this.parseBlockConfig(this.blockSource)
			const renderer = new MarkdownTextRenderer(this.plugin, this.app, {
				recursionLimit: config.depth
			})
			await MarkdownRenderer.renderMarkdown(renderer.buildMarkdownText(files), this.container, this.filePath, this)
		}
	}

	private parseBlockConfig(source: string): { depth?: number } {
		const config: { depth?: number } = {}
		const lines = source.split(/\r?\n/)
		for (const line of lines) {
			const trimmed = line.trim()
			if (trimmed.length === 0 || trimmed.startsWith("#")) {
				continue
			}
			const match = /^([A-Za-z0-9_-]+)\s*:\s*(.+)$/.exec(trimmed)
			if (!match) {
				continue
			}
			const key = match[1].toLowerCase()
			const value = match[2].trim()
			if (key === "depth") {
				const parsed = Number.parseInt(value, 10)
				if (!Number.isNaN(parsed)) {
					config.depth = parsed < -1 ? -1 : parsed
				}
			}
		}
		return config
	}


}
