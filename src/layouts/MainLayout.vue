<script setup>
import { useInfoStore } from 'src/stores/userinfo'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ref, watch } from 'vue'

let drawerLeft = ref(true)

const infoStore = useInfoStore()
const { userId, userData, groups, currentGroup } = storeToRefs(infoStore)

if (userData.value && !groups.value) {
	infoStore.getGroups()
}

async function login() {
	await infoStore.connect().then(() => {
		// router.push('/group')
	})
}

function setCurrentGroup(i) {
	infoStore.setCurrentGroup(i)
}
</script>

<template>
	<q-layout view="hHh lpR fFf">
		<q-page-container>
			<q-header elevated class="bg-primary">
				<q-toolbar>
					<q-btn flat @click="drawerLeft = !drawerLeft" icon="menu" />
					<q-btn flat to="/"> Splitwise </q-btn>
					<q-space />

					<div v-if="userData && userId">
						<q-avatar size="md" class="q-mr-sm">
							<img :src="userData.picture?.small" />
						</q-avatar>
						<span class="q-subtitle-1 q-mr-sm">
							{{ userData.first_name }} {{ userData.last_name }}
						</span>
						<q-btn outline class="q-ml-sm">Log Out</q-btn>
					</div>
					<div v-else>
						<q-btn outline label="Log In" @click="login" />
					</div>
				</q-toolbar>
			</q-header>
			<q-drawer
				side="left"
				breakpoint="900"
				bordered
				persistent
				v-model="drawerLeft"
				class="bg-grey-3"
			>
				<q-list>
					<q-item
						v-if="currentGroup"
						style="margin-top: 20px; margin-bottom: 10px"
					>
						<q-item-section>
							<q-item-label overline>Current Group</q-item-label>
							<q-item-label>{{ currentGroup.name }}</q-item-label>
						</q-item-section>
						<q-item-section avatar>
							<q-avatar>
								<img :src="currentGroup.avatar?.small" />
							</q-avatar>
						</q-item-section>
					</q-item>

					<q-separator inset />

					<q-item
						clickable
						to="/recent-expenses"
						:disable="currentGroup ? null : true"
					>
						<q-item-section avatar>
							<q-icon name="timeline" color="green" />
						</q-item-section>
						<q-item-section>Recent Group Expenses</q-item-section>
					</q-item>
					<q-item
						clickable
						to="/new-expense"
						:disable="currentGroup ? null : true"
					>
						<q-item-section avatar>
							<q-icon name="paid" color="green" />
						</q-item-section>
						<q-item-section>New Group Expense</q-item-section>
					</q-item>

					<q-separator inset />

					<q-expansion-item
						icon="group"
						expand-icon-class="text-green"
						label="Groups"
						:disable="groups ? null : true"
					>
						<template #header>
							<q-item-section avatar>
								<q-icon name="group" color="green" />
							</q-item-section>
							<q-item-section>Groups</q-item-section>
						</template>
						<q-list dense padding>
							<q-item
								clickable
								v-for="(group, i) in groups"
								:key="`group-${i}`"
								@click="() => setCurrentGroup(i)"
								:active="currentGroup.id === group.id"
							>
								<q-item-section>{{ group.name }}</q-item-section>
							</q-item>
						</q-list>
					</q-expansion-item>
				</q-list>
			</q-drawer>
			<router-view></router-view>
		</q-page-container>
	</q-layout>
</template>

<script>
// import { defineComponent } from 'vue'

// export default defineComponent({
// 	name: 'IndexPage',
// 	data: function () {
// 		return {
// 			user: null,
// 			groups: [],
// 			userInfo: null,
// 			currentGroupId: null,
// 			currentGroupData: {},
// 			recentGroupExpenses: [],
// 			members: [],
// 			slidersKey: 0,
// 			formError: false,
// 			inputCost: null,
// 			inputDate: null,
// 			inputName: null,
// 			tab: 'login',
// 			splitTotal: 0,
// 			splitwise: splitwise,
// 		}
// 	},

// 	methods: {
// 		isLoggedIn() {
// 			return this.user && this.userInfo !== null ? true : false
// 		},
// 		isGroup() {
// 			return this.currentGroupId && this.currentGroupData
// 		},
// 		connect: function () {
// 			splitwise.connect().then(this.connectSuccess).catch(this.connectError)
// 		},
// 		logoutUser: function () {
// 			this.user = null
// 			this.groups = []
// 			this.userInfo = null
// 			this.currentGroupData = {}
// 			this.currentGroupId = null
// 			this.members = []
// 			localStorage.removeItem('splitwise_user')
// 			localStorage.removeItem('splitwise_currentgroupid')
// 		},
// 		getCurrentUser: function () {
// 			if (!this.user) {
// 				return this.sendError('missing user auth')
// 			}
// 			splitwise
// 				.auth(this.user)
// 				.get('/get_current_user')
// 				.then((response) => response.json())
// 				.then((data) => {
// 					if (data.error) {
// 						throw data.error
// 					} else {
// 						this.userInfo = data.user
// 					}
// 				})
// 				.catch((err) => {
// 					console.error(err)
// 					this.user = null
// 				})
// 		},
// 		sendError: function (msg) {
// 			console.error(msg)
// 			return
// 		},
// 		getGroups: function () {
// 			if (!this.user) {
// 				return this.sendError('missing user auth')
// 			}
// 			splitwise
// 				.auth(this.user)
// 				.get('/get_groups')
// 				.then((response) => response.json())
// 				.then((data) => {
// 					if (data.error) throw data.error
// 					this.groups = data.groups
// 					this.tab = 'groups'
// 				})
// 				.catch((err) => {
// 					console.error(err)
// 					this.user = null
// 				})
// 		},
// 		getGroup(id) {
// 			splitwise
// 				.auth(this.user)
// 				.get('/get_group/' + id)
// 				.then((response) => response.json())
// 				.then((data) => {
// 					if (data.error) throw data.error
// 					this.currentGroupId = id
// 					this.currentGroupData = data.group

// 					this.store.groupId = id

// 					this.currentGroupData.members.forEach((member, i) => {
// 						this.members[i] = JSON.parse(JSON.stringify(member))
// 						this.members[i].currentSplit = 0
// 						if (member.id == 1530173) {
// 							// michelle
// 							this.members[i].currentSplit = 30
// 						} else if (member.id == 12048317) {
// 							// jonathan
// 							this.members[i].currentSplit = 37
// 						} else if (member.id == 32806672) {
// 							// bárbara
// 							this.members[i].currentSplit = 33
// 						} else {
// 							this.members[i].currentSplit = 0
// 						}
// 					})

// 					this.store.groupData = data.group

// 					// localStorage.setItem('splitwise_currentgroupid', this.currentGroupId)
// 					this.getExpenses()
// 				})
// 				.catch(console.error)
// 		},

// 		connectError: function (err) {
// 			console.log(err)
// 		},
// 	},
// })
</script>
