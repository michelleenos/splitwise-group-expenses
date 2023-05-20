const routes = [
   {
      path: '/',
      component: () => import('layouts/MainLayout.vue'),
      // component: () => import('layouts/TestLayout.vue'),
      children: [
         {
            path: '/recent-expenses',
            component: () => import('pages/RecentExpenses.vue'),
         },
         {
            path: '/new-expense',
            component: () => import('pages/NewExpense.vue'),
         },
         {
            path: '/user-expenses',
            component: () => import('pages/UserExpenses.vue'),
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
