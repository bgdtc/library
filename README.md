# Ma Bibliothèque

Application web moderne pour gérer votre bibliothèque personnelle de livres. Scannez vos livres, organisez-les et suivez vos lectures avec une interface élégante style Apple.

## Fonctionnalités

- 📚 **Création de bibliothèque** : Créez une nouvelle bibliothèque et ajoutez vos livres
- 📷 **Scan de livres** : Scannez les codes-barres ISBN avec votre webcam ou caméra mobile
- ⌨️ **Saisie manuelle** : Entrez l'ISBN manuellement si le scan n'est pas disponible
- 🖼️ **Couvertures automatiques** : Récupération automatique des couvertures et métadonnées via Open Library API
- 👁️ **Suivi de lecture** : Marquez les livres comme lus/non lus
- 👥 **Lecteurs** : Enregistrez qui a lu chaque livre
- 💾 **Sauvegarde** : Exportez votre bibliothèque en fichier JSON
- ☁️ **Import** : Importez depuis un fichier JSON local ou depuis Amazon S3
- 🎨 **Interface moderne** : Design élégant inspiré d'Apple avec Material UI

## Technologies

- React 18 + TypeScript
- Vite
- Material UI (MUI)
- React Router
- html5-qrcode pour le scan de codes-barres
- Open Library API pour les métadonnées de livres
- AWS SDK pour l'import depuis S3

## Installation

1. Installez les dépendances :
```bash
npm install
```

2. Lancez le serveur de développement :
```bash
npm run dev
```

3. Ouvrez votre navigateur à l'adresse indiquée (généralement http://localhost:5173)

## Utilisation

### Créer une bibliothèque

1. Cliquez sur "Créer une bibliothèque"
2. Utilisez le scanner pour scanner les codes-barres ISBN de vos livres
3. Ou entrez l'ISBN manuellement
4. Les informations du livre sont récupérées automatiquement
5. Cliquez sur "Terminer et sauvegarder" pour finaliser

### Importer une bibliothèque

1. Cliquez sur "Importer une bibliothèque"
2. Choisissez d'importer depuis :
   - Un fichier JSON local
   - Amazon S3 (nécessite les credentials AWS)

### Gérer votre bibliothèque

- Cliquez sur un livre pour voir ses détails
- Marquez les livres comme lus/non lus
- Ajoutez qui a lu chaque livre
- Utilisez la barre de recherche pour trouver des livres
- Filtrez par statut (lu/non lu)
- Sauvegardez votre bibliothèque en JSON

## Format JSON

Le format de la bibliothèque est le suivant :

```json
{
  "id": "library-1234567890",
  "name": "Ma Bibliothèque",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "books": [
    {
      "isbn": "9782070368228",
      "title": "Le Petit Prince",
      "authors": ["Antoine de Saint-Exupéry"],
      "coverUrl": "https://...",
      "publishedYear": 1943,
      "read": false,
      "readBy": [],
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Build pour production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## Licence

MIT

