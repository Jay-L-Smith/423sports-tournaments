/** Set to false to put the white home background back. */
export const HOME_FIELD_BACKDROP = true;
export const HOME_FIELD_PHOTO = "/photos/field-diamond.jpg";
export const NOTIFICATIONS_FIELD_PHOTO = "/photos/field-celebrate.jpg";

/** Faded field photo for leftover white space. Original pictures, not copied from another site. */
export function FieldBand({ src }: { src: string }) {
  if (HOME_FIELD_BACKDROP && src === HOME_FIELD_PHOTO) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none mt-6 min-h-48 flex-1 rounded-lg"
      style={{
        backgroundImage: `linear-gradient(to bottom, #ffffff 0%, rgb(255 255 255 / 0.72) 16%, rgb(255 255 255 / 0.08) 46%), url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
