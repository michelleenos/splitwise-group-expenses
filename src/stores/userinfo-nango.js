import { defineStore } from 'pinia'
import Nango from '@nangohq/frontend'
const nango = new Nango({ publicKey: '8e8f192b-f1a6-4a3b-b74b-cd8bd2e114c9' })

const baseUrl = 'https://cors-anywhere.herokuapp.com/https://secure.splitwise.com/api/v3.0'

let localId = localStorage?.getItem('splitwise_user')
let localToken = localStorage?.getItem('splitwise_token')
let localData = localStorage.getItem('splitwise_userData')
if (localData) localData = JSON.parse(localData)
let localGroups = localStorage.getItem('splitwise_groups')
if (localGroups) localGroups = JSON.parse(localGroups)
let localGroupId = localStorage?.getItem('splitwise_groupId')
let localGroupData = localStorage.getItem('splitwise_groupData')
if (localGroupData) localGroupData = JSON.parse(localGroupData)

export const useInfoStore = defineStore('info', {
   state: () => {
      return {
         userData: localData ?? false,
         groupId: localGroupId ?? -1,
         currentGroup: localGroupData ?? false,
         expenses: [],
         userExpenses: [],
         groups: localGroups ?? null,
         token: localToken ?? null,
         headers: null,
      }
   },

   getters: {
      doubleCount(state) {
         return state.counter * 2
      },
   },

   actions: {
      increment() {
         this.counter++
      },
      async connect() {
         if (!this.token) {
            await nango
               .auth('splitwise', 'mysw')
               .then((result) => {
                  console.log(
                     `OAuth flow succeeded for provider "${result.providerConfigKey}" and connection-id "${result.connectionId}"!`
                  )
               })
               .catch((err) => {
                  console.error(
                     `There was an error in the OAuth flow for integration: ${err.message}`
                  )
               })

            let url = `https://api.nango.dev/connection/mysw?provider_config_key=splitwise`
            let headers = new Headers()
            headers.append('Authorization', `Bearer ${process.env.VITE_SECRET_KEY}`)

            await fetch(url, { method: 'GET', headers, redirect: 'follow' })
               .then((response) => response.json())
               .then((res) => {
                  this.token = res.credentials.access_token
                  localStorage.setItem('splitwise_token', this.token)

                  this.setupHeaders()
               })
               .catch((error) => console.log('error', error))
         } else {
            this.setupHeaders()
         }

         console.log(this.headers)
         this.getUser()
      },
      setupHeaders() {
         if (!this.token) throw 'no token'
         let splitwiseHeaders = new Headers()
         splitwiseHeaders.append('Authorization', `Bearer ${this.token}`)
         splitwiseHeaders.append('Origin', 'https://secure.splitwise.com')
         this.headers = splitwiseHeaders
      },
      async getUser(id) {
         let userData = await fetch(`${baseUrl}/get_current_user`, {
            method: 'GET',
            headers: this.headers,
         })
            .then((res) => res.json())
            .then((data) => {
               if (data.error) {
                  console.error(data.error)
               } else {
                  console.log('🙌 got user data: ', data)
                  localStorage.setItem('splitwise_userData', JSON.stringify(data.user))
                  return data.user
               }
            })

         this.userData = userData
         this.getGroups()
      },
      async getUserExpenses() {
         const filterExpenses = () => {
            this.userExpenses = this.expenses.filter((expense) => {
               return expense.created_by.id == this.userData.id
            })
         }

         if (!this.expenses || this.expenses.length === 0) {
            await this.getExpenses().then(filterExpenses)
         } else {
            filterExpenses()
         }
      },
      async getExpenses() {
         if (this.groupId < 0) {
            this.expenses = []
            throw 'select a group first'
         }
         let d = new Date()
         d.setMonth(d.getMonth() - 5)

         let expenses = await fetch(
            `${baseUrl}/get_expenses?group_id=${
               this.groupId
            }&limit=150&updated_after=${d.toISOString()}`,
            {
               method: 'GET',
               headers: this.headers,
            }
         )
            .then((response) => response.json())
            .then((data) => {
               if (data.error) throw Error(data.error.message ?? 'unknown error')

               console.log('🤑 got expenses ', data.expenses)
               return data.expenses.filter((expense) => expense.deleted_at === null)
            })
            .catch(console.error)

         this.expenses = expenses
      },
      async getGroups() {
         if (!this.headers) this.setupHeaders()
         let groups = await fetch(`${baseUrl}/get_groups`, {
            method: 'GET',
            headers: this.headers,
         })
            .then((response) => response.json())
            .then((data) => {
               if (data.error) throw data.error
               console.log('👯‍♀️ got groups: ', data.groups)
               let recent = data.groups.filter((group) => {
                  let since = new Date()
                  since.setMonth(since.getMonth() - 4)
                  let d = new Date(group.updated_at)
                  return since <= d
               })
               return recent
            })
            .catch(console.error)

         console.log(groups)
         // localStorage.setItem('splitwise_groups', JSON.stringify(groups))
         this.groups = groups
      },
      setCurrentGroup(i) {
         let currentGroup = this.groups[i]
         currentGroup.members.forEach((member, i) => {
            member.currentSplit = 0
            if (member.id == 1530173) {
               // michelle
               member.currentSplit = 38
            } else if (member.id == 12048317) {
               // jonathan
               member.currentSplit = 31
            } else if (member.id == 32806672) {
               // bárbara
               member.currentSplit = 31
            }
         })
         localStorage.setItem('splitwise_groupData', JSON.stringify(currentGroup))
         localStorage.setItem('splitwise_groupId', currentGroup.id)

         this.currentGroup = currentGroup
         this.groupId = this.currentGroup.id
      },

      async submitExpense(inputCost, inputName, inputDate, even) {
         let expenseData = {
            cost: inputCost,
            description: inputName,
            date: inputDate,
            group_id: this.currentGroup.id,
            split_equally: even ? 'true' : 'false',
         }

         const roundToCents = (n) => Math.floor(n * 100) / 100

         if (!even) {
            expenseData['users__0__paid_share'] = inputCost.toString()
            let shares = {}
            let total = 0
            for (let i = 0; i < this.currentGroup.members.length; i++) {
               let currentMember = this.currentGroup.members[i]

               let currentShare = roundToCents(inputCost * (currentMember.currentSplit / 100))
               shares[currentMember.id] = currentShare
               total += currentShare
               // if (currentMember.id === this.userId) {
               //    currentUserShare = inputCost * (currentMember.currentSplit / 100)
               // }
               // let userShare = inputCost * (currentMember.currentSplit / 100)

               // expenseData['users__' + i + '__user_id'] = currentMember.id
               // expenseData['users__' + i + '__owed_share'] = userShare.toString()
            }

            let diff = inputCost - total
            console.log(shares, diff)

            if (diff <= 0.03) {
               shares[this.userData.id] += diff
            }

            Object.keys(shares).forEach((id, i) => {
               expenseData['users__' + i + '__user_id'] = id
               expenseData['users__' + i + '__owed_share'] = shares[id].toString()
            })

            console.log(expenseData)
         }

         let headers = new Headers()
         headers.append('Authorization', `Bearer ${this.token}`)
         headers.append('Origin', 'https://secure.splitwise.com')
         headers.append('Content-Type', 'application/json')
         await fetch(`${baseUrl}/create_expense`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(expenseData),
         })
            .then((res) => res.json())
            .then((data) => {
               if (data.errors && Object.keys(data.errors).length > 0) {
                  throw data.errors.base[0]
               } else {
                  console.log('wooooooo', data)
                  return data
               }
            })
            .catch((err) => {
               console.error(err)
               throw err
            })
      },
   },
})
