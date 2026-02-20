/**
 * Optimizes an image file for web upload by resizing and compressing it.
 * 
 * @param {File} file - The original image file.
 * @param {number} maxWidth - Maximum width of the optimized image.
 * @param {number} maxHeight - Maximum height of the optimized image.
 * @param {number} quality - Compression quality (0.0 to 1.0).
 * @returns {Promise<File>} - A promise that resolves to the optimized File object.
 */
export const optimizeImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return resolve(file); // Return original if not an image
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;

        img.onload = () => {
            URL.revokeObjectURL(url); // Clean up memory

            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Maintain aspect ratio while resizing
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            // Use better image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed'));
                    }
                    // Create a new File from the blob
                    const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    console.log(`Optimized image: ${(file.size / 1024).toFixed(2)}KB -> ${(optimizedFile.size / 1024).toFixed(2)}KB`);
                    resolve(optimizedFile);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
    });
};

/**
 * Creates a temporary object URL for a file.
 * Useful for memory-efficient image previews.
 * 
 * @param {File} file 
 * @returns {string} 
 */
export const createPreviewUrl = (file) => {
    if (!file) return '';
    return URL.createObjectURL(file);
};

/**
 * Revokes a temporary object URL.
 * @param {string} url 
 */
export const revokePreviewUrl = (url) => {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};
