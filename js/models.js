class TodoList {
  constructor(attributes) {
    let whitelist = ["id", "name", "active"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
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
    return fetch("http://localhost:3000/todo_lists")
      .then(res => res.json())
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
    return fetch("http://localhost:3000/todo_lists", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if(res.ok) {
          return res.json()
        } else {
          return res.text().then(errors => Promise.reject(errors))
        }
      })
      .then(json => {
        let todoList = new TodoList(json);
        this.collection.push(todoList);
        this.container().appendChild(todoList.render());
        new FlashMessage({type: 'success', message: 'TodoList added successfully'})
        return todoList;
      })
      .catch(error => {
        new FlashMessage({type: 'error', message: error});
      })
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

    this.element.classList.add(..."my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6".split(" "));
    this.nameLink ||= document.createElement('a');
    this.nameLink.classList.add(..."py-4 col-span-10 sm:col-span-4".split(" "));
    this.nameLink.textContent = this.name;
    if(!this.editLink) {
      this.editLink = document.createElement('a');
      this.editLink.classList.add(..."editList my-4 text-right".split(" "));
      this.editLink.innerHTML = '<i class="fa fa-pencil-alt"></i>';
      this.deleteLink = document.createElement('a');
      this.deleteLink.classList.add(..."deleteList my-4 text-right".split(" "));
      this.deleteLink.innerHTML = '<i class="fa fa-trash-alt"></i>';
    }

    this.element.append(this.nameLink, this.editLink, this.deleteLink);
    return this.element;
  }

}

class Task {
  constructor(attributes) {
    let whitelist = ["id", "name", "todo_list_id", "complete", "due_by"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
  }

  static container() {
    return this.c = document.querySelector("#tasks")
  }
}

class FlashMessage {
  constructor({message, type}) {
    this.error = type === "error";
    this.message = message;
    this.render()
  }

  container() {
    return this.c ||= document.querySelector("#flash")
  }

  render() {
    this.container().textContent = this.message;
    this.toggleDisplay();
    setTimeout(() => this.toggleDisplay(), 5000);
  }

  toggleDisplay() {
    this.container().classList.toggle('opacity-0');
    this.container().classList.toggle(this.error ? 'bg-red-200' : 'bg-blue-200')
    this.displayed = !this.displayed;
  } 
}