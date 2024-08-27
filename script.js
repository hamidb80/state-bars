// -------- Other Utils -----------------

function toArray(arrayLike) {
  return Array.from(arrayLike)
}

function uuid() {
  return self.crypto.randomUUID()
}

function purify(obj) {
  return JSON.parse(JSON.stringify(obj))
}


// -------- DataBase Utils ---------------

// ------ Low Level APIs
function clearDB() {
  return window.localStorage.clear()
}

function missingItemDB(key) {
  return window.localStorage.getItem(key) === null
}
function existsItemDB(key) {
  return !missingItemDB(key)
}

function getItemDB(key) {
  return JSON.parse(window.localStorage.getItem(key))
}
function setItemDB(key, val) {
  return window.localStorage.setItem(key, JSON.stringify(val))
}

// ------ Keys 

const TasksK = 'tasks'
const HistoryK = 'history'

// ------ Models

function newAction(name, emoji, boost, desc) {
  return { name, emoji, boost, desc }
}

function newTask(id, name, actions, max, decrate) {
  return { id, name, actions, max, decrate, archived: false }
}

function newRecord(taskID, time, boost, desc) {
  return { taskID, time, boost, title, desc }
}

// ------  Actions 

function add(taskID, boost) {
}

// ------ DOM Utils

function q(sel) {
  return document.querySelector(sel)
}

function qa(sel) {
  return document.querySelectorAll(sel)
}

function setAttrs(el, attrsObj) {
  for (let key in attrsObj)
    el.setAttribute(key, attrsObj[key])
}


// ------- Setup ------------------------------

// ------ Globals 

var tasks = undefined
var selectedTask = undefined

function getTasks() {
  return getItemDB(TasksK) ?? {}
}

function saveTasks(tasksMap) {
  return setItemDB(TasksK, tasksMap)
}

function saveTask(task) {
  tasks[task.id] = task
  saveTasks(tasks)
}


function initGlobalsIfNot() {
  if (tasks === undefined)
    tasks = getTasks()
}

// ------ UI 

rivets.formatters['not'] = b => !b
rivets.formatters['task_url'] = task => {
  let suburl = q`#new-task-link`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}

up.macro('main', initGlobalsIfNot)

up.macro('[smooth-link]', link => {
  setAttrs(link, {
    'up-transition': 'cross-fade',
    'up-duration': '230',
    'up-follow': '',
  })
})

up.compiler('#app-page', el => {
  let all = Object.values(tasks)
  let actives = all.filter(t => !t.archived)
  let archives = all.filter(t => t.archived)
  rivets.bind(el, {
    active_tasks: actives,
    archived_tasks: archives
  })
})

up.compiler('#task-settings-page', el => {
  let qp = new URLSearchParams(window.location.search)
  let taskid = qp.get('task-id')
  selectedTask = taskid ? purify(tasks[taskid]) : newTask(uuid(), '', [], '', '')

  rivets.binders['task-settings-remove-action-click'] = (el, index) => {
    el.onclick = () => {
      selectedTask.actions.splice(index, 1)
    }
  }
  rivets.bind(el, { task: selectedTask })
})

up.compiler('#task-settings-archive', el => {
  el.onclick = () => {
    selectedTask.archived = true
    console.log(selectedTask)
  }
})

up.compiler('#task-settings-apply', el => {
  el.onclick = () => {
    saveTask(selectedTask)
    console.log('saved!') // TODO notif
  }
})

up.compiler('#task-settings-add-action', el => {
  el.onclick = () => {
    selectedTask.actions.push(newAction('', '', '', ''))
  }
})

// TODO HTML validate
