// LSB (Least Significant Bit) steganography for hiding encrypted messages in images

interface StegoPayload {
  version: number;
  ciphertext: string;
  metadata: string;
  checksum: string;
}

/**
 * Calculate simple checksum for validation
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Hide encrypted message in an image using LSB steganography
 */
export async function hideMessageInImage(
  imageFile: File,
  ciphertext: string,
  metadata: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Create structured payload with checksum
          const payloadObj: StegoPayload = {
            version: 1,
            ciphertext,
            metadata,
            checksum: calculateChecksum(ciphertext + metadata)
          };
          
          const payloadStr = JSON.stringify(payloadObj);
          console.log('[STEGO] Embedding payload length:', payloadStr.length);
          
          // Convert payload to binary
          const binaryPayload = stringToBinary(payloadStr);
          
          // Add length header (32 bits for length)
          const lengthBinary = (binaryPayload.length).toString(2).padStart(32, '0');
          const fullBinary = lengthBinary + binaryPayload;
          
          console.log('[STEGO] Total bits to embed:', fullBinary.length);
          
          // Check if image can hold the data
          const maxBits = data.length * 0.75; // Use 3 color channels (skip alpha)
          if (fullBinary.length > maxBits) {
            reject(new Error('Image too small to hide this message'));
            return;
          }
          
          // Hide data in LSB of RGB channels
          let bitIndex = 0;
          for (let i = 0; i < data.length && bitIndex < fullBinary.length; i++) {
            // Skip alpha channel
            if (i % 4 === 3) continue;
            
            // Replace LSB
            const bit = fullBinary[bitIndex];
            data[i] = (data[i] & 0xFE) | parseInt(bit);
            bitIndex++;
          }
          
          // Put modified image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          }, 'image/png', 1.0);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Extract encrypted message from a stego image
 */
export async function extractMessageFromImage(imageUrl: string): Promise<{ ciphertext: string; metadata: string } | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Handle Supabase storage URLs
    if (imageUrl.includes('supabase')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      try {
        console.log('[STEGO] Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          reject(new Error('CANVAS_CONTEXT_ERROR: Could not get canvas context'));
          return;
        }
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        console.log('[STEGO] Image data length:', data.length);
        
        // Extract length (first 32 bits) and track pixel position
        let lengthBinary = '';
        let pixelIndex = 0;
        
        // Extract length header from RGB channels only
        for (let i = 0; i < data.length && lengthBinary.length < 32; i++) {
          if (i % 4 === 3) continue; // Skip alpha channel
          lengthBinary += (data[i] & 1).toString();
          pixelIndex = i + 1; // Track where we stopped
        }
        
        const messageLength = parseInt(lengthBinary, 2);
        console.log('[STEGO] Extracted message length:', messageLength);
        
        // Validate length
        const maxBits = Math.floor(data.length * 0.75); // 3 out of 4 channels (RGB, skip alpha)
        if (messageLength <= 0 || messageLength > maxBits) {
          reject(new Error('DATA_LENGTH_ERROR: Invalid or corrupted data length'));
          return;
        }
        
        // Extract message bits starting from where length header ended
        let messageBinary = '';
        
        for (let i = pixelIndex; i < data.length && messageBinary.length < messageLength; i++) {
          // Skip alpha channel
          if (i % 4 === 3) continue;
          
          messageBinary += (data[i] & 1).toString();
        }
        
        console.log('[STEGO] Extracted bits:', messageBinary.length);
        
        if (messageBinary.length < messageLength) {
          reject(new Error('DATA_INCOMPLETE_ERROR: Could not extract complete message'));
          return;
        }
        
        // Convert binary to string
        const payloadStr = binaryToString(messageBinary);
        console.log('[STEGO] Payload string length:', payloadStr.length);
        
        // Parse JSON payload
        let payloadObj: StegoPayload;
        try {
          payloadObj = JSON.parse(payloadStr);
        } catch (parseError) {
          console.error('[STEGO] JSON parse error:', parseError);
          reject(new Error('PARSE_ERROR: Could not parse hidden data - image may be corrupted'));
          return;
        }
        
        // Validate payload structure
        if (!payloadObj.ciphertext || !payloadObj.metadata || !payloadObj.checksum) {
          reject(new Error('VALIDATION_ERROR: Invalid payload structure'));
          return;
        }
        
        // Verify checksum
        const expectedChecksum = calculateChecksum(payloadObj.ciphertext + payloadObj.metadata);
        if (payloadObj.checksum !== expectedChecksum) {
          reject(new Error('CHECKSUM_ERROR: Data integrity check failed - image may be corrupted or altered'));
          return;
        }
        
        console.log('[STEGO] Extraction successful, checksum validated');
        
        resolve({
          ciphertext: payloadObj.ciphertext,
          metadata: payloadObj.metadata
        });
      } catch (error) {
        console.error('[STEGO] Extraction error:', error);
        if (error instanceof Error && error.message.includes('ERROR:')) {
          reject(error);
        } else {
          reject(new Error('EXTRACTION_ERROR: Failed to extract message from image'));
        }
      }
    };
    
    img.onerror = (event) => {
      console.error('[STEGO] Image load error:', event);
      reject(new Error('IMAGE_LOAD_ERROR: Failed to load image - check if file is corrupted or inaccessible'));
    };
    
    // Add timestamp to prevent caching issues
    const urlWithTimestamp = imageUrl.includes('?') 
      ? `${imageUrl}&t=${Date.now()}` 
      : `${imageUrl}?t=${Date.now()}`;
    
    img.src = urlWithTimestamp;
  });
}

/**
 * Convert string to binary representation
 */
function stringToBinary(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes).map(byte => 
    byte.toString(2).padStart(8, '0')
  ).join('');
}

/**
 * Convert binary representation to string
 */
function binaryToString(binary: string): string {
  const bytes = binary.match(/.{8}/g) || [];
  const byteArray = new Uint8Array(bytes.map(byte => parseInt(byte, 2)));
  const decoder = new TextDecoder('utf-8', { fatal: true });
  return decoder.decode(byteArray);
}

/**
 * Load an image file as an Image element
 */
export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
