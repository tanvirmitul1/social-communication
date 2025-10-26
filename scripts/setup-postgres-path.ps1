# PowerShell script to add PostgreSQL bin directory to system PATH on Windows 11
# Adjust the path below to your PostgreSQL installation directory

$pgBinPath = "C:\Program Files\PostgreSQL\18\bin"

# Get current system PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)

if ($currentPath -notlike "*$pgBinPath*") {
    $newPath = "$currentPath;$pgBinPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
    Write-Output "PostgreSQL bin path added to system PATH. Please restart your terminal."
} else {
    Write-Output "PostgreSQL bin path already in system PATH."
}