const roundToCents = (n) => Math.floor(n * 100) / 100

export const splitUnevenlyQuery = (members, inputCost, userId) => {
   let shares = {}
   // 'users__0__paid_share' = inputCost.value.toString()
   let total = 0
   for (let i = 0; i < members.length; i++) {
      let cur = members[i]
      let currentShare = roundToCents(inputCost * (cur.currentSplit / 100))
      shares[cur.id] = currentShare
      total += currentShare
   }

   let diff = inputCost - total
   if (diff <= 0.03) {
      shares[userId] += diff
   }

   let queryString = '&users__0__paid_share' + '=' + inputCost.toString()

   Object.keys(shares).forEach((id, i) => {
      queryString += `&users__${i}__user_id=${id}&users__${i}__owed_share=${shares[id].toString()}`
   })

   return queryString
}

export const parseCategories = (data) => {
   let reduced = data.categories.reduce((acc, cur) => {
      let topLevel = cur.name
      let subcats = cur.subcategories.map((subcat) => {
         return {
            id: subcat.id,
            value: subcat.id,
            label: `${topLevel} - ${subcat.name}`,
         }
      })
      return [...acc, ...subcats]
   }, [])

   return reduced
}
