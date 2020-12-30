## Making a modal 

First step is to copy the modal html into our document:

```html
<!--Modal-->
<div class="modal opacity-0 pointer-events-none fixed w-full h-full top-0 left-0 flex items-center justify-center">
  <div class="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>
  
  <div class="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
    
    <div class="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50">
      <svg class="fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
        <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
      </svg>
      <span class="text-sm">(Esc)</span>
    </div>

    <!-- Add margin if you want to see some of the overlay behind the modal-->
    <div class="modal-content py-4 text-left px-6">
      <!--Title-->
      <div class="flex justify-between items-center pb-3">
        <p class="text-2xl font-bold">Simple Modal!</p>
        <div class="modal-close cursor-pointer z-50">
          <svg class="fill-current text-black" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
            <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
          </svg>
        </div>
      </div>

      <!--Body-->
      <p>Modal content can go here</p>
      <p>...</p>
      <p>...</p>
      <p>...</p>
      <p>...</p>

      <!--Footer-->
      <div class="flex justify-end pt-2">
        <button class="px-4 bg-transparent p-3 rounded-lg text-indigo-500 hover:bg-gray-100 hover:text-indigo-400 mr-2">Action</button>
        <button class="modal-close px-4 bg-indigo-500 p-3 rounded-lg text-white hover:bg-indigo-400">Close</button>
      </div>
      
    </div>
  </div>
</div>
```

We next want to make a class that manages the Modal
It should be able to populate the modal with a title and content. 
It should be able to manage toggling the modal (making it visible or hidden)

To accomplish these tasks, we'll need to create references to the containers in which 
the title and content will reside. 
To manage toggling: We'll also need references to the modal element and the body element.

First, we'll add an #id to the title paragraph in the modal, so we can target it with js.
```html
<p id="modal-title" class="text-2xl font-bold">Simple Modal!</p>
```
Next, we'll add an element to the modal where we can put the contents:
```html
<!--Body-->
<div id="modal-content">
  <p>Modal content can go here</p>
  <p>...</p>
  <p>...</p>
  <p>...</p>
  <p>...</p>
</div>
```
Now, let's create the class. Because we're only going to manage a single modal on the page, we'll use 
static methods to manage the behavior. (We don't need instances only one, so class methods are sufficient)

```js
class Modal {
  static init() {
    this.body ||= document.body;
    this.modal ||= document.querySelector('.modal');
  }
}
```
Now that we have references to the body and modal elements, we can add the toggle method which will display 
the modal when called.

```js
class Modal {
  static init() {
    this.body ||= document.body;
    this.modal ||= document.querySelector('.modal');
  }

  static toggle() {
    this.modal.classList.toggle('opacity-0');
    this.modal.classList.toggle('pointer-events-none');
    this.body.classList.toggle('modal-active');
  }
}
```

If we run `Modal.init()` and then `Modal.toggle()` in our browser console, we should see the modal appear.

In order to get this working with our own content, we'll need a method called `populate`. This method will 
accept an object as an argument with properties for title and content. Those property values will be 
inserted into the modal at the two elements we added ids to earlier. We can also store references to these 
within init(). 

```js
class Modal {
  static init() {
    this.body ||= document.body;
    this.modal ||= document.querySelector('.modal');
    this.title ||= document.querySelector('#modal-title');
    this.content ||= document.querySelector('#modal-content');
  }

  static populate({title, content}) {
    this.title.innerText = title;
    this.content.innerHTML = ""; 
    this.content.append(content);
  }

  static toggle() {
    this.modal.classList.toggle('opacity-0');
    this.modal.classList.toggle('pointer-events-none');
    this.body.classList.toggle('modal-active');
  }
}
```


To try this in the browser, we'd need to do the following:
```js
Modal.init() 
Modal.populate({title: "hello", content: "world"});
Modal.toggle();
```

This allows us to display the modal via our javascript and populate it with the contents of our choosing.

We want to trigger the modal to open upon clicking the task edit icon.

First, let's call `Modal.init()` when the page loads, so we're ready to populate and toggle the modal when it's time:

```js
document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all();
  Modal.init();
})
```

We also need to make sure that the edit task icon has a class we can use to target the click event. We also need
access to the task id that we're trying to edit, so we'll add that as a data attribute in `task.render()`

```js
this.editLink.innerHTML = `<i class="editTask p-4 fa fa-pencil-alt" data-task-id="${this.id}"></i>`;
```
Now, we'll capture that click event and hopefully land in the debugger with access to the task.
```js
else if(target.matches(".editTask")) {
  let task = Task.findById(target.dataset.taskId);
  debugger
  
}
```

It works properly, so we can add in the modal code:

```js
else if(target.matches(".editTask")) {
  let task = Task.findById(target.dataset.taskId);
  Modal.populate({title: "Edit Task", content: "Task edit form"})
  Modal.toggle()
  
}
```

So this will display the edit form in the modal. However at the moment we're just displaying a string not an actual form.
So, we'll need to create a method in the `Task` class that returns the form element we want to add inside of the modal.

We'll call this method, `edit()`

```js
/*
task.edit() => returns a form that will allow updating a task. 
*/
edit() {
  this.editForm ||= document.createElement('form');
  this.editForm.classList.set("taskEditForm mb-2");
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
```

After we've done that we can use this method to populate the modal when we click on the `.editTask` link

```js
else if(target.matches(".editTask")) {
  let task = Task.findById(target.dataset.taskId);
  Modal.populate({title: "Edit Task", content: task.edit()})
  Modal.toggle()
}
```

Now we should see the contents of the form filled in with the current values of the task object when we click on the edit icon.

Next, we need to hook up a submit event handler to actually update the task on the backend.

```js
else if(target.matches('.editTaskForm')) {
  e.preventDefault();
  let task = Task.findById(target.dataset.taskId);
  task.update(target.serialize())
}
```

This relies on a method called serialize which I added to the HTMLFormElement prototype, allowing us to pull out the form data in an object 
if we have access to an HTMLFormElement. I put this in `js/utilities.js`.

```js
HTMLFormElement.prototype.serialize = function() {
  return Array.from(this.elements).reduce((data, element) => {
    const isValidElement = element.name && element.value;
    const isValidValue = (!['checkbox', 'radio'].includes(element.type) || element.checked);
    const isCheckbox = element.type === 'checkbox';
    const isMultiSelect = element.options && element.multiple;
    const getSelectValues = element => Array.from(element.options).reduce((values, option) => {
      return option.selected ? values.concat(option.value) : values;
    }, []);
    
    if (isValidElement && isValidValue) {
      if(isCheckbox) {
        data[element.name] = (data[element.name] || []).concat(element.value);
      } else if (isMultiSelect) {
        data[element.name] = getSelectValues(element);
      } else {
        data[element.name] = element.value;
      }
    }

    return data;
  }, {}) 
}
```

To get this to work, we need to actually have a `task.update(formData)` method.

## task.update(formData)

This method should accept form data and return a fetch request (promise) to update the backend with the data from the form. Upon a successful response, we should update the client side instance of task and call render on it so that its list item is updated. We should then toggle the modal so that it is no longer visible. If we get an error, we also want to toggle the modal and display the error in a flash message.

```js
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
  return fetch(`http://localhost:3000/tasks/${this.id}`, {
    method: "PUT",
    headers: {
      "Accept": "application/json", 
      "Content-Type": "application/json"
    },
    body: JSON.stringify({task: formData})
  })
    .then(res => {
      if(res.ok) {
        return res.json() // returns a promise for body content parsed as JSON
      } else {
        return res.text().then(error => Promise.reject(error)) // return a reject promise so we skip the following then
      }
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

```

This works to update a task, but the modal hangs in the browser, in order to hide it whether or not we get a successful update request, 
we can chain a promise callback onto the update call in our event handler. 

```js
else if(target.matches('.editTaskForm')) {
  e.preventDefault();
  let task = Task.findById(target.dataset.taskId);
  task.update(target.serialize())
    .then(() => Modal.toggle())
}
```

Finally, we want to get the modal close functionality working as well. To do this, we'll need to add another conditional to our click event handler:

```js
else if(target.matches(".modal-close") || target.matches(".modal-overlay")) {
  e.preventDefault();
  Modal.toggle();
} 
```

Add the `.modal-close` to the html tags inside of the modal-close elements. This is necessary because of how we're attaching event listeners
using the event delegation pattern. Adding the class to all of the elements that will possibly be clicked will ensure we're able to close 
the modal.
```html
<div class="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50">
  <svg class="modal-close fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
    <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
  </svg>
  <span class="modal-close text-sm">(Esc)</span>
</div>
```

```html
<div class="flex justify-between items-center pb-3">
  <p id="modal-title" class="text-2xl font-bold">Edit Task</p>
  <div class="modal-close cursor-pointer z-50">
    <svg class="modal-close fill-current text-black" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
    </svg>
  </div>
</div>
```

Finally, we need to add the keydown event listener so that the escape key will also dismiss the modal:

```js
document.addEventListener('keydown', function(evt) {
  evt = evt || window.event
  var isEscape = false
  if ("key" in evt) {
    isEscape = (evt.key === "Escape" || evt.key === "Esc")
  } else {
    isEscape = (evt.keyCode === 27)
  }
  if (isEscape && document.body.classList.contains('modal-active')) {
    Modal.toggle()
  }
});
```