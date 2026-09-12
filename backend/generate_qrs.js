/**
 * Este script genera tokens aleatorios y únicos que servirán para los códigos QR impresos.
 * Cada vez que se corra, puede generar un lote de N tokens y guardarlos en un archivo para la imprenta.
 */

const fs = require('fs');
const crypto = require('crypto');

const BATCH_SIZE = 1000; // La cantidad de QRs que la imprenta pide como mínimo
const BASE_URL = 'https://nexoradar.com/qr/';

// Genera un string aleatorio corto (ej. A7F9X2)
function generateRandomToken(length = 6) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

function generateQRLiteBatch() {
  const tokens = new Set();
  
  // Aseguramos que no haya duplicados usando un Set
  while(tokens.size < BATCH_SIZE) {
    tokens.add(generateRandomToken());
  }

  const tokenList = Array.from(tokens);
  
  // En un caso real, aquí usaríamos una librería como 'qrcode' para generar imágenes .png
  // Por ahora, solo generamos el archivo de texto con las URLs para simular el proceso.
  let output = 'URL_PARA_QR\n';
  tokenList.forEach(token => {
    output += `${BASE_URL}${token}\n`;
  });

  fs.writeFileSync('qrs_para_imprenta.csv', output);
  console.log(`¡Éxito! Se han generado ${BATCH_SIZE} tokens únicos.`);
  console.log('El archivo qrs_para_imprenta.csv está listo para ser procesado.');
}

generateQRLiteBatch();
