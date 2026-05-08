import uPlot from 'uPlot'
import { downsampleMultiSeries, downsampleSeries } from '../domain/downsample'
import type { SerializedChannel } from '../domain/worker-protocol'
import {
  buildCombinedPlotOptions,
  buildSeriesPlotOptions,
  CHART_COMBINED_HEIGHT_PX,
  CHART_HEIGHT_PX,
  CHART_MIN_WIDTH_PX,
  CHART_RESIZE_MIN_WIDTH_PX,
} from './uplot-theme'

/** Single-series mount — used by per-row chart components (each gets its own `onAfterRender`). */
export function mountPlotInSlot(
  slot: HTMLElement,
  channel: SerializedChannel,
  timeSec: Float64Array,
  fallbackWidth: number,
): uPlot {
  const { x, y } = downsampleSeries(timeSec, channel.values)
  const w = Math.max(CHART_MIN_WIDTH_PX, slot.clientWidth || fallbackWidth)
  const opts = buildSeriesPlotOptions(channel.name, channel.unit, w, CHART_HEIGHT_PX)
  const data: uPlot.AlignedData = [x, y]
  return new uPlot(opts, data, slot)
}

/** One uPlot with one X and multiple Y series (aligned downsampled data). */
export function mountCombinedPlotInSlot(
  slot: HTMLElement,
  channels: SerializedChannel[],
  timeSec: Float64Array,
  fallbackWidth: number,
): uPlot {
  const ys = channels.map((c) => c.values)
  const { x, ys: ysDown } = downsampleMultiSeries(timeSec, ys)
  const meta = channels.map((c) => ({ name: c.name, unit: c.unit }))
  const w = Math.max(CHART_MIN_WIDTH_PX, slot.clientWidth || fallbackWidth)
  const opts = buildCombinedPlotOptions(meta, w, CHART_COMBINED_HEIGHT_PX)
  const data: uPlot.AlignedData = [x, ...ysDown]
  return new uPlot(opts, data, slot)
}

/** Batch mount — retained for callers that manage multiple slots in one imperative pass. */
export function mountPlotsInSlots(
  slots: HTMLElement[],
  channels: SerializedChannel[],
  timeSec: Float64Array,
  fallbackWidth: number,
): uPlot[] {
  const plots: uPlot[] = []
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i]!
    const slot = slots[i]
    if (!slot) continue
    plots.push(mountPlotInSlot(slot, ch, timeSec, fallbackWidth))
  }
  return plots
}

export function resizePlotsToSlots(
  plots: uPlot[],
  slots: HTMLElement[],
  plotHeight: number = CHART_HEIGHT_PX,
): void {
  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i]
    const slot = slots[i]
    if (slot && plot) {
      const nw = Math.max(CHART_RESIZE_MIN_WIDTH_PX, slot.clientWidth)
      plot.setSize({ width: nw, height: plotHeight })
    }
  }
}
