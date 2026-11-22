# Web de la defensa del TFG

Web estática de una sola página: `index.html`, `styles.css` y `app.js`. No necesita instalar nada ni compilar.

## Ver en local con VS Code
1. Abre esta carpeta en VS Code (Archivo → Abrir carpeta).
2. Instala la extensión **Live Server** y pulsa «Go Live» abajo a la derecha.
   También vale abrir `index.html` directamente en el navegador.

## Publicar en Vercel

### Opción A: con GitHub (recomendada)
1. Crea un repositorio en GitHub y sube esta carpeta:
   ```
   git init
   git add .
   git commit -m "Web de la defensa del TFG"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/tfg-web.git
   git push -u origin main
   ```
2. En vercel.com → Add New → Project → importa el repositorio.
3. Framework Preset: **Other**. Sin comando de build. Output directory: la raíz.
4. Deploy. Cada `git push` vuelve a publicar la web.

### Opción B: desde la terminal de VS Code
```
npm i -g vercel
vercel        # primera vez: inicia sesión y acepta los valores por defecto
vercel --prod # publica en la URL definitiva
```

## Antes de compartir el enlace
Busca `pend` en `index.html`: son los datos marcados como PENDIENTE (resaltados en amarillo en la web).
