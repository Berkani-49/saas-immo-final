// Script pour minifier le JSON Firebase et l'ajouter au .env

const fs = require('fs');
const path = require('path');

// Lire le fichier JSON Firebase que vous avez téléchargé
// REMPLACEZ 'firebase-service-account.json' par le nom de votre fichier
const firebaseJsonPath = path.join(__dirname, 'firebase-service-account.json');

if (!fs.existsSync(firebaseJsonPath)) {
  console.error('❌ Fichier firebase-service-account.json non trouvé !');
  console.log('');
  console.log('📝 Instructions :');
  console.log('1. Téléchargez le fichier JSON depuis Firebase');
  console.log('2. Renommez-le en "firebase-service-account.json"');
  console.log('3. Placez-le dans le dossier saas-immo/');
  console.log('4. Relancez ce script : node minify-firebase-json.js');
  process.exit(1);
}

// Lire et minifier le JSON
const firebaseJson = fs.readFileSync(firebaseJsonPath, 'utf8');
const minified = JSON.stringify(JSON.parse(firebaseJson));

// Échapper les caractères spéciaux pour le .env
const escaped = minified.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

// Créer la ligne à ajouter au .env
const envLine = `FIREBASE_SERVICE_ACCOUNT='${minified}'`;

console.log('✅ JSON minifié avec succès !');
console.log('');
console.log('📋 Copiez cette ligne et ajoutez-la à votre fichier .env :');
console.log('');
console.log(envLine);
console.log('');
console.log('📝 Note : Assurez-vous de bien utiliser des guillemets simples \'...\'');
