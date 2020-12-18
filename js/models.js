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
    this.nameLink.classList.add(..."py-4 col-span-10 sm:col-span-4 cursor-pointer".split(" "));
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