import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// 🔑 Deine Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyCcfDmj42JpXqUl2GMsEcYxTu4bYVIPKB4",
  authDomain: "filmkatalog-d926d.firebaseapp.com",
  projectId: "filmkatalog-d926d",
  storageBucket: "filmkatalog-d926d.firebasestorage.app",
  messagingSenderId: "135910725774",
  appId: "1:135910725774:web:84546af4c38eb691c591df"
};

// 🔧 Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tmdbApiKey = '1d7a23e91b060bc48d6b26e4eacca83c';

const startScannerBtn = document.getElementById('startScanner');
const scannerDiv = document.getElementById('scanner');
const codeOutput = document.getElementById('codeOutput');
const moviesDiv = document.getElementById('movies');

let html5QrcodeScanner;

startScannerBtn.addEventListener('click', async () => {
  if (!html5QrcodeScanner) html5QrcodeScanner = new Html5Qrcode("scanner");

  scannerDiv.style.display = 'block';
  await html5QrcodeScanner.start({ facingMode: "environment" }, { fps:10, qrbox:250 },
    async (decodedText) => {
      scannerDiv.style.display = 'none';
      await html5QrcodeScanner.stop();
      codeOutput.textContent = `Scanne: ${decodedText}`;
      await processBarcode(decodedText);
      loadAndShowMovies();
    },
    err => {}
  );
});

async function processBarcode(barcode) {
  let title = barcode;

  // ➤ Produkttitel über UPC holen
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    const data = await response.json();
    if (data.code === "OK" && data.items.length > 0) {
      title = data.items[0].title;
    }
  } catch (error) {
    console.warn("UPCitemDB Fehler:", error);
  }

  // ➤ TMDb-Abfrage
  try {
    const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`);
    const tmdbData = await tmdbResponse.json();

    if (tmdbData.results && tmdbData.results.length > 0) {
      const m = tmdbData.results[0];
      const film = {
        barcode,
        tmdbId: m.id,
        title: m.title,
        year: m.release_date?.split('-')[0] || '',
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : ''
      };
      await saveMovie(film);
      showTempInfo(film);
    } else {
      codeOutput.textContent = `Kein Film gefunden: ${title}`;
    }
  } catch (e) {
    console.error("TMDb Fehler:", e);
    codeOutput.textContent = 'Fehler beim Abrufen der Filmdaten';
  }
}

async function saveMovie(film) {
  await setDoc(doc(db, "movies", film.barcode), film);
}

function showTempInfo(film) {
  codeOutput.innerHTML = `
    <strong>${film.title} (${film.year})</strong><br/>
    ${film.poster ? `<img src="${film.poster}" style="max-width:150px; margin-top:10px;">` : ''}
  `;
}

// ➤ Anzeige aller Filme
async function loadAndShowMovies() {
  const snap = await getDocs(collection(db, "movies"));
  const movies = [];
  snap.forEach(doc => movies.push(doc.data()));
  movies.sort((a, b) => a.title.localeCompare(b.title));

  moviesDiv.innerHTML = '';
  for (let i = 0; i < movies.length; i += 3) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'center';
    row.style.marginBottom = '10px';

    for (let j = 0; j < 3 && i + j < movies.length; j++) {
      const m = movies[i + j];
      const cell = document.createElement('div');
      cell.style.margin = '0 10px';
      cell.style.textAlign = 'center';
      cell.innerHTML = `
        <img src="${m.poster}" style="width:100px"><br>
        <small>${m.title}</small>
      `;
      row.appendChild(cell);
    }

    moviesDiv.appendChild(row);
  }
}

document.addEventListener('DOMContentLoaded', loadAndShowMovies);
