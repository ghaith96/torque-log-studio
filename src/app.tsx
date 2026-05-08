import { Component } from '@geajs/core'
import ChartStack from './components/chart-stack'
import ChannelPicker from './components/channel-picker'
import ImportDropzone from './components/import-dropzone'
import { formatDuration } from './format-duration'
import connectivityStore from './connectivity-store'
import sessionStore from './session-store'

/**
 * Mobile-first shell (Gea Mobile–style layout): fixed viewport, top bar, scroll body.
 * @geajs/mobile View/ViewManager are not bundled — they depend on ComponentManager removed in @geajs/core 1.3+.
 */
export default class TorqueApp extends Component {
  template() {
    const { status, session } = sessionStore
    const { online } = connectivityStore

    return (
      <div class="mobile-root">
        <header class="mobile-nav-bar">Torque Log Studio</header>
        {!online ? (
          <div class="offline-banner" role="status">
            You’re offline — reconnect to load new files. Imported logs stay on this device only.
          </div>
        ) : null}
        <div class="mobile-scroll">
          <div class="shell shell--mobile">
            <ImportDropzone />

            {status === 'ready' && session ? (
              <section class="session-strip animate-in">
                <div class="session-strip__main">
                  <p class="session-strip__file">{session.fileName}</p>
                  <p class="session-strip__meta">
                    <span>{session.rowCount.toLocaleString()} samples</span>
                    <span class="session-strip__dot" aria-hidden="true" />
                    <span>{formatDuration(session.durationSec)}</span>
                    <span class="session-strip__dot" aria-hidden="true" />
                    <span>{session.channels.length} channels detected</span>
                  </p>
                </div>
                <button type="button" class="button button-muted" click={() => sessionStore.reset()}>
                  Clear session
                </button>
              </section>
            ) : null}

            {status === 'idle' && !session ? (
              <section class="empty-story animate-in">
                <h2 class="empty-story__title">Welcome</h2>
                <p class="empty-story__body">
                  Export a log from Torque on your phone, then drop the CSV here. You’ll get synced
                  timelines for speed, load, temperatures — whatever your export captured — without
                  spreadsheets or uploads.
                </p>
              </section>
            ) : null}

            {status === 'ready' && session ? (
              <ChannelPicker
                key={`pick-${session.fileName}-${session.rowCount}-${session.channels.map((c) => c.id).join('|')}`}
              />
            ) : null}
            {status === 'ready' && session ? <ChartStack /> : null}
          </div>
        </div>
      </div>
    )
  }
}
