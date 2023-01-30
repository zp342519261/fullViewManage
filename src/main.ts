import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import elementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import vuetify from './plugins/vuetify.js'
import router from './router/index.js'

const app = createApp(App)

app.use(elementPlus)
app.use(createPinia())
app.use(router)
app.mount('#tesla-full-view')
