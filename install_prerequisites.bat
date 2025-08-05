@echo off
echo Installing required Python packages...

:: Remove existing virtual environment if it exists
if exist venv (
    echo Removing existing virtual environment...
    rmdir /s /q venv
)

:: Create a new virtual environment
echo Creating virtual environment...
python -m venv venv

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Upgrade pip first
echo Upgrading pip...
python -m pip install --upgrade pip

:: Install packages from requirements.txt
echo Installing packages from requirements.txt...
pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install packages from requirements.txt
    pause
    exit /b 1
)

echo.
echo Installation complete!
echo.
echo To run the application:
echo 1. Run run_app.bat
echo.
pause 