import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
   {
      path: '/',
      component: () => import('layouts/MainLayout.vue'),
      children: [
         {
            path: '/recent-expenses',
            component: () => import('pages/RecentExpenses.vue'),
            children: [
               {
                  path: '/recent-expenses/expense/:id',
                  props: true,
                  component: () => import('pages/ExpenseDialog.vue'),
               },
            ],
         },
         {
            path: '/new-expense',
            component: () => import('pages/NewExpense.vue'),
         },
         {
            path: '/user-expenses',
            component: () => import('pages/UserExpenses.vue'),
            children: [
               {
                  path: '/user-expenses/expense/:id',
                  props: true,
                  component: () => import('pages/ExpenseDialog.vue'),
               },
            ],
         },
         {
            path: '/expense/:id',
            component: () => import('pages/Expense.vue'),
            props: true,
         },
      ],
   },

   // Always leave this as last one,
   // but you can also remove it
   {
      path: '/:catchAll(.*)*',
      component: () => import('pages/ErrorNotFound.vue'),
   },
]

export default routes
