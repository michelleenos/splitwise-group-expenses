const routes = [
	{
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
		children: [
			{ path: '', component: () => import('pages/HomeView.vue') },
			{
				path: '/recent-expenses',
				component: () => import('pages/RecentExpenses.vue'),
			},
			{
				path: '/new-expense',
				component: () => import('pages/NewExpense.vue'),
			},
			{
				path: '/group',
				component: () => import('pages/GroupView.vue'),
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
