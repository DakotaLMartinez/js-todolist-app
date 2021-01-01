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
    return Auth.fetch("http://localhost:3000/todo_lists")
      .then(todoListArray => {
        this.collection = todoListArray.map(attrs => new TodoList(attrs))
        let renderedLists = this.collection.map(todoList => todoList.render())
        this.container().append(...renderedLists);
        return this.collection
      })
      .catch(error => new FlashMessage(error));
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
    return Auth.fetch("http://localhost:3000/todo_lists", {
      method: 'POST',
      body: JSON.stringify({todo_list: formData})
    })
      .then(todoListAttributes => {
        let todoList = new TodoList(todoListAttributes);
        this.collection.push(todoList);
        this.container().appendChild(todoList.render());
        new FlashMessage({type: 'success', message: 'New list added successfully'})
        return todoList;
      })
      .catch(error => new FlashMessage(error));
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
    return Auth.fetch(`http://localhost:3000/todo_lists/${this.id}`)
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
  return Auth.fetch(`http://localhost:3000/todo_lists/${this.id}`, {
    method: "DELETE"
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
    this.element.classList.set(`my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6`);
    
    this.nameLink ||= document.createElement('a');
    this.nameLink.classList.set("py-4 col-span-10 sm:col-span-4 selectTodoList");
    this.nameLink.textContent = this.name;
    this.nameLink.dataset.todoListId = this.id;

    this.editLink ||= document.createElement('a');
    this.editLink.classList.set("my-4 text-right");
    this.editLink.innerHTML = `<i class="fa fa-pencil-alt"></i>`;

    this.deleteLink ||= document.createElement('a');
    this.deleteLink.classList.set("my-4 text-right");
    this.deleteLink.innerHTML = `<i class="deleteTodoList fa fa-trash-alt" data-todo-list-id="${this.id}"></i>`;

    this.element.append(this.nameLink, this.editLink, this.deleteLink);

    return this.element;
  }
}

class Task {
  constructor(attributes) {
    let whitelist = ["id", "name", "todo_list_id", "completed", "notes"]
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
    return Auth.fetch('http://localhost:3000/tasks',{
      method: 'POST',
      body: JSON.stringify({ task: formData })
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
    Auth.fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: 'PUT',  
      body: JSON.stringify({ task: { completed: !this.completed } })
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
  task.edit() => returns a form that will allow updating a task. 
  */
  edit() {
    this.editForm ||= document.createElement('form');
    this.editForm.classList.set("editTaskForm mb-2");
    this.editForm.dataset.taskId = this.id;
    this.editForm.innerHTML = `
      <fieldset class="my-2">
        <label for="name" class="block w-full uppercase">Name</label>
        <input  
          type="text" 
          name="name" 
          id="name"
          class="w-full border-2 rounded p-2 focus:outline-none focus:ring focus:border-blue-300" 
        />
      </fieldset>
      <fieldset class="my-2">
        <label for="notes" class="block w-full uppercase">Notes</label>
        <textarea 
          id="notes" 
          name="notes" 
          class="w-full h-32 border-2 rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
        ></textarea>
      </fieldset> 
      <input 
        type="submit" 
        class="w-full block py-3 bg-green-400 hover:bg-green-500 transition duration-200 uppercase font-semibold cursor-pointer" 
        value="Save Task" 
      />
    </form>
    `
    this.editForm.querySelector('#name').value = this.name;
    this.editForm.querySelector('#notes').value = this.notes || '';
    return this.editForm;
  }

  /*
  task.update(formData) => {
    1. update backend via fetch request
    2. upon success return response parsed as JSON object, upon failure return rejected promise with error message
    3. use successful response to update `this` object. 
    4. Call this.render() to update the list item in the dom with the new info.
    5. add success flash message 
    6. upon failure, catch error and return new FlashMessage to display it.
  }
  */
  
  update(formData) {
    return Auth.fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: "PUT",
      body: JSON.stringify({task: formData})
    })
      .then((taskAttributes) => {
        Object.keys(taskAttributes).forEach(attr => this[attr] = taskAttributes[attr])
        this.render();
        new FlashMessage({type: 'success', message: 'Task updated successfully'});
        // this.element.remove();
        // return this;
      })
      .catch(error => new FlashMessage({type: 'error', message: error}))
  }
  /*
  task.delete => {
    send fetch request to delete task with matching id 
    upon successful response, remove the task from this.collection()
    and remove the li from the dom by calling this.element.remove()
  }
  */
  delete() {
    return Auth.fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: "DELETE"
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
    this.element.classList.set("my-2 px-4 bg-green-200 grid grid-cols-12");

    this.markCompleteLink ||= document.createElement('a');
    this.markCompleteLink.classList.set("my-1 text-center");
    this.markCompleteLink.innerHTML = `<i class="toggleComplete p-4 far ${this.completeIconClass()}" data-task-id="${this.id}"></i>`;

    this.nameSpan ||= document.createElement('span');
    this.nameSpan.classList.set("py-4 col-span-9");
    this.nameSpan.textContent = this.name; 

    this.editLink ||= document.createElement('a');
    this.editLink.classList.set("my-1 text-right");
    this.editLink.innerHTML = `<i class="editTask p-4 fa fa-pencil-alt" data-task-id="${this.id}"></i>`;

    this.deleteLink ||= document.createElement('a');
    this.deleteLink.classList.set("my-1 text-right");
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