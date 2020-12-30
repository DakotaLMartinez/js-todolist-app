document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all();
  Modal.init();
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
  } else if(target.matches(".editTask")) {
    let task = Task.findById(target.dataset.taskId);
    Modal.populate({title: "Edit Task", content: task.edit()})
    Modal.toggle()
    
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
    TodoList.create(target.serialize())
      .then(() => {
        target.reset();
        target.querySelector('input[name="name"]').blur();
      });
  } else if(target.matches('#newTaskForm')) {
    e.preventDefault();
    Task.create(target.serialize())
      .then(() => target.reset());
  } else if(target.matches('.editTaskForm')) {
    e.preventDefault();
    let task = Task.findById(target.dataset.taskId);
    task.update(target.serialize())
      .then(() => Modal.toggle())
  }
})