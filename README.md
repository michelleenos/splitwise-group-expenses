# splitwise-group-expenses

My partners and I use [splitwise](https://www.splitwise.com/) to manage our household expenses, but a few things like groceries we split un-evenly. I was tired of always having to re-type the perentages into the Splitwise form, which is a bit clunky and unwieldy. So I made a little app to make it easier!

## this project is built with:

-  Vue3
-  Vue Router
-  Axios
-  [Pinia](https://pinia.vuejs.org/)
-  [Quasar](https://quasar.dev/)

## API Authentication

Initially this app included auth with PizzlyJS, but since Pizzly became [Nango](https://docs.nango.dev/) I've been unable to make this work. So we are using an API key for now.

-  Go to https://secure.splitwise.com/apps/ and click "Register your application"
-  Create a new app. the app name, description, and URL can be whatever you like.
-  Once your app is created, create an API key for it.
-  Copy the API key. In the root folder of this project, create a `.env` file and add your API key like this:

```
VITE_SPLITWISE_API_KEY={{your key}}
```
