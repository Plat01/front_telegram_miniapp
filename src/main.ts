import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueTelegramPlugin } from 'vue-tg'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(VueTelegramPlugin)

app.mount('#app')
