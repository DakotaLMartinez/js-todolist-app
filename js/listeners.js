document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all();
})

document.addEventListener('click', function(e) {
  let target = e.target;

  if(target.matches(".selectTodoList")) {
    let todoList = TodoList.findById(target.dataset.todoListId);
    todoList.show();
  } else if(target.matches(".deleteTodoList")) {
    if(confirm("Are you sure you want to delete this todo list?")) {
      let todoList = TodoList.findById(target.dataset.todoListId);
      todoList.delete();
    }
  } else if(target.matches(".toggleComplete")) {
    let task = Task.findById(target.dataset.taskId);
    task.toggleComplete();
  } else if(target.matches(".deleteTask")) {
    if(confirm("Are you sure you want to delete this task?")) {
      let task = Task.findById(target.dataset.taskId);
      task.delete();
    }
  }
})

document.addEventListener('submit', function(e) {
  let target = e.target;
  if(target.matches('#newTodoList')) {
    e.preventDefault();
    let formData = {}
    target.querySelectorAll('input').forEach(function(input) {
      formData[input.name] = input.value;
    })
    TodoList.create(formData)
      .then(() => {
        target.querySelectorAll('input').forEach(function(input) {
          input.value = "";
        })
      });
  } else if(target.matches('#newTaskForm')) {
    e.preventDefault();
    let formData = {};
    target.querySelectorAll('input').forEach(function(input) {
      formData[input.name] = input.value;
    });
    Task.create(formData)
      .then(() => {
        target.querySelectorAll('input').forEach(function(input) {
          input.value = "";
        })
      });
  }
})