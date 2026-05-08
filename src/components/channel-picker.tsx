import { Component } from '@geajs/core'
import { filterChannelsFuzzy } from '../domain/fuzzy-match-channels'
import sessionStore from '../session-store'

export default class ChannelPicker extends Component {
  panelOpen = false
  channelSearchQuery = ''

  private escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.closePanel()
  }

  private onToggle = (id: string, ev: Event) => {
    const el = ev.target as HTMLInputElement
    sessionStore.setChannelSelected(id, el.checked)
  }

  openPanel = () => {
    if (this.panelOpen) return
    this.panelOpen = true
    document.addEventListener('keydown', this.escapeHandler)
    queueMicrotask(() => document.getElementById('channel-picker-search-input')?.focus())
  }

  closePanel = () => {
    if (!this.panelOpen) return
    this.panelOpen = false
    this.channelSearchQuery = ''
    document.removeEventListener('keydown', this.escapeHandler)
  }

  togglePanel = () => {
    if (this.panelOpen) this.closePanel()
    else this.openPanel()
  }

  dispose() {
    document.removeEventListener('keydown', this.escapeHandler)
    super.dispose()
  }

  template() {
    const { session, selectedIds } = sessionStore
    if (!session) return <div />

    const selectedCount = session.channels.filter((ch) => selectedIds.includes(ch.id)).length
    const visibleChannels = filterChannelsFuzzy(session.channels, this.channelSearchQuery)

    return (
      <div class="channel-picker-host">
        <button
          type="button"
          class="channel-picker-fab"
          aria-expanded={this.panelOpen}
          aria-haspopup="dialog"
          aria-controls="channel-picker-dialog"
          click={this.togglePanel}
        >
          <span class="channel-picker-fab__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </span>
          <span class="channel-picker-fab__label">Signals</span>
          <span class="channel-picker-fab__badge">{selectedCount}</span>
        </button>

        {this.panelOpen ? (
          <div
            class="channel-picker-overlay"
            role="presentation"
            click={(e: MouseEvent) => {
              if (e.target === e.currentTarget) this.closePanel()
            }}
          >
            <section
              class="channel-picker-sheet"
              id="channel-picker-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="channel-picker-title"
              click={(e: MouseEvent) => e.stopPropagation()}
            >
              <header class="channel-picker-sheet__head">
                <p class="label channel-picker-sheet__title" id="channel-picker-title">
                  Signals
                </p>
                <button type="button" class="button button-muted channel-picker-sheet__done" click={this.closePanel}>
                  Done
                </button>
              </header>
              <p class="channel-picker__hint">
                Toggle which traces appear in the chart (same timeline, one overlay).
              </p>
              <div class="channel-picker-search">
                <label class="channel-picker-search__label" for="channel-picker-search-input">
                  Filter
                </label>
                <div class="channel-picker-search__field">
                  <span class="channel-picker-search__icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" />
                    </svg>
                  </span>
                  <input
                    id="channel-picker-search-input"
                    class="channel-picker-search__input"
                    type="search"
                    placeholder="Search signals…"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={this.channelSearchQuery}
                    input={(e: Event) => {
                      this.channelSearchQuery = (e.target as HTMLInputElement).value
                    }}
                  />
                </div>
              </div>
              <ul class="channel-list">
                {visibleChannels.map((ch) => (
                  <li
                    class="channel-list__item"
                    key={`${ch.id}:${ch.name}:${ch.unit ?? ''}`}
                  >
                    <label class="channel-toggle">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ch.id)}
                        change={(e: Event) => this.onToggle(ch.id, e)}
                      />
                      <span class="channel-toggle__text">
                        <span class="channel-toggle__name">{ch.name}</span>
                        {ch.unit ? <span class="channel-toggle__unit"> ({ch.unit})</span> : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {session.channels.length > 0 && visibleChannels.length === 0 ? (
                <p class="channel-picker__empty" role="status">
                  No signals match “{this.channelSearchQuery.trim()}”.
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    )
  }
}
