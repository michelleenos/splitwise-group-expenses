let categories = null

export async function getCategories() {
   if (categories) {
      return categories
   }
   let cats = await fetch(`/api/splitwise/get_categories`)
      .then((res) => res.json())
      .then((data) => {
         return data.categories.reduce((acc, cur) => {
            let subcats = cur.subcategories.map((subcat) => {
               return {
                  id: subcat.id,
                  name: subcat.name,
                  icon: subcat.icon,
               }
            })
            return [...acc, ...subcats]
         }, [])
      })

   categories = cats

   return categories
}

export async function getExpenses({
   groupId,
   count,
   offset,
}: {
   groupId: string
   count: number
   offset: number
}) {
   let data = await fetch(
      `/api/splitwise/expenses?group_id=${groupId}&limit=${count}&offset=${offset}`
   ).then((res) => res.json())

   console.log({ groupId, count, offset })
   console.log(data)

   return data.expenses
}
