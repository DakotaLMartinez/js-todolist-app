## Adding Auth to the Project 

For this, we'll be referring to the end part of this tutorial: https://github.com/dakotalmartinez/rails-devise-jwt-tutorial.
In this section of the tutorial, we demonstrate the requests that will be sent to the backend surrounding the authentication process. What we'll be adding here is some logic to handle displaying a login/signup form in the navbar of the app or the current user's email address, depending on whether we're currently authenticated or not.

First, let's add in the navbar and make space for this form to be added to the DOM:

```html
<div class="bg-green-500">
  <navbar class="container mx-auto grid grid-cols-2 py-6">
    <span class="text-white text-2xl font-bold">Todo</span>
    <div id="auth"></div>
  </navbar>
</div>
```
The div with the id of auth will be where we insert the authentication form, or the current user's email address and a logout button depending on what's appropriate. If you've read through the tutorial linked above, you know that we're planning on using localStorage to persist the JWT which contains encoded information about the currently logged in user. To handle this client side, we'll want to create a class to manage the Session. This class will handle initiating requests necessary to signup, login and logout. It will also do an initial check to our API to see if we have an active session. Currently, after finishing the tutorial, we have the /signup /login and /logout routes already working (from devise). Now, we need to add a route for getting the currently logged in user.

```rb
# app/controllers/current_user_controller.rb
class CurrentUserController < ApplicationController
  before_action :authenticate_user!
  def index
    render json: current_user.email, status: :ok
  end
end

# config/routes.rb 
get 'current_user', to: 'current_user#index'
```

Now, you'll want to set up the `Auth` class with a `static init()` method that will make a request to `/current_user` and if we get no user back, add the login form to the DOM inside of the `#auth` div, if we do get a user with an active session, then display the current user's email and the logout button up in the `#auth` div. But before we get into that, we need to think a bit about the bigger picture of how authentication fit into our client side application. Currently, all of the requests that our front end code sends to the API requires data that belongs to the current_user. We've been mocking that by just returning the first user from `current_user` in the API and not actually requiring an active session within the todo_lists and tasks controllers. Now, we're going to start requiring an active session in those controllers, so we'll need to be sending an authorization header with all of our fetch requests containing the JWT that will identify the user with an active session to the API. Thus our Auth class will have the following methods:

## Auth class methods
### static init()
Will fetch the current user using the token currently stored in localStorage. If there is an active session, it will add the email address to the navbar and a logout button as well. If there isn't one, it'll add the login form to the navbar.
### static container()
returns the `#auth` div where we'll be putting all of the contents.
### static setToken(token) 
Will store the token in localStorage and also the current time as the lastLoginTime. We do this so that if we try to get the token after more than 30 minutes have passed (our token expiration time) then we don't get anything back.
### static getToken() 
fetch the token out of localStorage and return it if the current time is less than 30 minutes after the last login time, otherwise return undefined.
### static fetch(url, options)
This method returns a promise for the parsed response of an authenticated fetch request. We'll also have a catch here that will create a new flash message displaying any errors we get back from the API. We'll replace all of our current calls to `fetch` with calls to `Auth.fetch` allowing us to skip a lot of the repetitive code and just leave the unique parts within our models.
### static loginForm() 
returns the form with sign in and sign up buttons. 
### static logoutForm()
returns the logged in user's email and a Log Out button.
### static login(formData) 
takes in user credentials and sends a fetch request to /login and stores the token from the response headers using `setToken()`.
Upon success, we'll clear out the `#auth` div and replace it with the logoutForm.
### static signup(formData) 
takes in user credentials and sends a fetch request to /signup and stores the token from the response headers using `setToken()`. Upon success, we'll clear out the `#auth` div and replace it with the loginForm.

## Building out the class

We'll start by building out the token handling/storage logic and the fetch method that will utilize the token in the headers
```js 
class Auth {

  static container() {
    return this.container ||= document.querySelector('#auth');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
    localStorage.setItem('lastLoginTime', new Date(Date.now()).getTime())
  }

  static getToken() {
    let now = new Date(Date.now()).getTime();
    let thirtyMinutes = 1000 * 60 * 30;
    let timeSinceLastLogin = now - localStorage.getItem('lastLoginTime');
    if(timeSinceLastLogin < thirtyMinutes) {
      return localStorage.getItem('token');
    }
  }

  static fetch(url, options) {
    let fetchOptions = Object.assign({}, {
      headers: {
        "Accept": "application/json", 
        "Content-Type": "application/json", 
        "Authorization": this.getToken()
      }
    }, options)
    return fetch(url, fetchOptions)
      .then(res => {
        if(res.ok) {
          return res.json();
        } else {
          return res.text().then(error => Promise.reject(error));
        }
      })
      .catch(error => new FlashMessage(error));
  }
}
```

Now, we're going to use a modal to display the login/signup form upon clicking on a link we add to our navbar:

```html
<navbar class="container mx-auto grid grid-cols-2 py-6 px-3 sm:px-0">
  <span class="text-white text-2xl font-bold">Todo</span>
  <div id="auth" class="text-right">
    <a href="#" class="loginLink">Login <i class="text-3xl loginLink fas fa-user-alt"></i></a>
  </div>
</navbar>
```
we add an event listener to handle clicking on the loginLink.
```js
// js/listeners.js
if (target.matches('.loginLink')) {
  e.preventDefault();
  Modal.populate({title: "", content: Auth.loginForm()})
  Modal.toggle();
}
```

And a `loginForm()` method to our `Auth` class that will return the login form element so we can append it to the modal content before it is displayed. 

```js
// js/auth.js 
static loginForm() {
  this.loginFormElement ||= document.createElement("form");
  this.loginFormElement.classList.set("authForm bg-white rounded px-8 pt-0 pb-2 mb-4");
  this.loginFormElement.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Login</h1>
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
        Email
      </label>
      <input 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
        id="email" 
        type="eamil" 
        name="email" 
        placeholder="email"
      >
    </div>
    <div class="mb-6">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
        Password
      </label>
      <input 
        class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
        id="password" 
        type="password" 
        name="password" 
        placeholder="******************"
      >
      <p class="text-red-500 text-xs italic">Please choose a password.</p>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <input 
        class="multi-submit bg-blue-500 hover:bg-blue-700 transition duration-200 text-white font-bold py-2 px-4 w-full rounded focus:outline-none focus:shadow-outline" 
        type="submit"
        value="Login"
      />
      <input 
        class="multi-submit bg-green-500 hover:bg-green-700 transition duration-200 text-white font-bold py-2 px-4 w-full rounded focus:outline-none focus:shadow-outline" 
        type="submit"
        value="Signup"
      />
    </div>
  `;
  return this.loginFormElement;
}
```

These methods will work to allow the form to be displayed in response to clicking the login icon in the top right corner of the page. Note that the two inputs of type submit have a class `multi-submit`. We do this so that we can attach a click event listener to `.multi-select[type="submit"]` and capture form submissions that have two submit buttons. This works because submitting a form triggers a click event on the submit button before triggering the submit event. 

To use this technique, you can handle normal forms with the submit event handler, but capture forms with multiple buttons by adding a `.multi-select` class to the submit buttons allowing you to capture the event as a click event and use conditional logic to handle the form submission differently depending on which button was the target of the click. In order to have access to the form, we can use the `closest` method to find the nearest parent node that matches the `form` selector.

```js
if (target.matches('.multi-submit[type="submit"]')) {
  e.preventDefault();
  let form = target.closest('form');
  if(form.matches('.authForm')) {
    if(target.value === "Login") {
      Auth.login(form.serialize());
    } else if(target.value === "Signup") {
      Auth.signup(form.serialize());
    }
  }
}
```

Next, the `Auth` class will define two methods for `login` and `signup`. 

```js
static login({email, password}) {
  return fetch('http://localhost:3000/login', {  
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "user": {
      email,
      password
    }})
  })
    .then(res => {
      if(res.ok) {
        this.setToken(res.headers.get('Authorization'))
        return res.json()
      } else {
        return res.text().then(text => Promise.reject(text));
      }
    })
    .then(json => {
      console.log(json);
      Modal.toggle();
    })
    .catch(error => new FlashMessage(error));
}

static signup({email, password}) {
  return fetch('http://localhost:3000/signup', {  
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "user": {
      email,
      password
    }})
  })
    .then(res => {
      if(res.ok) {
        this.setToken(res.headers.get('Authorization'))
        return res.json()
      } else {
        return res.text().then(text => Promise.reject(text));
      }
    })
    .then(json => {
      console.log(json)
      Modal.toggle();
    })
    .catch(error => new FlashMessage(error));
}
```

We're getting there. We just have a couple more tasks to address. 
First, we need to make sure that the navbar shows the login link if we don't have someone logged in, then the current user's email and a logout button if we do.
Second, we need to make sure that we don't load any todo lists unless we have a logged in user. 

## Checking if someone is logged in 

In order to know if we have an active session, we need to use the token in storage to make a request to our `/current_user` route. If we get a user back the we're good, and we can load the navbar with the logout button and that user's email address. if we get back a 401, then we can load up the navbar with a login link.

To do this, let's add a few methods:

### init() 
this method will check for a current user and if there is one, it'll fetch all of the todo lists. We're going to replace the call to `TodoList.all()` in the `DOMContentLoaded` event handler with a call to `Auth.init()`, that way we won't try to fetch any todo lists if the user isn't logged in.
### checkForCurrentUser() 
returns the current user as json if we have an active session, returns 401 unauthorized if not. If we get a user, then add the `loggedInNavbar()` to the `container()`. If we don't then we put the `loggedOutNavbar()` into the `container()`.
### loggedInNavbar()
returns the current user's email and a logout button. 
### loggedOutNavbar()
returns the Login link.

```js
static init() {
  this.getCurrentUser
    .then(user => {
      TodoList.all()
    })
}

static getCurrentUser() {
  return fetch('http://localhost:3000/current_user', {
    headers: {
      "Accept": "application/json", 
      "Content-Type": "application/json", 
      "Authorization": this.getToken()
    }
  })
    .then(res => {
      if(res.ok) {
        return res.json()
      } else {
        throw new Error("Not logged in");
      }
    })
    .then(user => {
      Auth.current_user = user;
      this.container().innerHTML = this.loggedInNavbar().outerHTML;
      TodoList.all();
    })
    .catch(error => {
      Auth.current_user = null;
      this.container().innerHTML = this.loggedOutNavbar().outerHTML;
    })
}

static loggedInNavbar() {
  let span = document.createElement('span');
  span.classList.set();
  span.innerHTML = `${Auth.current_user.email} <a href="#" class="logoutLink bg-blue-300 px-4 py-2">Logout</a>`
  return span;
}

static loggedOutNavbar() {
  let link = document.createElement('a');
  link.href = "#";
  link.classList.set("loginLink");
  link.innerHTML = `Login <i class="text-3xl loginLink fas fa-user-alt"></i>`;
  return link;
}
```

Next, we'll want to make sure that the login or signup actions will do additional things:
1. Store the current user's email in `Auth.current_user`
2. Update the navbar with the current user's email and the logout button
3. Toggle the modal
4. Trigger `TodoList.all()` to load the todo lists belonging to the current user.


```js
static login({email, password}) {
  return fetch('http://localhost:3000/login', {  
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "user": {
      email,
      password
    }})
  })
    .then(res => {
      if(res.ok) {
        this.setToken(res.headers.get('Authorization'))
        return res.json()
      } else {
        return res.json().then(json => Promise.reject(json.error));
      }
    })
    .then(({data}) => {
      Auth.current_user = data.email;
      this.container().innerHTML = this.loggedInNavbar().outerHTML;
      Modal.toggle();
      TodoList.all();
    })
    .catch(error => new FlashMessage({type: 'error', message: error}));
}

static signup({email, password}) {
  return fetch('http://localhost:3000/signup', {  
    method: 'POST',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "user": {
      email,
      password
    }})
  })
    .then(res => {
      if(res.ok) {
        this.setToken(res.headers.get('Authorization'))
        return res.json()
      } else {
        return res.json().then(({status}) => Promise.reject(status));
      }
    })
    .then(({status, data}) => {
      Auth.current_user = data.email;
      this.container().innerHTML = this.loggedInNavbar().outerHTML;
      Modal.toggle();
      TodoList.all();
      new FlashMessage({type: 'success', message: status.message})
    })
    .catch(error => new FlashMessage({type: 'error', message: error.message}));
}
```

Now, we need to hook up the Logout button so that we can trigger the ability to log out. 
Logout also has a few other tasks to accomplish:

1. We need to remove the jwt that will be invalidated by the logout request.
2. We need to clear out the TodoLists and tasks.
3. We need to replace the navbar contents with the loggedOutNavbar version.
4. We need to set the current_user to null. 
5. Display a flash message to indicate that the logged out worked out.

```js
static revokeToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('lastLoginTime');
}

static logout() {
  return fetch('http://localhost:3000/logout', {  
    method: 'DELETE',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": this.getToken()
    }
  })
    .then(res => {
      if(res.ok) {
        return res.json()
      } else {
        return res.json().then(({message}) => Promise.reject(message));
      }
    })
    .then(({message}) => {
      this.revokeToken();
      TodoList.container().innerHTML = '';
      Task.container().innerHTML = '';
      Auth.container().innerHTML = this.loggedOutNavbar().outerHTML;
      Auth.current_user = null;
      new FlashMessage({type: 'success', message})
    })
    .catch(message => new FlashMessage({type: 'error', message}));
}
```

This should allow our users to log out and remove the todo lists and tasks from the DOM, 
adding a flash message saying we've logged out. After this is done, the last step is to 
rework our fetch requests so that we will be able to use the token stored in Auth and 
make authenticated requests so we can retrieve the todo lists and tasks belonging to this
user who's logged in. To get this working, we will remove the `current_user` method we 
mocked at the beginning of the project. The current_user will be set by devise-jwt using  
the token included in fetch requests sent using `Auth.fetch()`. 

The auth code looks like this in the end:

```js
class Auth {
  static init() {
    this.getCurrentUser()
  }

  static container() {
    return this.c ||= document.querySelector('#auth');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
    localStorage.setItem('lastLoginTime', new Date(Date.now()).getTime())
  }

  static getToken() {
    let now = new Date(Date.now()).getTime();
    let thirtyMinutes = 1000 * 60 * 30;
    let timeSinceLastLogin = now - localStorage.getItem('lastLoginTime');
    if(timeSinceLastLogin < thirtyMinutes) {
      return localStorage.getItem('token');
    }
  }

  static revokeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('lastLoginTime');
  }

  static getCurrentUser() {
    return fetch('http://localhost:3000/current_user', {
      headers: {
        "Accept": "application/json", 
        "Content-Type": "application/json", 
        "Authorization": this.getToken()
      }
    })
      .then(res => {
        if(res.ok) {
          return res.text()
        } else {
          return Promise.reject("Not logged in");
        }
      })
      .then(user => {
        Auth.current_user = user;
        this.container().innerHTML = this.loggedInNavbar().outerHTML;
        TodoList.all()
      })
      .catch(error => {
        Auth.current_user = null;
        this.container().innerHTML = this.loggedOutNavbar().outerHTML;
      })
  }

  static loggedInNavbar() {
    let span = document.createElement('span');
    span.classList.set("block text-xl mt-1");
    span.innerHTML = `${Auth.current_user} <a href="#" class="logoutLink bg-blue-300 px-4 py-2 inline-block ml-2">Logout</a>`
    return span;
  }

  static loggedOutNavbar() {
    let link = document.createElement('a');
    link.href = "#";
    link.classList.set("loginLink text-xl block mt-1");
    link.innerHTML = `Login <i class="text-3xl loginLink fas fa-user-alt"></i>`;
    return link;
  }

  static fetch(url, options) {
    let fetchOptions = Object.assign({}, {
      headers: {
        "Accept": "application/json", 
        "Content-Type": "application/json", 
        "Authorization": this.getToken()
      }
    }, options)
    return fetch(url, fetchOptions)
      .then(res => {
        if(res.ok) {
          return res.json();
        } else {
          return res.text().then(error => Promise.reject(error));
        }
      })
      .catch(error => new FlashMessage(error));
  }

  static loginForm() {
    this.loginFormElement ||= document.createElement("form");
    this.loginFormElement.classList.set("authForm bg-white rounded px-8 pt-0 pb-2 mb-4");
    this.loginFormElement.innerHTML = `
      <h1 class="text-2xl font-bold mb-4">Login</h1>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
          Email
        </label>
        <input 
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          id="email" 
          type="eamil" 
          name="email" 
          placeholder="email"
        >
      </div>
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
          Password
        </label>
        <input 
          class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
          id="password" 
          type="password" 
          name="password" 
          placeholder="******************"
        >
        <p class="text-red-500 text-xs italic">Please choose a password.</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input 
          class="multi-submit bg-blue-500 hover:bg-blue-700 transition duration-200 text-white font-bold py-2 px-4 w-full rounded focus:outline-none focus:shadow-outline" 
          type="submit"
          value="Login"
        />
        <input 
          class="multi-submit bg-green-500 hover:bg-green-700 transition duration-200 text-white font-bold py-2 px-4 w-full rounded focus:outline-none focus:shadow-outline" 
          type="submit"
          value="Signup"
        />
      </div>
    `;
    return this.loginFormElement;
  }

  static login({email, password}) {
    return fetch('http://localhost:3000/login', {  
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ "user": {
        email,
        password
      }})
    })
      .then(res => {
        if(res.ok) {
          this.setToken(res.headers.get('Authorization'))
          return res.json()
        } else {
          return res.json().then(json => Promise.reject(json.error));
        }
      })
      .then(({data}) => {
        Auth.current_user = data.email;
        this.container().innerHTML = this.loggedInNavbar().outerHTML;
        Modal.toggle();
        TodoList.all();
      })
      .catch(error => new FlashMessage({type: 'error', message: error}));
  }

  static signup({email, password}) {
    return fetch('http://localhost:3000/signup', {  
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ "user": {
        email,
        password
      }})
    })
      .then(res => {
        if(res.ok) {
          this.setToken(res.headers.get('Authorization'))
          return res.json()
        } else {
          return res.json().then(({status}) => Promise.reject(status));
        }
      })
      .then(({status, data}) => {
        Auth.current_user = data.email;
        this.container().innerHTML = this.loggedInNavbar().outerHTML;
        Modal.toggle();
        TodoList.all();
        new FlashMessage({type: 'success', message: status.message})
      })
      .catch(error => new FlashMessage({type: 'error', message: error.message}));
  }

  static logout() {
    return fetch('http://localhost:3000/logout', {  
      method: 'DELETE',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": this.getToken()
      }
    })
      .then(res => {
        if(res.ok) {
          return res.json()
        } else {
          return res.json().then(({message}) => Promise.reject(message));
        }
      })
      .then(({message}) => {
        this.revokeToken();
        TodoList.container().innerHTML = '';
        Task.container().innerHTML = '';
        Auth.container().innerHTML = this.loggedOutNavbar().outerHTML;
        Auth.current_user = null;
        new FlashMessage({type: 'success', message})
      })
      .catch(message => new FlashMessage({type: 'error', message}));
  }
}
```

And then the final code for the models:  

```js
class TodoList {
  constructor(attributes) {
    let whitelist = ["id", "name", "active"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
    // if this list is active, store a reference to it so we can toggle its background color later on when
    // we mark another list as the active list.
    if(this.active) { TodoList.active = this; }
  }
  /*
  TodoList.container() returns a reference to this DOM node:
  <ul id="lists" class="list-none">

  </ul>
  */
  static container() {
    return this.c ||= document.querySelector('#lists')
  }

  /*
    TodoList.all() returns a promise for the collection of all todoList objects from the API.
    It also takes those todoLists and calls render on them, generating the li DOM nodes that 
    display them, and spreading them out into the list where they'll be appended to the DOM.
  */
  static all() {
    return Auth.fetch("http://localhost:3000/todo_lists")
      .then(todoListsJson => {
        this.collection = todoListsJson.map(tlAttributes => new TodoList(tlAttributes))
        let listItems = this.collection.map(list => list.render())
        this.container().append(...listItems)
        return this.collection
      })
  }
  /*
  TodoList.create(formData) will post the todoList to the database, take the successful 
  response and use it to create a new TodoList, add it to the collection, render it and
  insert it into the list(). If there's an error, the validation message will get added.
  */
  static create(formData) {
    return Auth.fetch("http://localhost:3000/todo_lists", {
      method: 'POST',
      body: JSON.stringify({todo_list: formData})
    })
      .then(json => {
        let todoList = new TodoList(json);
        this.collection.push(todoList);
        this.container().appendChild(todoList.render());
        new FlashMessage({type: 'success', message: 'TodoList added successfully'})
        return todoList;
      })
  }
  /*
  TodoList.findById(id) will return the TodoList object that matches the id passed as an argument.
  We'll assume here that this.collection exists because we won't be calling this method until the DOM 
  we've clicked on an element created by one of our TodoList instances that we created and stored in 
  this.collection when the initial fetch has completed and promise callbacks have been executed.
  We're using == instead of === here so we can take advantage of type coercion 
  (the dataset property on the target element will be a string, whereas the id of the TodoList will be an integer)
  */
  static findById(id) {
    return this.collection.find(todoList => todoList.id == id)
  }

  /*
  todoList.show() will make a fetch request to the show route that will use a different serializer that includes the tasks 
  that belong to a list. Upon response, it will call toggleActive() on the todoList, adding the darker background color to 
  the selected list and restoring the original.
  */
  show() {
    return Auth.fetch(`http://localhost:3000/todo_lists/${this.id}`)
      .then(({todo_list, tasks}) => {
        Task.loadFromList(tasks, todo_list.id)
        this.toggleActive();
      })
  }

  /*
  This method will remove the contents of the element and replace them with the form we can use to edit the
  todo list. We'll also change the styling of our this.element li a little so it looks better within the list.
  <li class="my-2 bg-green-200">  
    <form class="edit-todo-list flex mt-4" data-todo-list-id=${this.id}>
      <input type="text" class="flex-1 p-3" name="name" value="${this.name} />
      <button type="submit" class="flex-none"><i class="fa fa-save p-4 z--1 bg-green-400"></i></button>
    </form>
  </li>
  */
  edit() {
    // remove the current contents of the element representing this TodoList and remove grid styles
    [this.nameLink, this.editLink, this.deleteLink].forEach(el => el.remove())
    this.element.classList.remove(..."grid grid-cols-12 sm:grid-cols-6 pl-4".split(" "))
    // if we've already created the form, all we need to do is make sure the value of
    // the name input matches the current name of the todo list
    if(this.form) {
      this.nameInput.value = this.name;
    } else {
      this.form = document.createElement('form');
      // adding the classes this way lets us copy what we'd have in our html here.
      // we need to run split(" ") to get an array of class names individually, then we 
      // call ... (the spread operator) on that array so we can spread out each element
      // as a separate argument to classList, which accepts a sequence of strings as arguments
      this.form.classList.add(..."editTodoListForm flex mt-4".split(" "));
      this.form.dataset.todoListId = this.id;
      // create name input 
      this.nameInput = document.createElement('input');
      this.nameInput.value = this.name;
      this.nameInput.name = 'name';
      this.nameInput.classList.add(..."flex-1 p-3".split(" "));
      // create save button 
      this.saveButton = document.createElement('button');
      this.saveButton.classList.add("flex-none");
      this.saveButton.innerHTML = `<i class="fa fa-save p-4 z--1 bg-green-400"></i>`

      this.form.append(this.nameInput, this.saveButton);
    }
    // add the form to the empty list item.
    this.element.append(this.form);
    this.nameInput.focus();
  }
  /*
  todoList.update(formData) will make a fetch request to update the todoList via our API, we'll take the succesful response and
  use it to update the DOM with the new name. We'll also replace the form with the original nameLink, editLink, and deleteLink 
  and restore the styles on the this.element li to their initial state. We'll also show a successful flash message at the top.
  If something goes wrong, we'll hold off on removing the form and instead raise a flash error message at the top allowing the 
  user to try again.
  */
  update(formData) {
    return Auth.fetch(`http://localhost:3000/todo_lists/${this.id}`, {
      method: 'PUT',
      body: JSON.stringify({todo_list: formData})
    })
      .then(json => {
        //update this object with the json response
        Object.keys(json).forEach((key) => this[key] = json[key])
        // remove the form
        this.form.remove();
        // add the nameLink edit and delete links in again.
        this.render();
        new FlashMessage({type: 'success', message: 'TodoList updated successfully'})
        return todoList;
      })
  }

  delete() {
    let proceed = confirm("Are you sure you want to delete this list?");
    if(proceed) {
      return Auth.fetch(`http://localhost:3000/todo_lists/${this.id}`, {
        method: 'DELETE'
      })
        .then(json => {
          //update this object with the json response
          let index = TodoList.collection.findIndex(list => list.id == json.id);
          TodoList.collection.splice(index, 1);
          this.element.remove();
          new FlashMessage({type: 'success', message: 'Todo List deleted successfully'})
        })
    }
  }

  /*
  todoList.toggleActive() will toggle the background color of the previously active list to the original bg-green-200. 
  it will then replace the original background color of the newly selected list with bg-green-400. Finally, it will mark
  this list as the active list so we'll be able to switch its color back to the original when another list is selected.
  */
  toggleActive() {
    // only toggle the active list's background color if there is an active list.
    if(TodoList.active) { 
      TodoList.active.element.classList.replace("bg-green-400", "bg-green-200");
      TodoList.active.active = false; // update the active property of previously active list to false
    }
    // make this one darker and mark it as the currently active list
    this.element.classList.replace("bg-green-200", "bg-green-400");
    TodoList.active = this;
  }

  /*
  <li class="my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6">
    <a href="#" class="py-4 col-span-10 sm:col-span-4">My List</a>
    <a href="#" class="editList my-4 text-right"><i class="fa fa-pencil-alt"></i></a>
    <a href="#" class="deleteList my-4 text-right"><i class="fa fa-trash-alt"></i></a>
  </li>
  */
  render() {
    this.element ||= document.createElement('li');

    this.element.classList.add(..."my-2 pl-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6".split(" "));
    this.nameLink ||= document.createElement('a');
    this.nameLink.classList.add(..."selectTodoList py-4 col-span-10 sm:col-span-4 cursor-pointer".split(" "));
    this.nameLink.dataset.todoListId = this.id;
    this.nameLink.textContent = this.name;
    // only create the edit and delete links if we don't already have them
    if(!this.editLink) {
      this.editLink = document.createElement('a');
      this.editLink.classList.add(..."my-1".split(" "));
      this.editLink.innerHTML = `<i class="fa fa-pencil-alt editTodoList p-4 cursor-pointer" data-todo-list-id="${this.id}"></i>`;
      this.deleteLink = document.createElement('a');
      this.deleteLink.classList.add(..."my-1".split(" "));
      this.deleteLink.innerHTML = `<i class="fa fa-trash-alt deleteTodoList p-4 cursor-pointer" data-todo-list-id="${this.id}"></i>`;
    }

    this.element.append(this.nameLink, this.editLink, this.deleteLink);
    return this.element;
  }

}

class Task {
  constructor(attributes) {
    let whitelist = ["id", "name", "todo_list_id", "completed", "notes"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
  }
  /*
  <ul id="tasks" class="list-none">
    
  </ul>
  */
  static container() {
    return this.c = document.querySelector("#tasks")
  }

  /*
  Task.all() returns an object with keys of todo_list_id and the values are arrays of task instances.
  */
  static all() {
    return this.collection ||= {};
  }

  /*
  Task.findById(id) => returns a task within Task.all() at the key of the active_todo_list_id that matches the id 
  */
  static findById(id) {
    let result = this.all()[Task.active_todo_list_id].find(task => task.id == id);
    return result ? result : new FlashMessage({type: "error", message: "Task not found."})
  }

  /*
  Task.loadFromList(tasks, todo_list_id) will accept an array of task attributes and a todo_list_id. It will create Tasks 
  having the attributes in the array, store them in the this.collection object under the key matching the todo_list_id.
  It also renders all of them and replaces the contents of the container with the rendered task elements. It also stores 
  the todo_list_id as a property of the class so it'll be accessible when we submit the form to create a new task.
  */
  static loadFromList(tasks, todo_list_id) {
    let taskObjects = tasks.map(attrs => new Task(attrs));
    this.all()[todo_list_id] = taskObjects;
    this.active_todo_list_id = todo_list_id;
    let taskElements = taskObjects.map(task => task.render());
    this.container().innerHTML = "";
    this.container().append(...taskElements);
  }

  /*
  Task.create(formData) will: 
  accept form data as an argument
  make a fetch request with that formData to create the new task via the API 
  check if the response is ok, and if it is
  parse the response as a JSON formatted string and pass the parsed value to the next callback
  take the js data structure in the next callback and use it to create a new instance of Task client side 
  store the instance in this.collection
  call render on the instance creating the node that will represent it in the DOM 
  append the created instance to this.container() 
  if the respose is not ok, we will parse it as text, consume that promise with a then callback which returns a rejected promise for the error from the API 
  catch the error with another callback which uses it to create a new FlashMessage which will be displayed in section#flash
  */
  static create(formData) {
    formData.todo_list_id = Task.active_todo_list_id;
    return Auth.fetch('http://localhost:3000/tasks', {
      method: 'POST', 
      body: JSON.stringify({task: formData})
    })
      .then(taskAttributes => {
        let task = new Task(taskAttributes);
        this.collection[this.active_todo_list_id].push(task);
        let rendered = task.render();
        this.container().appendChild(rendered);
        return task;
      })
  }

  /*
  task.toggleComplete() will make a fetch request and update the complete attribute of the task 
  it will then update the client side copy and call render on it to update the icon.
  */
  toggleComplete() {
    return Auth.fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: 'PUT',
      body: JSON.stringify({task: {completed: !this.completed }})
    })
      .then(taskAttributes => {
        Object.keys(taskAttributes).forEach(attr => this[attr] = taskAttributes[attr]);
        this.render();
      })
  }

  /*
  task.completeIconClass() returns the class indicating whether the icon should be a checked circle or an empty one.
  */
  completeIconClass() {
    return this.completed ? 'fa-check-circle' : 'fa-circle';
  }

  /*
  task.edit() creates an edit task form element and adds it as modal content. Then calls Modal.toggle() to display it.
  */
  edit() {
    Modal.populate({title: "Edit Task", content: this.editTaskForm()})
    Modal.toggle();
  }

  editTaskForm() {
    this.editForm ||= document.createElement('form');
    this.editForm.classList.set("editTaskForm mt-4");
    this.editForm.dataset.taskId = this.id;

    this.nameLabel ||= document.createElement('label');
    this.nameLabel.classList.set('flex flex-col');
    this.nameSpanEdit ||= document.createElement('span');
    this.nameSpanEdit.textContent = "Name";
    this.nameSpanEdit.classList.set("uppercase semibold my-2")
    this.nameLabel.append(this.nameSpanEdit);
    this.nameInput ||= document.createElement('input');
    this.nameInput.type = "text";
    this.nameInput.value = this.name;
    this.nameInput.name = 'name';
    this.nameInput.classList.set("flex-1 p-3 bg-gray-200 rounded focus:outline-none focus:shadow-outline focus:border-blue-300");

    this.nameLabel.append(this.nameInput);

    this.notesLabel ||= document.createElement('label');
    this.notesLabel.classList.set('flex flex-col');
    this.notesSpanEdit ||= document.createElement('span');
    this.notesSpanEdit.textContent = "notes";
    this.notesSpanEdit.classList.set("uppercase semibold my-2")
    this.notesLabel.append(this.notesSpanEdit);
    this.notesInput ||= document.createElement('textarea');
    this.notesInput.classList.set('flex-1 p-3 mb-2 bg-gray-200 min-h-12 rounded focus:outline-none focus:shadow-outline focus:border-blue-300 resize-y');
    this.notesInput.rows = 4;
    this.notesInput.textContent = this.notes;
    this.notesInput.name="notes";
    this.notesLabel.append(this.notesInput);

    this.saveTaskButton ||= document.createElement('button');
    this.saveTaskButton.classList.set('w-full bg-green-400 my-4 py-3 uppercase font-bold hover:bg-green-500 transition duration-500');
    this.saveTaskButton.type = "submit";
    this.saveTaskButton.textContent = "Save Task";

    this.editForm.append(this.nameLabel, this.notesLabel, this.saveTaskButton);

    return this.editForm;
  }

  /*
  task.update(formData) will make a fetch request to update the task via our API, 
  we'll take the succesful response and use it to update the DOM with the new name.
  We'll toggle (hide) the modal in response to the form submission. 
  We'll also show a successful flash message at the top. If something goes wrong, we'll hold off 
  on removing the form and instead raise a flash error message at the top allowing the 
  user to try again.
  */
  update(formData) {
    return Auth.fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: 'PUT',
      body: JSON.stringify({task: formData})
    })
      .then(json => {
        //update this object with the json response
        Object.keys(json).forEach((key) => this[key] = json[key])
        // remove the form
        this.editForm.remove();
        // add the nameLink edit and delete links in again.
        this.render();
        Modal.toggle();
        new FlashMessage({type: 'success', message: 'Task updated successfully'})
        return todoList;
      })
  }

  delete() {
    let proceed = confirm("Are you sure you want to delete this task?");
    if(proceed) {
      return Auth.fetch(`http://localhost:3000/tasks/${this.id}`, {
        method: 'DELETE'
      })
        .then(json => {
          //update this object with the json response
          let index = Task.collection[Task.active_todo_list_id].findIndex(task => task.id == json.id);
          Task.collection[Task.active_todo_list_id].splice(index, 1);
          this.element.remove();
          new FlashMessage({type: 'success', message: 'Task deleted successfully'})
        })
        .catch(error => {
          new FlashMessage({type: 'error', message: error});
        })
    }
  }

  /*
  <li class="my-2 px-4 bg-green-200 grid grid-cols-12">
    <a href="#" class="my-1 text-center"><i class="p-4 far fa-circle"></i></a>
    <span class="py-4 col-span-9">My First Task</span>
    <a href="#" class="my-1 text-right"><i class="p-4 fa fa-pencil-alt"></i></a>
    <a href="#" class="my-1 text-right"><i class="p-4 fa fa-trash-alt"></i></a>
  </li>
  */
  render() {
    this.element ||= document.createElement('li');
    this.element.classList.set("my-2 px-1 bg-green-200 grid grid-cols-12");

    this.completeLink ||= document.createElement('a');
    this.completeLink.classList.set("my-1 text-center");
    this.completeLink.innerHTML = `<i class="p-4 far ${this.completeIconClass()} toggleComplete" data-task-id="${this.id}"></i>`

    this.nameSpan ||= document.createElement('a');
    this.nameSpan.classList.set("editTask py-4 col-span-9");
    this.nameSpan.dataset.taskId = this.id;
    this.nameSpan.textContent = this.name;
    // only create the edit and delete links if we don't already have them
    if(!this.editLink) {
      this.editLink = document.createElement('a');
      this.editLink.classList.set("my-1");
      this.editLink.innerHTML = `<i class="fa fa-pencil-alt editTask modal-open p-4 cursor-pointer" data-task-id="${this.id}"></i>`;
      this.deleteLink = document.createElement('a');
      this.deleteLink.classList.set("my-1");
      this.deleteLink.innerHTML = `<i class="fa fa-trash-alt deleteTask p-4 cursor-pointer" data-task-id="${this.id}"></i>`;
    }

    this.element.append(this.completeLink, this.nameSpan, this.editLink, this.deleteLink);
    return this.element;
  }
}
```