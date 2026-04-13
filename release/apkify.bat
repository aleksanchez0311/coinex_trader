@echo off
setlocal enabledelayedexpansion
echo ========================================
echo CoinEx Trader - Setup Capacitor (Java 22)
echo ========================================
echo.

:: Configuración de rutas
set PROJECT_ROOT=%~dp0..
set WEB_DIR=%PROJECT_ROOT%\app\web
set ANDROID_SDK_PATH=%ANDROID_HOME%
if "%ANDROID_SDK_PATH%"=="" set ANDROID_SDK_PATH=%ANDROID_SDK_ROOT%
if "%ANDROID_SDK_PATH%"=="" set ANDROID_SDK_PATH=C:\Users\aleks\Documents\WorkSpaces\sdk\android-sdk

set JAVA_HOME_PATH=%JAVA_HOME%
if "%JAVA_HOME_PATH%"=="" set JAVA_HOME_PATH=C:\Program Files\Eclipse Adoptium\jdk-22.0.1.8-hotspot

:: Parámetro default
if /i "%1"=="--default" (
    set PROJECT_NAME=CoinEx Trader
    set PACKAGE_ID=cu.limitlesscode.coinextraderandroid
    goto :start_process
)

:: Parámetro --sign-only
if /i "%1"=="--sign-only" (
    set PROJECT_NAME=CoinEx Trader
    set PACKAGE_ID=cu.limitlesscode.coinextraderandroid
    set SIGN_ONLY=true
    goto :sign_only_process
)

set /p PROJECT_NAME="Nombre de la app: "
set /p PACKAGE_ID="ID del paquete: "

:start_process
cd /d "%WEB_DIR%"

echo [1/8] Instalando Capacitor 7...
call npm install @capacitor/cli@7.0.0 @capacitor/core@7.0.0 @capacitor/android@7.0.0
call npm audit fix

echo [2/8] Configurando SDK...
call npx cap config set android.sdkPath "%ANDROID_SDK_PATH%"

echo [3/8] Inicializando Capacitor...
if exist "capacitor.config.*" del /q capacitor.config.*
call npx cap init "%PROJECT_NAME%" "%PACKAGE_ID%" --web-dir dist
call :configure_capacitor_config

echo [4/8] Compilando Web...
call npm run build

echo [5/8] Agregando Plataforma Android...
if exist "android" rmdir /s /q android
call npx cap add android

echo [6/8] Configurando Gradle...
call :configure_gradle_final

echo [7/8] Sincronizando...
call npx cap sync android

echo [7.5/8] Agregando permiso de CAMERA al manifest...
powershell -Command "$manifest='android\app\src\main\AndroidManifest.xml'; $content=Get-Content $manifest -Raw; if($content -notmatch 'CAMERA'){ $content=$content -replace '<uses-permission android:name=.android.permission.INTERNET. />', '<uses-permission android:name=.android.permission.INTERNET. />`n    <uses-permission android:name=.android.permission.CAMERA. />'; Set-Content $manifest $content }"

echo [8/8] Compilando APK...
cd android
:: call gradlew clean
:: Forzamos descarga
call gradlew assembleRelease --no-daemon
cd ..

:: --- FIRMA ---
set RELEASE_DIR=%~dp0
set FINAL_APK_NAME=%PROJECT_NAME%-release.apk
set RAW_APK=android\app\build\outputs\apk\release\app-release-unsigned.apk

if not exist "%RAW_APK%" (
    echo.
    echo ERROR: El APK no se pudo generar.
    pause & exit /b 1
)

:: Copiar APK a release\
echo Copiando APK a carpeta release...
copy "%RAW_APK%" "%RELEASE_DIR%%PROJECT_NAME%-unsigned.apk"
echo APK copiado como: %RELEASE_DIR%%PROJECT_NAME%-unsigned.apk

:: Usar rutas absolutas del Android SDK
set BUILD_TOOLS_PATH=%ANDROID_SDK_PATH%\build-tools\35.0.0
set ZIPALIGN=%BUILD_TOOLS_PATH%\zipalign.exe
set APSIGNER=%BUILD_TOOLS_PATH%\apksigner.bat

echo Firmando APK con herramientas del SDK...
echo ZIPALIGN: %ZIPALIGN%
echo APSIGNER: %APSIGNER%

cd "%RELEASE_DIR%"
%ZIPALIGN% -f -v 4 "%RELEASE_DIR%%PROJECT_NAME%-unsigned.apk" "%PROJECT_NAME%-aligned.apk"
set KEYSTORE_NAME=%PROJECT_NAME%-release.keystore
if not exist "%KEYSTORE_NAME%" (
    keytool -genkey -v -keystore "%KEYSTORE_NAME%" -alias releaseKey -keyalg RSA -keysize 2048 -validity 10000 -storepass uyK16cvG45. -keypass uyK16cvG45. -dname "CN=%PROJECT_NAME%, O=Trading, C=US"
)
%APSIGNER% sign --ks "%KEYSTORE_NAME%" --ks-pass pass:uyK16cvG45. --out "%PROJECT_NAME%-release.apk" "%PROJECT_NAME%-aligned.apk"
if exist "%PROJECT_NAME%-aligned.apk" del "%PROJECT_NAME%-aligned.apk"
if exist "%PROJECT_NAME%-unsigned.apk" del "%PROJECT_NAME%-unsigned.apk"

:: Copiar APK firmado a la raíz
copy "%PROJECT_NAME%-release.apk" "%PROJECT_ROOT%\%PROJECT_NAME%-release.apk"

echo.
echo ========================================
echo PROCESO FINALIZADO CON EXITO
echo APK: %RELEASE_DIR%%PROJECT_NAME%-release.apk
echo APK: %PROJECT_ROOT%\%PROJECT_NAME%-release.apk
echo ========================================
echo.
echo ========================================
echo      INSTALAR VIA ADB
echo ========================================
echo Para instalar, ejecuta:
echo   adb install -r "%PROJECT_ROOT%\%PROJECT_NAME%-release.apk"
echo.
pause
exit /b 0

:sign_only_process
echo ========================================
echo CoinEx Trader - Firmar APK Existente
echo ========================================
echo.

:: Configurar rutas
set RELEASE_DIR=%~dp0
set FINAL_APK_NAME=%PROJECT_NAME%-release.apk
set RAW_APK=%RELEASE_DIR%%PROJECT_NAME%-unsigned.apk

if not exist "%RAW_APK%" (
    echo.
    echo ERROR: No se encuentra el APK unsigned en: %RAW_APK%
    echo Asegúrate de ejecutar primero --default para generar el APK.
    pause & exit /b 1
)

:: Usar rutas absolutas del Android SDK
set BUILD_TOOLS_PATH=%ANDROID_SDK_PATH%\build-tools\35.0.0
set ZIPALIGN=%BUILD_TOOLS_PATH%\zipalign.exe
set APSIGNER=%BUILD_TOOLS_PATH%\apksigner.bat

echo Firmando APK existente: %RAW_APK%
echo ZIPALIGN: %ZIPALIGN%
echo APSIGNER: %APSIGNER%

cd "%RELEASE_DIR%"
%ZIPALIGN% -f -v 4 "%RAW_APK%" "%PROJECT_NAME%-aligned.apk"
set KEYSTORE_NAME=%PROJECT_NAME%-release.keystore
if not exist "%KEYSTORE_NAME%" (
    keytool -genkey -v -keystore "%KEYSTORE_NAME%" -alias releaseKey -keyalg RSA -keysize 2048 -validity 10000 -storepass uyK16cvG45. -keypass uyK16cvG45. -dname "CN=%PROJECT_NAME%, O=Trading, C=US"
)
%APSIGNER% sign --ks "%KEYSTORE_NAME%" --ks-pass pass:uyK16cvG45. --out "%PROJECT_NAME%-release.apk" "%PROJECT_NAME%-aligned.apk"
if exist "%PROJECT_NAME%-aligned.apk" del "%PROJECT_NAME%-aligned.apk"

:: Copiar APK firmado a la raíz
copy "%PROJECT_NAME%-release.apk" "%PROJECT_ROOT%\%PROJECT_NAME%-release.apk"

echo.
echo ========================================
echo APK FIRMADO CON EXITO
echo ========================================
echo APK firmado: %RELEASE_DIR%%PROJECT_NAME%-release.apk
echo APK firmado: %PROJECT_ROOT%\%PROJECT_NAME%-release.apk
echo Archivos auxiliares permanecen en: %RELEASE_DIR%
echo.
echo ========================================
echo      INSTALAR VIA ADB
echo ========================================
echo Para instalar, ejecuta:
echo   adb install -r "%PROJECT_ROOT%\%PROJECT_NAME%-release.apk"
echo.
pause
exit /b 0

:: --- FUNCIONES CORREGIDAS ---

:configure_capacitor_config
(
echo {
echo   "appId": "%PACKAGE_ID%",
echo   "appName": "%PROJECT_NAME%",
echo   "webDir": "dist",
echo   "server": { "androidScheme": "https" }
echo }
) > capacitor.config.json
goto :eof

:configure_gradle_final
:: 1. Wrapper
(
echo distributionBase=GRADLE_USER_HOME
echo distributionPath=wrapper/dists
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-all.zip
echo networkTimeout=60000
echo validateDistributionUrl=true
echo zipStoreBase=GRADLE_USER_HOME
echo zipStorePath=wrapper/dists
) > android\gradle\wrapper\gradle-wrapper.properties

:: 2. Build.gradle Raiz (VERSION 8.5.2 para mayor compatibilidad)
(
echo buildscript {
echo     repositories {
echo         google^(^)
echo         mavenCentral^(^)
echo     }
echo     dependencies {
echo         classpath 'com.android.tools.build:gradle:8.5.2'
echo     }
echo }
echo.
echo ext {
echo     compileSdkVersion = 35
echo     minSdkVersion = 24
echo     targetSdkVersion = 35
echo     androidxAppCompatVersion = '1.6.1'
echo     androidxCoordinatorLayoutVersion = '1.2.0'
echo     coreSplashScreenVersion = '1.0.1'
echo     junitVersion = '4.13.2'
echo     androidxJunitVersion = '1.1.5'
echo     androidxEspressoCoreVersion = '3.5.1'
echo }
echo.
echo allprojects {
echo     repositories {
echo         google^(^)
echo         mavenCentral^(^)
echo     }
echo }
echo task clean^(type: Delete^) {
echo     delete rootProject.buildDir
echo }
) > android\build.gradle

:: 3. gradle.properties con configuración Java 22
(
echo # Project-wide Gradle settings.
echo.
echo # IDE ^(e.g. Android Studio^) users:
echo # Gradle settings configured through the IDE *will override*
echo # any settings specified in this file.
echo.
echo # Specifies the JVM arguments used for the daemon process.
echo org.gradle.jvmargs=-Xmx1536m
echo.
echo # AndroidX package structure
echo android.useAndroidX=true
echo.
echo # Java version compatibility
echo org.gradle.java.home=%JAVA_HOME_PATH:\=\\%
echo.
echo # Gradle configuration
echo android.defaults.buildfeatures.buildconfig=true
echo android.nonTransitiveRClass=true
echo android.nonFinalResIds=true
) > android\gradle.properties

:: 4. Java 22 en la App
powershell -Command "$path='android\app\build.gradle'; (Get-Content $path) -replace 'JavaVersion.VERSION_17', 'JavaVersion.VERSION_22' | Set-Content $path"
goto :eof
