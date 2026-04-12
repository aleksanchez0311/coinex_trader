@echo off
echo ========================================
echo CoinEx Trader - Setup Capacitor
echo ========================================
echo.

:: Configuración
set PROJECT_ROOT=%~dp0..
set WEB_DIR=%PROJECT_ROOT%\app\web

:: Verificar parámetros
set CLEAN_BUILD=false
if /i "%1"=="--clean" set CLEAN_BUILD=true
if /i "%1"=="--clean-build" set CLEAN_BUILD=true
if /i "%1"=="-cb" set CLEAN_BUILD=true

set INSTALL_APK=false
if /i "%2"=="--install" set INSTALL_APK=true
if /i "%2"=="-i" set INSTALL_APK=true

set SIGN_APK=true
if /i "%2"=="--no-sign" set SIGN_APK=false
if /i "%2"=="--unsigned" set SIGN_APK=false
if /i "%2"=="-ns" set SIGN_APK=false

:: Si se pasan parámetros, usar valores por defecto
if not "%1"=="" (
    set PROJECT_NAME=CoinEx Trader
    set PACKAGE_ID=cu.limitlesscode.coinextraderandroid
    goto :start_process
)

:: Pedir nombre de la app al usuario
echo ========================================
echo CONFIGURACIÓN DE LA APLICACIÓN
echo ========================================
echo.
echo Este será el nombre visible de tu app en el dispositivo
echo Ejemplo: CoinEx Trader, Mi App Trading, etc.
echo.
set /p PROJECT_NAME="Ingresa el nombre de la app: "

:: Validar que no esté vacío
if "%PROJECT_NAME%"=="" (
    echo ERROR: El nombre de la app no puede estar vacío
    pause
    exit /b 1
)

echo.
echo App configurada: %PROJECT_NAME%
echo.

:: Pedir nombre del paquete al usuario
echo ========================================
echo CONFIGURACIÓN DEL PAQUETE
echo ========================================
echo.
echo Formato recomendado: com.nombreempresa.nombreapp
echo Ejemplo: cu.limitlesscode.coinextrader
echo NOTA: No agregar .android (con punto) al final, pero android (sin punto) está bien
echo.
set /p PACKAGE_ID="Ingresa el nombre del paquete: "

:: Validar que no esté vacío
if "%PACKAGE_ID%"=="" (
    echo ERROR: El nombre del paquete no puede estar vacío
    pause
    exit /b 1
)

:: Validar formato del paquete (sin .android al final)
echo %PACKAGE_ID% | findstr /i "\.android$" >nul
if %errorlevel% equ 0 (
    echo ADVERTENCIA: El paquete no debe terminar en .android
    echo Removiendo .android del final...
    set PACKAGE_ID=%PACKAGE_ID:.android=%
)

echo.
echo Paquete configurado: %PACKAGE_ID%
echo.

:start_process
cd /d "%WEB_DIR%"

echo [1/7] Instalando dependencias de Capacitor...
call npm install @capacitor/cli@7.0.0 @capacitor/core@7.0.0 @capacitor/android@7.0.0 @capacitor/ios@7.0.0
call npm audit fix --force
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias de Capacitor
    pause
    exit /b 1
)

echo.
echo [2/7] Limpiando configuración previa de Capacitor...
if exist "capacitor.config.ts" (
    echo Eliminando capacitor.config.ts existente...
    del capacitor.config.ts
)
if exist "capacitor.config.json" (
    echo Eliminando capacitor.config.json existente...
    del capacitor.config.json
)

echo.
echo [3/7] Inicializando Capacitor...
call npx cap init "%PROJECT_NAME%" "%PACKAGE_ID%"
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: INICIALIZACIÓN DE CAPACITOR FALLIDA
    echo ========================================
    echo.
    echo Causas comunes:
    echo 1. Permisos de escritura en el directorio
    echo 2. Problemas con las dependencias de Node
    echo 3. Configuración de proyecto incompatible
    echo.
    echo Soluciones:
    echo - Ejecutar como administrador: Ejecutar como Administrador
    echo - Revisar instalación de Node: npm list -g @capacitor/cli
    echo - Limpiar manualmente: del capacitor.config.*
    echo.
    echo El script se detendrá aquí. Corrige los problemas
    echo y vuelve a ejecutarlo.
    echo ========================================
    pause
    exit /b 1
)

:: Configurar capacitor.config.json con versiones compatibles
echo.
echo [3.5/7] Configurando Capacitor con versiones compatibles...
call :configure_capacitor_config

echo.
echo [4/7] Creando build de la web...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: No se pudo crear el build de la web
    pause
    exit /b 1
)

echo.
echo [5/7] Verificando instalación de Capacitor Android...
echo Capacitor Android ya fue instalado en el paso [1/7]
echo Continuando con el siguiente paso...

echo.
echo [6/7] Agregando plataformas (Android e iOS)...

:: Verificar si ya existe la plataforma Android
if exist "android" (
    echo ADVERTENCIA: La plataforma Android ya existe
    echo Limpiando plataforma existente...
    rmdir /s /q android
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo eliminar la plataforma Android existente
        pause
        exit /b 1
    )
)

call npx cap add android
if %errorlevel% neq 0 (
    echo ERROR: No se pudo agregar la plataforma Android
    pause
    exit /b 1
)

:: Configurar versiones de Gradle compatibles
echo.
echo [6.5/7] Configurando versiones de Gradle compatibles...
call :configure_gradle_versions

:: Verificar si ya existe la plataforma IOs
::if exist "ios" (
::    echo ADVERTENCIA: La plataforma Ios ya existe
::    echo Limpiando plataforma existente...
::    rmdir /s /q ios
::    if %errorlevel% neq 0 (
::        echo ERROR: No se pudo eliminar la plataforma IOs existente
::        pause
::        exit /b 1
::    )
::)

::call npx cap add ios
::if %errorlevel% neq 0 (
::    echo ERROR: No se pudo agregar la plataforma IOs
::    pause
::    exit /b 1
::)

echo.
echo [7/7] Sincronizando archivos web con Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ADVERTENCIA: SINCRONIZACIÓN INCOMPLETA
    echo ========================================
    echo.
    echo Posibles causas:
    echo 1. El directorio dist no existe o está vacío
    echo 2. Problemas con permisos de archivos
    echo 3. Conflictos con archivos existentes
    echo.
    echo El script continuará, pero pueden haber problemas.
    echo ========================================
)

echo.
echo [8/8] Compilando APK desde Android...
cd android

:: Limpiar build si se solicita
if "%CLEAN_BUILD%"=="true" (
    echo Limpiando build anterior...
    call gradlew clean
)

call gradlew assembleRelease
cd ..

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: BUILD DE GRADLE FALLIDO
    echo ========================================
    echo.
    echo No se pudo generar el APK. Revisa:
    echo 1. Conexión a internet
    echo 2. Configuración de Android SDK
    echo 3. Dependencias en build.gradle
    echo.
    echo El script se detendrá aquí. Corrige los problemas
    echo y vuelve a ejecutar el script.
    echo.
    pause
    exit /b 1
)

:: Verificar que el APK se haya generado
if not exist "android\app\build\outputs\apk\release\app-release-unsigned.apk" (
    echo.
    echo ========================================
    echo ERROR: APK NO GENERADO
    echo ========================================
    echo.
    echo El build de Gradle falló o no generó el APK.
    echo Revisa la salida de Gradle arriba para más detalles.
    echo.
    echo Posibles soluciones comunes:
    echo 1. Revisa conexión a internet
    echo 2. Verifica Android SDK instalado
    echo 3. Limpia manualmente: cd android ^&^& gradlew clean
    echo 4. Reintenta: cd android ^&^& gradlew assembleRelease
    echo ========================================
    pause
    exit /b 1
)

echo.
echo [8/8] Firmando y optimizando APK...
:: Configuración de firma para Capacitor
set KEYSTORE_NAME=%PROJECT_NAME%-release.keystore
set ALIAS_NAME=%PROJECT_NAME%
set KEYSTORE_PASSWORD=uyK16cvG45.
set FINAL_APK_NAME=%PROJECT_NAME%-release-capacitor.apk
set UNSIGNED_APK_NAME=%PROJECT_NAME%-unsigned-capacitor.apk

if "%SIGN_APK%"=="true" (
    :: Verificar si existe keystore
    if not exist "%KEYSTORE_NAME%" (
        echo Creando keystore para %PROJECT_NAME%...
        keytool -genkey -v -keystore "%KEYSTORE_NAME%" -alias "%ALIAS_NAME%" -keyalg RSA -keysize 2048 -validity 10000 -storepass "%KEYSTORE_PASSWORD%" -keypass "%KEYSTORE_PASSWORD%" -dname "CN=%PROJECT_NAME%, OU=Trading, O=%PROJECT_NAME%, L=Unknown, S=Unknown, C=US"
        if %errorlevel% neq 0 (
            echo ERROR: No se pudo crear el keystore
            pause
            exit /b 1
        )
    ) else (
        echo Keystore encontrado: %KEYSTORE_NAME%
    )

    :: Firmar el APK
    echo Firmando APK...
    jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore "%KEYSTORE_NAME%" -storepass "%KEYSTORE_PASSWORD%" -keypass "%KEYSTORE_PASSWORD%" android\app\build\outputs\apk\release\app-release-unsigned.apk "%ALIAS_NAME%"
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo firmar el APK
        echo Copiando APK unsigned...
        copy android\app\build\outputs\apk\release\app-release-unsigned.apk "%PROJECT_ROOT%\%UNSIGNED_APK_NAME%" >nul
        set FINAL_APK_NAME=%UNSIGNED_APK_NAME%
        goto :end_process
    )

    :: Optimizar APK
    echo Optimizando APK...
    zipalign -v 4 android\app\build\outputs\apk\release\app-release-unsigned.apk "%PROJECT_ROOT%\%FINAL_APK_NAME%" >nul
    if %errorlevel% neq 0 (
        echo ADVERTENCIA: No se pudo optimizar, usando APK firmado sin optimizar
        copy android\app\build\outputs\apk\release\app-release-unsigned.apk "%PROJECT_ROOT%\%FINAL_APK_NAME%" >nul
    )
) else (
    echo [8/8] Omitiendo firma (parámetro --no-sign detectado)
    set FINAL_APK_NAME=%UNSIGNED_APK_NAME%
    copy android\app\build\outputs\apk\release\app-release-unsigned.apk "%PROJECT_ROOT%\%FINAL_APK_NAME%" >nul
)

:end_process
echo.
echo ========================================
echo ¡APK CREADO EXITOSAMENTE!
echo ========================================
echo.
echo App: %PROJECT_NAME%
echo Paquete: %PACKAGE_ID%
if "%SIGN_APK%"=="true" (
    echo APK Firmado: %PROJECT_ROOT%\%FINAL_APK_NAME%
) else (
    echo APK Unsigned: %PROJECT_ROOT%\%FINAL_APK_NAME%
)
echo.

:: Instalar APK si se solicitó
if "%INSTALL_APK%"=="true" (
    echo.
    echo Verificando dispositivo conectado...
    adb devices
    
    echo.
    echo Instalando APK...
    adb install -r "%PROJECT_ROOT%\%FINAL_APK_NAME%"
    if %errorlevel% equ 0 (
        echo APK instalado exitosamente
    ) else (
        echo ERROR: No se pudo instalar el APK
        echo Asegúrate de tener un dispositivo conectado con depuración USB habilitada
    )
)

echo.
echo Archivos importantes:
echo - app/web/android/ - Proyecto Android generado
echo - app/web/dist/ - Build de la web compilada
echo - app/web/capacitor.config.json - Configuración de Capacitor
echo - %PROJECT_ROOT%\%FINAL_APK_NAME% - APK final para instalar
echo.

pause

goto :eof

:remove_android_suffix
:: Remover .android del final del paquete
set "PACKAGE_ID=%PACKAGE_ID:.android=%"
goto :eof

:configure_capacitor_config
echo Configurando capacitor.config.json con versiones probadas...

:: Crear capacitor.config.json (Capacitor prefiere JSON sobre TS)
(
echo {
echo   "appId": "%PACKAGE_ID%",
echo   "appName": "%PROJECT_NAME%",
echo   "webDir": "dist",
echo   "server": {
echo     "androidScheme": "https"
echo   },
echo   "android": {
echo     "buildOptions": {
echo       "signingType": "jarsigner",
echo       "releaseType": "APK"
echo     }
echo   },
echo   "plugins": {
echo     "CapacitorHttp": {
echo       "enabled": true
echo     }
echo   }
echo }
) > capacitor.config.json

echo.
echo [CONFIGURACIÓN] Capacitor 8.0.0 configurado con:
echo - App ID: %PACKAGE_ID%
echo - App Name: %PROJECT_NAME%
echo - Web Directory: dist
echo - Android Scheme: https
echo - Signing Type: jarsigner
echo - Release Type: APK
echo - CapacitorHttp: enabled
goto :eof

:configure_capacitor_config
echo Configurando capacitor.config.json con versiones probadas...
(
echo {
echo   "appId": "%PACKAGE_ID%",
echo   "appName": "%PROJECT_NAME%",
echo   "webDir": "dist",
echo   "server": {
echo     "androidScheme": "https"
echo   },
echo   "plugins": {
echo     "CapacitorHttp": {
echo       "enabled": true
echo     }
echo   }
echo }
) > capacitor.config.json

echo [CONFIGURACIÓN] Capacitor configurado con éxito.
goto :eof

:configure_gradle_versions
echo Configurando versiones de Gradle compatibles...

:: Usamos un método más seguro para escribir las dependencias sin romper las comillas
set GRADLE_FILE=android\build.gradle

:: Crear un archivo temporal con las versiones correctas
(
echo buildscript {
echo     repositories {
echo         google^(^)
echo         mavenCentral^(^)
echo     }
echo     dependencies {
echo         classpath 'com.android.tools.build:gradle:8.4.0'
echo     }
echo }
echo.
echo allprojects {
echo     repositories {
echo         google^(^)
echo         mavenCentral^(^)
echo     }
echo }
echo.
echo task clean^(type: Delete^) {
echo     delete rootProject.buildDir
echo }
) > %GRADLE_FILE%

:: Actualizar Gradle Wrapper a 8.10.2
echo Actualizando Gradle Wrapper para soportar Java 17...
(
echo distributionBase=GRADLE_USER_HOME
echo distributionPath=wrapper/dists
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip
echo networkTimeout=10000
echo validateDistributionUrl=true
echo zipStoreBase=GRADLE_USER_HOME
echo zipStorePath=wrapper/dists
) > android\gradle\wrapper\gradle-wrapper.properties

echo [CONFIGURACIÓN] Gradle configurado con: AGP 8.4.0 y Wrapper 8.6
goto :eof
