<template>
	<q-form @submit="submitExpense" class="q-gutter-md col-12 col-md-6" ref="form" @reset="onReset">
		<q-input
			v-model="inputName"
			label="Expense Title"
			outlined
			required
			:rules="[(v) => !!v || 'This field is required']"
			lazy-rules="ondemand"
			hide-bottom-space
		/>
		<q-input
			outlined
			v-model="inputDate"
			mask="date"
			:rules="[(v) => /^-?[\d]+\/[0-1]\d\/[0-3]\d$/.test(v) || 'Invalid date']"
			lazy-rules="ondemand"
			label="Date"
			hide-bottom-space
		>
			<template v-slot:prepend>
				<q-icon name="event" class="cursor-pointer">
					<q-popup-proxy cover transition-show="scale" transition-hide="scale">
						<q-date v-model="inputDate">
							<div class="row items-center justify-end">
								<q-btn v-close-popup label="Close" color="primary" flat />
							</div>
						</q-date>
					</q-popup-proxy>
				</q-icon>
			</template>
		</q-input>
		<q-input
			label="Cost"
			v-model="inputCost"
			outlined
			mask="#.##"
			fill-mask="0"
			reverse-fill-mask
			hide-bottom-space
			lazy-rules="ondemand"
			prefix="$"
			:rules="[(v) => v > 0 || 'Invalid cost']"
		>
			<template v-slot:prepend>
				<q-icon name="sell"></q-icon>
			</template>
		</q-input>

		<div class="splits">
			<div class="row q-gutter-sm no-wrap">
				<div>
					<q-input
						class="q-mb-sm"
						v-for="(member, i) in members"
						:key="i"
						outlined
						type="number"
						:label="member.first_name"
						v-model="member.currentSplit"
						@update:model-value="updateSplit"
					/>
				</div>
				<q-input
					filled
					type="number"
					label="Total"
					v-model="splitTotal"
					readonly
					:rules="[(v) => v == 100 || 'Split must add up to 100']"
					lazy-rules="ondemand"
				/>
			</div>
		</div>

		<q-btn label="Submit" type="submit" color="primary" />
	</q-form>
</template>

<script>
export default {
	props: {
		members: { required: true },
		splitwise: { required: true },
		user: { required: true },
		userInfo: { type: Object, required: true },
		currentGroupId: { type: String, required: true },
	},
	data() {
		return {
			inputName: null,
			inputDate: null,
			inputCost: 0,
			splitTotal: 0,
		}
	},
	mounted() {
		this.updateSplit()
	},
	methods: {
		updateSplit: function (val) {
			let newTotal = 0
			this.members.forEach((m) => {
				newTotal += +m.currentSplit
			})
			this.splitTotal = newTotal
		},
		onReset() {
			this.inputCost = null
			this.inputName = null
			this.inputDate = null
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
			this.splitwise
				.auth(this.user)
				.post('/create_expense', {
					body: JSON.stringify(expenseData),
					headers: {
						'Content-Type': 'application/json',
					},
				})
				.then((response) => response.json())
				.then((data) => {
					this.$emit('submission')
					if (data.errors && Object.keys(data.errors).length > 0) {
						throw data.errors.base[0]
					} else {
						this.$q.notify({
							color: 'green-4',
							message: 'Success!',
						})
						this.$refs.form.resetValidation()
					}
				})
				.catch((error) => {
					this.$q.notify({
						color: 'red-4',
						message: 'There was an error',
					})
					console.error(error)
				})
		},
	},
}
</script>
