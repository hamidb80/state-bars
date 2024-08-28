# based on Nim v2.0.0, no libs, just standard library

import std/[
  strutils, nre,
  parsecfg,
  os, 
  times
]


template mkdir(p): untyped = 
  createDir p
  
template cpdir(a, b): untyped = 
  copyDir a, b
  
template mvdir(a, b): untyped = 
  moveDir a, b
  
template str(a): untyped = 
  $a
  
template `|`(c, p): untyped =
  let t = p.split '/'
  config.getSectionValue(t[0], t[1])


proc cliExec(cmd: string) = 
  echo cmd
  discard execShellCmd cmd

const help = """
available commands:
  + build
  + deploy
"""

when isMainModule:
  let 
    config      = loadConfig "./config.ini"
    baseurl     = config|"site/base-url"
    builddir    = config|"site/build-dir"
    scriptsdir  = config|"site/scripts-dir"
    pagesdir    = config|"templates/pages-dir"
    partialsdir = config|"templates/partials-dir"
    
    timestamp   = str toUnix toTime now()
    distDir     = timestamp & "-dist/"
    finalDistDir     = builddir / distDir
    finalScriptDirUrl = baseurl & distDir

  proc resolveHtml(content: string): string =
    proc wtf(s: string): string = 
      readfile builddir / s[2..^3]

    content
      .replace(re"@/",      baseUrl)
      .replace(re"#/",      finalScriptDirUrl)
      .replace(re"{{[a-zA-Z0-9-.]+}}", wtf)

  proc resolveHtmls(dir: string) = 
    for fpath in walkDirRec dir:
      if fpath.endsWith ".html":
        writefile fpath, resolveHtml readfile fpath

  if paramCount() == 1:
    case paramStr 1
    of "build":
      mkdir              builddir
      cpdir partialsdir, builddir
      cpdir scriptsdir,  finalDistDir
      resolveHtmls       builddir
      cpdir pagesdir,    builddir
      resolveHtmls       builddir

    of "deploy":
      cliExec "git checkout pages"
      mvdir    builddir,  "./"
      cliExec "git add ."
      cliExec "git commit -m 'up'"
      cliExec "git push"
      cliExec "git checkout main"

    else:
      echo "invalid command, ", help
      quit 1
  else:
    echo help
