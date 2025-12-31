import React, { useState } from "react";
import { Link } from "@inertiajs/react";

interface Photo {
  id: number;
  photo_path: string;
  order: number;
}

interface CarModel {
  id: number;
  brand: string;
  model: string;
  fuel_type: string;
  price_per_day: number;
  transmission: string;
  finish: string;
  photos: Photo[];
}

interface ShowCarModelCardProps {
  carModel: CarModel;
}

export default function ShowCarModelCard({ carModel }: ShowCarModelCardProps) {
  const firstPhoto =
    carModel.photos && carModel.photos.length > 0 ? carModel.photos[0] : null;

  const [selectedImage, setSelectedImage] = useState(
    firstPhoto ? `/storage/${firstPhoto.photo_path}` : ""
  );

  return (
    <div className="w-[320px] mx-auto">
      <div className="rounded-lg shadow-md overflow-hidden bg-white dark:bg-gray-900 transition-transform hover:scale-[1.02]">
        {/* Main image */}
        <div className="relative h-52 w-full">
          <img
            src={selectedImage || "/images/default-car.jpg"}
            alt={`${carModel.brand} ${carModel.model}`}
            className="h-full w-full object-cover transition-all duration-300"
          />
        </div>

        {/* Info */}
        <div className="p-4 text-foreground dark:text-foreground">
          <h2 className="font-bold text-2xl mb-1">
            {carModel.brand} {carModel.model}
          </h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
            {carModel.finish} • {carModel.transmission} • {carModel.fuel_type}
          </p>

          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-xl text-black dark:text-white">
              {carModel.price_per_day} MAD / jour
            </span>

            {/* Thumbnails */}
            <div className="flex gap-2">
              {carModel.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() =>
                    setSelectedImage(`/storage/${photo.photo_path}`)
                  }
                  className={`w-10 h-10 border-2 rounded-full overflow-hidden transition-all ${
                    selectedImage === `/storage/${photo.photo_path}`
                      ? "border-black dark:border-white"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  type="button"
                  title={`Photo #${photo.id}`}
                >
                  <img
                    src={`/storage/${photo.photo_path}`}
                    alt={`Thumbnail ${photo.id}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link
              href={route("car-models.edit", carModel.id)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-center hover:bg-blue-700 transition"
            >
              Editer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
