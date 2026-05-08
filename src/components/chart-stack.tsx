import { Component } from '@geajs/core'
import { formatDuration } from '../format-duration'
import sessionStore from '../session-store'
import CombinedChart from './combined-chart'

export default class ChartStack extends Component {
  template() {
    const { session, status, selectedIds } = sessionStore

    if (status !== 'ready' || !session) {
      return <div />
    }

    const warnings = session.warnings
    const visible = session.channels.filter((c) => selectedIds.includes(c.id))

    return (
      <section class="chart-stack">
        {warnings.length ? (
          <div class="banner banner--warn" role="status">
            {warnings.join(' ')}
          </div>
        ) : null}
        <header class="chart-stack__head">
          <div>
            <p class="label">Trip timeline</p>
            <p class="chart-stack__sub">
              {session.rowCount.toLocaleString()} samples ·{' '}
              {formatDuration(session.durationSec)} span · horizontal axis: seconds from trip start
            </p>
          </div>
        </header>
        {visible.length === 0 ? (
          <p class="chart-stack__empty">Select at least one signal to plot.</p>
        ) : (
          <CombinedChart key={`${session.fileName}::combined`} />
        )}
      </section>
    )
  }
}
