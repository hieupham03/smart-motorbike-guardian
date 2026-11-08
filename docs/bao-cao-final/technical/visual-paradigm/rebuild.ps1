$ErrorActionPreference='Stop'
$taskRepo=(Resolve-Path (Join-Path $PSScriptRoot '../../../../')).Path
$taskVpRoot='D:/Visual Paradigm CE 18.0'
$taskJavac='C:/Program Files/Java/jdk-24/bin/javac.exe'
if(Get-Process 'Visual Paradigm' -ErrorAction SilentlyContinue){throw 'Close Visual Paradigm after saving your work before rebuilding this generated project.'}
Push-Location $taskRepo
try {
    python -X utf8 "$PSScriptRoot/builder/schema_snapshot.py"
    if($LASTEXITCODE -ne 0){throw 'Schema extraction failed.'}
    & $taskJavac --release 8 -encoding UTF-8 -classpath "$taskVpRoot/lib/*" -d "$PSScriptRoot/builder/classes" "$PSScriptRoot/builder/GuardianDiagramBuilder.java"
    if($LASTEXITCODE -ne 0){throw 'Java compilation failed.'}
    Push-Location "$taskVpRoot/bin"
    try {
        & "$taskVpRoot/jre/bin/java.exe" '-Djava.awt.headless=true' '-Dfile.encoding=UTF-8' "-Djava.library.path=$taskVpRoot/lib" -classpath ".;$taskVpRoot/lib/*;$taskVpRoot/ormlib/*;$PSScriptRoot/builder/classes" GuardianDiagramBuilder
        if($LASTEXITCODE -ne 0){throw 'Visual Paradigm export failed.'}
    } finally {Pop-Location}
} finally {Pop-Location}
