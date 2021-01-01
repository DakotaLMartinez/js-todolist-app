class Auth {
  static init() {
    this.getCurrentUser()
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
    span.classList.set('block mt-1');
    span.innerHTML = `${Auth.current_user} <a href="#" class="logoutLink bg-blue-300 px-4 py-2">Logout</a>`
    return span;
  }

  static loggedOutNavbar() {
    let link = document.createElement('a');
    link.href = "#";
    link.classList.set("loginLink");
    link.innerHTML = `Login <i class="text-3xl loginLink fas fa-user-alt"></i>`;
    return link;
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

  static fetch(url, options) {
    let fetchOptions = Object.assign({}, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": this.getToken()
      }
    }, options);
    return fetch(url, fetchOptions)
      .then(res => {
        if(res.ok) {
          return res.json();
        } else {
          return res.text().then(error => Promise.reject(error));
        }
      })
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
          type="email" 
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

  static login(formData) {
    return fetch("http://localhost:3000/login", { 
      method: 'POST', 
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }, 
      body: JSON.stringify({user: formData})
    })
      .then(res => {
        if(res.ok) {
          this.setToken(res.headers.get('Authorization'));
          return res.json();
        } else {
          return res.json().then(error => Promise.reject(error));
        }
      })
      .then(({data,status}) => {
        Auth.current_user = data.email;
        new FlashMessage({type: 'success', message: status.message});
        this.container().innerHTML = this.loggedInNavbar().outerHTML;
        Modal.toggle();
        TodoList.all();
      })
      .catch(({error}) => new FlashMessage({type: 'error', message: error}))
  }

  static signup(formData) {
    return fetch('http://localhost:3000/signup', {  
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({user: formData})
    })
      .then(res => {
        if(res.ok) {
          this.setToken(res.headers.get('Authorization'))
          return res.json()
        } else {
          return res.json().then(text => Promise.reject(text));
        }
      })
      .then(({data,status}) => {
        Auth.current_user = data.email;
        new FlashMessage({type: 'success', message: status.message});
        this.container().innerHTML = this.loggedInNavbar().outerHTML;
        Modal.toggle();
        TodoList.all();
      })
      .catch(({status: {message}}) => new FlashMessage({type: 'error', message}))
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