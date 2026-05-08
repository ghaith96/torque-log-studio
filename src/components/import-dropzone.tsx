import { Component } from '@geajs/core'
import { CSV_INPUT_ACCEPT } from '../domain/csv-input'
import sessionStore from '../session-store'

export default class ImportDropzone extends Component {
  dragging = false

  setDragging = (v: boolean) => {
    this.dragging = v
  }

  onFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) void sessionStore.loadFile(file)
  }

  pickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = CSV_INPUT_ACCEPT
    input.addEventListener('change', () => this.onFiles(input.files))
    input.click()
  }

  template() {
    const { dragging } = this
    const { status, progressPct, errorMessage, session } = sessionStore
    const compact = status === 'ready' && session

    return (
      <section
        class={`dropzone ${dragging ? 'dropzone--active' : ''} ${compact ? 'dropzone--compact' : ''}`}
        dragover={(e: DragEvent) => {
          e.preventDefault()
          this.setDragging(true)
        }}
        dragleave={() => this.setDragging(false)}
        drop={(e: DragEvent) => {
          e.preventDefault()
          this.setDragging(false)
          this.onFiles(e.dataTransfer?.files ?? null)
        }}
      >
        <div class="dropzone__inner">
          {compact ? (
            <p class="dropzone__compact-line">
              <strong>{session!.fileName}</strong> loaded —{' '}
              <button type="button" class="link-button" click={this.pickFile}>
                import a different file
              </button>
            </p>
          ) : (
            <>
              <p class="dropzone__title">Import Torque log</p>
              <p class="dropzone__hint">
                Drop a CSV export here, or{' '}
                <button type="button" class="link-button" click={this.pickFile}>
                  browse files
                </button>
                .
              </p>
            </>
          )}
          {!compact ? (
            <button
              type="button"
              class="button button-primary"
              click={this.pickFile}
              disabled={status === 'parsing'}
            >
              {status === 'parsing' ? 'Reading…' : 'Choose CSV'}
            </button>
          ) : null}
          {status === 'parsing' ? (
            <div class="progress" aria-live="polite">
              <div class="progress__track">
                <div class="progress__fill" style={`width: ${progressPct}%`} />
              </div>
              <span class="progress__label">Parsing {progressPct}%</span>
            </div>
          ) : null}
          {status === 'error' && errorMessage ? (
            <p class="inline-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>
    )
  }
}
