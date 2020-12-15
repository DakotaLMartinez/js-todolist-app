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

  }
})