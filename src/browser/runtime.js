// -------- Other Utils -----------------

function p2(smth) {
  return String(smth).padStart(2, '0')
}

function unixToFormattedDate(unixTimestamp) {
  let oo = new Date(unixTimestamp * 1000) // Convert to milliseconds
  let yyyy = oo.getFullYear()
  let mm = p2(oo.getMonth() + 1)
  let dd = p2(oo.getDate())
  return `${yyyy}-${mm}-${dd}`
}

function unixToFormattedTime(unixTimestamp) {
  let oo = new Date(unixTimestamp * 1000) // Convert to milliseconds
  let hh = p2(oo.getHours())
  let tt = p2(oo.getMinutes())
  let ss = p2(oo.getSeconds())
  return `${hh}:${tt}:${ss}`
}

function unixNow() {
  return Math.floor(Date.now() / 1000)
}

function sec2hour(secs) {
  return secs / (60 * 60)
}

function toArray(arrayLike) {
  return Array.from(arrayLike)
}

function obj2array(obj) {
  return Object.values(obj)
}

function uuid() {
  return self.crypto.randomUUID()
}

function purify(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function shallowCopy(smth) {
  if (Array.isArray(smth)) return [...smth]
  if (typeof smth === "object") return { ...smth }
  else return smth
}

function filterchop(arr, pred) {
  var does = []
  var donts = []

  for (let item of arr) {
    if (pred(item)) does.push(item)
    else donts.push(item)
  }
  return [does, donts]
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

function getAllItemsDB() {
  let result = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    let key = window.localStorage.key(i)
    let valueStr = window.localStorage.getItem(key)
    result[key] = JSON.parse(valueStr)
  }
  return result
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
  records.push(newRecord(unixNow(), 0))

  var timecurr = task.created
  var boostlevel = 0

  for (let [rtime, boost] of records) {
    let decay = task.decrate * sec2hour(rtime - timecurr)
    boostlevel = Math.min(task.max, Math.max(0, boostlevel - decay) + boost)
    timecurr = rtime
  }

  return boostlevel
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

function newElement(tag, attrs = {}) {
  let el = document.createElement(tag)
  setAttrs(el, attrs)
  return el
}

function downloadFile(name, mime, content) {
  let a = newElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}


// ------- Setup ------------------------------

// ------ Globals 

var tasks = undefined
var selectedTask = undefined
var records = undefined
var selectedRecords = undefined


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
function getRecordsFor(taskid) {
  return records[taskid] ?? []
}
function saveRecordsFor(taskid, recs) {
  records[taskid] = recs
  return saveAllRecords(records)
}
function addSaveRecordFor(taskid, time, boost) {
  let recs = getRecordsFor(taskid)
  recs.push(newRecord(time, boost))
  records[taskid] = recs
  return saveAllRecords(records)
}

function initGlobalsIfNot() {
  tasks = getAllTasks()
  records = getAllRecords()
}

// ------ Helpers ?

function taskidFromUrl() {
  return new URLSearchParams(window.location.search).get('task-id')
}

function taskElemId(task) {
  return "task-" + task.id
}

// ------ UI 

function setProgressBar(taskid) {
  let task = tasks[taskid]
  let pbar = q(`#${taskElemId(task)} .progress-bar`)
  let percent = 100 * computeState(task, shallowCopy(getRecordsFor(task.id))) / task.max
  pbar.style.width = percent + '%'
}

rivets.formatters['not'] = b => !b
rivets.formatters['task_element_id'] = taskElemId
rivets.formatters['task_settings_url'] = task => {
  let suburl = q`#new-task-link`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}
rivets.formatters['task_stats_url'] = task => {
  let suburl = q`#test-stats-base`.getAttribute('href')
  return suburl + '?task-id=' + task.id
}
rivets.formatters['reversed'] = arr => arr.slice().reverse()

rivets.formatters['unixtime_to_formatted_date'] = ut => unixToFormattedDate(parseInt(ut))
rivets.formatters['unixtime_to_formatted_time'] = ut => unixToFormattedTime(parseInt(ut))

rivets.binders['task-settings-remove-action-click'] = (el, index) => {
  el.onclick = () => {
    selectedTask.actions.splice(index, 1)
  }
}
rivets.binders['task-stats-remove-record-click'] = (el, index) => {
  el.onclick = () => {
    selectedRecords.splice(index, 1)
  }
}

rivets.binders['click-action-btn'] = (el, boost) => {
  let taskid = el.getAttribute('task-id')

  el.onclick = () => {
    addSaveRecordFor(taskid, unixNow(), parseInt(boost))
    setProgressBar(taskid)
  }
  setTimeout(() => setProgressBar(taskid), 0)
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
  let [archived_tasks, active_tasks] = filterchop(obj2array(tasks), t => t.archived)
  rivets.bind(el, { active_tasks, archived_tasks })
})

up.compiler('#task-stats-page', el => {
  let task = tasks[taskidFromUrl()]
  selectedRecords = getRecordsFor(task.id)
  rivets.bind(el, { records: selectedRecords, task })
})

up.compiler('#task-settings-page', el => {
  let taskid = taskidFromUrl()
  selectedTask = taskid ? purify(tasks[taskid]) : newTask(uuid(), '', [], '', '', unixNow())
  rivets.bind(el, { task: selectedTask })
})

up.compiler('#task-settings-archive', el => {
  el.onclick = () => {
    selectedTask.archived = true
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

up.compiler('#tasks-stats-apply-btn', el => {
  el.onclick = () => {
    saveRecordsFor(taskidFromUrl(), selectedRecords)
  }
})

up.compiler('#export-db-btn', el => {
  el.onclick = () => {
    downloadFile(
      'life-is-like-a-game.json',
      'application/json',
      JSON.stringify(getAllItemsDB()))
  }
})

up.compiler('#import-db-btn', el => {
  el.onclick = () => {
    let target = newElement('input', { type: "file", accept: ".json" })
    target.onchange = e => {
      let file = e.target.files[0]
      let reader = new FileReader()
      reader.onload = evt => {
        let json = JSON.parse(evt.target.result)
        for (let key in json)
          setItemDB(key, json[key])
      }
      reader.readAsText(file)
    }
    target.click()
  }
})

up.compiler('#clear-db-btn', el => {
  el.onclick = () => {
    if (confirm("Are you sure?")) {
      clearDB()
    }
  }
})

// TODO HTML validate
// TODO change color of bar according to the percent
// TODO add toast/notif on error/success
