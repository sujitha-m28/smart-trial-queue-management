@echo off
title Smart Trial Room Queue - Backend (Spring Boot)
echo ======================================================================
echo    Starting Smart Trial Room Queue Management System - Backend
echo ======================================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "PATH=C:\Users\sujim\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin;%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0backend"
mvn spring-boot:run
pause
