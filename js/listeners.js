document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all();
})

document.addEventListener('click', function(e) {
  let target = e.target;

  if(target.matches(".selectTodoList")) {
    let todoList = TodoList.findById(target.dataset.todoListId)
    todoList.show()
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