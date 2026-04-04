# **Anforderungskatalog: KI-gestützter Tanz-Event-Kalender**

## **Projekt-Kontext**

Digitalisierung von Tanzevent-Informationen, die bisher unstrukturiert via WhatsApp-Flyer verteilt werden. Ziel ist eine automatisierte Ingestion durch lokale KI, ein effizientes Admin-Review-System und eine benutzerfreundliche Kalender-App mit Social-Features.

## **1\. Endnutzer-Erlebnis (Consumer Interface)**

### **US.01: Event-Discovery (Basis-Suche)**

**Als** Tänzer

**möchte ich** anstehende Tanzevents in einer Kalenderansicht nach Datum, Tanzstil und Ort filtern können,

**um** schnell passende Veranstaltungen zu finden.

**Akzeptanzkriterien:**

* Der Kalender bietet eine Monats- und Wochenansicht mit optischen Markern für Event-Tage.  
* Filter für Tanzstile (Salsa, Bachata, Kizomba), Ort und Zeitraum sind funktionsfähig.  
* Die Ladezeit der gefilterten Liste liegt bei \< 2 Sekunden.

### **US.02: Multimodale Kalenderansicht**

**Als** Tänzer

**möchte ich** zwischen einer klassischen Monatsübersicht und einer vertikalen Scroll-Liste wechseln können,

**um** je nach Bedarf die beste Übersicht zu erhalten.

**Akzeptanzkriterien:**

* Ein Toggle-Switch erlaubt den sofortigen Wechsel zwischen Grid- und Listenansicht.  
* Die Listenansicht zeigt chronologisch alle Events des aktuellen und der folgenden Tage.  
* In der Grid-Ansicht öffnet ein Klick auf einen Tag die zugehörige Event-Liste.

### **US.03: Deep Filtering (Tanz-Spezifisch)**

**Als** Nutzer

**möchte ich** Filter nach Tanzstil, Level und Event-Typ speichern können,

**um** bei jedem App-Start sofort meine relevanten Events zu sehen.

**Akzeptanzkriterien:**

* Nutzer können Filterkombinationen als "Standard" markieren.  
* Beim App-Start wird die Liste automatisch basierend auf den gespeicherten Präferenzen geladen.  
* Filterkategorien umfassen mindestens: Tanzstil, Level (Open, Intermediate, etc.) und Typ (Party, Workshop, Festival).

### **US.04: Social Attendance (Zusagen)**

**Als** Tänzer

**möchte ich** per Klick meine Teilnahme an einem Event bestätigen oder widerrufen,

**um** die Popularität eines Events einzuschätzen.

**Akzeptanzkriterien:**

* Ein interaktiver "Bin dabei"-Button ist in der Detailansicht vorhanden.  
* Die Gesamtzahl der Zusagen wird in Echtzeit (oder Near-Realtime) angezeigt.  
* Nur via WhatsApp-OTP verifizierte Nutzer können eine Zusage abgeben.

### **US.05: Geografische Orientierung (Statisch)**

**Als** ortsfremder Tänzer

**möchte ich** in den Event-Details eine Karte des Veranstaltungsortes sehen,

**um** den Ort ohne manuelle Suche zu finden.

**Akzeptanzkriterien:**

* Jedes Event zeigt eine statische Karte (Google Maps/OSM) mit Pin auf der Location.  
* Es erfolgt keine Abfrage oder Speicherung des Nutzerstandorts (Privacy-by-Design).  
* Ein "Route planen"-Link öffnet die Adresse direkt in der nativen Maps-App des Geräts.

### **US.06: Personalisierter Kalender-Feed (iCal/ICS)**

**Als** Power-User

**möchte ich** meine gefilterte Suche als dynamischen Kalender-Link exportieren,

**um** neue Events automatisch in meiner privaten Kalender-App zu sehen.

**Akzeptanzkriterien:**

* Die App generiert eine eindeutige URL basierend auf den gewählten Filtern.  
* Der Feed liefert valide Daten im .ics-Format.  
* Der Kalender-Eintrag enthält Titel, Zeit, Ort und einen Link zum Flyer in der App.

## **2\. Daten-Ingestion & KI-Intelligenz**

### **US.07: Automatisierte Extraktion (Data Ingestion)**

**Als** System-Administrator

**möchte ich**, dass das System Medien aus WhatsApp-Channels scannt und mittels KI extrahiert,

**um** den manuellen Pflegeaufwand zu minimieren.

**Akzeptanzkriterien:**

* Der Bot liest Bilder und zugehörige Metadaten (Sender-ID, Zeitstempel) aus definierten Channels.  
* Das System extrahiert Name, Datum, Uhrzeit, Ort und Tanzstil aus Bild-Assets.  
* Daten werden als strukturierte Entwürfe in der Datenbank abgelegt.

### **US.08: Media Triage (Noise Filtering)**

**Als** System-Betreiber

**möchte ich**, dass WhatsApp-Bilder zuerst durch einen schnellen Klassifikator laufen,

**um** Ressourcen des LLMs zu schonen.

**Akzeptanzkriterien:**

* Ein Classifier erkennt Nicht-Event-Bilder (Memes, Privatfotos) mit einer Genauigkeit von \> 98%.  
* Herausgefilterte Bilder werden verworfen oder in einen separaten Spam-Ordner verschoben.  
* Die Verarbeitungszeit pro Bild liegt bei \< 500ms.

### **US.09: Automatisierte Zuordnung & Qualitätssicherung**

**Als** System-Administrator

**möchte ich**, dass das lokale LLM zu jedem Feld einen Confidence Score liefert,

**damit** nur verifizierte Daten direkt veröffentlicht werden.

**Akzeptanzkriterien:**

* Jedes extrahierte Feld (z.B. Datum) besitzt einen Score zwischen 0.0 und 1.0.  
* Felder mit einem Score \< 0.85 werden in der Admin-UI zur Korrektur markiert.  
* Das System nutzt ein lokales Modell (z.B. Llama-3-Vision), um Datensouveränität zu wahren.

### **US.10: Full-Automation (Auto-Publish)**

**Als** Veranstalter

**möchte ich**, dass meine Flyer ohne Zeitverzögerung erscheinen,

**sofern** das System eine hohe Konfidenz erreicht.

**Akzeptanzkriterien:**

* Events mit einem Gesamt-Confidence-Score \> 0.95 werden sofort auf LIVE gesetzt.  
* Der Veranstalter erhält eine Bestätigung via WhatsApp, dass das Event veröffentlicht wurde.

### **US.11: Automatisierte Absage-Erkennung**

**Als** App-Nutzer

**möchte ich**, dass abgesagte Events im Kalender sofort als "Abgesagt" markiert werden,

**indem** das System Textnachrichten analysiert.

**Akzeptanzkriterien:**

* Das System erkennt Schlüsselwörter wie "fällt aus", "abgesagt" oder "storniert".  
* Eine Absage wird nur akzeptiert, wenn der Absender der Inhaber des Events oder ein Admin ist.  
* Abgesagte Events erhalten im Kalender ein rotes "ABGESAGT"-Banner und werden durchgestrichen.

### **US.12: Manueller Self-Service**

**Als** Veranstalter

**möchte ich** meine Events über ein strukturiertes Formular selbst anlegen können,

**um** die volle Kontrolle zu haben.

**Akzeptanzkriterien:**

* Ein Web-Formular erlaubt die Eingabe aller Event-Details inkl. Flyer-Upload.  
* Veranstalter können ihre eigenen (und nur ihre eigenen) Events bearbeiten oder löschen.  
* Die Validierung der Pflichtfelder (Titel, Datum, Ort) erfolgt in Echtzeit.

## **3\. Administration & Moderation (Mobile-First)**

### **US.13: Schnelle Triage (High-Speed Review)**

**Als** Admin

**möchte ich** eine übersichtliche Liste aller Events im Status ADMIN\_REVIEW sehen,

**um** unklare Daten blitzschnell zu korrigieren.

**Akzeptanzkriterien:**

* Die Ansicht zeigt den Original-Flyer neben dem bearbeitbaren Formular.  
* Unsichere Felder (Low Confidence) sind farblich hervorgehoben.  
* Shortcuts für "Freigeben", "Löschen" und "Nächster" sind vorhanden.

### **US.14: Mobiler Review (On-the-Go)**

**Als** mobiler Admin

**möchte ich** eine für Touchscreens optimierte Oberfläche nutzen,

**um** Events via Wischgesten zu bearbeiten.

**Akzeptanzkriterien:**

* Swipe-Right führt eine Freigabe aus, Swipe-Left verwirft den Entwurf.  
* Bilder lassen sich per Pinch-to-Zoom vergrößern.  
* Alle Touch-Ziele sind mindestens 44x44 Pixel groß.

### **US.15: Multi-Admin Kollaboration (Locking)**

**Als** Haupt-Administrator

**möchte ich**, dass Events während der Bearbeitung für andere gesperrt werden,

**um** Konflikte zu vermeiden.

**Akzeptanzkriterien:**

* Beim Öffnen eines Events wird ein Lock für 5 Minuten gesetzt.  
* Andere Admins sehen ein Schloss-Symbol und den Namen des Bearbeiters.  
* Das Sperrsystem folgt dem "First-come, first-serve"-Prinzip.

### **US.16: Batch-Processing (Mass-Actions)**

**Als** Admin

**möchte ich** mehrere WhatsApp-Eingänge markieren und gesammelt bearbeiten,

**um** bei Chat-Spam Zeit zu sparen.

**Akzeptanzkriterien:**

* Eine Gallery-Ansicht ermöglicht die Mehrfachauswahl von Bildern.  
* Aktion "Als kein Event markieren" löscht alle ausgewählten Entwürfe gleichzeitig.  
* Aktion "Ort zuweisen" setzt die Location für alle markierten Events.

### **US.17: Model-Monitoring**

**Als** System-Administrator

**möchte ich** eine Statistik über Korrekturen und False-Positives einsehen,

**um** das System zu optimieren.

**Akzeptanzkriterien:**

* Ein Dashboard zeigt die Automation Rate (% der Auto-Publish Events).  
* Die Fehlerquote pro Feld (z.B. Datum falsch erkannt) wird grafisch dargestellt.  
* Admins können Schwellenwerte für Confidence-Scores im Dashboard anpassen.

## **4\. Identität, Security & Ownership**

### **US.18: Identitäts-Verknüpfung (WhatsApp-OTP)**

**Als** Nutzer

**möchte ich** mich via WhatsApp-OTP verifizieren,

**um** mein Profil sicher mit meiner Nummer zu verknüpfen.

**Akzeptanzkriterien:**

* Der Login-Prozess startet in der App; der Code/Link wird via WhatsApp-Bot gesendet.  
* Eine Verifizierung ist zwingend für Zusagen und das Anlegen von Events.  
* Die Session bleibt für 30 Tage aktiv (Refresh-Token).

### **US.19: Ownership-Management (Reject-Workflow)**

**Als** User

**möchte ich** die Inhaberschaft ablehnen können,

**um** die Verantwortung an den Admin zu delegieren.

**Akzeptanzkriterien:**

* User erhalten eine Push-Nachricht, wenn ein Event für sie erstellt wurde.  
* Ein "Nicht mein Event"-Button überträgt das Ownership an den System-Admin.  
* Bei Ablehnung verschwindet das Event aus dem privaten Dashboard des Users.

### **US.20: Passwordless Admin Login**

**Als** Admin

**möchte ich** mich ohne Passwort via Magic Link einloggen,

**um** die Sicherheit zu maximieren.

**Akzeptanzkriterien:**

* Admin-Login ist nur für Mobilnummern auf einer serverseitigen Whitelist möglich.  
* Der Magic Link verfällt nach einmaliger Nutzung oder 15 Minuten.

## **5\. Technische Infrastruktur (Backend)**

### **US.21: Adaptive Image Loading**

**Als** mobiler Admin

**möchte ich**, dass das System Bilder in optimierten Formaten bereitstellt,

**um** Daten zu sparen.

**Akzeptanzkriterien:**

* Flyer werden automatisch in WebP konvertiert.  
* Größen: Thumb (200px), Preview (800px) und Original werden vorgehalten.  
* Die App lädt standardmäßig nur die Thumbnail-Größe in der Listenansicht.

### **US.22: Automatisierte Adress-Vervollständigung**

**Als** System-Administrator

**möchte ich**, dass unvollständige Ortsangaben vervollständigt werden,

**um** korrekte Karten anzuzeigen.

**Akzeptanzkriterien:**

* Bei fehlender Adresse triggert der Location-Name eine Suche via Google Places/OSM.  
* Ergebnisse mit einer Eindeutigkeit \> 90% werden automatisch übernommen.  
* Bei Mehrdeutigkeit wird das Feld zur manuellen Auswahl im Admin-Review markiert.
