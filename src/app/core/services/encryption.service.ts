import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  /**
   * Encrypt data using AES encryption (matching original implementation)
   */
  encryptId(id: string): string {
    return this.encryptAccountId(id);
  }

  /**
   * Encrypt account ID (same as encryptId, matching original encryptAccountId)
   */
  encryptAccountId(id: string): string {
    const key = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encryptedid = CryptoJS.AES.encrypt(String(id), key, { iv: iv });
    let cipherDataid = iv.toString(CryptoJS.enc.Base64) + ":" + 
                      encryptedid.ciphertext.toString() + ":" + 
                      key.toString(CryptoJS.enc.Base64);

    // Replace + with PAM
    let indexid = cipherDataid.indexOf('+');
    while (indexid !== -1) {
      cipherDataid = cipherDataid.replace('+', 'PAM');
      indexid = cipherDataid.indexOf('+');
    }

    // Replace / with CBZ
    indexid = cipherDataid.indexOf('/');
    while (indexid !== -1) {
      cipherDataid = cipherDataid.replace('/', 'CBZ');
      indexid = cipherDataid.indexOf('/');
    }

    return cipherDataid;
  }
decryptUsername(value: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse('3Hbfh997adMkEJ78');

    const decrypted = CryptoJS.AES.decrypt(
      value,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '';
  }
}
  decryptId(id: string): string | null {
  try {
    if (!id) return null;

    // Same replacements
    id = id.replaceAll('PAM', '+');
    id = id.replaceAll('CBZ', '/');

    // Split like Java: iv:hexEncrypted:key
    const data2 = id.split(':');
    const ivBase64 = data2[0];
    const encryptedHex = data2[1];
    const keyBase64 = data2[2];

    // Convert Base64 -> WordArray
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const key = CryptoJS.enc.Base64.parse(keyBase64);

    // Convert HEX -> WordArray (Java used hexStringToByteArray)
    const cipherBytes = CryptoJS.enc.Hex.parse(encryptedHex);

    // Java: Base64.getEncoder().encode(encryptedByteData)
    // So convert bytes to Base64 string
    const cipherBase64 = CryptoJS.enc.Base64.stringify(cipherBytes);

    // AES Decrypt (CBC + PKCS7 is most common in Java)
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(cipherBase64) } as any,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const plainText = decrypted.toString(CryptoJS.enc.Utf8);

    return plainText || null;
  } catch (err) {
    // console.error('decryptId error:', err);
    return null;
  }
}
encryptPassword(password: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse('3Hbfh997adMkEJ78'); // same as decryptUsername

    const encrypted = CryptoJS.AES.encrypt(
      password,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    return encrypted.toString(); // Base64 output

  } catch (e) {
    return password;
  }
}
}
