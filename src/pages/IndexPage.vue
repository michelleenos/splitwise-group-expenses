<template>
	<q-layout view="lhh lpR fFf">
		<q-page-container>
			<q-header bordered class="bg-primary" height-hint="98">
				<q-toolbar>
					<!---
                
					<q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
                    ----->
					<q-toolbar-title v-if="currentGroupId && currentGroupData">{{
						currentGroupData.name
					}}</q-toolbar-title>
					<q-toolbar-title v-else> Splitwise </q-toolbar-title>

					<div v-if="isLoggedIn()" class="text-subtitle1">
						<span>{{ userInfo.first_name }} {{ userInfo.last_name }}</span>
						<q-btn outline class="q-ml-sm" @click="logoutUser">Log Out</q-btn>
					</div>
					<div v-else>
						<q-btn outline label="Log In" @click="connect" />
					</div>
				</q-toolbar>
				<q-tabs align="center" v-if="isLoggedIn()" v-model="tab">
					<q-tab v-if="isGroup()" name="recent" label="Recent Expenses" />
					<q-tab v-if="isGroup()" name="form" label="New Expense" />
					<q-tab name="groups" label="Groups" />
				</q-tabs>
			</q-header>

			<!---
             <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered> </q-drawer> 
            ----->

			<q-page>
				<q-tab-panels v-model="tab" animated>
					<q-tab-panel name="recent">
						<div
							class="q-pa-lg"
							v-if="currentGroupData && recentGroupExpenses.length > 0"
						>
							<q-table
								flat
								bordered
								title="Recent Group Expenses"
								table-header-class="bg-info"
								:rows="recentGroupExpenses"
								:columns="columns"
								color="secondary"
								row-key="id"
							/>
						</div>
					</q-tab-panel>
					<q-tab-panel name="form">
						<div class="q-pa-md" v-if="currentGroupData">
							<q-form
								@submit="submitExpense"
								class="q-gutter-md"
								style="max-width: 500px"
							>
								<q-input v-model="inputName" label="Expense Title" outlined />
								<q-input
									outlined
									v-model="inputDate"
									mask="date"
									:rules="[
										(v) =>
											/^-?[\d]+\/[0-1]\d\/[0-3]\d$/.test(v) || 'invalid date',
									]"
									label="Date"
									hide-bottom-space
								>
									<template v-slot:prepend>
										<q-icon name="event" class="cursor-pointer">
											<q-popup-proxy
												cover
												transition-show="scale"
												transition-hide="scale"
											>
												<q-date v-model="inputDate">
													<div class="row items-center justify-end">
														<q-btn
															v-close-popup
															label="Close"
															color="primary"
															flat
														/>
													</div>
												</q-date>
											</q-popup-proxy>
										</q-icon>
									</template>
								</q-input>
								<q-input label="Cost" v-model="inputCost" type="number" outlined>
									<template v-slot:prepend>
										<q-icon name="sell"></q-icon>
									</template>
								</q-input>

								<div class="splits">
									<div class="row no-wrap q-gutter-sm">
										<div v-for="(member, i) in members" :key="i">
											<q-input
												outlined
												type="number"
												:label="member.first_name"
												v-model="member.currentSplit"
											/>
										</div>
									</div>
								</div>

								<q-btn label="Submit" type="submit" color="primary" />
							</q-form>
						</div>
					</q-tab-panel>
					<q-tab-panel name="groups">
						<div class="q-pa-md" v-if="groups.length > 0">
							<h2 class="text-subtitle1 text-uppercase text-bold">Choose A Group</h2>
							<q-list bordered separator>
								<q-item
									clickable
									v-for="(group, i) in groups"
									:key="i"
									@click="getGroup(group.id)"
								>
									<q-item-section>
										<q-item-label>
											{{ group.name }}
										</q-item-label>
									</q-item-section>
								</q-item>
							</q-list>
						</div>
					</q-tab-panel>
				</q-tab-panels>
			</q-page>
		</q-page-container>
	</q-layout>
</template>

<script>
import { ref } from 'vue'
import Pizzly from 'pizzly-js'
const pizzly = new Pizzly({
	host: 'https://splitwise-grocery-tracker.herokuapp.com',
})
const splitwise = pizzly.integration('splitwise')
console.log(splitwise)

import { defineComponent } from 'vue'

export default defineComponent({
	name: 'IndexPage',
	data: function () {
		return {
			user: null,
			groups: [],
			userInfo: null,
			currentGroupId: null,
			currentGroupData: {},
			recentGroupExpenses: [],
			members: [],
			slidersKey: 0,
			formError: false,
			inputCost: null,
			inputDate: null,
			inputName: null,
			tab: 'recent',
			columns: [
				{
					name: 'description',
					required: true,
					label: 'Name',
					align: 'left',
					field: 'description',
					sortable: false,
				},
				{
					name: 'date',
					label: 'Date',
					field: 'date',
					format: (val) => new Date(val).toLocaleDateString('en-US'),
				},
				{ name: 'cost', label: 'Cost', field: 'cost', format: (val) => `$${val}` },
			],
		}
	},
	setup() {
		const leftDrawerOpen = ref(false)

		return {
			leftDrawerOpen,
			toggleLeftDrawer() {
				leftDrawerOpen.value = !leftDrawerOpen.value
			},
		}
	},
	mounted() {
		if (localStorage.getItem('splitwise_user')) {
			this.user = localStorage.getItem('splitwise_user')
			this.getCurrentUser()
			this.getGroups()
			if (localStorage.getItem('splitwise_currentgroupid')) {
				this.currentGroupId = localStorage.getItem('splitwise_currentgroupid')
				this.getGroup(this.currentGroupId)
			} else {
				this.tab = 'groups'
			}
		}
	},
	methods: {
		isLoggedIn() {
			return this.user && this.userInfo !== null ? true : false
		},
		isGroup() {
			return this.currentGroupId && this.currentGroupData
		},
		connect: function () {
			splitwise.connect().then(this.connectSuccess).catch(this.connectError)
		},
		logoutUser: function () {
			this.user = null
			this.groups = []
			this.userInfo = null
			this.currentGroupData = {}
			this.currentGroupId = null
			this.members = []
			localStorage.removeItem('splitwise_user')
			localStorage.removeItem('splitwise_currentgroupid')
		},
		connectSuccess: function (data) {
			console.log(data)
			this.user = data.authId
			localStorage.setItem('splitwise_user', data.authId)
			this.getCurrentUser()
			this.getGroups()
		},
		getCurrentUser: function () {
			splitwise
				.auth(this.user)
				.get('/get_current_user')
				.then((response) => response.json())
				.then((data) => {
					this.userInfo = data.user
				})
				.catch(console.error)
		},
		getGroups: function () {
			splitwise
				.auth(this.user)
				.get('/get_groups')
				.then((response) => response.json())
				.then((data) => {
					this.groups = data.groups

					this.tab = 'groups'
				})
				.catch(console.error)
		},
		getGroup(id) {
			splitwise
				.auth(this.user)
				.get('/get_group/' + id)
				.then((response) => response.json())
				.then((data) => {
					this.currentGroupId = id
					this.currentGroupData = data.group
					console.log(this.currentGroupData)

					this.currentGroupData.members.forEach((member, i) => {
						this.members[i] = JSON.parse(JSON.stringify(member))
						this.members[i].currentSplit = 0
						if (member.id == 1530173) {
							// michelle
							this.members[i].currentSplit = 30
						} else if (member.id == 12048317) {
							// jonathan
							this.members[i].currentSplit = 37
						} else if (member.id == 32806672) {
							// bárbara
							this.members[i].currentSplit = 33
						} else {
							this.members[i].currentSplit = 0
						}
					})
					localStorage.setItem('splitwise_currentgroupid', this.currentGroupId)
					this.getExpenses()
				})
				.catch(console.error)
		},
		getExpenses: function () {
			splitwise
				.auth(this.user)
				.get('/get_expenses?group_id=' + this.currentGroupId)
				.then((response) => response.json())
				.then((data) => {
					this.recentGroupExpenses = data.expenses.filter(
						(expense) => expense.deleted_at === null
					)
				})
		},
		submitExpenseTest() {
			console.log(this.inputCost)
			console.log(this.inputDate)
			console.log(this.inputName)
		},
		submitExpense: function () {
			if (!this.inputCost || !this.inputName) {
				// this.formError = 'whoops, missing information'
				return
			}

			let expenseData = {
				cost: this.inputCost,
				description: this.inputName,
				group_id: this.currentGroupId,
				date: this.inputDate,
				users__0__user_id: this.userInfo.id,
				users__0__paid_share: this.inputCost.toString(),
			}

			let currentUserShare = this.inputCost

			for (let i = 0; i < this.members.length; i++) {
				let currentMember = this.members[i]
				if (currentMember.id == this.userInfo.id) {
					currentUserShare = this.inputCost * (currentMember.currentSplit / 100)
				}

				let userShare = this.inputCost * (currentMember.currentSplit / 100)

				expenseData['users__' + i + '__user_id'] = currentMember.id
				expenseData['users__' + i + '__owed_share'] = userShare.toString()
			}

			expenseData['users__0__owed_share'] = currentUserShare.toString()

			splitwise
				.auth(this.user)
				.post('/create_expense', {
					body: JSON.stringify(expenseData),
					headers: {
						'Content-Type': 'application/json',
					},
				})
				.then((response) => response.json())
				.then((data) => {
					console.log(data)
					this.inputName = ''
					this.inputCost = null
					this.getExpenses()

					if (data.errors && Object.keys(data.errors).length > 0) {
						this.formError = data.errors.base[0]
					} else {
						this.formError = false
					}
				})
				.catch((error) => console.error(error))
		},
		connectError: function (err) {
			console.error(err)
		},
	},
})
</script>
