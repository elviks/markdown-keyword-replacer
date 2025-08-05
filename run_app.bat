@echo off
echo Starting the Markdown Processor Flask application...

echo Checking for virtual environment...
if not exist venv\Scripts\activate.bat (
    echo Virtual environment not found or incomplete.
    echo Please run install_prerequisites.bat first to set up the environment.
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Failed to activate virtual environment. 
    echo Please ensure install_prerequisites.bat ran successfully.
    pause
    exit /b 1
)

echo Attempting to open the application in your default browser...
start "" "http://127.0.0.1:5000/"

echo Running the Flask application (app.py)...
echo You can close this window to stop the server.
python app.py

echo Flask application has been stopped.
pause 