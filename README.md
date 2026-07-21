# Evilbram UIID-Copier

**Evilbram UIID-Copier** est un module pour **Foundry Virtual Tabletop v14** permettant de copier rapidement l’UUID de nombreux éléments Foundry grâce à une option **Copier UUID** ajoutée à leurs menus contextuels.

Le module ne modifie pas le core de Foundry. Il utilise uniquement les Hooks et API prévus par Foundry VTT.

## Fonctionnalités

Le module permet actuellement de copier l’UUID des éléments suivants :

### Documents des panneaux latéraux

- Scènes
- Acteurs
- Objets
- Journaux
- Tables aléatoires
- Macros
- Playlists
- Paquets de cartes, lorsque le type est disponible

### Éléments intégrés

- Murs
- Lumières ambiantes
- Régions
- Musiques individuelles contenues dans une playlist
- Pages internes d’un journal

Après la copie, Foundry affiche une notification sous cette forme :

```text
UUID copié : Scene.xxxxxxxxxxxxxxxx
```

## Installation automatique

Dans l’écran de configuration de Foundry VTT :

1. Ouvrez l’onglet **Modules complémentaires**.
2. Cliquez sur **Installer un module**.
3. Collez l’adresse suivante dans le champ **URL du manifeste** :

```text
https://raw.githubusercontent.com/ctotone/uuid-copier/refs/heads/main/module.json
```

4. Cliquez sur **Installer**.
5. Lancez votre monde et activez **Evilbram UIID-Copier** dans la gestion des modules.

## Installation manuelle

1. Téléchargez `uuid-copier.zip` depuis la dernière release GitHub.
2. Extrayez son contenu dans le dossier :

```text
Data/modules/uuid-copier/
```

3. Vérifiez que l’arborescence obtenue est :

```text
uuid-copier/
├─ module.json
├─ README.md
└─ scripts/
   └─ main.js
```

4. Redémarrez Foundry VTT.
5. Activez le module dans votre monde.

## Utilisation

Faites un clic droit sur un élément compatible, puis sélectionnez :

```text
Copier UUID
```

L’UUID est immédiatement copié dans le presse-papier.

Exemples :

```text
Actor.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.Wall.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.AmbientLight.xxxxxxxxxxxxxxxx
Scene.xxxxxxxxxxxxxxxx.Region.xxxxxxxxxxxxxxxx
Playlist.xxxxxxxxxxxxxxxx.PlaylistSound.xxxxxxxxxxxxxxxx
JournalEntry.xxxxxxxxxxxxxxxx.JournalEntryPage.xxxxxxxxxxxxxxxx
```

## Compatibilité

- Version minimale : Foundry VTT 14
- Version vérifiée : Foundry VTT 14
- Système de jeu : indépendant du système, dans la mesure où celui-ci conserve les menus et Documents standards de Foundry

Le module a notamment été testé dans un monde utilisant le système Call of Cthulhu 7e édition.

## Limites actuelles

Le module ne prend pas encore en charge :

- les tokens ;
- les sons ambiants placés sur une scène ;
- les tuiles ;
- les dessins ;
- les notes de scène ;
- les raccourcis clavier ;
- les UUID des packs de compendium eux-mêmes.

La copie des entrées de compendium n’est pas un objectif prioritaire du module.

## Dépannage

Si la copie échoue :

1. Ouvrez la console avec `F12`.
2. Recherchez les messages commençant par :

```text
[Evilbram UIID-Copier]
```

Le module affiche un warning propre lorsqu’aucun UUID exploitable ne peut être récupéré.

## Dépôt

Le code source et les releases sont disponibles sur GitHub :

```text
https://github.com/ctotone/uuid-copier
```

## Version

Version actuelle : **1.0.0**
