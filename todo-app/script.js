const taskInput = document.getElementById("taskInput");
const dueDate = document.getElementById("dueDate");
const taskList = document.getElementById("taskList");
const darkModeToggle = document.getElementById("darkModeToggle");
const searchBar = document.getElementById("searchBar");
const navItems = document.querySelectorAll("#task-nav li");

let tasks = [];
let currentFilter = "all";
let draggedIndex;

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem("tasks");
  if (saved) {
    tasks = JSON.parse(saved);
    // Restore Date objects
    tasks.forEach(t => {
      t.createdAt = new Date(t.createdAt);
      if (t.completedAt) t.completedAt = new Date(t.completedAt);
    });
    renderTasks();
  }
}

function addTask() {
  const taskText = taskInput.value.trim();
  const date = dueDate.value;

  if (!taskText) return;

  const task = {
    text: taskText,
    date,
    completed: false,
    createdAt: new Date(),
    completedAt: null
  };

  tasks.push(task);
  saveTasks();
  renderTasks();
  taskInput.value = "";
  dueDate.value = "";
  filterTasks(currentFilter);  // reapply filter
}

function getTimeDiff(start, end) {
  const diff = new Date(end) - new Date(start);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  return `${hours > 0 ? hours + "h " : ""}${remainingMins}m`;
}

function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks;

  if (currentFilter === "completed") {
    filteredTasks = tasks.filter(t => t.completed);
  } else if (currentFilter === "active") {
    filteredTasks = tasks.filter(t => !t.completed);
  }

  const searchText = searchBar.value.trim().toLowerCase();
  if (searchText) {
    filteredTasks = filteredTasks.filter(t =>
      t.text.toLowerCase().includes(searchText)
    );
  }

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", true);
    li.addEventListener("dragstart", e => drag(e, index));

    // Overdue highlighting
    const now = new Date();
    const due = new Date(task.date);
    const diff = due - now;

    li.classList.toggle("completed", task.completed);
    li.classList.toggle("overdue", !task.completed && diff < 0);

    // Task text & date
    const taskText = document.createElement("span");
    taskText.textContent = task.text;
    if (task.completed) taskText.style.textDecoration = "line-through";

    const meta = document.createElement("div");
    meta.className = "task-meta";

    if (task.date) {
      const dueSpan = document.createElement("span");
      dueSpan.textContent = "Due: " + task.date;
      meta.appendChild(dueSpan);
    }

    // Countdown
    const countdown = document.createElement("span");
    countdown.className = "countdown";

    if (!task.completed && task.date) {
      if (diff < 0) {
        countdown.textContent = "Overdue!";
      } else {
        countdown.textContent = "Due in " + getTimeDiff(now, due);
      }
    } else if (task.completed) {
      countdown.textContent = "Completed in " + getTimeDiff(task.createdAt, task.completedAt);
    }

    meta.appendChild(countdown);

    // Buttons container
    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "5px";

    // Complete/Incomplete toggle button
    const completeBtn = document.createElement("button");
    completeBtn.textContent = task.completed ? "↩️" : "✅";
    completeBtn.title = task.completed ? "Mark incomplete" : "Mark complete";
    completeBtn.onclick = () => toggleComplete(index);
    btnContainer.appendChild(completeBtn);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "Edit task";
    editBtn.onclick = () => editTask(index);
    btnContainer.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.title = "Delete task";
    deleteBtn.onclick = () => deleteTask(index);
    btnContainer.appendChild(deleteBtn);

    li.appendChild(taskText);
    li.appendChild(meta);
    li.appendChild(btnContainer);
    taskList.appendChild(li);
  });
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  if (tasks[index].completed) {
    tasks[index].completedAt = new Date();
  } else {
    tasks[index].completedAt = null;
  }
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
}

function clearAll() {
  if (confirm("Clear ALL tasks?")) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
}

function filterTasks(filterType) {
  currentFilter = filterType;

  // Update nav highlight
  navItems.forEach(li => li.classList.remove("active-filter"));
  const target = [...navItems].find(li => li.textContent.toLowerCase().includes(filterType));
  if (target) target.classList.add("active-filter");

  renderTasks();
}

function searchTasks() {
  renderTasks();
}

// Drag & drop handlers
function drag(event, index) {
  draggedIndex = index;
}

function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  const targetLi = event.target.closest("li");
  if (!targetLi) return;
  const nodes = [...taskList.children];
  const targetIndex = nodes.indexOf(targetLi);
  if (targetIndex === -1 || draggedIndex === undefined) return;

  // Rearrange tasks array
  const draggedTask = tasks.splice(draggedIndex, 1)[0];
  tasks.splice(targetIndex, 0, draggedTask);

  saveTasks();
  renderTasks();
}

function editTask(index) {
  const newText = prompt("Edit task:", tasks[index].text);
  if (newText !== null) {
    tasks[index].text = newText.trim() || tasks[index].text; // keep old if empty
    saveTasks();
    renderTasks();
  }
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  }
}

loadTasks();
loadDarkMode();
renderTasks();
