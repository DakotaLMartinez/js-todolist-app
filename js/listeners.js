document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all();
  Modal.init();
})
document.addEventListener('click', function(e) {
  console.dir(e.target)
  let target = e.target; 
  if (target.matches('.editTodoList')) {
    let list = TodoList.findById(target.dataset.todoListId);
    list.edit();
  } else if (target.matches('.deleteTodoList')) {
    let list = TodoList.findById(target.dataset.todoListId);
    list.delete();
  } else if (target.matches('.selectTodoList')) {
    let list = TodoList.findById(target.dataset.todoListId);
    list.show();
  } else if (target.matches('.toggleComplete')) {
    let task = Task.findById(target.dataset.taskId);
    task.toggleComplete();
  } else if (target.matches('.editTask')) {
    let task = Task.findById(target.dataset.taskId);
    task.edit();
  } else if(e.target.matches('.modal-overlay') || e.target.matches('.modal-close')) {
    e.preventDefault();
    Modal.toggle();
  }
})

document.addEventListener('submit', function(e) {
  let target = e.target; 
  if(target.matches('#newTodoList')) {
    e.preventDefault();
    TodoList.create(target.serialize())
      .then(() => target.reset());
  } else if (target.matches('.editTodoListForm')) {
    e.preventDefault();
    let list = TodoList.findById(target.dataset.todoListId);
    list.update(target.serialize());
  } else if (target.matches('#newTask')) {
    e.preventDefault();
    if(!Task.active_todo_list_id) {
      return new FlashMessage({type: 'error', message: 'Make sure to select a Todo List before creating a new task'})
    }
    Task.create(target.serialize())
      .then(() => target.reset());
  } else if (target.matches('.editTaskForm')) {
    e.preventDefault();
    let task = Task.findById(target.dataset.taskId);
    task.update(target.serialize());
  } 
})

document.addEventListener('keydown', (e) => {
  e = e || window.event;
  let isEscape = false;
  if("key" in e) {
    isEscape = (e.key === "Escape" || e.key === "Esc")
  } else {
    isEscape = (e.keyCode === 27)
  }
  if(isEscape && document.body.classList.contains('modal-active')) {
    Modal.toggle();
  }
})