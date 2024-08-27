// -------- Other Utils -----------------

function unow() {
  return Math.floor(Date.now() / 1000)
}

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
const RecordsK = 'history'

// ------ Models

function newAction(name, emoji, boost, desc) {
  return { name, emoji, boost, desc }
}

function newTask(id, name, actions, max, decrate, created) {
  return { id, name, actions, max, decrate, created, archived: false }
}

function newRecord(time, boost) {
  return [time, boost]
}

// ------ Domain Logic

function computeState(task, records) {
  task.created
  task.decrate
  return 10
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
var records = undefined


function getAllTasks() {
  return getItemDB(TasksK) ?? {}
}
function saveAllTasks(obj) {
  return setItemDB(TasksK, obj)
}

function getAllRecords() {
  return getItemDB(RecordsK) ?? {}
}
function saveAllRecords(obj) {
  return setItemDB(RecordsK, obj)
}


function saveTask(task) {
  tasks[task.id] = task
  return saveAllTasks(tasks)
}
function getRecordFor(taskid) {
  return records[taskid] ?? []
}
function saveRecordFor(taskid, time, boost) {
  let recs = getRecordFor(taskid)
  recs.push(newRecord(time, boost))
  records[taskid] = recs
  return saveAllRecords(records)
}

function initGlobalsIfNot() {
  tasks = getAllTasks()
  records = getAllRecords()
}

// ------ UI 

rivets.formatters['not'] = b => !b
rivets.formatters['task_settings_url'] = task => {
  let suburl = q`#new-task-link`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}
rivets.formatters['task_stats_url'] = task => {
  let suburl = q`#tast-stats-base`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}
rivets.binders['task-settings-remove-action-click'] = (el, index) => {
  el.onclick = () => {
    selectedTask.actions.splice(index, 1)
  }
}
rivets.binders['click-action-btn'] = (el, boost) => {
  el.onclick = () => {
    saveRecordFor(
      el.getAttribute('task-id'),
      unow(),
      parseInt(boost))
  }
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
  let actives = all
    .filter(t => !t.archived)
    .map(task => ({
      ...task,
      state: computeState(task, getRecordFor(task.id))
    }))
  let archives = all.filter(t => t.archived)

  rivets.bind(el, {
    active_tasks: actives,
    archived_tasks: archives
  })
})

up.compiler('#task-settings-page', el => {
  let qp = new URLSearchParams(window.location.search)
  let taskid = qp.get('task-id')
  selectedTask = taskid ? purify(tasks[taskid]) : newTask(uuid(), '', [], '', '', unow())
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

up.compiler('#task-settings-delete', el => {
  el.onclick = () => {
    delete tasks[selectedTask.id]
    saveAllTasks(tasks)
  }
})

up.compiler('#task-settings-add-action', el => {
  el.onclick = () => {
    selectedTask.actions.push(newAction('', '', '', ''))
  }
})

// TODO HTML validate
// TODO change color of bar according to the percent 
