// -------- Other Utils -----------------

function toArray(arrayLike) {
  return Array.from(arrayLike)
}

function uuid() {
  return self.crypto.randomUUID()
}

function reJSON(obj) {
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
  return { id, name, actions, max, decrate }
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
  return getItemDB(TasksK) ?? []
}

function initGlobalsIfNot() {
  if (tasks === undefined)
    tasks = getTasks()

  if (selectedTask === undefined)
    selectedTask = {
      actions: [
        {
          name: "wow"
        }
      ]
    }

}

// ------ UI 

up.macro('main', initGlobalsIfNot)

up.macro('[smooth-link]', link => {
  setAttrs(link, {
    'up-transition': 'cross-fade',
    'up-duration': '230',
    'up-follow': '',
  })
})

up.compiler('#app-page', el => {
  rivets.bind(el, { tasks })
})

up.compiler('#task-settings-page', el => {
  rivets.bind(el, { task: selectedTask })
})

up.compiler('#task-settings-apply', el => {
  el.onclick = () => {
    console.log(reJSON(selectedTask))
  }
})

up.compiler('#task-settings-add-action', el => {
  el.onclick = () => {

  }
})
