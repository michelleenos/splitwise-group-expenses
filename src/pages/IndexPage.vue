<template>
	<q-layout view="lhh lpR fFf">
		<q-page-container>
			<q-header bordered class="bg-primary" height-hint="98">
				<q-toolbar>
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

			<q-page>
				<q-tab-panels v-model="tab" animated>
					<q-tab-panel name="recent">
						<div
							class="q-pa-md full-width row wrap justify-center items-start"
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
								class="col-12 col-md-8"
							/>
						</div>
					</q-tab-panel>
					<q-tab-panel name="form">
						<div
							class="q-pa-md full-width row wrap justify-center items-start"
							v-if="currentGroupData"
						>
							<NewExpenseForm
								:members="members"
								:splitwise="splitwise"
								:user="user"
								:userInfo="userInfo"
								:currentGroupId="currentGroupId"
								@submission="getExpenses"
							/>
						</div>
					</q-tab-panel>
					<q-tab-panel name="groups">
						<div
							class="q-pa-md full-width row wrap justify-center items-start"
							v-if="groups.length > 0"
						>
							<div class="col-12 col-md-8 col-lg-6">
								<h2 class="text-subtitle1 text-uppercase text-bold">
									Choose A Group
								</h2>
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
						</div>
					</q-tab-panel>
					<q-tab-panel name="login" v-if="!isLoggedIn()">
						<div class="q-pa-lg text-center">please log in using the toolbar above</div>
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
	publishableKey: 'BVRchYHCWpZmxWzwALyluch',
})
const splitwise = pizzly.integration('splitwise')

import { defineComponent } from 'vue'
import NewExpenseForm from 'src/components/NewExpenseForm.vue'

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
			tab: 'login',
			splitTotal: 0,
			splitwise: splitwise,
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
			this.panel = 'login'
		},
		connectSuccess: function (data) {
			this.user = data.authId
			localStorage.setItem('splitwise_user', data.authId)
			this.getCurrentUser()
			this.getGroups()
		},
		getCurrentUser: function () {
			if (!this.user) {
				return this.sendError('missing user auth')
			}
			splitwise
				.auth(this.user)
				.get('/get_current_user')
				.then((response) => response.json())
				.then((data) => {
					if (data.error) {
						throw data.error
					} else {
						this.userInfo = data.user
					}
				})
				.catch((err) => {
					console.error(err)
					this.user = null
				})
		},
		sendError: function (msg) {
			console.error(msg)
			return
		},
		getGroups: function () {
			if (!this.user) {
				return this.sendError('missing user auth')
			}
			splitwise
				.auth(this.user)
				.get('/get_groups')
				.then((response) => response.json())
				.then((data) => {
					if (data.error) throw data.error
					this.groups = data.groups
					this.tab = 'groups'
				})
				.catch((err) => {
					console.error(err)
					this.user = null
				})
		},
		getGroup(id) {
			splitwise
				.auth(this.user)
				.get('/get_group/' + id)
				.then((response) => response.json())
				.then((data) => {
					if (data.error) throw data.error
					this.currentGroupId = id
					this.currentGroupData = data.group
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
					if (data.error) throw Error(data.error.message ?? 'unknown error')
					this.recentGroupExpenses = data.expenses.filter(
						(expense) => expense.deleted_at === null
					)
				})
				.catch(console.error)
		},
		connectError: function (err) {
			console.log(err)
		},
	},
	components: { NewExpenseForm },
})
</script>
