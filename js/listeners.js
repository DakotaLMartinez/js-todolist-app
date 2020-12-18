document.addEventListener('DOMContentLoaded', function(e) {
  TodoList.all();
})

document.addEventListener('click', function(e) {
  console.dir(e.target)
})

document.addEventListener('submit', function(e) {
  let target = e.target;
  if(target.matches('#newTodoList')) {
    e.preventDefault();
    let formData = {}
    target.querySelectorAll('input').forEach(function(input) {
      formData[input.name] = input.value;
    })
    TodoList.create(formData);
  }
})