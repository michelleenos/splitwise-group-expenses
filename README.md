# splitwise-group-expenses

My partners and I use [splitwise](https://www.splitwise.com/) to manage our household expenses, but a few things like groceries we split un-evenly. I was tired of always having to re-type the perentages into the Splitwise form, which is a bit clunky and unwieldy. So I made a little app to make it easier!

#### Vue3 :star: Quasar :star: Vite :star: Vue Router :star: Pinia :star: Axios

## API Authentication

Initially this app included auth with PizzlyJS, but since Pizzly became [Nango](https://docs.nango.dev/) I've been unable to make this work. So we are using an API key for now.

-  At https://secure.splitwise.com/apps/ click "Register your application"
-  Create a new app. The app's name, description, and URL can be whatever you like.
-  Once your app is created, create an API key for it and copy it.
-  In the root folder of this project, create a `.env` file and add your API key like this:

```
VITE_SPLITWISE_API_KEY=YOURAPIKEY
```

## Using the App

-  Add an API key first! (see above)
-  `npm install`, then `npm run dev`
-  The app will open on a localhost port
-  Click "Login" in the top right corner to fetch your user info. Once you've done this, any groups you are a part of in splitwise (that you've interacted with in the past 6 months) should show up in the left sidebar. Choose a group and visit the other links in the sidebar to see recent expenses in your group, or to create a new expense.
