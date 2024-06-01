<script setup>
import { useInfoStore } from 'stores/userinfo'
import { storeToRefs } from 'pinia'
import { watch, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const infoStore = useInfoStore()
const { currentGroup, userData } = storeToRefs(infoStore)

const dt = new Date()
let month = dt.getMonth() + 1
month = month.toString().padStart(2, '0')

let inputDate = ref(`${dt.getFullYear()}/${month}/${dt.getDate()}`)
let inputName = ref('')
let inputNotes = ref('')
let inputCost = ref()
let splitTotal = ref(0)
let inputCategory = ref()
let even = ref(true)
let bar = ref()
let formRes = ref('')
const categoryOpts = ref(null)

function onReset() {
   inputName.value = ''
   inputCost.value = 0
   inputNotes.value = ''
   even.value = true
   splitTotal.value = 0
   inputDate.value = `${dt.getFullYear()}/${month}/${dt.getDate()}`
}

const roundToCents = (n) => Math.floor(n * 100) / 100

function splitUnevelyQuery() {
   let shares = {}
   // 'users__0__paid_share' = inputCost.value.toString()
   let total = 0
   for (let i = 0; i < currentGroup.value.members.length; i++) {
      let cur = currentGroup.value.members[i]
      let currentShare = roundToCents(inputCost.value * (cur.currentSplit / 100))
      shares[cur.id] = currentShare
      total += currentShare
   }

   let diff = inputCost.value - total
   if (diff <= 0.03) {
      shares[userData.value.id] += diff
   }

   let queryString = '&users__0__paid_share' + '=' + inputCost.value.toString()

   Object.keys(shares).forEach((id, i) => {
      queryString += `&users__${i}__user_id=${id}&users__${i}__owed_share=${shares[id].toString()}`
   })

   return queryString
}

async function submitExpense() {
   let url = `/api/splitwise/new-expense?`
   url += `cost=${inputCost.value}`
   url += `&description=${inputName.value}&date=${inputDate.value}`
   url += `&even=${even.value}&group_id=${currentGroup.value.id}`
   url += `&details=${encodeURIComponent(inputNotes.value)}`
   if (inputCategory.value) {
      url += `&category_id=${inputCategory.value.value}`
   }
   if (!even.value) {
      url += splitUnevelyQuery()
   }

   bar.value.start()
   formRes.value = ''
   await fetch(url)
      .then((res) => res.json())
      .then((data) => {
         bar.value.stop()
         let share = ''
         let user = data.expenses[0].users.find((user) => {
            return user.user_id === userData.value.id
         })
         if (user) {
            share = user.owed_share
         }
         formRes.value = `success!`
         if (share) {
            formRes.value += ` your share is: ${share}`
         }
         console.log(data)
         $q.notify(formRes.value)
      })
      .catch((err) => {
         formRes.value = 'there was an error. check the console for more information.'
         $q.notify(formRes.value)
         console.log(err)
         bar.value.stop()
      })
}

async function getCategories() {
   await fetch(`api/splitwise/get_categories`)
      .then((res) => res.json())
      .then((data) => {
         let reduced = data.categories.reduce((acc, cur) => {
            let subcats = cur.subcategories.map((subcat) => {
               return {
                  id: subcat.id,
                  value: subcat.id,
                  label: subcat.name,
               }
            })
            return [...acc, ...subcats]
         }, [])

         categoryOpts.value = reduced
      })
}

function updateSplit() {
   if (!currentGroup.value || !currentGroup.value.members) return
   let total = 0
   currentGroup.value.members.forEach((member, i) => {
      total += +member.currentSplit ?? 0
   })

   splitTotal.value = total
}

updateSplit()

function splitRules(val) {
   if (splitTotal.value !== 100 && splitTotal.value !== 0) {
      return 'Split must add up to 100'
   }
}

onMounted(() => {
   getCategories()
})
</script>

<template>
   <q-page>
      <q-banner class="bg-green-9 text-white" v-if="!currentGroup">
         <span class="text-weight-medium">select a group in the sidebar</span>
      </q-banner>

      <div v-else class="q-py-xl full-width row wrap justify-center items-start">
         <q-form
            @submit="submitExpense"
            class="q-gutter-md col-12 col-md-8"
            ref="form"
            @reset="onReset">
            <q-input
               v-model="inputName"
               label="Expense Title"
               outlined
               required
               :rules="[(v) => !!v || 'This field is required']"
               lazy-rules="ondemand"
               hide-bottom-space />
            <q-input v-model="inputNotes" label="Notes (optional)" outlined hide-bottom-space />
            <q-input
               outlined
               v-model="inputDate"
               mask="date"
               :rules="[(v) => /^-?[\d]+\/[0-1]\d\/[0-3]\d$/.test(v) || 'Invalid date']"
               lazy-rules="ondemand"
               label="Date"
               hide-bottom-space>
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
            <q-select label="Category" :options="categoryOpts" v-model="inputCategory" />
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
               :rules="[(v) => v > 0 || 'Invalid cost']">
               <template v-slot:prepend>
                  <q-icon name="sell"></q-icon>
               </template>
            </q-input>

            <div class="splits">
               <q-toggle v-model="even" color="green" label="split evenly"></q-toggle>

               <div class="row q-gutter-sm" v-if="!even">
                  <q-input
                     class="q-mb-sm"
                     v-for="(member, i) in currentGroup.members"
                     :key="i"
                     :disable="even"
                     outlined
                     type="number"
                     :label="member.first_name"
                     v-model="member.currentSplit"
                     @update:model-value="updateSplit" />
                  <div style="width: 100%"></div>
                  <q-input
                     filled
                     class="self-start"
                     type="number"
                     label="Total"
                     v-model="splitTotal"
                     readonly
                     :rules="[(val) => splitRules(val)]"
                     lazy-rules="ondemand" />
               </div>
            </div>

            <q-btn label="Submit" type="submit" color="primary" />
            <q-btn label="Reset" type="reset" color="primary" flat />
            <div class="res">{{ formRes }}</div>
         </q-form>
         <q-ajax-bar ref="bar" position="bottom" color="accent" skip-hijack />
      </div>
   </q-page>
</template>
