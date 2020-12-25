class TodoList {
  /*
  new TodoList({id: 1, name: "My todo list", "active": false})
  */
  constructor(attributes) {
    let whitelist = ["id", "name", "active"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
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
  TodoList.findById(id) => accepts an id as an argument and returns the todoList matching that id.
  */
  static findById(id) {
    return this.collection.find(todoList => todoList.id == id);
  }

  /*
  TodoList.create(formData) will make a fetch request to create a new Todo List in our database.
  It will use a successful response to create a new Todo List client side and store it in this.collection.
  It will also call render() on it to create the DOM element we'll use to represent it in our web page.
  Finally it will add that DOM node to TodoList.container().
  It will return a promise for the TodoList object that was created.
  */
  static create(formData) {
    return fetch("http://localhost:3000/todo_lists", {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({todo_list: formData})
    })
      .then(res => {
        if(res.ok) {
          return res.json() // returns a promise for body content parsed as JSON
        } else {
          return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then and go to catch
        }
      })
      .then(todoListAttributes => {
        let todoList = new TodoList(todoListAttributes);
        this.collection.push(todoList);
        this.container().appendChild(todoList.render());
        new FlashMessage({type: 'success', message: 'New list added successfully'})
        return todoList;
      })
      .catch(error => {
        new FlashMessage({type: 'error', message: error});
      })
  }

  /*
  todoList.show() => {
    fetch the /todo_lists/:id route to get the todolist and its associated tasks 
    use the response to create task instances client side by invoking Task.loadByList(id, tasksAttributes)
    take the previously selected active todolist and mark active: false.
    mark the shown todoList as active: true (so it's got a darker background)
  }
  */
  show() {
    return fetch(`http://localhost:3000/todo_lists/${this.id}`, {
      method: 'GET', 
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if(res.ok) {
          return res.json() // returns a promise for body content parsed as JSON
        } else {
          return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then
        }
      })
      .then(({id, tasksAttributes}) => {
        Task.loadByList(id, tasksAttributes)
        this.markActive()
      })
      .catch(err => {
        return res.text().then(error => Promise.reject(err))
      })
  }
  /*
  todoList.markActive() will set the active property on the previously active list to false, 
  call render on it to update its background color
  next, we'll set the current todolist to be the TodoList.activeList and set its active property to true 
  finally, we'll call render on it again, so that it gets the darker background.
  */
  markActive() {
    if(TodoList.activeList) {
      TodoList.activeList.active = false;
      TodoList.activeList.element.classList.replace('bg-green-400', 'bg-green-200');
    }
    TodoList.activeList = this;
    this.active = true;
    this.element.classList.replace('bg-green-200', 'bg-green-400');
  }

  /*
  todoList.delete => {
    send fetch request to delete todoList with matching id 
    upon successful response, remove the task from this.collection
    and remove the li from the dom by calling this.element.remove()
    also replace contents of the Task.container if we're deleting the active todo list
  }
  */
 delete() {
  return fetch(`http://localhost:3000/todo_lists/${this.id}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json", 
      "Content-Type": "application/json"
    }
  })
    .then(res => {
      if(res.ok) {
        return res.json() // returns a promise for body content parsed as JSON
      } else {
        return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then
      }
    })
    .then(({id}) => {
      let index = TodoList.collection.findIndex(task => task.id == id)
      TodoList.collection.splice(index, 1);
      this.element.remove();
      if(id == Task.active_todo_list_id) {
        Task.container().innerHTML = `<li class="my-2 p-4">Select a Todo List to see tasks</li>`
      }
      return this;
    })
    .catch(error => new FlashMessage({type: 'error', message: error}))
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
    this.element.classList.add(...`my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6`.split(" "));
    
    this.nameLink ||= document.createElement('a');
    this.nameLink.classList.add(..."py-4 col-span-10 sm:col-span-4 selectTodoList".split(" "));
    this.nameLink.textContent = this.name;
    this.nameLink.dataset.todoListId = this.id;

    this.editLink ||= document.createElement('a');
    this.editLink.classList.add(..."my-4 text-right".split(" "));
    this.editLink.innerHTML = `<i class="fa fa-pencil-alt"></i>`;

    this.deleteLink ||= document.createElement('a');
    this.deleteLink.classList.add(..."my-4 text-right".split(" "));
    this.deleteLink.innerHTML = `<i class="deleteTodoList fa fa-trash-alt" data-todo-list-id="${this.id}"></i>`;

    this.element.append(this.nameLink, this.editLink, this.deleteLink);

    return this.element;
  }
}

class Task {
  constructor(attributes) {
    let whitelist = ["id", "name", "todo_list_id", "completed"]
    whitelist.forEach(attr => this[attr] = attributes[attr])
  }

  static container() {
    return this.c ||= document.querySelector("#tasks")
  }
  /*

  */
  static collection() {
    return this.coll ||= {};
  }

  /*
  Task.findById(id) => accepts an id as an argument and returns the task matching that id.
  */
  static findById(id) {
    return this.collection()[Task.active_todo_list_id].find(task => task.id == id);
  }

  /*
  static loadByList(id, tasksAttributes) => {
    mark the id as active_todo_list_id (for when we handle form submission to add a new task later)
    create task instances using tasksAttributes 
    call render on each of the instances to build the associated DOM node
    clear out the container() contents 
    append the rendered instances to the container
  }
  */
  static loadByList(id, tasksAttributes) {
    Task.active_todo_list_id = id;
    let tasks = tasksAttributes.map(taskAttributes => new Task(taskAttributes));
    this.collection()[id] = tasks;
    let rendered = tasks.map(task => task.render())
    this.container().innerHTML = "";
    this.container().append(...rendered)
  }
  /*
  Task.create(formData) => {
    will make a fetch request using the form data and active_todo_list_id to create a new task instance
    if the response is ok, we'll parse it as JSON and return that 
    we'll use the data we parsed to create a new task instance, store it render it and add it to DOM at container()
    if the response is not OK we'll return a rejected promise for the error and catch it with a callback which will display it in a FlashMessage.
  }
  */
  static create(formData) {
    if(!Task.active_todo_list_id) {
      return Promise.reject().catch(() => new FlashMessage({type: 'error', message: "Please select a todo list before adding a task"}));
    } else {
      formData.todo_list_id = Task.active_todo_list_id;
    }
    return fetch('http://localhost:3000/tasks',{
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task: formData
      })
    })
      .then(res => {
        if(res.ok) {
          return res.json() // returns a promise for body content parsed as JSON
        } else {
          return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then
        }
      })
      .then(taskData => {
        let task = new Task(taskData);
        this.collection()[Task.active_todo_list_id].push(task);
        this.container().append(task.render())
        return task;
      })
      .catch(error => new FlashMessage({type: 'error', message: error}))
  }

  /*
  task.toggleComplete() will send a fetch request to update the task with a completed attribute 
  opposite to its current state. It will take a successful response and use it to update the task object stored client side and update the DOM by invoking render on the updated task.
  */
  toggleComplete() {
    fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: 'PUT', 
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }, 
      body: JSON.stringify({
        task: { completed: !this.completed }
      })
    })
      .then(res => {
        if(res.ok) {
          return res.json() // returns a promise for body content parsed as JSON
        } else {
          return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then
        }
      })
      .then(taskAttributes => {
        Object.keys(taskAttributes).forEach(attr => this[attr] = taskAttributes[attr]);
        this.render();
      })
      .catch(error => new FlashMessage({type: 'error', message: error}))
  }

  completeIconClass() {
    return this.completed ? 'fa-check-circle' : 'fa-circle';
  }

  /*
  task.delete => {
    send fetch request to delete task with matching id 
    upon successful response, remove the task from this.collection()
    and remove the li from the dom by calling this.element.remove()
  }
  */
  delete() {
    return fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json", 
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if(res.ok) {
          return res.json() // returns a promise for body content parsed as JSON
        } else {
          return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then
        }
      })
      .then(({id}) => {
        let index = Task.collection()[Task.active_todo_list_id].findIndex(task => task.id == id)
        Task.collection()[Task.active_todo_list_id].splice(index, 1);
        this.element.remove();
        return this;
      })
      .catch(error => new FlashMessage({type: 'error', message: error}))
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
    this.element.classList.add(..."my-2 px-4 bg-green-200 grid grid-cols-12".split(" "));

    this.markCompleteLink ||= document.createElement('a');
    this.markCompleteLink.classList.add(..."my-1 text-center".split(" "));
    this.markCompleteLink.innerHTML = `<i class="toggleComplete p-4 far ${this.completeIconClass()}" data-task-id="${this.id}"></i>`;

    this.nameSpan ||= document.createElement('span');
    this.nameSpan.classList.add(..."py-4 col-span-9".split(" "));
    this.nameSpan.textContent = this.name; 

    this.editLink ||= document.createElement('a');
    this.editLink.classList.add(..."my-1 text-right".split(" "));
    this.editLink.innerHTML = `<i class="p-4 fa fa-pencil-alt"></i>`;

    this.deleteLink ||= document.createElement('a');
    this.deleteLink.classList.add(..."my-1 text-right".split(" "));
    this.deleteLink.innerHTML = `<i class="deleteTask p-4 fa fa-trash-alt" data-task-id="${this.id}"></i>`;

    this.element.append(this.markCompleteLink, this.nameSpan, this.editLink, this.deleteLink);

    return this.element;
  }
}


/*
new FlashMessage({type: 'error', message: 'Name is required'})
this will create the flash message and fade it in. It'll also trigger a fade out in 5 seconds.
*/
class FlashMessage {
  constructor({type, message}) {
    this.message = message;
    // we want the color to be red if it's an error type and blue if it's not
    this.color = type == "error" ? 'bg-red-200' : 'bg-blue-100';
    this.render();
  }

  static container() {
    return this.c ||= document.querySelector('#flash')
  }

  render() {
    this.toggleMessage();
    window.setTimeout(() => this.toggleMessage(), 5000);
  }

  toggleMessage() {
    FlashMessage.container().textContent = this.message;
    FlashMessage.container().classList.toggle(this.color);
    FlashMessage.container().classList.toggle('opacity-0');
  }
}