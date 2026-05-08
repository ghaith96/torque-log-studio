import { Component } from '@geajs/core'
import 'uplot/dist/uPlot.min.css'
import type uPlot from 'uplot'
import { mountCombinedPlotInSlot, resizePlotsToSlots } from '../chart/mount-session-plots'
import { CHART_COMBINED_HEIGHT_PX, CHART_MIN_WIDTH_PX } from '../chart/uplot-theme'
import sessionStore from '../session-store'

/**
 * Single uPlot: shared X scale, live legend values, legend rows spotlight one trace (focus alpha).
 */
export default class CombinedChart extends Component {
  plot: uPlot | null = null
  ro: ResizeObserver | null = null
  private unsubSelected: (() => void) | null = null
  private unsubSession: (() => void) | null = null

  created(): void {
    const schedule = () => requestAnimationFrame(() => this.refreshPlot())
    this.unsubSelected = sessionStore.observe('selectedIds', schedule)
    this.unsubSession = sessionStore.observe('session', schedule)
  }

  onAfterRender(): void {
    requestAnimationFrame(() => this.refreshPlot())
  }

  refreshPlot(): void {
    const { session, status, selectedIds } = sessionStore
    if (status !== 'ready' || !session || !this.el) {
      this.teardownPlot()
      return
    }

    const visible = session.channels.filter((c) => selectedIds.includes(c.id))
    if (visible.length === 0) {
      this.teardownPlot()
      return
    }

    const slot = this.$('.chart-slot') as HTMLElement | null
    if (!slot) return

    this.teardownPlot()

    const fallbackWidth = Math.max(CHART_MIN_WIDTH_PX, this.el.clientWidth || 600)
    this.plot = mountCombinedPlotInSlot(slot, visible, session.timeSec, fallbackWidth)

    this.ro?.disconnect()
    this.ro = new ResizeObserver(() => {
      const el = this.$('.chart-slot') as HTMLElement | null
      if (!this.plot || !el) return
      resizePlotsToSlots([this.plot], [el], CHART_COMBINED_HEIGHT_PX)
    })
    this.ro.observe(this.el)

    requestAnimationFrame(() => {
      const el = this.$('.chart-slot') as HTMLElement | null
      if (this.plot && el) {
        resizePlotsToSlots([this.plot], [el], CHART_COMBINED_HEIGHT_PX)
      }
    })
  }

  teardownPlot(): void {
    this.ro?.disconnect()
    this.ro = null
    this.plot?.destroy()
    this.plot = null
  }

  dispose(): void {
    this.unsubSelected?.()
    this.unsubSelected = null
    this.unsubSession?.()
    this.unsubSession = null
    this.teardownPlot()
    super.dispose()
  }

  template() {
    return (
      <article class="chart-card chart-card--combined">
        <div class="chart-card__legend-help">
          <p class="chart-card__legend-help-title">Chart &amp; legend</p>
          <ul class="chart-card__legend-help-list">
            <li>Drag on the plot to scrub time; values update in the legend.</li>
            <li>
              Use a legend row (or <kbd class="kbd-hint">Enter</kbd> /{' '}
              <kbd class="kbd-hint">Space</kbd> when a row is focused) to spotlight one trace; use{' '}
              <strong>Clear spotlight</strong> or activate the same row again when it is the only
              spotlighted trace to reset.
            </li>
            <li>Move the pointer near a line to emphasize it by proximity.</li>
          </ul>
        </div>
        <div class="chart-slot chart-slot--combined" />
      </article>
    )
  }
}
