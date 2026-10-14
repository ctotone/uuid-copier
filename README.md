## ☕ Support the Developer / Soutenir le développeur

### 🇬🇧 English
This Foundry VTT module is developed and shared for free.
If you enjoy using it and would like to support my work on Foundry VTT systems and modules, you can buy me a coffee!
Your support is entirely optional, but always appreciated. Thank you!

### 🇫🇷 Français
Ce module Foundry VTT est développé et partagé gratuitement.
Si vous appréciez son utilisation et souhaitez soutenir mon travail sur mes différents systèmes et modules Foundry VTT, vous pouvez m'offrir un café !
Votre soutien est entièrement facultatif, mais toujours très apprécié. Merci !

<p align="center">
  <a href="https://ko-fi.com/evilbram">
    <img src="https://storage.ko-fi.com/cdn/kofi5.png" alt="Support Evilbram on Ko-fi" height="45">
  </a>
</p>

# Evilbram UIID-Copier

Un module pour **Foundry VTT v14** qui ajoute une option **Copier UUID** dans les menus accessibles au clic droit.

L’UUID sélectionné est immédiatement copié dans le presse-papier, avec une notification de confirmation dans Foundry.

## Éléments compatibles

- Acteurs
- Objets
- Scènes
- Journaux
- Pages de journal
- Tables aléatoires
- Macros
- Playlists
- Musiques individuelles
- Paquets de cartes
- Murs
- Lumières
- Régions
- Tokens
- Sons ambiants de scène
- Tuiles
- Dessins
- Notes de scène

## Installation

Dans Foundry VTT :

1. Ouvrez **Modules complémentaires**.
2. Cliquez sur **Installer un module**.
3. Collez cette adresse dans le champ **URL du manifeste** :

```text
https://raw.githubusercontent.com/ctotone/uuid-copier/refs/heads/main/module.json
```

4. Installez le module, puis activez-le dans votre monde.

## Utilisation

Faites un clic droit sur un élément compatible, puis choisissez :

```text
Copier UUID
```

Exemples d’UUID copiés :

```text
Actor.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.Token.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.AmbientSound.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.Tile.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.Drawing.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.Note.xxxxxxxxxxxxxxxx
Playlist.xxxxxxxxxxxxxxxx.PlaylistSound.xxxxxxxxxxxxxxxx
JournalEntry.xxxxxxxxxxxxxxxx.JournalEntryPage.xxxxxxxxxxxxxxxx
```

## Compatibilité

- **Foundry VTT :** version 14
- **Systèmes de jeu :** module indépendant du système
- Testé notamment avec **Call of Cthulhu 7e édition**

## Liens

- [Dépôt GitHub](https://github.com/ctotone/uuid-copier)
- [Signaler un problème](https://github.com/ctotone/uuid-copier/issues)
- [Historique des versions](CHANGELOG.md)

## Licence

Distribué sous licence MIT.

**Version de développement actuelle : 1.1.0**
