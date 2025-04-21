import { defineStore } from 'pinia'
import { getExpenses } from 'src/utils/api-requests'

type UserData = {
   id: number
   first_name: string
   last_name: string
   email: string
   picture?: { small: string }
}

type Member = {
   balance: { amount: number }[]
   currentSplit?: number
   id: number
   first_name: string
   last_name: string
}

type Group = {
   id: number
   name: string
   members: Member[]
   avatar?: { small: string }
}

export const useInfoStore = defineStore('info', {
   state: () => {
      return {
         groupId: -1,
         currentGroup: null as Group | null,
         userData: null as UserData | null,
         expenses: [],
         expensesOffset: 0,
         groups: [] as Group[],
         userExpenses: [],
      }
   },

   actions: {
      setUser(data) {
         this.userData = data
      },
      setUserExpenses: async function () {
         const userId = this.userData.id

         if (this.expenses.length === 0) {
            await this.loadExpenses()
         }

         this.userExpenses = this.expenses.filter((expense) => {
            return expense.created_by.id == userId
         })
      },
      loadExpenses: async function (count = 400) {
         let newExpenses = await getExpenses({
            groupId: this.groupId,
            count,
            offset: this.expensesOffset,
         })
         let returned = newExpenses.length
         this.expenses = [...this.expenses, ...newExpenses]
         this.expensesOffset += returned
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
