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
    return fetch(`http://localhost:3000/todo_lists/${this.id}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })
      .then(res => {
        if(res.ok) {
          return res.json()
        } else {
          return res.text().then(errors => Promise.reject(errors))
        }
      })
      .then(({todo_list, tasks}) => {
        Task.loadFromList(tasks, todo_list.id)
        this.toggleActive();
      })
      .catch(error => {
        new FlashMessage({type: 'error', message: error});
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
    return fetch(`http://localhost:3000/todo_lists/${this.id}`, {
      method: 'PUT',
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
        //update this object with the json response
        Object.keys(json).forEach((key) => this[key] = json[key])
        // remove the form
        this.form.remove();
        // add the nameLink edit and delete links in again.
        this.render();
        new FlashMessage({type: 'success', message: 'TodoList updated successfully'})
        return todoList;
      })
      .catch(error => {
        new FlashMessage({type: 'error', message: error});
      })
  }

  delete() {
    let proceed = confirm("Are you sure you want to delete this list?");
    if(proceed) {
      return fetch(`http://localhost:3000/todo_lists/${this.id}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })
        .then(res => {
          if(res.ok) {
            return res.json()
          } else {
            return res.text().then(errors => Promise.reject(errors))
          }
        })
        .then(json => {
          //update this object with the json response
          let index = TodoList.collection.findIndex(list => list.id == json.id);
          TodoList.collection.splice(index, 1);
          this.element.remove();
        })
        .catch(error => {
          new FlashMessage({type: 'error', message: error});
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
    return fetch('http://localhost:3000/tasks', {
      method: 'POST', 
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({task: formData})
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          return res.text().then(errors => Promise.reject(errors));
        }
      })
      .then(taskAttributes => {
        let task = new Task(taskAttributes);
        this.collection[this.active_todo_list_id].push(task);
        let rendered = task.render();
        this.container().appendChild(rendered);
        return task;
      })
      .catch(err => new FlashMessage({type: 'error', message: err}) )
  }

  /*
  task.toggleComplete() will make a fetch request and update the complete attribute of the task 
  it will then update the client side copy and call render on it to update the icon.
  */
  toggleComplete() {
    return fetch(`http://localhost:3000/tasks/${this.id}`, {
      method: 'PUT',
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({task: {completed: !this.completed }})
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          return res.text().then(errors => Promise.reject(errors));
        }
      })
      .then(taskAttributes => {
        Object.keys(taskAttributes).forEach(attr => this[attr] = taskAttributes[attr]);
        this.render();
      })
      .catch(err => {
        new FlashMessage({type: 'error', message: err.message});
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

    // this.completedLabel ||= document.createElement('label');
    // this.completedLabel.setAttribute('for', 'completed');
    // this.icon = document.createElement('i');
    // this.icon.classList.set(`far text-3xl p-4 ${this.completeIconClass()}`)
    // this.completedLabel.append(this.icon);

    // this.completeCheckbox ||= document.createElement('input');
    // this.completeCheckbox.type = "checkbox";
    // this.completeCheckbox.id = 'completed';
    // this.completeCheckbox.checked = this.completed;
    // this.completeCheckbox.classList.set('hidden');

    // this.completedLabel.append(this.completeCheckbox);
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
    this.notesLabel.append(this.notesInput);

    this.saveTaskButton ||= document.createElement('button');
    this.saveTaskButton.classList.set('w-full bg-green-400 my-4 py-3 uppercase font-bold hover:bg-green-500 transition duration-500');
    this.saveTaskButton.type = "submit";
    this.saveTaskButton.textContent = "Save Task";


    this.editForm.append(this.nameLabel, this.notesLabel, this.saveTaskButton);

    return this.editForm;
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
    this.nameSpan.classList.set("py-4 col-span-9");
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
  } 
}

class Modal {

  static init() {
    this.element = document.querySelector(".modal")
    this.title = document.querySelector("#modal-title");
    this.content = document.querySelector("#modal-content");
  }

  static populate({title, content}) {
    Modal.title.innerText = title;
    Modal.content.innerHTML = '';
    Modal.content.append(content);
  }

  static toggle() {
    document.body.classList.toggle('modal-active');
    this.element.classList.toggle('opacity-0');
    this.element.classList.toggle('pointer-events-none');
  }

}