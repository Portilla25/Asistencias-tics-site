param(
    [string]$mode = "web",
    [string]$name = "",
    [string]$port = "5001"
)

$sfDir = "$env:TEMP\spiderfoot"

if ($mode -eq "web") {
    python "$sfDir\sf.py" -l "0.0.0.0:$port"
} elseif ($mode -eq "search" -and $name -ne "") {
    python "$sfDir\sf.py" -m search -s "$name" -o txt
} else {
    Write-Output "Modos:"
    Write-Output "  .\spiderfoot web              - Inicia interfaz web en http://localhost:5001"
    Write-Output "  .\spiderfoot search -nombre ""Tu Nombre"" - Busca nombre por consola"
}
