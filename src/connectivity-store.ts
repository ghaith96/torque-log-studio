import { Store } from '@geajs/core'

/** Tracks `navigator.onLine` for PWA offline UX (separate from CSV parse worker). */
class ConnectivityStore extends Store {
  online = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    super()
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.online = true
    })
    window.addEventListener('offline', () => {
      this.online = false
    })
  }
}

export default new ConnectivityStore()
