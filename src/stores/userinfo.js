import { defineStore } from 'pinia'

export const useInfoStore = defineStore('info', {
   state: () => {
      return {
         userData: false,
         groupId: -1,
         currentGroup: false,
         expenses: [],
         groups: null,
         userExpenses: [],
      }
   },

   actions: {
      setUserExpenses() {
         const userId = this.userData.id

         this.userExpenses = this.expenses.filter((expense) => {
            return expense.created_by.id == userId
         })
      },
      setGroups(data) {
         let recent = data.groups.filter((group) => {
            let since = new Date()
            since.setMonth(since.getMonth() - 4)
            let d = new Date(group.updated_at)
            return since <= d
         })
         this.groups = recent
      },
   },
})
