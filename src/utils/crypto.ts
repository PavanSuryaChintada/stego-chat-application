// AES-256-GCM encryption/decryption utilities using Web Crypto API

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a key from a password
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text with optional passcode
 */
export async function encryptMessage(
  plaintext: string,
  passcode?: string
): Promise<{ ciphertext: string; metadata: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  let key: CryptoKey;
  let salt: Uint8Array | null = null;
  
  if (passcode) {
    // Derive key from passcode
    salt = crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKey(passcode, salt);
  } else {
    // Generate random key
    key = await generateKey();
  }
  
  // Encrypt the message
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  );
  
  // Export key if not using passcode
  const exportedKey = passcode ? null : await crypto.subtle.exportKey('raw', key);
  
  // Create metadata object
  const metadata = {
    iv: Array.from(iv),
    hasPasscode: !!passcode,
    salt: salt ? Array.from(salt) : null,
    key: exportedKey ? Array.from(new Uint8Array(exportedKey as ArrayBuffer)) : null
  };
  
  // Convert encrypted data to base64
  const ciphertextArray = new Uint8Array(encrypted);
  const ciphertext = btoa(String.fromCharCode(...ciphertextArray));
  
  // Convert metadata to base64
  const metadataStr = btoa(JSON.stringify(metadata));
  
  return { ciphertext, metadata: metadataStr };
}

/**
 * Decrypt message with optional passcode
 */
export async function decryptMessage(
  ciphertext: string,
  metadata: string,
  passcode?: string
): Promise<string> {
  try {
    // Parse metadata
    const metadataObj = JSON.parse(atob(metadata));
    const iv = new Uint8Array(metadataObj.iv);
    
    let key: CryptoKey;
    
    if (metadataObj.hasPasscode) {
      if (!passcode) {
        throw new Error('Passcode required');
      }
      const salt = new Uint8Array(metadataObj.salt);
      key = await deriveKey(passcode, salt);
    } else {
      // Import the key
      const keyArray = new Uint8Array(metadataObj.key);
      key = await crypto.subtle.importKey(
        'raw',
        keyArray,
        'AES-GCM',
        false,
        ['decrypt']
      );
    }
    
    // Convert base64 ciphertext to Uint8Array
    const ciphertextArray = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertextArray
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message. Invalid passcode or corrupted data.');
  }
}
