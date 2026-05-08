import { registerSW } from 'virtual:pwa-register'
import TorqueApp from './app'
import '@geajs/ui/style.css'
import './styles.css'

registerSW({ immediate: true })

const root = document.getElementById('app')

if (!root) {
  throw new Error('App root element not found')
}

const app = new TorqueApp()
app.render(root)
