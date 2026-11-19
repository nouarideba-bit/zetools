#!/bin/sh
# Assemble la maquette en un seul fichier autonome : dist/zetools-maquette.html
cd "$(dirname "$0")" && node -e '
const fs=require("fs");
let h=fs.readFileSync("index.html","utf8");
h=h.replace("<link rel=\"stylesheet\" href=\"style.css\">",()=>"<style>\n"+fs.readFileSync("style.css","utf8")+"\n</style>");
for (const f of ["logique.js","donnees.js","juridique.js","qr.js","pdf.js","app.js"]) h=h.replace(`<script src="${f}"></script>`,()=>"<script>\n"+fs.readFileSync(f,"utf8")+"\n</script>");
fs.mkdirSync("dist",{recursive:true}); fs.writeFileSync("dist/zetools-maquette.html",h); console.log("dist/zetools-maquette.html assemblé");'
