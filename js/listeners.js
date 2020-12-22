document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all()
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
  }
})

document.addEventListener('submit', function(e) {
  let target = e.target; 
  if(target.matches('#newTodoList')) {
    e.preventDefault();
    let nameInput = target.querySelector('input[name="name"]');
    let formData = {
      name: nameInput.value
    };
    TodoList.create({todo_list: formData})
      .then(() => nameInput.value = "");
  } else if (target.matches('.editTodoListForm')) {
    e.preventDefault();
    let nameInput = target.querySelector('input[name="name"]');
    let formData = {
      name: nameInput.value
    };
    let list = TodoList.findById(target.dataset.todoListId);
    list.update({todo_list: formData});
  } else if (target.matches('#newTask')) {
    e.preventDefault();
    if(!Task.active_todo_list_id) {
      return new FlashMessage({type: 'error', message: 'Make sure to select a Todo List before creating a new task'})
    }
    let nameInput = target.querySelector('input[name="name"]');
    let formData = {
      name: nameInput.value,
      todo_list_id: Task.active_todo_list_id
    };
    Task.create(formData)
      .then(() => nameInput.value = "");
  }
})