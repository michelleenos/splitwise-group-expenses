import { ssrMiddleware } from 'quasar/wrappers'

const apiHandlers = {
   splitwise: import('../../src/api/splitwise'),
}
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/developing-ssr/ssr-middlewares
export default ssrMiddleware(async ({ app, resolve }) => {
   // something to do with the server "app"

   app.all(resolve.urlPath('*'), async (req, res, next) => {
      if (req.url.substring(0, 4) === '/api') {
         //  res.status(200).send(`Hi! req.method: ${req.method}, req.url: ${req.url}`)
         try {
            const path = req.url.split('?')[0].substring(5).split('/')[0] // whatever comes after /api
            const apiHandler = await apiHandlers[path]
            if (apiHandler) {
               await apiHandler.default(req, res)
            } else {
               res.sendStatus(404)
            }
         } catch (error) {
            console.error(error)
            res.sendStatus(500)
         }
      } else {
         next()
      }
   })
})
