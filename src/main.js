import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import './assets/global.css'

const app = createApp(App)
app.config.devtools = true
app.mount('#app') 