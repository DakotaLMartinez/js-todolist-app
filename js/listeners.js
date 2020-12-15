document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all()
})
document.addEventListener('click', function(e) {
  console.dir(e.target)
})

document.addEventListener('submit', function(e) {
  let target = e.target; 
  if(target.matches('#newTodoList')) {
    e.preventDefault();
    let nameInput = target.querySelector('input[name="name"]')
    let formData = {
      name: nameInput.value
    };
    TodoList.create({todo_list: formData})
      .then(() => nameInput.value = "");
  }
})