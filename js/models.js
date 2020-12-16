class TodoList {
  /*
  new TodoList({id: 1, name: "My todo list", "active": false})
  */
  constructor(attributes) {
    let whitelist = ["id", "name", "active"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
    // this["id"] = attributes["id"]
    // this["name"] = attributes["name"]
    // this["active"] = attributes["active"]
  }
  /*
  TodoList.container() returns a reference to this DOM node:
  <section id="todoListsContainer" class="px-4 bg-blue-100 min-h-screen rounded-md shadow">
    <h1 class="text-2xl semibold border-b-4 border-blue">Todo Lists</h1>
    <ul id="lists" class="list-none">

    </ul>
  </section>
  */
  static container() {
    return this.c ||= document.querySelector('#lists')
  }
 
  /*
  TodoList.all() will return a promise for all of the todo_list objects that we get from fetching to /todo_lists. This
  collection will be stored locally in TodoList.collection so we can reference it after the initial call to TodoList.all()
  which will occur at the DOMContentLoaded event.
  */
  static all() {
    console.log(this);
    return fetch("http://localhost:3000/todo_lists", {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if(res.ok) {
          return res.json() // returns a promise for body content parsed as JSON
        } else {
          return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then and go to catch
        }
      })
      .then(todoListArray => {
        this.collection = todoListArray.map(attrs => new TodoList(attrs))
        let renderedLists = this.collection.map(todoList => todoList.render())
        this.container().append(...renderedLists);
        return this.collection
      })
  }

  /*
  todoList.render() will create an li element and assign it to this.element. It will then fill the element with contents 
  looking like the below html:
  <li class="my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6">
    <a href="#" class="py-4 col-span-10 sm:col-span-4">My List</a>
    <a href="#" class="my-4 text-right"><i class="fa fa-pencil-alt"></i></a>
    <a href="#" class="my-4 text-right"><i class="fa fa-trash-alt"></i></a>
  </li>
  */
  render() {
    this.element ||= document.createElement('li');
    this.element.classList.add(..."my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6".split(" "));
    
    this.nameLink ||= document.createElement('a');
    this.nameLink.classList.add(..."py-4 col-span-10 sm:col-span-4".split(" "));
    this.nameLink.textContent = this.name;

    this.editLink ||= document.createElement('a');
    this.editLink.classList.add(..."my-4 text-right".split(" "));
    this.editLink.innerHTML = `<i class="fa fa-pencil-alt"></i>`;

    this.deleteLink ||= document.createElement('a');
    this.deleteLink.classList.add(..."my-4 text-right".split(" "));
    this.deleteLink.innerHTML = `<i class="fa fa-trash-alt"></i>`;

    this.element.append(this.nameLink, this.editLink, this.deleteLink);

    return this.element;
  }
}

class Task {
  constructor(attributes) {
    let whitelist = ["id", "name", "todo_list_id", "complete"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
  }

  static container() {
    return this.c ||= document.querySelector("#tasks")
  }
}