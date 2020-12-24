General approach to OO Design:

```js
class MyClass {
  // decide what attributes to store/methods to call when creating a new instance
  constructor(attributes) {

  }
  // DOM node where we're storing the elements representing instances
  static container() {

  }
  /*
  method to:
  fetch data from backend
  create and store instances from response
  render them as dom nodes
  and append them to the container
  */
  static all() {

  } 
  /*
  method to:
  send fetch request to create new instance
  if response is ok, parse it as json
  use the json data to build and store a new instance of the class client side
  call render on the instance to create the DOM node that will represent it
  append the rendered instance (this.element) to the container.
  if the respose is not ok (validation error from backend) 
  parse the resopnse as text 
  take the text return a rejected promise for it
  catch the rejected promise's error message and append it to the DOM somewhere (this is what we used FlashMessage for)
  */
  static create() {

  }

  /*
  method creates the element only on first call, otherwise updates the existing element
  create the DOM node we'll use to represent this instance in the page. 
  Add all of its attributes and children and return it (doesn't insert to the DOM!!!)
  render itself creates or refreshes the DOM node representing this instance in the HTML document.
  Build the DOM elements in such a way that you'll be able to keep a reference to things that are 
  going to change later so when we call render again, they'll be updated.
  */
  render() {
    this.element ||= document.createElement('div');
    // more cool stuff goes down here
  }

}
```

Making a mockup of what you want the project to look like is a good first step

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo List</title>
  <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" integrity="sha512-+4zCK9k+qNFUR5X+cKL9EIR+ZOhtIloNl9GIKS57V1MyNsYpYcUrUeQc9vNfzsWfV28IaLL3i96P9sdNyeRssA==" crossorigin="anonymous" />
</head>
<body>
  <div class="container mx-auto sm:grid grid-cols-3 gap-4 my-4">
    <section id="todoListsContainer" class="px-4 bg-blue-100 sm:min-h-screen rounded-md shadow">
      <h1 class="text-2xl semibold border-b-4 border-blue">Todo Lists</h1>
      <form id="newTodoList" class="clearfix mt-4">
        <input type="text" class="block float-left w-10/12 p-3" placeholder="New List" />
        <button type="submit" class="block float-left w-2/12"><i class="fa fa-plus p-4 z--1 bg-green-400"></i></button>
      </form>
      <ul id="lists" class="list-none">
        <li class="my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6">
          <a href="#" class="py-4 col-span-10 sm:col-span-4">My List</a>
          <a href="#" class="my-4 text-right"><i class="fa fa-pencil-alt"></i></a>
          <a href="#" class="my-4 text-right"><i class="fa fa-trash-alt"></i></a>
        </li>
        <li class="my-2 px-4 bg-green-200 grid grid-cols-12 sm:grid-cols-6">
          <a href="#" class="py-4 col-span-10 sm:col-span-4">My Next List</a>
          <a href="#" class="my-4 text-right"><i class="fa fa-pencil-alt"></i></a>
          <a href="#" class="my-4 text-right"><i class="fa fa-trash-alt"></i></a>
        </li>
      </ul>
    </section>
    <section id="tasksContainer" class="px-4 bg-blue-100 sm:min-h-screen col-span-2 rounded-md shadow">
      <h1 class="text-2xl semibold border-b-4 border-blue">Tasks</h1>
      <form id="newTask" class="clearfix mt-4">
        <input type="text" class="block float-left w-11/12 p-3" placeholder="New Task" />
        <button type="submit" class="block float-left w-1/12 px-4"><i class="fa fa-plus p-4 z--1 bg-green-400"></i></button>
      </form>
      <ul id="tasks" class="list-none">
        <li class="my-2 px-4 bg-green-200 grid grid-cols-12">
          <a href="#" class="py-4 col-span-10">My First Task</a>
          <a href="#" class="my-4 text-right"><i class="fa fa-pencil-alt"></i></a>
          <a href="#" class="my-4 text-right"><i class="fa fa-trash-alt"></i></a>
        </li>
      </ul>
    </section>
  </div>
  <script src="js/models.js"></script>
  <script src="js/listeners.js"></script>
</body>
</html>
```

## New Task Submit

## What event do we need to handle?
submit event on `#newTaskForm`
## What is the target element of that event?
`form#newTaskForm`
## What information do we need access to when the event happens? 
the name of the task and the todo_list_id to which it will belong.
## How and where do we ensure access to said information when the event occurs?
We're storing the `active_todo_list_id` as a property of the Task class. It is set when a user clicks on
a todolist from the left hand column.
The name of the task will be the value of the `input[type="name"]` inside of `form#newTaskForm`
## Which model method(s) are we invoking when this event happens?
Task.create(formData)
## If we need to invoke an instance method, how do we access the appropriate instance?
N/A
## Inside the model method, If we're sending a fetch request, how should our client side data change in response?
We create the task via fetch to `/tasks` and with the response, add a task to this.collection[this.activeTodoListId]

## If something goes wrong on the server side, how do we handle the error client side?
Display a flash error message with the returned error.
## Once the client side data has changed in response, how is the DOM affected? Are we inserting, removing or updating existing nodes?
We insert a new rendered task li into the Task.container()
## If inserting, where are we doing so? If removing, how do we identify the node(s) to be removed? If updating, how do we find the appropriate node and how do we update its contents when we do?
The task goes at the end of the Task.container()

## What event do we need to handle?
clicking on the circle by a task to toggle completeness.
## What is the target element of that event?
the .completeLink a tag associated with a Task instance's element.
## What information do we need access to when the event happens? 
we need access to the id of the task that we're updating and whether it is currently marked as complete.
## How and where do we ensure access to said information when the event occurs?
we'll add data attributes for both the id and a status attribute storing either complete or incomplete.
## Which model method(s) are we invoking when this event happens?
task.toggleComplete() => update the task status via fetch request and update the DOM in response.
task.completeIconClass() => returns 'fa-check-circle' if the task is complete, 'fa-circle' if not.
## If we need to invoke an instance method, how do we access the appropriate instance?
we find the instance via the data-task-id attribute attached to the completeLink event target.
## Inside the model method, If we're sending a fetch request, how should our client side data change in response?
we'll update the client side copy of the task and then update the completeLink
## If something goes wrong on the server side, how do we handle the error client side?
We'll create a flash message with the error message and display it.
## Once the client side data has changed in response, how is the DOM affected? Are we inserting, removing or updating existing nodes?
we update the completeLink by calling `render()` on the task.
## If inserting, where are we doing so? If removing, how do we identify the node(s) to be removed? If updating, how do we find the appropriate node and how do we update its contents when we do?
we find the node by invoking element on the task object related to the click. Calling render on it will make sure the check is updated.

After writing a bunch of code like this:

```js
this.actionButton.classList.add(..."px-4 bg-transparent p-3 rounded-lg text-indigo-500 hover:bg-gray-100 hover:text-indigo-400 mr-2".split(" "));
```
When building up javascript elements with lots of classes from html, I finally wised up and made a change:

```js
DOMTokenList.prototype.set = function(classString) {
  this.add(...classString.split(" "));
}
// now I can do this:
this.actionButton.classList.set("px-4 bg-transparent p-3 rounded-lg text-indigo-500 hover:bg-gray-100 hover:text-indigo-400 mr-2")
```

