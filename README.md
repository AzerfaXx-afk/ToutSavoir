# ToutSavoir // AEGIS CHRONOS-TERRA — Global Intelligence & Live Telemetry

> Plateforme de renseignement planétaire open-source et télémétrie mondiale en temps réel au design d'élite Awwwards (*Dark Obsidian / Tactical Luxury*). Fusion intégrale des statistiques en direct de **Worldometer** et des outils tactiques d'**OSIRIS OSINT**.

---

## 🌟 Fonctionnalités Majeures

### 1. 🌐 Télémétrie Globale Worldometer en Temps Réel
- **Horloge Démographique Mondiale** : Population mondiale à la seconde près, naissances et décès du jour et cumulés sur l'année, croissance nette calculée par algorithme odométrique de haute précision.
- **Indicateurs Multithématiques** :
  - *Gouvernement & Économie* : Dépenses militaires mondiales à la seconde ($ US), production automobile, ordinateurs, vélos, dette publique.
  - *Société & Médias* : Recherches Google, courriels envoyés, smartphones vendus, billets de blog.
  - *Environnement & Climat* : Déforestation (hectares perdus), érosion des sols, émissions de CO2 en direct.
  - *Alimentation & Eau* : Personnes sous-alimentées, obésité, décès causés par la faim, consommation d'eau mondiale.
  - *Énergie* : Réserves pétrolières restantes, gaz naturel, charbon, production d'énergies renouvelables.
  - *Santé Publique* : Dépenses de santé mondiales, causes de mortalité.

### 2. 🎯 OSIRIS Open Source Intelligence Platform
- **🛰️ Satellites en Orbite Réelle (Données TLE)** :
  - Suivi orbital 3D & 2D en temps réel de l'**ISS (Station Spatiale Internationale)**, **Tiangong (CSS)**, **Hubble (HST)**, constellation **Starlink**, **NOAA-20**, **Sentinel-2A**, satellites GPS et militaires.
  - Données d'altitude, vitesse orbitale (~27 600 km/h), inclinaison et identifiants NORAD.
- **📹 Réseau de Caméras CCTV Mondiales en Direct** :
  - Webcams publiques haute résolution aux emplacements stratégiques mondiaux : *Détroit du Bosphore, Times Square NYC, Carrefour de Shibuya Tokyo, Canal de Panama, Port de Rotterdam, Kyiv Maïdan, Tour Eiffel, Volcan Popocatépetl, etc.*
  - **Lecteur Vidéo Picture-in-Picture (PiP)** intégré avec scanlines tactiques, timecode UTC et coordonnées géographiques.
- **✈️ Couloirs Aériens Internationaux (ADS-B)** :
  - Visualisation des routes de vol hub-to-hub avec aéronefs animés le long de courbes géodésiques 3D.
- **🌐 Câbles Internet Sous-Marins en Fibre Optique** :
  - Tracés réels des grandes dorsales transocéaniques (*MAREA, Dunant, Grace Hopper, FASTER, SeaMeWe-5, Curie*).
- **⚡ Cyberguerre & Alertes Réseau** :
  - Vecteurs d'attaques DDoS, tentatives d'intrusion et botnets visualisés par arcs photoniques.
- **🌋 Séismes USGS & Anomalies Thermiques NASA FIRMS** :
  - Détection sismique en temps réel avec cercles d'ondes et foyers d'incendies détectés par infrarouge satellitaire.

### 3. 🔍 Moteur de Recherche Universel (Spotlight / `⌘ + K`)
- Déclenchement instantané au clavier (`⌘K` / `Ctrl+K`) ou par bouton HUD dédié.
- Recherche prédictive dans les **195 pays du monde**, **60+ indicateurs Worldometer**, **satellites**, **caméras live**, **câbles** et **points chauds**.
- Centrage caméra automatique (`flyTo` cinématique 2D / rotation vectorielle 3D).

### 4. 🎛️ Barre de Pilules Multi-Calques Modulaires
- 8 calques cumulables indépendamment avec compteurs d'entités en temps réel :
  - `[🛰️ Satellites]` `[✈️ Aviation]` `[⚡ Cyber]` `[🎯 Conflits]` `[📹 Caméras Live]` `[🌐 Câbles Fibre]` `[🌋 Séismes]` `[🌦️ Météo & Feux]`.

### 5. 🎨 Double Moteur Cartographique Awwwards
- **Mode 2D Tactique** : Cartographie Leaflet Dark Radar avec bordures luminescentes, scanlines, infobulles magnétiques et géométrie des îles/territoires.
- **Mode 3D Orbital** : Globe Three.js photoréaliste, shader d'atmosphère de Rayleigh, rotation gyroscopique fluide, arcs balistiques 3D et détection d'objets au clic (raycasting).
- **Jog Dial Temporel (1950 - 2100)** : Molette crantée interactive interpolant les données démographiques historiques et futures.

---

## 💻 Technologies Utilisées

- **Framework** : React 19 + Vite 8
- **Rendu 3D** : Three.js (WebGL, OrbitControls, custom GLSL Shaders)
- **Rendu 2D** : Leaflet.js
- **Typographie** : Space Grotesk & JetBrains Mono (Google Fonts)
- **Icônes & Audio** : Lucide React, Web Audio API (soundFX synthétiques)
- **Linter & Performance** : Oxlint

---

## 🚀 Installation & Lancement Local

```bash
# Cloner le dépôt
git clone https://github.com/AzerfaXx-afk/ToutSavoir.git
cd ToutSavoir

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Compiler pour la production
npm run build
```

---

## 🛡️ Licence
MIT © ToutSavoir / AEGIS Platform
