<h1 align="center">
  <img src="../../assets/app-icon.png" alt="Thoughtline app icon" width="96" height="96" valign="middle" /> 晾念头 · Thoughtline
</h1>

<p align="center">
  <a href="https://github.com/NocodeMrLi/thoughtline/stargazers"><img src="badges/stars.svg" alt="GitHub stars: 0" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases"><img src="badges/downloads.svg" alt="Release asset downloads: 3" /></a>
  <a href="#license"><img src="badges/license.svg" alt="License: UNLICENSED" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2"><img src="badges/preview.svg" alt="Preview: 0.0.17-preview.2" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/issues"><img src="badges/feedback.svg" alt="Feedback on GitHub" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2"><img src="badges/platforms.svg" alt="Platforms: macOS and Windows" /></a>
</p>

<p align="center">
  <sub><a href="../../README.md">中文</a> · <a href="../../docs/readme/README.en.md">English</a> · <a href="../../docs/readme/README.ja.md">日本語</a> · <a href="../../docs/readme/README.ko.md">한국어</a> · <a href="../../docs/readme/README.es.md">Español</a> · <a href="../../docs/readme/README.fr.md">Français</a> · <a href="../../docs/readme/README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>Accrochez une idée. Gardez l’inspiration à portée de main.</strong><br />
  Une corde, quelques pinces et des feuilles pour les idées du quotidien.
</p>

<h2 align="center"><a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2"><ins>Télécharger Thoughtline</ins></a></h2>

<p align="center"><sub>macOS Apple Silicon · Windows x64 · 0.0.17-preview.2</sub></p>

Thoughtline est un outil léger pour macOS et Windows. Retrouvez vos idées au bord supérieur de l’écran, notez une pensée, puis reprenez votre activité.

## Fonctionnalités

- Saisissez titre, texte et catégorie avec un raccourci ; conservez les notes inachevées comme brouillons.
- Une corde de bureau avec pinces et papier ; les nouvelles idées sont classées dans Général.
- Déplacez une pince entière ou détachez une feuille ; fusionnez les pinces compatibles et annulez l’organisation.
- Modifiez dans la vue détaillée ou le calendrier, avec sauvegarde après une courte pause et changement de page immédiat.
- Parcourez jours, mois et années ; recherchez et filtrez aussi les idées archivées.
- Restaurez les notes récemment supprimées. Supprimer un projet conserve ses idées.
- Copiez ou glissez le texte brut. La note reste en place et rien n’est envoyé automatiquement.
- Conservez les données localement ; consultez le dossier réel, déplacez-le ou exportez une sauvegarde indépendante.

<p align="center"><img src="images/thought-calendar.png" alt="Calendrier d’idées avec des données de démonstration synthétiques." width="740" /><br /><sub>Calendrier d’idées avec des données de démonstration synthétiques.</sub></p>

## Téléchargement et installation

Cette version d’aperçu est réservée aux membres ayant accès au dépôt. Releases contient les paquets, lanceurs isolés, SHA256SUMS et informations de provenance. [Releases](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2).

| Platform | Package |
|---|---|
| macOS · Apple Silicon | arm64 · DMG |
| Windows | x64 · EXE (NSIS) |

Avant une mise à jour, quittez normalement et sauvegardez vos données. Mac utilise une signature ad-hoc, sans Developer ID ni notarisation ; Windows n’est pas signé. Gardez les protections système actives. Aucune mise à jour automatique.

## Premiers pas

1. Control + Alt + N (⌃ + ⌥ + N sur Mac) ouvre une nouvelle note ; modifiez ce raccourci dans les réglages.
2. Enter ajoute une ligne. Validez avec ⌘ + Enter sur Mac ou Ctrl + Enter sur Windows. Esc sauvegarde le brouillon et ferme la saisie.
3. Placez le pointeur au bord supérieur pour afficher la corde ; ouvrez une feuille pour lire, copier, modifier ou archiver.
4. Retrouvez les idées archivées dans le calendrier ou restaurez les éléments récemment supprimés.

Codex, Claude et Cursor sont des catégories. Copiez ou glissez vous-même le texte ; la réception dans les autres applications reste à vérifier.

## Données et sauvegardes

Les réglages du calendrier affichent le dossier réel. Un déplacement copie et vérifie avant de changer de dossier ; l’original est conservé. Exporter une sauvegarde ne change pas l’emplacement actuel. [Data / 备份说明](../ROUND1-DATA-SAFETY.md).

Le format actuel est schema3. La version 0.0.16-preview.6 ne peut pas le lire directement. Conservez les nouvelles données et vérifiez une sauvegarde antérieure dans un dossier séparé avant de revenir en arrière. Elle n’inclut pas les modifications suivantes.

## Développement

Utilisez Node.js 24.19.0 ou une version 24.x plus récente. verify exécute les contrôles de types, tests unitaires et compilation. Construisez chaque paquet sur son OS. Technologies : Electron, React, TypeScript et Vite.

```bash
npm ci
npm run dev
```

```bash
npm run verify
npm run package:mac
npm run package:win
```

Les contrôles automatiques et de paquets applicables ont réussi. IME, DPI, multi-écran, focus et champs réels de WeChat, Doubao et WorkBuddy nécessitent encore des tests indépendants. Ces langues traduisent le README ; l’interface est actuellement en chinois.

## Retours

Signalez les problèmes dans Issues avec versions, étapes, résultats attendus et réels, et preuves anonymisées. Ne publiez pas de pensées personnelles ou de données réelles. [Issues](https://github.com/NocodeMrLi/thoughtline/issues).

Étoiles et téléchargements : instantané API du 2026-10-09. Les téléchargements comptent les fichiers des publications.

<a id="license"></a>
## Licence et remerciements

Le projet est UNLICENSED ; aucune permission d’utilisation open source n’a été accordée. Une future publication précisera la licence et les contributions. Consultez les avis tiers pour le code et les licences inclus. [Third-party notices](../../THIRD_PARTY_NOTICES.md).
