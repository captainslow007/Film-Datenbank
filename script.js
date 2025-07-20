const startBtn = document.getElementById("startScanner");
const scannerDiv = document.getElementById("scanner");
const codeOutput = document.getElementById("codeOutput");

let html5QrCode;

startBtn.addEventListener("click", async () => {
  if (html5QrCode) {
    // Stop scanner if already running
    await html5QrCode.stop();
    html5QrCode.clear();
    html5QrCode = null;
    scannerDiv.style.display = "none";
    startBtn.textContent = "🎯 Barcode scannen";
    return;
  }

  html5QrCode = new Html5Qrcode("scanner");
  scannerDiv.style.display = "block";
  startBtn.textContent = "🛑 Scanner stoppen";

  const config = { fps: 10, qrbox: 250 };

  html5QrCode
    .start({ facingMode: "environment" }, config,
      (decodedText, decodedResult) => {
        codeOutput.textContent = decodedText;
        // hier später: automatisch API aufrufen & Cover anzeigen
        console.log("Erkannt:", decodedText);
      },
      (errorMessage) => {
        // Fehler ignorieren
      }
    )
    .catch(err => {
      console.error("Fehler beim Start des Scanners:", err);
    });
});