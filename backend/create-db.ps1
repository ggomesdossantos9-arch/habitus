# Script to create the `habitus` database and a `habitus` user on local MySQL.
# Run this in an elevated PowerShell prompt. It will prompt for the MySQL root password.

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-Not (Test-Path $mysqlPath)) {
  Write-Error "mysql.exe not found at $mysqlPath. Update the path in this script and re-run."
  exit 1
}

$rootPass = Read-Host -AsSecureString "Enter MySQL root password"
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($rootPass)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

# SQL commands: creates database, creates user 'habitus'@'127.0.0.1' with password 'change-me'
$sql = @"
CREATE DATABASE IF NOT EXISTS `habitus` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'habitus'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'change-me';
GRANT ALL PRIVILEGES ON `habitus`.* TO 'habitus'@'127.0.0.1';
FLUSH PRIVILEGES;
"@

# Execute
& "$mysqlPath" -u root -p$plain -e $sql
$exit = $LASTEXITCODE
if ($exit -eq 0) { Write-Host "Database and user created (or already existed)." } else { Write-Error "mysql returned exit code $exit" }

# NOTE: If your MySQL requires the user to be 'habitus'@'localhost' replace 127.0.0.1 above with 'localhost'.
