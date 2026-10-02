#!/usr/bin/env node
// Erzeugt die Mock-Bibliothek unter library/: Kategorie-Ordner mit _category.json,
// echte (kleine) PDF-Dateien und die zugehörigen *.meta.json-Sidecars.
// Im echten Betrieb liegen dort eure eigenen Dokumente und der KI-Agent schreibt die Sidecars.
//
//   node tools/make-mock-library.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(ROOT, 'library');

// ---------------------------------------------------------------------------
// Mock-Inhalte
// ---------------------------------------------------------------------------

const CATEGORIES = {
  '01_Mechanik': { title: 'Mechanik', icon: '⚙️', color: '#1f6fd1', description: 'Bewegungen, Kräfte und Energie – von der gleichförmigen Bewegung bis zur Energieerhaltung.' },
  '01_Mechanik/01_Kinematik': { title: 'Kinematik', description: 'Beschreibung von Bewegungen mit Ort, Geschwindigkeit und Beschleunigung.' },
  '01_Mechanik/02_Dynamik': { title: 'Dynamik', description: 'Kräfte und ihre Wirkungen – die Newtonschen Gesetze.' },
  '01_Mechanik/03_Energie_und_Arbeit': { title: 'Energie und Arbeit', description: 'Energieformen, Energieerhaltung, Arbeit und Leistung.' },
  '02_Elektrizitaetslehre': { title: 'Elektrizitätslehre', icon: '⚡', color: '#c98a00', description: 'Stromkreise, Spannung, Widerstand und Magnetismus.' },
  '02_Elektrizitaetslehre/01_Stromkreise': { title: 'Stromkreise', description: 'Aufbau und Gesetze einfacher und verzweigter Stromkreise.' },
  '02_Elektrizitaetslehre/02_Widerstand': { title: 'Widerstand', description: 'Elektrischer Widerstand und Ohmsches Gesetz.' },
  '02_Elektrizitaetslehre/03_Magnetismus': { title: 'Magnetismus', description: 'Magnetfelder, Elektromagnete und Induktion.' },
  '03_Optik': { title: 'Optik', icon: '🔭', color: '#7b3fe4', description: 'Licht als Strahl und als Welle: Reflexion, Brechung, Linsen und Interferenz.' },
  '03_Optik/01_Strahlenoptik': { title: 'Strahlenoptik', description: 'Ausbreitung von Licht, Reflexion, Brechung und Abbildung mit Linsen.' },
  '03_Optik/02_Wellenoptik': { title: 'Wellenoptik', description: 'Interferenz und Beugung: Licht als Welle.' },
  '04_Waermelehre': { title: 'Wärmelehre', icon: '🌡️', color: '#d9480f', description: 'Temperatur, Wärme und die Hauptsätze der Thermodynamik.' },
  '04_Waermelehre/01_Temperatur_und_Waerme': { title: 'Temperatur und Wärme', description: 'Teilchenmodell, Temperaturskalen und Wärmekapazität.' },
  '04_Waermelehre/02_Thermodynamik': { title: 'Thermodynamik', description: 'Hauptsätze, Kreisprozesse und Wärmekraftmaschinen.' },
  '04_Waermelehre/02_Thermodynamik/01_Kreisprozesse': { title: 'Kreisprozesse', description: 'Idealisierte Zyklen als Modell für reale Maschinen.' },
};

// Kapitel: [Titel, [Schlagworte], Text]
const DOCS = [
  // --- Mechanik ---------------------------------------------------------------
  {
    file: '01_Mechanik/01_Kinematik/gleichfoermige-bewegung.pdf', title: 'Gleichförmige Bewegung', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Geschwindigkeit', 'Bewegung', 'Weg-Zeit-Diagramm', 'Durchschnittsgeschwindigkeit'],
    summary: 'Bewegungen mit konstanter Geschwindigkeit: Definition, Weg-Zeit-Gesetz und die Auswertung von Diagrammen.',
    chapters: [
      ['Was ist eine gleichförmige Bewegung?', ['konstante Geschwindigkeit', 'Bezugssystem'], 'Ein Körper bewegt sich gleichförmig, wenn er in gleichen Zeitabschnitten gleich lange Wege zurücklegt. Seine Geschwindigkeit ist dann nach Betrag und Richtung konstant. Ob sich ein Körper überhaupt bewegt, hängt immer vom gewählten Bezugssystem ab.'],
      ['Weg-Zeit-Gesetz', ['s = v · t', 'Formel'], 'Für die gleichförmige Bewegung gilt s = v · t, wenn der Körper zum Zeitpunkt t = 0 am Ort s = 0 startet. Die Geschwindigkeit ergibt sich als Quotient aus zurückgelegtem Weg und benötigter Zeit: v = s / t.'],
      ['Diagramme auswerten', ['t-s-Diagramm', 'Steigung', 'Ursprungsgerade'], 'Im Zeit-Weg-Diagramm ergibt eine gleichförmige Bewegung eine Gerade. Ihre Steigung entspricht der Geschwindigkeit. Im Zeit-Geschwindigkeit-Diagramm ergibt sich eine Parallele zur Zeitachse; die Fläche darunter ist der zurückgelegte Weg.'],
      ['Einheiten umrechnen', ['km/h', 'm/s', 'Umrechnung'], 'Geschwindigkeiten werden in m/s oder km/h angegeben. Es gilt 1 m/s = 3,6 km/h. Beim Umrechnen von km/h in m/s teilt man also durch 3,6.'],
    ],
  },
  {
    file: '01_Mechanik/01_Kinematik/beschleunigte-bewegung.pdf', title: 'Gleichmäßig beschleunigte Bewegung', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Beschleunigung', 'Geschwindigkeit', 'Bewegung', 'freier Fall'],
    summary: 'Beschleunigung, Bewegungsgesetze der gleichmäßig beschleunigten Bewegung, freier Fall und Bremsweg.',
    chapters: [
      ['Beschleunigung', ['a = Δv / Δt', 'm/s²'], 'Die Beschleunigung gibt an, wie schnell sich die Geschwindigkeit ändert: a = Δv / Δt. Ihre Einheit ist m/s². Bei einer gleichmäßig beschleunigten Bewegung ist a konstant.'],
      ['Bewegungsgesetze', ['s = ½ · a · t²', 'v = a · t'], 'Startet ein Körper aus der Ruhe, gilt v = a · t und s = ½ · a · t². Der zurückgelegte Weg wächst also quadratisch mit der Zeit.'],
      ['Freier Fall', ['Fallbeschleunigung', 'g = 9,81 m/s²', 'Luftwiderstand'], 'Ohne Luftwiderstand fallen alle Körper gleich schnell. Die Fallbeschleunigung beträgt in Mitteleuropa etwa g = 9,81 m/s².'],
      ['Bremsweg', ['Anhalteweg', 'Reaktionsweg', 'Verkehr'], 'Der Anhalteweg setzt sich aus Reaktionsweg und Bremsweg zusammen. Der Bremsweg wächst quadratisch mit der Geschwindigkeit – doppelte Geschwindigkeit bedeutet vierfachen Bremsweg.'],
    ],
  },
  {
    file: '01_Mechanik/01_Kinematik/aufgaben-kinematik.pdf', title: 'Aufgaben zur Kinematik', type: 'Aufgaben', level: 'Mittelstufe',
    tags: ['Übungsaufgaben', 'Geschwindigkeit', 'Beschleunigung', 'freier Fall'],
    summary: 'Drei Rechenaufgaben zu Durchschnittsgeschwindigkeit, beschleunigter Bewegung und freiem Fall – mit Lösungen.',
    chapters: [
      ['Aufgabe 1: Radfahrt', ['Durchschnittsgeschwindigkeit'], 'Eine Radfahrerin legt 18 km in 45 Minuten zurück. Berechne ihre Durchschnittsgeschwindigkeit in km/h und in m/s.'],
      ['Aufgabe 2: Anfahrender Zug', ['Beschleunigung', 'Weg'], 'Ein Zug erreicht aus dem Stand nach 50 s eine Geschwindigkeit von 90 km/h. Bestimme die Beschleunigung und den in dieser Zeit zurückgelegten Weg.'],
      ['Aufgabe 3: Fallender Stein', ['freier Fall'], 'Ein Stein fällt 2,0 s lang frei. Wie tief ist er gefallen und welche Geschwindigkeit hat er erreicht?'],
      ['Lösungen', ['Lösung'], '1) 24 km/h, also etwa 6,7 m/s. 2) a = 0,5 m/s², s = 625 m. 3) s ≈ 19,6 m, v ≈ 19,6 m/s.'],
    ],
  },
  {
    file: '01_Mechanik/02_Dynamik/newtonsche-gesetze.pdf', title: 'Die Newtonschen Gesetze', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Kraft', 'Trägheit', 'Masse', 'Wechselwirkung'],
    summary: 'Trägheitsprinzip, Grundgleichung der Mechanik F = m · a und das Wechselwirkungsprinzip.',
    chapters: [
      ['Trägheitsprinzip', ['1. Newtonsches Gesetz', 'Trägheit'], 'Ein Körper verharrt im Zustand der Ruhe oder der gleichförmigen Bewegung, solange keine resultierende Kraft auf ihn wirkt.'],
      ['Grundgleichung der Mechanik', ['F = m · a', 'Newton', '2. Newtonsches Gesetz'], 'Die resultierende Kraft auf einen Körper ist gleich dem Produkt aus Masse und Beschleunigung: F = m · a. Die Einheit der Kraft ist 1 N = 1 kg · m/s².'],
      ['Wechselwirkungsprinzip', ['actio = reactio', 'Gegenkraft', '3. Newtonsches Gesetz'], 'Übt ein Körper A auf einen Körper B eine Kraft aus, so übt B auf A eine gleich große, entgegengesetzt gerichtete Kraft aus.'],
    ],
  },
  {
    file: '01_Mechanik/02_Dynamik/reibung.pdf', title: 'Reibung', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Kraft', 'Reibungskraft', 'Haftreibung', 'Gleitreibung'],
    summary: 'Haft-, Gleit- und Rollreibung, die Berechnung der Reibungskraft und Reibung im Alltag.',
    chapters: [
      ['Arten der Reibung', ['Haftreibung', 'Gleitreibung', 'Rollreibung'], 'Man unterscheidet Haft-, Gleit- und Rollreibung. Die Haftreibung ist meist größer als die Gleitreibung, die Rollreibung ist am kleinsten.'],
      ['Reibungskraft berechnen', ['Reibungszahl', 'Normalkraft', 'F_R = µ · F_N'], 'Die Reibungskraft ist proportional zur Normalkraft: F_R = µ · F_N. Die Reibungszahl µ hängt von den Materialien der Oberflächen ab.'],
      ['Reibung im Alltag', ['Bremsen', 'Schmierung', 'Kugellager'], 'Ohne Reibung könnten wir weder gehen noch bremsen. Wo Reibung stört, wird sie durch Schmierstoffe oder Kugellager verringert.'],
    ],
  },
  {
    file: '01_Mechanik/02_Dynamik/versuch-fahrbahn.pdf', title: 'Versuch: Wagen auf der Fahrbahn', type: 'Versuch', level: 'Mittelstufe',
    tags: ['Experiment', 'Kraft', 'Beschleunigung', 'Messwerte'],
    summary: 'Experimentelle Bestätigung von F = m · a mit einem Wagen auf einer reibungsarmen Fahrbahn.',
    chapters: [
      ['Aufbau', ['Fahrbahn', 'Lichtschranke'], 'Ein Wagen auf einer reibungsarmen Fahrbahn wird über einen Faden von einem fallenden Massestück beschleunigt. Lichtschranken messen die Zeiten.'],
      ['Durchführung', ['Messreihe'], 'Die beschleunigende Kraft wird schrittweise erhöht, während die Gesamtmasse konstant bleibt. Für jede Kraft wird die Beschleunigung bestimmt.'],
      ['Auswertung', ['Proportionalität', 'F-a-Diagramm'], 'Im Kraft-Beschleunigungs-Diagramm liegen die Messpunkte auf einer Ursprungsgeraden. Die Steigung entspricht der beschleunigten Masse.'],
    ],
  },
  {
    file: '01_Mechanik/03_Energie_und_Arbeit/energieerhaltung.pdf', title: 'Energieerhaltung', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Energie', 'Lageenergie', 'Bewegungsenergie', 'Energieerhaltung'],
    summary: 'Lage- und Bewegungsenergie, der Energieerhaltungssatz und Energieumwandlungen am Beispiel der Achterbahn.',
    chapters: [
      ['Energieformen', ['potentielle Energie', 'kinetische Energie'], 'Die Lageenergie eines Körpers ist E_pot = m · g · h, seine Bewegungsenergie E_kin = ½ · m · v².'],
      ['Energieerhaltungssatz', ['abgeschlossenes System'], 'In einem abgeschlossenen System bleibt die Gesamtenergie erhalten. Energie wird nur von einer Form in eine andere umgewandelt.'],
      ['Beispiel Achterbahn', ['Energieumwandlung', 'Reibungsverluste'], 'Auf dem höchsten Punkt hat der Wagen maximale Lageenergie. Beim Hinabfahren wird sie in Bewegungsenergie umgewandelt – abzüglich der Reibungsverluste.'],
    ],
  },
  {
    file: '01_Mechanik/03_Energie_und_Arbeit/arbeit-und-leistung.pdf', title: 'Arbeit und Leistung', type: 'Aufgaben', level: 'Mittelstufe',
    tags: ['Arbeit', 'Leistung', 'Energie', 'Übungsaufgaben'],
    summary: 'Kurze Wiederholung von Arbeit und Leistung und eine Aufgabe zur Hubarbeit beim Treppensteigen.',
    chapters: [
      ['Grundlagen', ['W = F · s', 'P = W / t', 'Watt'], 'Mechanische Arbeit ist W = F · s, Leistung ist Arbeit pro Zeit: P = W / t. Die Einheit der Leistung ist 1 W = 1 J/s.'],
      ['Aufgabe: Treppensteigen', ['Hubarbeit'], 'Eine Person mit 70 kg steigt in 12 s eine 4,5 m hohe Treppe hinauf. Berechne die Hubarbeit und die Leistung.'],
      ['Lösungen', ['Lösung'], 'W = 70 kg · 9,81 m/s² · 4,5 m ≈ 3,1 kJ und P ≈ 260 W.'],
    ],
  },

  // --- Elektrizitätslehre -------------------------------------------------------
  {
    file: '02_Elektrizitaetslehre/01_Stromkreise/einfacher-stromkreis.pdf', title: 'Der einfache Stromkreis', type: 'Grundwissen', level: 'Unterstufe',
    tags: ['Stromkreis', 'Stromstärke', 'Spannung', 'Schaltzeichen'],
    summary: 'Bestandteile eines Stromkreises, Schaltzeichen sowie das Messen von Stromstärke und Spannung.',
    chapters: [
      ['Bestandteile', ['Quelle', 'Leiter', 'Verbraucher', 'Schalter'], 'Ein Stromkreis besteht mindestens aus einer Elektrizitätsquelle, Leitungen und einem Verbraucher. Nur in einem geschlossenen Stromkreis fließt ein Strom.'],
      ['Schaltzeichen', ['Schaltplan'], 'In Schaltplänen werden Bauteile durch genormte Schaltzeichen dargestellt, zum Beispiel Batterie, Lampe, Schalter und Widerstand.'],
      ['Stromstärke und Spannung', ['Ampere', 'Volt', 'Messgerät'], 'Die Stromstärke I wird in Ampere gemessen, die Spannung U in Volt. Strommesser werden in Reihe, Spannungsmesser parallel zum Bauteil geschaltet.'],
    ],
  },
  {
    file: '02_Elektrizitaetslehre/01_Stromkreise/reihen-und-parallelschaltung.pdf', title: 'Reihen- und Parallelschaltung', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Stromkreis', 'Reihenschaltung', 'Parallelschaltung', 'Widerstand'],
    summary: 'Gesetze für Strom, Spannung und Widerstand in Reihen- und Parallelschaltungen sowie die Kirchhoffschen Regeln.',
    chapters: [
      ['Reihenschaltung', ['Gesamtwiderstand', 'Spannungsteilung'], 'In der Reihenschaltung ist die Stromstärke überall gleich. Die Teilspannungen addieren sich zur Gesamtspannung, die Widerstände zum Gesamtwiderstand.'],
      ['Parallelschaltung', ['Stromteilung'], 'In der Parallelschaltung liegt an allen Zweigen dieselbe Spannung. Die Teilströme addieren sich zum Gesamtstrom.'],
      ['Kirchhoffsche Regeln', ['Knotenregel', 'Maschenregel'], 'Die Knotenregel besagt: Die Summe der zufließenden Ströme ist gleich der Summe der abfließenden. Nach der Maschenregel ist die Summe der Spannungen in einer Masche null.'],
    ],
  },
  {
    file: '02_Elektrizitaetslehre/01_Stromkreise/aufgaben-stromkreise.pdf', title: 'Aufgaben zu Stromkreisen', type: 'Aufgaben', level: 'Mittelstufe',
    tags: ['Übungsaufgaben', 'Reihenschaltung', 'Parallelschaltung', 'Widerstand'],
    summary: 'Übungen zu Lichterkette (Reihenschaltung) und parallel geschalteten Widerständen – mit Lösungen.',
    chapters: [
      ['Aufgabe 1: Lichterkette', ['Reihenschaltung', 'Teilspannung'], 'Eine Lichterkette mit 20 gleichen Lampen wird an 230 V betrieben. Welche Spannung liegt an jeder Lampe?'],
      ['Aufgabe 2: Zwei Widerstände', ['Parallelschaltung', 'Gesamtwiderstand'], 'Zwei Widerstände mit 100 Ohm und 300 Ohm werden parallel geschaltet. Berechne den Gesamtwiderstand.'],
      ['Lösungen', ['Lösung'], '1) An jeder Lampe liegen 11,5 V. 2) Der Gesamtwiderstand beträgt 75 Ohm.'],
    ],
  },
  {
    file: '02_Elektrizitaetslehre/02_Widerstand/ohmsches-gesetz.pdf', title: 'Widerstand und Ohmsches Gesetz', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Widerstand', 'Ohmsches Gesetz', 'Spannung', 'Stromstärke'],
    summary: 'Definition des elektrischen Widerstands, das Ohmsche Gesetz und der spezifische Widerstand von Drähten.',
    chapters: [
      ['Elektrischer Widerstand', ['R = U / I', 'Ohm'], 'Der elektrische Widerstand gibt an, wie stark ein Bauteil den Stromfluss hemmt: R = U / I. Die Einheit ist 1 Ohm = 1 V/A.'],
      ['Ohmsches Gesetz', ['Proportionalität', 'Temperatur'], 'Bei konstanter Temperatur ist die Stromstärke durch einen metallischen Leiter proportional zur angelegten Spannung.'],
      ['Spezifischer Widerstand', ['Leiterlänge', 'Querschnitt'], 'Der Widerstand eines Drahtes wächst mit seiner Länge und sinkt mit seinem Querschnitt: R = ρ · l / A.'],
    ],
  },
  {
    file: '02_Elektrizitaetslehre/02_Widerstand/versuch-kennlinien.pdf', title: 'Versuch: Kennlinien aufnehmen', type: 'Versuch', level: 'Mittelstufe',
    tags: ['Experiment', 'Kennlinie', 'Widerstand', 'Messwerte'],
    summary: 'U-I-Kennlinien eines Konstantandrahts und einer Glühlampe messen und vergleichen.',
    chapters: [
      ['Aufbau', ['Netzgerät', 'Multimeter'], 'Ein Bauteil wird an ein regelbares Netzgerät angeschlossen. Ein Multimeter misst die Stromstärke, ein zweites die Spannung.'],
      ['Durchführung', ['Messreihe'], 'Die Spannung wird in Schritten von 1 V erhöht und jeweils die Stromstärke notiert – zuerst für einen Konstantandraht, dann für eine Glühlampe.'],
      ['Auswertung', ['U-I-Kennlinie', 'Glühlampe'], 'Der Konstantandraht liefert eine Ursprungsgerade. Bei der Glühlampe flacht die Kennlinie ab, weil ihr Widerstand mit der Temperatur steigt.'],
    ],
  },
  {
    file: '02_Elektrizitaetslehre/03_Magnetismus/magnetfelder.pdf', title: 'Magnetfelder', type: 'Grundwissen', level: 'Unterstufe',
    tags: ['Magnetfeld', 'Feldlinien', 'Elektromagnet', 'Kompass'],
    summary: 'Dauermagnete, Feldlinienbilder und der Elektromagnet.',
    chapters: [
      ['Dauermagnete', ['Nordpol', 'Südpol'], 'Jeder Magnet hat einen Nord- und einen Südpol. Gleichnamige Pole stoßen sich ab, ungleichnamige ziehen sich an.'],
      ['Feldlinien', ['Feldlinienbild', 'Eisenfeilspäne'], 'Magnetfelder werden durch Feldlinien veranschaulicht. Sie verlaufen außerhalb des Magneten vom Nord- zum Südpol.'],
      ['Elektromagnet', ['Spule', 'Eisenkern', 'Oersted'], 'Ein stromdurchflossener Leiter ist von einem Magnetfeld umgeben. In einer Spule mit Eisenkern entsteht so ein starker, schaltbarer Magnet.'],
    ],
  },
  {
    file: '02_Elektrizitaetslehre/03_Magnetismus/induktion.pdf', title: 'Elektromagnetische Induktion', type: 'Grundwissen', level: 'Oberstufe',
    tags: ['Induktion', 'Magnetfeld', 'Generator', 'Transformator'],
    summary: 'Induktionsspannung, Lenzsche Regel und die Anwendungen Generator und Transformator.',
    chapters: [
      ['Induktionsspannung', ['magnetischer Fluss', 'Faraday'], 'Ändert sich der magnetische Fluss durch eine Spule, wird in ihr eine Spannung induziert.'],
      ['Lenzsche Regel', ['Gegenwirkung'], 'Der Induktionsstrom ist stets so gerichtet, dass er seiner Ursache entgegenwirkt.'],
      ['Generator und Transformator', ['Wechselspannung', 'Windungszahl'], 'Im Generator rotiert eine Spule im Magnetfeld und erzeugt Wechselspannung. Ein Transformator wandelt Spannungen im Verhältnis der Windungszahlen um.'],
    ],
  },

  // --- Optik --------------------------------------------------------------------
  {
    file: '03_Optik/01_Strahlenoptik/reflexion.pdf', title: 'Reflexion des Lichts', type: 'Grundwissen', level: 'Unterstufe',
    tags: ['Licht', 'Reflexion', 'Spiegel', 'Reflexionsgesetz'],
    summary: 'Geradlinige Lichtausbreitung, das Reflexionsgesetz und Bilder am ebenen Spiegel.',
    chapters: [
      ['Lichtausbreitung', ['Lichtstrahl', 'Schatten'], 'Licht breitet sich in einem homogenen Medium geradlinig aus. Das zeigt sich zum Beispiel an scharfen Schatten.'],
      ['Reflexionsgesetz', ['Einfallswinkel', 'Reflexionswinkel', 'Lot'], 'Einfallswinkel und Reflexionswinkel sind gleich groß. Beide Winkel werden zum Einfallslot gemessen.'],
      ['Spiegelbilder', ['ebener Spiegel', 'virtuelles Bild'], 'Ein ebener Spiegel erzeugt ein virtuelles, gleich großes Bild, das genauso weit hinter dem Spiegel erscheint, wie der Gegenstand davor steht.'],
    ],
  },
  {
    file: '03_Optik/01_Strahlenoptik/brechung.pdf', title: 'Brechung des Lichts', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Licht', 'Brechung', 'Brechungsgesetz', 'Totalreflexion'],
    summary: 'Brechung an Grenzflächen, das Brechungsgesetz von Snellius und die Totalreflexion.',
    chapters: [
      ['Brechung an Grenzflächen', ['optisch dichter', 'Lot'], 'Tritt Licht schräg von Luft in Wasser oder Glas über, wird es zum Lot hin gebrochen. Beim Übergang ins optisch dünnere Medium wird es vom Lot weg gebrochen.'],
      ['Brechungsgesetz', ['Snellius', 'Brechzahl'], 'Das Brechungsgesetz von Snellius lautet n1 · sin(α) = n2 · sin(β). Die Brechzahl n beschreibt, wie stark ein Stoff das Licht verlangsamt.'],
      ['Totalreflexion', ['Grenzwinkel', 'Glasfaser'], 'Überschreitet der Einfallswinkel beim Übergang ins optisch dünnere Medium den Grenzwinkel, wird das Licht vollständig reflektiert. Glasfasern nutzen diesen Effekt.'],
    ],
  },
  {
    file: '03_Optik/01_Strahlenoptik/linsen.pdf', title: 'Linsen und optische Abbildung', type: 'Grundwissen', level: 'Mittelstufe',
    tags: ['Linse', 'Brennweite', 'Abbildung', 'Linsengleichung'],
    summary: 'Sammel- und Zerstreuungslinsen, Bildkonstruktion, Linsengleichung sowie Auge und Brille.',
    chapters: [
      ['Sammel- und Zerstreuungslinsen', ['Brennpunkt', 'Brennweite'], 'Sammellinsen bündeln parallel einfallendes Licht im Brennpunkt. Der Abstand zwischen Linse und Brennpunkt heißt Brennweite f.'],
      ['Bildkonstruktion', ['Parallelstrahl', 'Mittelpunktstrahl', 'Brennpunktstrahl'], 'Mit drei ausgezeichneten Strahlen – Parallel-, Mittelpunkt- und Brennpunktstrahl – lässt sich das Bild eines Gegenstands konstruieren.'],
      ['Linsengleichung', ['1/f = 1/g + 1/b', 'Abbildungsmaßstab'], 'Gegenstandsweite g, Bildweite b und Brennweite f hängen über 1/f = 1/g + 1/b zusammen.'],
      ['Auge und Brille', ['Kurzsichtigkeit', 'Weitsichtigkeit'], 'Das Auge bildet mit einer veränderlichen Linse auf die Netzhaut ab. Brillen korrigieren Kurz- und Weitsichtigkeit.'],
    ],
  },
  {
    file: '03_Optik/02_Wellenoptik/doppelspalt.pdf', title: 'Interferenz am Doppelspalt', type: 'Grundwissen', level: 'Oberstufe',
    tags: ['Interferenz', 'Welle', 'Doppelspalt', 'Wellenlänge'],
    summary: 'Huygenssches Prinzip, Interferenzmuster hinter dem Doppelspalt und die Bestimmung der Wellenlänge.',
    chapters: [
      ['Huygenssches Prinzip', ['Elementarwelle'], 'Jeder Punkt einer Wellenfront ist Ausgangspunkt einer neuen Elementarwelle.'],
      ['Interferenzmuster', ['Gangunterschied', 'Maximum', 'Minimum'], 'Hinter einem Doppelspalt überlagern sich die Wellen. Beträgt der Gangunterschied ein ganzzahliges Vielfaches der Wellenlänge, entstehen helle Maxima.'],
      ['Wellenlänge bestimmen', ['Schirmabstand', 'Spaltabstand'], 'Aus Spaltabstand d, Schirmabstand a und dem Abstand benachbarter Maxima lässt sich die Wellenlänge des Lichts bestimmen.'],
    ],
  },
  {
    file: '03_Optik/02_Wellenoptik/versuch-gitter.pdf', title: 'Versuch: Wellenlänge mit dem Gitter', type: 'Versuch', level: 'Oberstufe',
    tags: ['Beugung', 'Gitter', 'Wellenlänge', 'Experiment', 'Laser'],
    summary: 'Bestimmung der Wellenlänge eines Lasers mit einem optischen Gitter.',
    chapters: [
      ['Aufbau', ['Laser', 'Gitterkonstante'], 'Ein Laserstrahl fällt senkrecht auf ein optisches Gitter. Auf einem entfernten Schirm erscheinen helle Punkte.'],
      ['Messung', ['Abstand der Maxima'], 'Gemessen werden der Abstand Gitter–Schirm und der Abstand der Maxima erster Ordnung zum Hauptmaximum.'],
      ['Auswertung', ['sin(α) = λ / g'], 'Mit sin(α) = λ / g ergibt sich die Wellenlänge. Für einen roten Laser erhält man etwa 650 nm.'],
    ],
  },
  {
    // Absichtlich OHNE Sidecar: zeigt, wie ein noch nicht katalogisiertes Dokument erscheint.
    file: '03_Optik/02_Wellenoptik/polarisation.pdf', title: 'Polarisation des Lichts', type: 'Grundwissen', level: 'Oberstufe', noMeta: true,
    tags: [], summary: 'Licht als Transversalwelle: Polarisationsfilter, Gesetz von Malus und Polarisation durch Reflexion.',
    chapters: [
      ['Transversalwellen', ['Schwingungsrichtung'], 'Nur Transversalwellen lassen sich polarisieren. Dass Licht polarisiert werden kann, zeigt, dass es eine Transversalwelle ist.'],
      ['Polarisationsfilter', ['Gesetz von Malus'], 'Ein Polarisationsfilter lässt nur Licht einer Schwingungsrichtung passieren. Zwei gekreuzte Filter sind undurchlässig.'],
      ['Brewster-Winkel', ['Reflexion'], 'Unter dem Brewster-Winkel reflektiertes Licht ist vollständig polarisiert. Das nutzen Polarisationsbrillen gegen Blendung.'],
    ],
  },

  // --- Wärmelehre ---------------------------------------------------------------
  {
    file: '04_Waermelehre/01_Temperatur_und_Waerme/teilchenmodell.pdf', title: 'Temperatur und Teilchenmodell', type: 'Grundwissen', level: 'Unterstufe',
    tags: ['Temperatur', 'Teilchenmodell', 'Aggregatzustand', 'Kelvin'],
    summary: 'Das Teilchenmodell, Celsius- und Kelvin-Skala sowie die Aggregatzustände.',
    chapters: [
      ['Das Teilchenmodell', ['Brownsche Bewegung'], 'Alle Stoffe bestehen aus kleinsten Teilchen, die sich ständig bewegen. Je höher die Temperatur, desto schneller bewegen sie sich.'],
      ['Temperaturskalen', ['Celsius', 'Kelvin', 'absoluter Nullpunkt'], 'Neben der Celsius-Skala verwendet die Physik die Kelvin-Skala. Der absolute Nullpunkt liegt bei 0 K = −273,15 °C.'],
      ['Aggregatzustände', ['fest', 'flüssig', 'gasförmig', 'Schmelzen'], 'Ob ein Stoff fest, flüssig oder gasförmig ist, hängt von Temperatur und Druck ab. Beim Schmelzen und Verdampfen wird Energie benötigt.'],
    ],
  },
  {
    file: '04_Waermelehre/01_Temperatur_und_Waerme/waermekapazitaet.pdf', title: 'Wärmekapazität', type: 'Aufgaben', level: 'Mittelstufe',
    tags: ['Wärme', 'spezifische Wärmekapazität', 'Energie', 'Übungsaufgaben'],
    summary: 'Die Grundgleichung der Wärmelehre und eine Aufgabe zum Wasserkocher.',
    chapters: [
      ['Grundlagen', ['Q = c · m · ΔT'], 'Die zum Erwärmen nötige Wärme ist Q = c · m · ΔT. Wasser hat mit c = 4,19 kJ/(kg·K) eine besonders große spezifische Wärmekapazität.'],
      ['Aufgabe: Wasserkocher', ['Leistung', 'Wirkungsgrad'], 'Ein Wasserkocher mit 2000 W erwärmt 1,5 l Wasser von 20 °C auf 100 °C. Wie lange dauert das mindestens?'],
      ['Lösungen', ['Lösung'], 'Q = 4,19 kJ/(kg·K) · 1,5 kg · 80 K ≈ 503 kJ; t = Q / P ≈ 251 s, also gut 4 Minuten.'],
    ],
  },
  {
    file: '04_Waermelehre/02_Thermodynamik/hauptsaetze.pdf', title: 'Hauptsätze der Thermodynamik', type: 'Grundwissen', level: 'Oberstufe',
    tags: ['Thermodynamik', 'Energie', 'Entropie', 'Wärme'],
    summary: 'Erster, zweiter und dritter Hauptsatz: Energieerhaltung, Entropie und der absolute Nullpunkt.',
    chapters: [
      ['Erster Hauptsatz', ['innere Energie', 'ΔU = Q + W'], 'Die Änderung der inneren Energie eines Systems ist gleich der Summe aus zugeführter Wärme und verrichteter Arbeit: ΔU = Q + W.'],
      ['Zweiter Hauptsatz', ['Entropie', 'Irreversibilität'], 'Wärme fließt von selbst nur vom wärmeren zum kälteren Körper. In einem abgeschlossenen System nimmt die Entropie nie ab.'],
      ['Dritter Hauptsatz', ['absoluter Nullpunkt'], 'Der absolute Nullpunkt der Temperatur ist prinzipiell nicht erreichbar.'],
    ],
  },
  {
    file: '04_Waermelehre/02_Thermodynamik/waermekraftmaschinen.pdf', title: 'Wärmekraftmaschinen', type: 'Grundwissen', level: 'Oberstufe',
    tags: ['Wärmekraftmaschine', 'Wirkungsgrad', 'Motor', 'Energie'],
    summary: 'Funktionsprinzip und Wirkungsgrad von Wärmekraftmaschinen mit Beispielen vom Ottomotor bis zur Wärmepumpe.',
    chapters: [
      ['Funktionsprinzip', ['Arbeitsmedium', 'Wärmereservoir'], 'Eine Wärmekraftmaschine nimmt Wärme aus einem heißen Reservoir auf, wandelt einen Teil davon in Arbeit um und gibt den Rest an ein kaltes Reservoir ab.'],
      ['Wirkungsgrad', ['η = W / Q'], 'Der Wirkungsgrad η gibt an, welcher Anteil der zugeführten Wärme in mechanische Arbeit umgewandelt wird.'],
      ['Beispiele', ['Ottomotor', 'Dampfturbine', 'Wärmepumpe'], 'Ottomotor, Dieselmotor und Dampfturbine sind Wärmekraftmaschinen. Eine Wärmepumpe arbeitet nach demselben Prinzip in umgekehrter Richtung.'],
    ],
  },
  {
    file: '04_Waermelehre/02_Thermodynamik/01_Kreisprozesse/carnot-prozess.pdf', title: 'Der Carnot-Prozess', type: 'Grundwissen', level: 'Oberstufe',
    tags: ['Kreisprozess', 'Carnot', 'Wirkungsgrad', 'Thermodynamik'],
    summary: 'Die vier Takte des Carnot-Prozesses, seine Darstellung im p-V-Diagramm und der maximale Wirkungsgrad.',
    chapters: [
      ['Die vier Takte', ['isotherm', 'adiabatisch'], 'Der Carnot-Prozess besteht aus zwei isothermen und zwei adiabatischen Zustandsänderungen eines idealen Gases.'],
      ['p-V-Diagramm', ['Arbeit als Fläche'], 'Im p-V-Diagramm umschließt der Prozess eine Fläche. Sie entspricht der pro Umlauf verrichteten Arbeit.'],
      ['Carnot-Wirkungsgrad', ['η = 1 − T_k / T_w'], 'Der Carnot-Wirkungsgrad η = 1 − T_k / T_w ist der größtmögliche Wirkungsgrad einer Wärmekraftmaschine zwischen zwei Temperaturen.'],
    ],
  },
];

// Ein HTML-Dokument, um zu zeigen, dass nicht nur PDFs funktionieren (Kapitel = Anker).
const HTML_DOC = {
  file: '03_Optik/01_Strahlenoptik/arbeitsblatt-reflexion.html', title: 'Arbeitsblatt: Reflexion am Spiegel', type: 'Arbeitsblatt', level: 'Unterstufe',
  tags: ['Reflexion', 'Spiegel', 'Reflexionsgesetz', 'Übungsaufgaben'],
  summary: 'Interaktives HTML-Arbeitsblatt: Reflexionsgesetz anwenden, Winkel bestimmen und Spiegelbilder konstruieren.',
  chapters: [
    { title: 'Teil 1: Winkel bestimmen', anchor: 'teil-1', keywords: ['Einfallswinkel', 'Reflexionswinkel'] },
    { title: 'Teil 2: Spiegelbild konstruieren', anchor: 'teil-2', keywords: ['virtuelles Bild', 'ebener Spiegel'] },
    { title: 'Teil 3: Periskop', anchor: 'teil-3', keywords: ['Periskop', 'Anwendung'] },
  ],
};

// ---------------------------------------------------------------------------
// Minimaler PDF-Writer (Helvetica, WinAnsiEncoding, unkomprimiert)
// ---------------------------------------------------------------------------

const WIN_ANSI = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '›': 0x9b };
const TRANSLIT = { 'Δ': 'Delta ', 'η': 'eta', 'ρ': 'rho', 'λ': 'lambda', 'α': 'alpha', 'β': 'beta', 'μ': 'µ', '−': '-', '→': '->', '≈': '~' };

function pdfText(str) {
  let out = '';
  for (const ch of str) {
    if (TRANSLIT[ch]) { out += pdfText(TRANSLIT[ch]); continue; }
    const code = WIN_ANSI[ch] ?? ch.codePointAt(0);
    const c = String.fromCharCode(code < 256 ? code : 0x3f);
    out += c === '(' || c === ')' || c === '\\' ? '\\' + c : c;
  }
  return out;
}

function wrap(text, size, width) {
  const maxChars = Math.floor(width / (size * 0.5));
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > maxChars) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(' ');
}

class Page {
  constructor() { this.ops = []; }
  text(x, y, str, { size = 11, bold = false, color = '0.12 0.12 0.14' } = {}) {
    this.ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg ${x} ${y} Td (${pdfText(str)}) Tj ET`);
  }
  para(x, y, str, { size = 11, lead = 1.45, width = 495, ...rest } = {}) {
    for (const line of wrap(str, size, width)) { this.text(x, y, line, { size, ...rest }); y -= size * lead; }
    return y;
  }
  rect(x, y, w, h, color) { this.ops.push(`${color} rg ${x} ${y} ${w} ${h} re f`); }
  line(x1, y1, x2, y2, color = '0.8 0.8 0.82') { this.ops.push(`${color} RG 0.8 w ${x1} ${y1} m ${x2} ${y2} l S`); }
}

function buildPdf(pages, title) {
  const objs = [];
  const add = (body) => { objs.push(body); return objs.length; };
  const catalogId = add(null);
  const pagesId = add(null);
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  for (const p of pages) {
    const stream = p.ops.join('\n');
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objs[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R /PageMode /UseNone >>`;
  objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const infoId = add(`<< /Title (${pdfText(title)}) /Producer (leifi-like-lib mock generator) >>`);

  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [];
  objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

function areaOf(file) {
  const parts = file.split('/');
  const area = CATEGORIES[parts[0]];
  const crumbs = [];
  for (let i = 1; i <= parts.length - 1; i++) crumbs.push(CATEGORIES[parts.slice(0, i).join('/')].title);
  return { area, crumbs };
}

function makePdf(doc) {
  const { area, crumbs } = areaOf(doc.file);
  const color = hexToRgb(area.color);
  const header = (p, n) => {
    p.rect(0, 798, 595, 44, color);
    p.text(50, 814, crumbs.join('  ›  '), { size: 10, bold: true, color: '1 1 1' });
    p.text(470, 814, doc.type, { size: 10, color: '1 1 1' });
    p.line(50, 50, 545, 50);
    p.text(50, 34, `${doc.title}  ·  Mock-Dokument (Proof of Concept)`, { size: 8, color: '0.45 0.45 0.5' });
    p.text(520, 34, `Seite ${n}`, { size: 8, color: '0.45 0.45 0.5' });
  };

  const pages = [];
  const cover = new Page();
  header(cover, 1);
  let y = 740;
  for (const l of wrap(doc.title, 26, 495)) { cover.text(50, y, l, { size: 26, bold: true }); y -= 32; }
  y -= 4;
  cover.text(50, y, `${doc.type}  ·  ${doc.level}`, { size: 11, color: color }); y -= 30;
  y = cover.para(50, y, doc.summary, { size: 12 }); y -= 24;
  cover.text(50, y, 'Inhalt', { size: 14, bold: true }); y -= 8;
  cover.line(50, y, 545, y); y -= 20;
  doc.chapters.forEach(([title], i) => {
    cover.text(60, y, `${i + 1}.  ${title}`, { size: 12 });
    cover.text(510, y, String(i + 2), { size: 12, color: '0.45 0.45 0.5' });
    y -= 22;
  });
  y -= 20;
  cover.rect(50, y - 46, 495, 58, '0.95 0.95 0.97');
  cover.para(62, y - 6, 'Hinweis: Automatisch erzeugtes Mock-Dokument für den Proof of Concept. Im echten Einsatz liegen hier eure eigenen PDFs.', { size: 10, width: 470, color: '0.35 0.35 0.4' });
  pages.push(cover);

  doc.chapters.forEach(([title, keywords, text], i) => {
    const p = new Page();
    header(p, i + 2);
    let y = 750;
    p.text(50, y, `Kapitel ${i + 1}`, { size: 11, color }); y -= 24;
    for (const l of wrap(title, 20, 495)) { p.text(50, y, l, { size: 20, bold: true }); y -= 26; }
    y -= 10;
    y = p.para(50, y, text, { size: 12, lead: 1.55 }); y -= 20;
    p.rect(50, y - 30, 4, 40, color);
    p.text(64, y - 2, 'Schlagworte', { size: 10, bold: true, color: '0.35 0.35 0.4' });
    p.text(64, y - 20, keywords.join('  ·  '), { size: 10, color: '0.35 0.35 0.4' }); y -= 60;
    p.para(50, y, 'Platzhaltertext: An dieser Stelle würde im echten Dokument die ausführliche Herleitung mit Abbildungen, Beispielen und Tabellen stehen. Der Proof of Concept zeigt nur, dass Kapitel gezielt angesprungen werden können.', { size: 10, color: '0.55 0.55 0.6' });
    pages.push(p);
  });
  return buildPdf(pages, doc.title);
}

function makeHtml(doc) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${doc.title}</title>
<style>
  body { font: 16px/1.6 system-ui, "Segoe UI", sans-serif; max-width: 760px; margin: 0 auto; padding: 24px; color: #1d1d22; background: #fff; }
  h1 { color: #7b3fe4; margin-bottom: 0; }
  section { border-top: 2px solid #eee; margin-top: 32px; padding-top: 8px; }
  .task { background: #f5f2fd; border-left: 4px solid #7b3fe4; padding: 12px 16px; border-radius: 6px; }
  input { font: inherit; width: 5em; }
  .ok { color: #2b8a3e; font-weight: 600; } .bad { color: #c92a2a; font-weight: 600; }
  svg { max-width: 100%; height: auto; }
</style>
</head>
<body>
<h1>${doc.title}</h1>
<p>Mock-Arbeitsblatt (HTML) – zeigt, dass die Bibliothek auch andere Dokumenttypen als PDF darstellen kann.</p>

<section id="teil-1">
  <h2>Teil 1: Winkel bestimmen</h2>
  <svg viewBox="0 0 400 200" role="img" aria-label="Lichtstrahl wird an einem Spiegel reflektiert">
    <rect x="40" y="170" width="320" height="8" fill="#adb5bd"/>
    <line x1="200" y1="170" x2="200" y2="30" stroke="#868e96" stroke-dasharray="6 4"/>
    <line x1="80" y1="50" x2="200" y2="170" stroke="#f08c00" stroke-width="3"/>
    <line x1="200" y1="170" x2="320" y2="50" stroke="#f08c00" stroke-width="3"/>
    <text x="150" y="110" font-size="14">α</text><text x="235" y="110" font-size="14">α'</text>
  </svg>
  <div class="task">
    Ein Lichtstrahl trifft unter einem Einfallswinkel von 35° auf einen ebenen Spiegel.
    Wie groß ist der Reflexionswinkel?
    <p><input id="a1" type="number"> ° <button onclick="check()">Prüfen</button> <span id="r1"></span></p>
  </div>
</section>

<section id="teil-2">
  <h2>Teil 2: Spiegelbild konstruieren</h2>
  <div class="task">Eine Kerze steht 40 cm vor einem ebenen Spiegel. In welcher Entfernung von der Kerze siehst du ihr Spiegelbild?
  Begründe mit dem Reflexionsgesetz.</div>
  <details><summary>Lösung anzeigen</summary><p>Das Bild liegt 40 cm hinter dem Spiegel, also 80 cm von der Kerze entfernt.</p></details>
</section>

<section id="teil-3">
  <h2>Teil 3: Periskop</h2>
  <div class="task">Ein Periskop besteht aus zwei parallelen, um 45° geneigten Spiegeln. Skizziere den Strahlengang und erkläre, warum das Bild aufrecht ist.</div>
  <details><summary>Lösung anzeigen</summary><p>Jeder Spiegel lenkt das Licht um 90° um. Durch die doppelte Reflexion ist das Bild wieder aufrecht und seitenrichtig.</p></details>
</section>

<script>
  function check() {
    var v = Number(document.getElementById('a1').value), r = document.getElementById('r1');
    r.textContent = v === 35 ? 'Richtig – Einfallswinkel = Reflexionswinkel.' : 'Noch nicht – denk an das Reflexionsgesetz.';
    r.className = v === 35 ? 'ok' : 'bad';
  }
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------

function write(rel, data) {
  const abs = join(LIB, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, data);
}
const json = (o) => JSON.stringify(o, null, 2) + '\n';

for (const [path, meta] of Object.entries(CATEGORIES)) write(`${path}/_category.json`, json(meta));

for (const doc of DOCS) {
  write(doc.file, makePdf(doc));
  if (doc.noMeta) continue;
  write(`${doc.file}.meta.json`, json({
    title: doc.title,
    type: doc.type,
    level: doc.level,
    tags: doc.tags,
    summary: doc.summary,
    chapters: doc.chapters.map(([title, keywords], i) => ({ title, page: i + 2, keywords })),
  }));
}

write(HTML_DOC.file, makeHtml(HTML_DOC));
const { file, ...htmlMeta } = HTML_DOC;
write(`${file}.meta.json`, json(htmlMeta));

console.log(`Mock-Bibliothek erzeugt: ${Object.keys(CATEGORIES).length} Kategorien, ${DOCS.length + 1} Dokumente in ${LIB}`);
