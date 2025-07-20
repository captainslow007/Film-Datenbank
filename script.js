const startScannerBtn = document.getElementById('startScanner');
const scannerDiv = document.getElementById('scanner');
const codeOutput = document.getElementById('codeOutput');

const apiKey = 'http://www.omdbapi.com/?i=tt3896198&apikey=4926b34f'; // <== Hier deinen echten API-Key eintragen

let html5QrcodeScanner;

startScannerBtn.addEventListener('click', () => {
  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5Qrcode("scanner");
  }

  scannerDiv.style.display = 'block';

  html5QrcodeScanner.start(
    { facingMode: "environment" }, 
    {
      fps: 10,
      qrbox: 250
    },
    async (decodedText, decodedResult) => {
      console.log(`Code gescannt: ${decodedText}`);
      codeOutput.textContent = `Scanne: ${decodedText}`;
      
      // Stoppe den Scanner nach dem ersten Scan
      await html5QrcodeScanner.stop();
      scannerDiv.style.display = 'none';

      // Hole Filmdaten von OMDb
      fetchFilmData(decodedText);
    },
    (errorMessage) => {
      // optional: Fehler bei Scan anzeigen
      console.warn(`Scan error: ${errorMessage}`);
    }
  ).catch(err => {
    console.error(`Scanner konnte nicht gestartet werden: ${err}`);
  });
});

async function fetchFilmData(barcode) {
  try {
    // OMDb sucht normalerweise nach IMDb-ID oder Titel
    // Barcode ist meist eine EAN, die OMDb nicht direkt erkennt.
    // Deshalb versuchen wir es als "i" (IMDb-ID) oder "t" (Titel) — hier direkt mit "i" nicht möglich
    // Alternative: Barcode als "upc" geht nur mit TMDb (wäre besser)
    // Für jetzt: Wir nutzen die Barcode als Suchstring "s" (Search)

    const url = `https://www.omdbapi.com/?apikey=${apiKey}&type=movie&s=${barcode}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "True" && data.Search && data.Search.length > 0) {
      // Nimm den ersten Suchtreffer
      const film = data.Search[0];
      showFilmInfo(film);
    } else {
      codeOutput.textContent = `Kein Film gefunden für Code: ${barcode}`;
    }
  } catch (error) {
    console.error(error);
    codeOutput.textContent = `Fehler beim Abrufen der Filmdaten`;
  }
}

function showFilmInfo(film) {
  codeOutput.innerHTML = `
    <strong>${film.Title} (${film.Year})</strong><br/>
    <img src="${film.Poster !== "N/A" ? film.Poster : ''}" alt="Filmcover" style="max-width: 150px; margin-top: 10px;" />
  `;
}
