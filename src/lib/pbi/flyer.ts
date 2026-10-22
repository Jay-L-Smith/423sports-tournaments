export function compressFlyer(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1080 / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not read that picture."));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const first = canvas.toDataURL("image/jpeg", 0.82);
      const flyer = first.length > 900_000 ? canvas.toDataURL("image/jpeg", 0.6) : first;
      if (flyer.length > 900_000) reject(new Error("That flyer is too big. Try a smaller picture."));
      else resolve(flyer);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that picture."));
    };
    image.src = url;
  });
}
