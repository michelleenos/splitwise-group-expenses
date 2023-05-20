import axios from 'axios'

const api = axios.create({
   baseURL: 'https://secure.splitwise.com/api/v3.0',
})

const headers = {
   Authorization: `Bearer ${process.env.VITE_SPLITWISE_API_KEY}`,
}

export default async function (req, res) {
   let path = req.url.split('?')[0].substring('/api/splitwise/'.length).split('/')[0]
   // let query = req.query
   let apireq = {
      url: '/get_current_user',
      method: 'get',
      headers,
   }

   if (path === 'groups') {
      apireq.url = '/get_groups'
   } else if (path === 'expenses') {
      if (!req.query.group_id) {
         res.status(400).send('group_id required')
         return
      }
      let d = new Date()
      d.setMonth(d.getMonth() - 5)
      apireq.url = `/get_expenses?group_id=${req.query.group_id}&updated_after=${d.toISOString()}`
   } else if (path === 'new-expense') {
      apireq.method = 'post'
      apireq.url = '/create_expense'
      let { cost, description, date, even, group_id } = req.query
      let data = {
         cost,
         description,
         date,
         group_id,
         split_equally: even,
      }

      Object.keys(req.query).forEach((key) => {
         if (key.startsWith('users__')) {
            data[key] = req.query[key]
         }
      })

      apireq.data = data
   }

   api(apireq)
      .then((response) => {
         let data = JSON.stringify(response.data)
         console.log(data)
         res.status(200).send(data)
      })
      .catch(function (error) {
         if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new Error({
               data: error.response.data,
               status: error.response.status,
               headers: error.response.headers,
            })
         } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            throw new Error({
               request: error.request,
               message: 'The request was made but no response was received',
            })
            // console.log('The request was made but no response was received')
            // console.log(error.request)
         } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message)
            throw new Error(error.message, error)
         }
      })
}
