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

Resources:

[Tabnine AI code completion](https://marketplace.visualstudio.com/items?itemName=TabNine.tabnine-vscode)

Spread operator 

let arr1 = [1,2,3];
let arr2 = [4,5,6];
[...arr1, ...arr2]
