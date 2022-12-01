import { defineStore } from 'pinia'

import Pizzly from 'pizzly-js'
const pizzly = new Pizzly({
	host: 'https://splitwise-grocery-tracker.herokuapp.com',
	publishableKey: 'BVRchYHCWpZmxWzwALyluch',
})
const splitwise = pizzly.integration('splitwise')

let localId = localStorage.getItem('splitwise_user')
let localData = JSON.parse(localStorage.getItem('splitwise_userData'))
let localGroups = JSON.parse(localStorage.getItem('splitwise_groups'))
let localGroupId = localStorage.getItem('splitwise_groupId')
let localGroupData = JSON.parse(localStorage.getItem('splitwise_groupData'))

export const useInfoStore = defineStore('info', {
	state: () => {
		return {
			userId: localId ?? false,
			userData: localData ?? false,
			groupId: localGroupId ?? -1,
			currentGroup: localGroupData ?? false,
			expenses: [],
			userExpenses: [],
			groups: localGroups ?? null,
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
			if (this.userId) {
				await this.getUser(this.userId)
			} else {
				const userId = await splitwise.connect().then((data) => {
					localStorage.setItem('splitwise_user', data.authId)
					return data.authId
				})

				this.userId = userId
				this.getUser(userId)
			}
		},
		async getUser(id) {
			let userData = await splitwise
				.auth(id)
				.get('/get_current_user')
				.then((res) => res.json())
				.then((data) => {
					if (data.error) {
						console.error(data.error)
					} else {
						console.log('🙌 got user data: ', data)
						localStorage.setItem(
							'splitwise_userData',
							JSON.stringify(data.user)
						)
						return data.user
					}
				})

			this.userData = userData
			this.getGroups()
		},
		async getUserExpenses() {
			const filterExpenses = () => {
				console.log(this.userData.id)
				this.userExpenses = this.expenses.filter((expense) => {
					return expense.created_by.id == this.userData.id
					// console.log(expense.created_by.id, this.userId)
				})
				console.log(this.userExpenses)
			}

			if (!this.expenses || this.expenses.length === 0) {
				await this.getExpenses().then(filterExpenses)
				console.log('hi', this.expenses)
			} else {
				filterExpenses()
			}
		},
		async getExpenses() {
			if (!this.userId) {
				throw 'you need to log in first'
			} else if (!this.groupId) {
				this.expenses = []
				throw 'select a group first'
			}
			let d = new Date()
			d.setMonth(d.getMonth() - 2)

			let expenses = await splitwise
				.auth(this.userId)
				.get(
					`/get_expenses?group_id=${
						this.groupId
					}&limit=150&updated_after=${d.toISOString()}`
				)
				.then((response) => response.json())
				.then((data) => {
					if (data.error)
						throw Error(data.error.message ?? 'unknown error')

					console.log('🤑 got expenses ', data.expenses)
					return data.expenses.filter(
						(expense) => expense.deleted_at === null
					)
				})
				.catch(console.error)

			this.expenses = expenses
		},
		async getGroups() {
			let groups = await splitwise
				.auth(this.userId)
				.get('/get_groups')
				.then((response) => response.json())
				.then((data) => {
					if (data.error) throw data.error
					console.log('👯‍♀️ got groups: ', data.groups)
					return data.groups
				})
				.catch(console.error)

			localStorage.setItem('splitwise_groups', JSON.stringify(groups))
			this.groups = groups
		},
		setCurrentGroup(i) {
			let currentGroup = this.groups[i]
			currentGroup.members.forEach((member, i) => {
				member.currentSplit = 0
				if (member.id == 1530173) {
					// michelle
					member.currentSplit = 30
				} else if (member.id == 12048317) {
					// jonathan
					member.currentSplit = 37
				} else if (member.id == 32806672) {
					// bárbara
					member.currentSplit = 33
				}
			})
			localStorage.setItem(
				'splitwise_groupData',
				JSON.stringify(currentGroup)
			)
			localStorage.setItem('splitwise_groupId', currentGroup.id)

			this.currentGroup = currentGroup
			this.groupId = this.currentGroup.id
		},
		async getGroup(id) {
			let groupData = await splitwise
				.auth(this.userId)
				.get('/get_group/' + id)
				.then((response) => response.json())
				.then((data) => {
					if (data.error) throw data.error
					console.log('🤸 got group: ', data.group)
					return data.group
				})
				.catch(console.error)

			let members = []
			groupData.members.forEach((member, i) => {
				members.push(member)
			})
			this.groupData = groupData
			this.members = members
		},
		async submitExpense(inputCost, inputName, inputDate, even) {
			let expenseData = {
				cost: inputCost,
				description: inputName,
				date: inputDate,
				group_id: this.currentGroup.id,
				split_equally: even ? 'true' : 'false',
			}

			if (!even) {
				expenseData['users__0__paid_share'] = inputCost.toString()
				for (let i = 0; i < this.currentGroup.members.length; i++) {
					let currentMember = this.currentGroup.members[i]
					if (currentMember.id === this.userId) {
						currentUserShare =
							inputCost * (currentMember.currentSplit / 100)
					}
					let userShare = inputCost * (currentMember.currentSplit / 100)

					expenseData['users__' + i + '__user_id'] = currentMember.id
					expenseData['users__' + i + '__owed_share'] =
						userShare.toString()
				}
			}

			await splitwise
				.auth(this.userId)
				.post('/create_expense', {
					body: JSON.stringify(expenseData),
					headers: {
						'Content-Type': 'application/json',
					},
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
