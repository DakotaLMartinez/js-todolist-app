document.addEventListener('DOMContentLoaded', function(e) {
  Auth.init();
  Modal.init();
})

document.addEventListener('click', function(e) {
  let target = e.target;

  if (target.matches('.loginLink')) {
    e.preventDefault();
    Modal.populate({title: "", content: Auth.loginForm()})
    Modal.toggle();
  } else if (target.matches('.logoutLink')) {
    e.preventDefault();
    Auth.logout();
  } else if(target.matches(".selectTodoList")) {
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
  } else if (target.matches('.multi-submit[type="submit"]')) {
    e.preventDefault();
    let form = target.closest('form');
    if(form.matches('.authForm')) {
      if(target.value === "Login") {
        Auth.login(form.serialize());
      } else if(target.value === "Signup") {
        Auth.signup(form.serialize());
      }
    }
  } else if(target.matches(".modal-close") || target.matches(".modal-overlay")) {
    e.preventDefault();
    Modal.toggle();
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
});

document.addEventListener('keydown', function(evt) {
  evt = evt || window.event;
  let isEscape = false;
  if ("key" in evt) {
    isEscape = (evt.key === "Escape" || evt.key === "Esc");
  } else {
    isEscape = (evt.keyCode === 27);
  }
  if (isEscape && document.body.classList.contains('modal-active')) {
    Modal.toggle();
  }
});