import Vue from 'vue'
import App from './App.vue'
import './assets/index.css'
Vue.config.productionTip = false
import eventBus from "./libs/evenBus"
Vue.prototype.$eventBus = eventBus
import iView from 'view-design'
Vue.use(iView)
import store from "./store/index"
import evenBus from './libs/evenBus'
new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
