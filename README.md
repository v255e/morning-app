# утро

сайт: погода, одежда, привычки, тренировки, сон, музыка и данные браслета WHOOP.

структура:
- public/index.html: сам сайт
- netlify/functions/: вход через WHOOP, колбэк и отдача данных
- netlify/lib/whoop.mjs: общий код функций
- netlify.toml, package.json: настройки Netlify

переменные окружения в Netlify (Site configuration → Environment variables):
- SITE_PASSWORD: длинный пароль, который знаешь только ты
- WHOOP_CLIENT_ID и WHOOP_CLIENT_SECRET: из https://developer-dashboard.whoop.com/

redirect URI в приложении WHOOP: https://ТВОЙ-САЙТ.netlify.app/api/whoop-callback
