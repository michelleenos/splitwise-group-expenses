import { boot } from 'quasar/wrappers'
import Nango from '@nangohq/frontend'

// auth does not work atm
// nango auth works on frontend if not ssr, but we need ssr for the api
// since calling api from frontend has cors issues
// @nango/node package also does not seem to compile correctly
// add this file to "boot" section in quasar.config.js to mess with it
let nango = new Nango({ publicKey: '8e8f192b-f1a6-4a3b-b74b-cd8bd2e114c9' })

// export default boot(({ app }) => {
//    app.config.globalProperties.$nango = nango
// })

export { nango }
