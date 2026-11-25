@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\Ismael\AppData\Local\Android\Sdk"
set "GRADLE_BIN=C:\Users\Ismael\.gradle\wrapper\dists\gradle-8.5-bin\5t9huq95ubn472n8rpzujfbqh\gradle-8.5\bin\gradle.bat"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "C:\Users\Ismael\.gemini\antigravity\scratch\gym-app\android"
call "%GRADLE_BIN%" assembleDebug
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gradle build failed
    exit /b %ERRORLEVEL%
)

cd /d "C:\Users\Ismael\.gemini\antigravity\scratch\gym-app"
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "Forma.apk"
copy /y "Forma.apk" "public\Forma.apk"
copy /y "Forma.apk" "dist\Forma.apk"
copy /y "Forma.apk" "CasitaGym.apk"
copy /y "CasitaGym.apk" "public\CasitaGym.apk"
copy /y "CasitaGym.apk" "dist\CasitaGym.apk"
echo [SUCCESS] Forma.apk built and distributed successfully!
